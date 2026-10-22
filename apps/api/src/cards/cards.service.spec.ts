import { type RichText, toPlainText } from "@daruma/shared";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { State } from "ts-fsrs";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { connect, createCard, createUser } from "../../test/db.js";
import { CommentsService } from "../comments/comments.service.js";
import { cards, decks, userSettings } from "../db/domain-schema.js";
import { DecksService } from "../decks/decks.service.js";
import { LabelsService } from "../labels/labels.service.js";
import { SchedulingService } from "../scheduling/scheduling.service.js";
import { CardsService } from "./cards.service.js";

const { db, pool } = connect();
afterAll(() => pool.end());

const service = new CardsService(db);
const deckService = new DecksService(db);

const paragraph = (text: string) => ({
  content: [{ text, type: "text" }],
  type: "paragraph",
});
const doc = (text: string): RichText => ({
  content: text ? [paragraph(text)] : [],
  type: "doc",
});
const empty = doc("");

let userId: string;
let deckId: string;

const newDeck = async (name: string) => {
  const [deck] = await db
    .insert(decks)
    .values({ name, userId })
    .returning({ id: decks.id });
  // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
  return deck!.id;
};

beforeEach(async () => {
  userId = await createUser(db);
  deckId = await newDeck("Anatomia");
});

describe("create", () => {
  test("stores the JSON and its plain text in an existing Deck", async () => {
    const { id } = await service.create(userId, {
      answer: doc("O tríceps braquial."),
      deckId,
      question: doc("Qual músculo estende o cotovelo?"),
    });

    expect(await service.get(userId, id)).toMatchObject({
      answerText: "O tríceps braquial.",
      deckId,
      deckName: "Anatomia",
      due: null,
      question: doc("Qual músculo estende o cotovelo?"),
      questionText: "Qual músculo estende o cotovelo?",
      state: "new",
    });
  });

  test("creates the Deck with its first Card", async () => {
    const card = await service.create(userId, {
      answer: doc("7"),
      deckName: "Ossos",
      question: doc("Quantas vértebras cervicais?"),
    });

    expect((await service.get(userId, card.id)).deckName).toBe("Ossos");
  });

  test("refuses a side without content, and creates no Deck", async () => {
    await expect(
      service.create(userId, {
        answer: doc("7"),
        deckName: "Ossos",
        question: empty,
      })
    ).rejects.toThrow(new BadRequestException("Escreva a pergunta."));
    const names = await db
      .select({ name: decks.name })
      .from(decks)
      .where(eq(decks.userId, userId));
    expect(names).toEqual([{ name: "Anatomia" }]);
  });

  test("refuses another user's Deck", async () => {
    const other = await createUser(db);
    await expect(
      service.create(other, { answer: doc("a"), deckId, question: doc("q") })
    ).rejects.toThrow(NotFoundException);
  });
});

describe("update", () => {
  test("editing and moving keep the schedule", async () => {
    const { id } = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("q"),
    });
    await db
      .update(cards)
      .set({ due: "2026-10-30", scheduledDays: 8, state: State.Review })
      .where(eq(cards.id, id));
    const target = await newDeck("Ossos");

    await service.update(userId, id, {
      answer: doc("nova"),
      deckId: target,
    });

    expect(await service.get(userId, id)).toMatchObject({
      answerText: "nova",
      deckId: target,
      due: "2026-10-30",
      questionText: "q",
      state: "learning",
    });
  });

  test("cannot move into a deleted Deck", async () => {
    const { id } = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("q"),
    });
    const target = await newDeck("Ossos");
    await deckService.remove(userId, target);

    await expect(
      service.update(userId, id, { deckId: target })
    ).rejects.toThrow(NotFoundException);
  });
});

describe("remove and restore", () => {
  test("a deleted Card leaves the list and comes back", async () => {
    const { id } = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("q"),
    });

    await service.remove(userId, [id]);
    expect(await service.list(userId, { deckId })).toEqual([]);
    await expect(service.get(userId, id)).rejects.toThrow(NotFoundException);

    await service.restore(userId, [id]);
    expect(await service.list(userId, { deckId })).toMatchObject([{ id }]);
  });

  test("a Card cannot come back without its Deck", async () => {
    const { id } = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("q"),
    });
    await service.remove(userId, [id]);
    await deckService.remove(userId, deckId);

    await expect(service.restore(userId, [id])).rejects.toThrow(
      NotFoundException
    );
  });
});

describe("list", () => {
  test("filters by Deck, oldest first", async () => {
    const other = await newDeck("Ossos");
    const first = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("1"),
    });
    await service.create(userId, {
      answer: doc("a"),
      deckId: other,
      question: doc("x"),
    });
    const second = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("2"),
    });

    const rows = await service.list(userId, { deckId });
    expect(rows.map((row) => row.id)).toEqual([first.id, second.id]);
    expect(await service.list(userId)).toHaveLength(3);
  });
});

