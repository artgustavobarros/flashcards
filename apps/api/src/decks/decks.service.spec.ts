import { NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { State } from "ts-fsrs";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { connect, createUser } from "../../test/db.js";
import { cards, decks } from "../db/domain-schema.js";
import { DecksService } from "./decks.service.js";

const { db, pool } = connect();
afterAll(() => pool.end());

const service = new DecksService(db);
const today = "2026-10-22";

let userId: string;
let deckId: string;

const addCard = async (schedule: Partial<typeof cards.$inferInsert> = {}) => {
  const [card] = await db
    .insert(cards)
    .values({
      answer: {},
      answerText: "",
      deckId,
      question: {},
      questionText: "",
      userId,
      ...schedule,
    })
    .returning({ id: cards.id });
  // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
  return card!.id;
};
const scheduled = (due: string) => ({ due, state: State.Review });

beforeEach(async () => {
  userId = await createUser(db);
  const [deck] = await db
    .insert(decks)
    .values({ name: "Anatomia", userId })
    .returning({ id: decks.id });
  // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
  deckId = deck!.id;
});

describe("list", () => {
  test("counts Cards, New Cards and Cards due today or overdue", async () => {
    await addCard();
    await addCard(scheduled(today));
    await addCard(scheduled("2026-10-20"));
    await addCard(scheduled("2026-10-23"));
    await addCard({ ...scheduled(today), deletedAt: new Date() });

    expect(await service.list(userId, today)).toEqual([
      { cardCount: 4, dueCount: 2, id: deckId, name: "Anatomia", newCount: 1 },
    ]);
  });

  test("shows an empty Deck and never another user's", async () => {
    const other = await createUser(db);
    expect(await service.list(other, today)).toEqual([]);
    expect(await service.list(userId, today)).toMatchObject([
      { cardCount: 0, dueCount: 0, newCount: 0 },
    ]);
    await expect(service.get(other, deckId, today)).rejects.toThrow(
      NotFoundException
    );
  });
});

describe("rename", () => {
  test("changes the name", async () => {
    await service.rename(userId, deckId, "Anatomia humana");
    expect((await service.get(userId, deckId, today)).name).toBe(
      "Anatomia humana"
    );
  });
});

describe("remove and restore", () => {
  test("restoring brings back the Cards deleted with the Deck, not older ones", async () => {
    const kept = await addCard();
    const deletedBefore = await addCard({
      deletedAt: new Date("2026-10-01T00:00:00Z"),
    });

    await service.remove(userId, deckId);
    expect(await service.list(userId, today)).toEqual([]);
    const [card] = await db.select().from(cards).where(eq(cards.id, kept));
    expect(card?.deletedAt).not.toBeNull();

    await service.restore(userId, deckId);
    const rows = await db
      .select({ deletedAt: cards.deletedAt, id: cards.id })
      .from(cards)
      .where(eq(cards.deckId, deckId));
    expect(rows.find((row) => row.id === kept)?.deletedAt).toBeNull();
    expect(rows.find((row) => row.id === deletedBefore)?.deletedAt).toEqual(
      new Date("2026-10-01T00:00:00Z")
    );
    expect((await service.get(userId, deckId, today)).cardCount).toBe(1);
  });

  test("another user can neither delete nor restore it", async () => {
    const other = await createUser(db);
    await expect(service.remove(other, deckId)).rejects.toThrow(
      NotFoundException
    );
    await service.remove(userId, deckId);
    await expect(service.restore(other, deckId)).rejects.toThrow(
      NotFoundException
    );
  });
});
