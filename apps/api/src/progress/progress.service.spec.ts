import { NotFoundException } from "@nestjs/common";
import { eq, inArray } from "drizzle-orm";
import { State } from "ts-fsrs";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { connect, createCard, createUser } from "../../test/db.js";
import { cards, decks, reviews, userDays } from "../db/domain-schema.js";
import { SchedulingService } from "../scheduling/scheduling.service.js";
import { ProgressService } from "./progress.service.js";

const { db, pool } = connect();
afterAll(() => pool.end());

let now: Date;
const clock = () => now;
const scheduling = new SchedulingService(db, clock);
const service = new ProgressService(db, clock);

let userId: string;

beforeEach(async () => {
  // 21:00 in São Paulo on 2026-10-22.
  now = new Date("2026-10-23T00:00:00Z");
  userId = await createUser(db);
});

// 12:00 in São Paulo on that day.
const noonOn = (day: string) => new Date(`${day}T15:00:00Z`);

const deckOf = async (cardId: string) => {
  const [card] = await db
    .select({ deckId: cards.deckId })
    .from(cards)
    .where(eq(cards.id, cardId));
  // biome-ignore lint/style/noNonNullAssertion: the Card was just created.
  return card!.deckId;
};

const schedule = (ids: string[], due: string, scheduledDays = 3) =>
  db
    .update(cards)
    .set({
      difficulty: 5,
      due,
      lastReviewedOn: "2026-10-01",
      scheduledDays,
      stability: 3,
      state: State.Review,
    })
    .where(inArray(cards.id, ids));

const mark = (day: string, values: { completed?: boolean; seen?: boolean }) =>
  db.insert(userDays).values({
    completedAt: values.completed ? noonOn(day) : null,
    day,
    seenAt: values.seen ? noonOn(day) : null,
    userId,
  });

// A Rating logged on reviewedOn for a Card that was due on prevDue.
const logRating = (cardId: string, prevDue: string, reviewedOn: string) =>
  db.insert(reviews).values({
    cardId,
    kind: "rating",
    prevDifficulty: 5,
    prevDue,
    prevLapses: 0,
    prevReps: 1,
    prevScheduledDays: 3,
    prevStability: 3,
    prevState: State.Review,
    rating: 3,
    reviewedAt: noonOn(reviewedOn),
    reviewedOn,
    userId,
  });

const marksOf = (days: { day: string; mark: string }[]) =>
  Object.fromEntries(
    days.filter((d) => d.mark !== "free").map((d) => [d.day, d.mark])
  );