describe("study queue", () => {
  test("daily review takes due Cards and only the remaining New Card allowance", async () => {
    const old = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("old"),
    });
    const first = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("first"),
    });
    const second = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("second"),
    });
    await db
      .update(userSettings)
      .set({ newCardsPerDay: 1 })
      .where(eq(userSettings.userId, userId));
    await db
      .update(cards)
      .set({ due: "2026-10-21", scheduledDays: 2, state: State.Review })
      .where(eq(cards.id, old.id));

    const queue = await service.studyQueue(
      userId,
      { origin: "daily" },
      "2026-10-22"
    );

    expect(queue.map((card) => card.id)).toEqual([old.id, first.id]);
    expect(queue[0]?.question).toEqual(doc("old"));
    expect(queue.map((card) => card.id)).not.toContain(second.id);
  });

  test("due Cards with lower retrievability come first", async () => {
    const easier = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("easier"),
    });
    const harder = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("harder"),
    });
    await Promise.all(
      (
        [
          [easier.id, 20],
          [harder.id, 2],
        ] as const
      ).map(([id, stability]) =>
        db
          .update(cards)
          .set({
            due: "2026-10-20",
            lastReviewedOn: "2026-10-10",
            scheduledDays: 10,
            stability,
            state: State.Review,
          })
          .where(eq(cards.id, id))
      )
    );

    const queue = await service.studyQueue(
      userId,
      { origin: "daily" },
      "2026-10-22"
    );

    expect(queue.slice(0, 2).map((card) => card.id)).toEqual([
      harder.id,
      easier.id,
    ]);
  });

  test("Deck study takes only due Cards from that Deck", async () => {
    const due = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("due"),
    });
    await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("new"),
    });
    await db
      .update(cards)
      .set({ due: "2026-10-22", scheduledDays: 2, state: State.Review })
      .where(eq(cards.id, due.id));

    const queue = await service.studyQueue(
      userId,
      { deckId, origin: "deck" },
      "2026-10-22"
    );

    expect(queue.map((card) => card.id)).toEqual([due.id]);
  });

  test("batch keeps its creation order and rejects foreign Cards", async () => {
    const first = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("first"),
    });
    const second = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("second"),
    });
    const other = await createUser(db);
    const foreign = await createCard(db, other);

    expect(
      (
        await service.studyQueue(
          userId,
          { cardIds: [second.id, first.id], origin: "batch" },
          "2026-10-22"
        )
      ).map((card) => card.id)
    ).toEqual([second.id, first.id]);
    await expect(
      service.studyQueue(
        userId,
        { cardIds: [first.id, foreign], origin: "batch" },
        "2026-10-22"
      )
    ).rejects.toThrow(NotFoundException);
  });
});

test("a reset Card shows when its schedule was restarted", async () => {
  const { id } = await service.create(userId, {
    answer: doc("a"),
    deckId,
    question: doc("q"),
  });
  const scheduling = new SchedulingService(
    db,
    () => new Date("2026-10-23T00:00:00Z")
  );
  expect((await service.get(userId, id)).resetAt).toBeNull();

  await scheduling.rate(userId, id, 3, 1000);
  await scheduling.reset(userId, id);

  expect((await service.get(userId, id)).resetAt).toBe(
    "2026-10-23T00:00:00.000Z"
  );
});

test("plain text has one line per block and keeps formulas", () => {
  expect(
    toPlainText({
      content: [
        {
          content: [
            { text: "Área: ", type: "text" },
            { attrs: { latex: "\\pi r^2" }, type: "inlineMath" },
          ],
          type: "paragraph",
        },
        {
          content: [
            { content: [paragraph("Dendritos")], type: "listItem" },
            { content: [paragraph("Axônio")], type: "listItem" },
          ],
          type: "bulletList",
        },
      ],
      type: "doc",
    })
  ).toBe("Área: \\pi r^2\nDendritos\nAxônio");
});

describe("Labels on a Card", () => {
  test("are set on create and replaced on update, by name", async () => {
    const labels = new LabelsService(db);
    const ossos = await labels.create(userId, "ossos");
    const prova = await labels.create(userId, "Prova final");
    const { id } = await service.create(userId, {
      answer: doc("a"),
      deckId,
      labelIds: [prova.id, ossos.id],
      question: doc("q"),
    });
    expect((await service.get(userId, id)).labels).toEqual([ossos, prova]);

    await service.update(userId, id, { labelIds: [prova.id] });
    expect((await service.get(userId, id)).labels).toEqual([prova]);
  });

  test("refuses another user's Label and saves nothing", async () => {
    const other = await createUser(db);
    const theirs = await new LabelsService(db).create(other, "deles");

    await expect(
      service.create(userId, {
        answer: doc("a"),
        deckId,
        labelIds: [theirs.id],
        question: doc("q"),
      })
    ).rejects.toThrow(new NotFoundException("Label not found."));
    expect(await service.list(userId)).toEqual([]);
  });

  test("a deleted Label is hidden and comes back on its Cards", async () => {
    const labels = new LabelsService(db);
    const ossos = await labels.create(userId, "ossos");
    const { id } = await service.create(userId, {
      answer: doc("a"),
      deckId,
      labelIds: [ossos.id],
      question: doc("q"),
    });

    await labels.remove(userId, ossos.id);
    // Saving the Card's Labels meanwhile doesn't drop the deleted one.
    await service.update(userId, id, { labelIds: [] });
    expect((await service.get(userId, id)).labels).toEqual([]);

    await labels.restore(userId, ossos.id);
    expect((await service.get(userId, id)).labels).toEqual([ossos]);
  });
});

