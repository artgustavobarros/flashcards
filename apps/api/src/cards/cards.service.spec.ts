import { type RichText, toPlainText } from "@daruma/shared";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { State } from "ts-fsrs";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { connect, createUser } from "../../test/db.js";
import { cards, decks } from "../db/domain-schema.js";
import { DecksService } from "../decks/decks.service.js";
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

    await service.remove(userId, id);
    expect(await service.list(userId, { deckId })).toEqual([]);
    await expect(service.get(userId, id)).rejects.toThrow(NotFoundException);

    await service.restore(userId, id);
    expect(await service.list(userId, { deckId })).toMatchObject([{ id }]);
  });

  test("a Card cannot come back without its Deck", async () => {
    const { id } = await service.create(userId, {
      answer: doc("a"),
      deckId,
      question: doc("q"),
    });
    await service.remove(userId, id);
    await deckService.remove(userId, deckId);

    await expect(service.restore(userId, id)).rejects.toThrow(
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
