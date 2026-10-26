import { eq, inArray } from "drizzle-orm";
import { State } from "ts-fsrs";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { connect, createCard, createUser } from "../../test/db.js";
import { cards, decks, userDays, userSettings } from "../db/domain-schema.js";
import { SchedulingService } from "../scheduling/scheduling.service.js";
import { TodayService } from "./today.service.js";

const { db, pool } = connect();
afterAll(() => pool.end());

let now: Date;
const clock = () => now;
const scheduling = new SchedulingService(db, clock);
const service = new TodayService(db, clock, scheduling);

let userId: string;

beforeEach(async () => {
  // 21:00 in São Paulo on 2026-10-22, after the 19:00 Review Time.
  now = new Date("2026-10-23T00:00:00Z");
  userId = await createUser(db);
});

const deckOf = async (cardId: string) => {
  const [card] = await db
    .select({ deckId: cards.deckId })
    .from(cards)
    .where(eq(cards.id, cardId));
  // biome-ignore lint/style/noNonNullAssertion: the Card was just created.
  return card!.deckId;
};

const makeDue = (ids: string[], due: string) =>
  db
    .update(cards)
    .set({
      difficulty: 5,
      due,
      lastReviewedOn: "2026-10-01",
      scheduledDays: 3,
      stability: 3,
      state: State.Review,
    })
    .where(inArray(cards.id, ids));

const settings = (values: Partial<typeof userSettings.$inferInsert>) =>
  db.update(userSettings).set(values).where(eq(userSettings.userId, userId));

describe("get", () => {
  test("without Decks the Day is empty", async () => {
    const today = await service.get(userId);

    expect(today).toMatchObject({
      day: "2026-10-22",
      decks: [],
      hasRatings: false,
      notice: false,
      remaining: 0,
      reviewTime: "19:00",
      status: "empty",
    });
  });

  test("counts reviews, New Cards and overdue, and each Deck's share", async () => {
    const overdue = await createCard(db, userId);
    const due = await createCard(db, userId);
    const fresh = await createCard(db, userId);
    await makeDue([overdue], "2026-10-20");
    await makeDue([due], "2026-10-22");

    const today = await service.get(userId);

    expect(today).toMatchObject({
      backlog: false,
      done: 0,
      fresh: 1,
      overdue: 1,
      remaining: 3,
      reviews: 2,
      status: "open",
    });
    const byId = Object.fromEntries(today.decks.map((d) => [d.id, d]));
    expect(byId[await deckOf(overdue)]).toMatchObject({
      cardCount: 1,
      fresh: 0,
      remaining: 1,
    });
    expect(byId[await deckOf(fresh)]).toMatchObject({ fresh: 1, remaining: 1 });
  });

  test("Ratings move Cards to done, and the last one completes the Day", async () => {
    const first = await createCard(db, userId);
    const second = await createCard(db, userId);

    await scheduling.rate(userId, first, 3, 1000);
    expect(await service.get(userId)).toMatchObject({
      done: 1,
      remaining: 1,
      status: "open",
    });

    await scheduling.rate(userId, second, 1, 1000);
    const today = await service.get(userId);
    expect(today).toMatchObject({
      completedAt: now.toISOString(),
      done: 2,
      firstDay: true,
      hasRatings: true,
      remaining: 0,
      status: "completed",
    });
    // Errei brings the second Card back tomorrow.
    expect(today.tomorrow).toBeGreaterThanOrEqual(1);
  });

  test("a Day with nothing due is free", async () => {
    const card = await createCard(db, userId);
    await makeDue([card], "2026-10-30");

    expect((await service.get(userId)).status).toBe("free");
  });

  test("the bell's dot waits for the Review Time and goes once the bell is opened", async () => {
    await createCard(db, userId);
    now = new Date("2026-10-22T21:59:00Z"); // 18:59 in São Paulo
    expect((await service.get(userId)).notice).toBe(false);

    now = new Date("2026-10-22T22:00:00Z");
    expect((await service.get(userId)).notice).toBe(true);

    await service.openBell(userId);
    expect((await service.get(userId)).notice).toBe(false);
  });

  test("no dot with the in-app reminder off", async () => {
    await createCard(db, userId);
    await settings({ inAppReminder: false });

    expect((await service.get(userId)).notice).toBe(false);
  });

  test("Recent Decks are the four with the latest activity", async () => {
    const ids = await Promise.all(
      [1, 2, 3, 4, 5].map(async (n) => {
        const cardId = await createCard(db, userId);
        const createdAt = new Date(`2026-10-0${n}T12:00:00Z`);
        await db.update(cards).set({ createdAt }).where(eq(cards.id, cardId));
        const deckId = await deckOf(cardId);
        await db.update(decks).set({ createdAt }).where(eq(decks.id, deckId));
        return deckId;
      })
    );
    // The oldest Deck gets a Rating now, so it comes first.
    const [oldCard] = await db
      .select({ id: cards.id })
      .from(cards)
      .where(eq(cards.deckId, ids[0] as string));
    await scheduling.rate(userId, oldCard?.id as string, 3, 1000);

    const { decks: recent } = await service.get(userId);

    expect(recent.map((deck) => deck.id)).toEqual([
      ids[0],
      ids[4],
      ids[3],
      ids[2],
    ]);
  });

  test("a deleted Deck is left out", async () => {
    const deckId = await deckOf(await createCard(db, userId));
    await db.update(decks).set({ deletedAt: now }).where(eq(decks.id, deckId));

    expect((await service.get(userId)).status).toBe("empty");
  });

  test("yesterday shows whether its Daily Review was completed or seen", async () => {
    await db
      .insert(userDays)
      .values({ completedAt: now, day: "2026-10-21", userId });

    expect((await service.get(userId)).yesterday).toBe("completed");
  });
});

describe("markSeen", () => {
  test("marks the open Day as seen, and the toast can undo it", async () => {
    await createCard(db, userId);

    await service.markSeen(userId, true);
    expect((await service.get(userId)).status).toBe("seen");

    await service.markSeen(userId, false);
    expect((await service.get(userId)).status).toBe("open");
  });
});

describe("pausing New Cards", () => {
  test("backlog from 30 overdue Cards", async () => {
    const ids = await Promise.all(
      Array.from({ length: 30 }, () => createCard(db, userId))
    );
    await makeDue(ids, "2026-10-20");

    expect((await service.get(userId)).backlog).toBe(true);
  });

  test("lasts the whole Day the backlog was cleared on, and ends the next", async () => {
    const overdue = await createCard(db, userId);
    await createCard(db, userId);
    await makeDue([overdue], "2026-10-20");
    await settings({ newCardsPaused: true });
    expect(await service.get(userId)).toMatchObject({
      fresh: 0,
      newCardsPaused: true,
      remaining: 1,
    });

    await scheduling.rate(userId, overdue, 3, 1000);
    expect(await service.get(userId)).toMatchObject({
      fresh: 0,
      newCardsPaused: true,
      status: "completed",
    });

    now = new Date("2026-10-24T00:00:00Z");
    expect(await service.get(userId)).toMatchObject({
      fresh: 1,
      newCardsPaused: false,
    });
  });
});