describe("list filters", () => {
  const card = async (
    text: string,
    schedule: Partial<typeof cards.$inferInsert> = {}
  ) => {
    const { id } = await service.create(userId, {
      answer: doc(`resposta ${text}`),
      deckId,
      question: doc(text),
    });
    if (Object.keys(schedule).length) {
      await db.update(cards).set(schedule).where(eq(cards.id, id));
    }
    return id;
  };
  const ids = async (query: Parameters<CardsService["list"]>[1]) =>
    (await service.list(userId, query, "2026-10-21")).map(
      (row) => row.questionText
    );

  test("by state and due today, overdue included", async () => {
    await card("novo");
    await card("atrasado", {
      due: "2026-10-19",
      scheduledDays: 3,
      state: State.Review,
    });
    await card("hoje", {
      due: "2026-10-21",
      scheduledDays: 30,
      state: State.Review,
    });
    await card("depois", {
      due: "2026-10-22",
      scheduledDays: 5,
      state: State.Review,
    });

    expect(await ids({ state: "new" })).toEqual(["novo"]);
    expect(await ids({ state: "learning" })).toEqual(["atrasado", "depois"]);
    expect(await ids({ state: "mature" })).toEqual(["hoje"]);
    expect(await ids({ due: "today" })).toEqual(["atrasado", "hoje"]);
    expect(await ids({ due: "today", state: "learning" })).toEqual([
      "atrasado",
    ]);
  });

  test("by Label", async () => {
    const ossos = await new LabelsService(db).create(userId, "ossos");
    const marked = await card("marcado");
    await card("solto");
    await service.labelAll(userId, [marked], ossos.id, true);

    expect(await ids({ labelId: ossos.id })).toEqual(["marcado"]);
  });

  test("search ignores accents and case, in question, answer and Comments", async () => {
    const musculo = await card("Qual MÚSCULO estende o cotovelo?");
    await card("Quantos ossos?");
    const viaComment = await card("Onde nasce o impulso?");
    const comments = new CommentsService(db);
    await comments.create(userId, viaComment, "Primeiro Comment");
    await comments.create(userId, viaComment, "Ver o nó atrioventricular");
    await comments.create(userId, musculo, "nó também aqui");

    expect(await ids({ q: "musculo" })).toEqual([
      "Qual MÚSCULO estende o cotovelo?",
    ]);
    expect(await ids({ q: "resposta quantos" })).toEqual(["Quantos ossos?"]);

    const rows = await service.list(userId, { q: "NO" }, "2026-10-21");
    expect(
      rows.map((row) => [
        row.questionText,
        row.matchedComment,
        row.commentCount,
      ])
    ).toEqual([
      ["Qual MÚSCULO estende o cotovelo?", "nó também aqui", 1],
      // Only its second Comment has the term.
      ["Onde nasce o impulso?", "Ver o nó atrioventricular", 2],
    ]);
  });
});

describe("selection actions", () => {
  const two = async () => [
    (
      await service.create(userId, {
        answer: doc("a"),
        deckId,
        question: doc("1"),
      })
    ).id,
    (
      await service.create(userId, {
        answer: doc("a"),
        deckId,
        question: doc("2"),
      })
    ).id,
  ];

  test("move keeps the schedule and is all or nothing", async () => {
    const [first, second] = (await two()) as [string, string];
    const target = await newDeck("Ossos");
    await service.remove(userId, [second]);

    await expect(service.move(userId, [first, second], target)).rejects.toThrow(
      NotFoundException
    );
    expect((await service.get(userId, first)).deckId).toBe(deckId);

    await service.restore(userId, [second]);
    await service.move(userId, [first, second], target);
    expect(await service.list(userId, { deckId: target })).toHaveLength(2);
  });

  test("delete and restore several Cards", async () => {
    const both = await two();
    await service.remove(userId, both);
    expect(await service.list(userId)).toEqual([]);

    await service.restore(userId, both);
    expect(await service.list(userId)).toHaveLength(2);
  });

  test("a Label goes on and off every Card", async () => {
    const both = await two();
    const ossos = await new LabelsService(db).create(userId, "ossos");
    await service.labelAll(userId, [both[0] as string], ossos.id, true);

    await service.labelAll(userId, both, ossos.id, true);
    expect(await service.list(userId, { labelId: ossos.id })).toHaveLength(2);

    await service.labelAll(userId, both, ossos.id, false);
    expect(await service.list(userId, { labelId: ossos.id })).toEqual([]);
  });

  test("refuses another user's Cards", async () => {
    const both = await two();
    const other = await createUser(db);
    await expect(service.remove(other, both)).rejects.toThrow(
      NotFoundException
    );
  });
});