describe("get", () => {
  test("before any Rating: every Card is new and every Day free", async () => {
    await createCard(db, userId);
    await createCard(db, userId);

    const progress = await service.get(userId, { period: "30" });

    expect(progress).toMatchObject({
      cardStates: { learning: 0, mature: 0, new: 2 },
      forecast: [0, 0, 0, 0, 0, 0, 0],
      hasRatings: false,
      streak: { best: 0, current: 0 },
    });
    expect(progress.days).toHaveLength(30);
    expect(progress.days[0]?.day).toBe("2026-09-23");
    expect(progress.days.at(-1)).toEqual({
      day: "2026-10-22",
      errors: 0,
      mark: "pending",
      reviews: 0,
    });
    expect(progress.decks.map((deck) => deck.today)).toEqual([1, 1]);
  });

  test("an unknown or deleted Deck is not found", async () => {
    const deckId = await deckOf(await createCard(db, userId));
    await db.update(decks).set({ deletedAt: now }).where(eq(decks.id, deckId));

    await expect(
      service.get(userId, { deckId, period: "30" })
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("Streak", () => {
  test("seen and free Days neither break nor extend it; a missed Day breaks it", async () => {
    const card = await createCard(db, userId);
    await schedule([card], "2026-11-30");
    await mark("2026-10-10", { completed: true });
    await mark("2026-10-11", { completed: true });
    await mark("2026-10-12", { completed: true });
    // Due on the 13th, rated only on the 15th: the 13th and 14th were missed.
    await logRating(card, "2026-10-13", "2026-10-15");
    await mark("2026-10-15", { completed: true });
    await mark("2026-10-16", { seen: true });
    await mark("2026-10-18", { completed: true });
    // Seen also wins over missed.
    await logRating(card, "2026-10-19", "2026-10-21");
    await mark("2026-10-19", { seen: true });
    await mark("2026-10-21", { completed: true });

    const progress = await service.get(userId, { period: "30" });

    expect(progress.streak).toEqual({ best: 3, current: 1 });
    expect(marksOf(progress.days)).toEqual({
      "2026-10-10": "completed",
      "2026-10-11": "completed",
      "2026-10-12": "completed",
      "2026-10-13": "missed",
      "2026-10-14": "missed",
      "2026-10-15": "completed",
      "2026-10-16": "seen",
      "2026-10-18": "completed",
      "2026-10-19": "seen",
      "2026-10-20": "missed",
      "2026-10-21": "completed",
    });
  });

  test("a Card still overdue misses every Day since its due Day; today stays pending", async () => {
    const card = await createCard(db, userId);
    await schedule([card], "2026-10-20");
    await mark("2026-10-19", { completed: true });

    const progress = await service.get(userId, { period: "7" });

    expect(progress.streak).toEqual({ best: 1, current: 0 });
    expect(marksOf(progress.days)).toEqual({
      "2026-10-19": "completed",
      "2026-10-20": "missed",
      "2026-10-21": "missed",
      "2026-10-22": "pending",
    });
  });

  test("completing today's Daily Review extends it", async () => {
    const card = await createCard(db, userId);
    await mark("2026-10-21", { completed: true });

    await scheduling.rate(userId, card, 3, 1000);
    const progress = await service.get(userId, { period: "7" });

    expect(progress.streak).toEqual({ best: 2, current: 2 });
    expect(progress.days.at(-1)?.mark).toBe("completed");
  });
});

describe("Ratings", () => {
  test("count per Day and per Deck; Errei is an error and its repeat doesn't count", async () => {
    const first = await createCard(db, userId);
    const second = await createCard(db, userId);
    now = noonOn("2026-10-21");
    await scheduling.rate(userId, first, 1, 1000);
    await scheduling.rate(userId, first, 3, 1000);
    now = new Date("2026-10-23T00:00:00Z");
    await scheduling.rate(userId, second, 4, 1000);

    const progress = await service.get(userId, { period: "7" });

    expect(progress.hasRatings).toBe(true);
    expect(progress.days.slice(-2)).toMatchObject([
      { day: "2026-10-21", errors: 1, reviews: 1 },
      { day: "2026-10-22", errors: 0, reviews: 1 },
    ]);
    const byId = Object.fromEntries(progress.decks.map((d) => [d.id, d]));
    expect(byId[await deckOf(first)]).toMatchObject({ errors: 1, reviews: 1 });
    expect(byId[await deckOf(second)]).toMatchObject({ errors: 0, reviews: 1 });
  });

  test("the Deck filter narrows the Days but not the Decks or the Streak", async () => {
    const first = await createCard(db, userId);
    const second = await createCard(db, userId);
    await scheduling.rate(userId, first, 3, 1000);
    await scheduling.rate(userId, second, 3, 1000);

    const progress = await service.get(userId, {
      deckId: await deckOf(first),
      period: "7",
    });

    expect(progress.days.at(-1)).toMatchObject({ reviews: 1 });
    expect(progress.decks).toHaveLength(2);
    expect(progress.streak.current).toBe(1);
  });

  test("a period starts that many Days back; Tudo starts at the first Rating", async () => {
    const card = await createCard(db, userId);
    now = noonOn("2026-09-01");
    await scheduling.rate(userId, card, 3, 1000);
    now = new Date("2026-10-23T00:00:00Z");

    const month = await service.get(userId, { period: "30" });
    const all = await service.get(userId, { period: "all" });

    expect(month.days.some((d) => d.reviews)).toBe(false);
    expect(month.decks[0]?.reviews).toBe(0);
    expect(all.days[0]).toMatchObject({ day: "2026-09-01", reviews: 1 });
    expect(all.days).toHaveLength(52);
    expect(all.decks[0]?.reviews).toBe(1);
  });

  test("Ratings of deleted Cards are left out", async () => {
    const card = await createCard(db, userId);
    await scheduling.rate(userId, card, 3, 1000);
    await db.update(cards).set({ deletedAt: now }).where(eq(cards.id, card));

    const progress = await service.get(userId, { period: "7" });

    expect(progress.days.at(-1)?.reviews).toBe(0);
    expect(progress.hasRatings).toBe(true);
  });
});

describe("Cards", () => {
  test("forecast counts what is due on each of the next 7 Days, overdue in today", async () => {
    const ids = await Promise.all(
      Array.from({ length: 4 }, () => createCard(db, userId))
    );
    await schedule([ids[0] as string], "2026-10-20");
    await schedule([ids[1] as string], "2026-10-23");
    await schedule([ids[2] as string], "2026-10-28");
    await schedule([ids[3] as string], "2026-10-29");

    const { forecast } = await service.get(userId, { period: "7" });

    expect(forecast).toEqual([1, 1, 0, 0, 0, 0, 1]);
  });

  test("Card States split at 21 days", async () => {
    const ids = await Promise.all(
      Array.from({ length: 3 }, () => createCard(db, userId))
    );
    await schedule([ids[0] as string], "2026-11-01", 20);
    await schedule([ids[1] as string], "2026-11-30", 21);

    const { cardStates } = await service.get(userId, { period: "7" });

    expect(cardStates).toEqual({ learning: 1, mature: 1, new: 1 });
  });
});
