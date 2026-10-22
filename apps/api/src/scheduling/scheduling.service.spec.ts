import { ConflictException, NotFoundException } from "@nestjs/common";
import { asc, eq } from "drizzle-orm";
import { State } from "ts-fsrs";
import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { connect, createCard, createUser } from "../../test/db.js";
import { cards, reviews } from "../db/domain-schema.js";
import { SchedulingService } from "./scheduling.service.js";

const { db, pool } = connect();
afterAll(() => pool.end());

let now: Date;
const service = new SchedulingService(db, () => now);

const cardRow = async (id: string) => {
  const [card] = await db.select().from(cards).where(eq(cards.id, id));
  return card;
};
const reviewRows = (id: string) =>
  db
    .select()
    .from(reviews)
    .where(eq(reviews.cardId, id))
    .orderBy(asc(reviews.reviewedAt));

let userId: string;
let cardId: string;

beforeEach(async () => {
  // 21:00 in São Paulo on 2026-10-22.
  now = new Date("2026-10-23T00:00:00Z");
  userId = await createUser(db);
  cardId = await createCard(db, userId);
});

describe("rate", () => {
  test("schedules a New Card and logs the schedule it had before", async () => {
    const { affectsSchedule, reviewId, schedule } = await service.rate(
      userId,
      cardId,
      3,
      4200
    );

    expect(affectsSchedule).toBe(true);
    const card = await cardRow(cardId);
    expect(card).toMatchObject(schedule);
    expect(card?.state).not.toBe(State.New);
    expect(card?.lastReviewedOn).toBe("2026-10-22");
    expect(await reviewRows(cardId)).toMatchObject([
      {
        affectsSchedule: true,
        durationMs: 4200,
        id: reviewId,
        kind: "rating",
        prevDue: null,
        prevReps: 0,
        prevState: State.New,
        rating: 3,
        reviewedAt: now,
        reviewedOn: "2026-10-22",
      },
    ]);
  });

  test("a repeat after Errei on the same local day is logged but changes nothing", async () => {
    const first = await service.rate(userId, cardId, 1, 1000);
    // 23:59 in São Paulo: still 2026-10-22.
    now = new Date("2026-10-23T02:59:00Z");
    const repeat = await service.rate(userId, cardId, 3, 1000);

    expect(repeat.affectsSchedule).toBe(false);
    expect(repeat.schedule).toEqual(first.schedule);
    expect(await cardRow(cardId)).toMatchObject(first.schedule);
    const rows = await reviewRows(cardId);
    expect(rows.map((row) => row.affectsSchedule)).toEqual([true, false]);
    expect(rows[1]?.reviewedOn).toBe("2026-10-22");
  });

  test("after the user's local midnight, a Rating goes through FSRS again", async () => {
    const first = await service.rate(userId, cardId, 1, 1000);
    // 00:00 in São Paulo: 2026-10-23, the day the Card is due.
    now = new Date("2026-10-23T03:00:00Z");
    const next = await service.rate(userId, cardId, 3, 1000);

    expect(next.affectsSchedule).toBe(true);
    expect(next.schedule.lastReviewedOn).toBe("2026-10-23");
    expect(next.schedule.reps).toBe(first.schedule.reps + 1);
  });

  test("uses the user's timezone for today", async () => {
    const tokyoUser = await createUser(db, "Asia/Tokyo");
    const tokyoCard = await createCard(db, tokyoUser);
    // 09:00 on 2026-10-23 in Tokyo, 21:00 on 2026-10-22 in São Paulo.
    expect(await service.today(tokyoUser)).toBe("2026-10-23");
    expect(await service.today(userId)).toBe("2026-10-22");

    await service.rate(tokyoUser, tokyoCard, 3, 1000);
    expect((await reviewRows(tokyoCard))[0]?.reviewedOn).toBe("2026-10-23");
  });

  test("refuses someone else's Card and a deleted Card", async () => {
    const otherUser = await createUser(db);
    await expect(service.rate(otherUser, cardId, 3, 1000)).rejects.toThrow(
      NotFoundException
    );

    await db.update(cards).set({ deletedAt: now }).where(eq(cards.id, cardId));
    await expect(service.rate(userId, cardId, 3, 1000)).rejects.toThrow(
      NotFoundException
    );
  });
});

describe("undo", () => {
  test("puts the schedule back and deletes the Rating", async () => {
    const first = await service.rate(userId, cardId, 3, 1000);
    now = new Date("2026-10-26T12:00:00Z");
    const second = await service.rate(userId, cardId, 1, 1000);

    const undone = await service.undo(userId, second.reviewId);

    expect(undone).toEqual({ cardId, schedule: first.schedule });
    expect(await cardRow(cardId)).toMatchObject(first.schedule);
    expect((await reviewRows(cardId)).map((row) => row.id)).toEqual([
      first.reviewId,
    ]);
  });

  test("undoing the only Rating makes the Card New again", async () => {
    const { reviewId } = await service.rate(userId, cardId, 4, 1000);

    await service.undo(userId, reviewId);

    expect(await cardRow(cardId)).toMatchObject({
      due: null,
      lastReviewedOn: null,
      reps: 0,
      state: State.New,
    });
    expect(await reviewRows(cardId)).toEqual([]);
  });

  test("only the user's last Rating can be undone", async () => {
    const first = await service.rate(userId, cardId, 3, 1000);
    const otherCard = await createCard(db, userId);
    now = new Date("2026-10-23T00:00:01Z");
    await service.rate(userId, otherCard, 3, 1000);

    await expect(service.undo(userId, first.reviewId)).rejects.toThrow(
      ConflictException
    );
    expect(await reviewRows(cardId)).toHaveLength(1);
  });

  test("can't undo someone else's Rating", async () => {
    const { reviewId } = await service.rate(userId, cardId, 3, 1000);
    const otherUser = await createUser(db);

    await expect(service.undo(otherUser, reviewId)).rejects.toThrow(
      ConflictException
    );
    expect(await reviewRows(cardId)).toHaveLength(1);
  });
});

describe("reset", () => {
  test("makes the Card New at the end of the queue and keeps its Ratings", async () => {
    const rated = await service.rate(userId, cardId, 3, 1000);
    now = new Date("2026-10-30T12:00:00Z");

    await service.reset(userId, cardId);

    expect(await cardRow(cardId)).toMatchObject({
      due: null,
      lastReviewedOn: null,
      newQueuedAt: now,
      reps: 0,
      stability: 0,
      state: State.New,
    });
    const rows = await reviewRows(cardId);
    expect(rows.map((row) => row.kind)).toEqual(["rating", "reset"]);
    expect(rows[1]).toMatchObject({
      prevDue: rated.schedule.due,
      prevReps: 1,
      prevState: rated.schedule.state,
      rating: null,
      reviewedOn: "2026-10-30",
    });
  });

  test("Undo brings the old schedule back", async () => {
    const rated = await service.rate(userId, cardId, 3, 1000);
    now = new Date("2026-10-30T12:00:00Z");
    const { reviewId } = await service.reset(userId, cardId);

    await service.undo(userId, reviewId);

    expect(await cardRow(cardId)).toMatchObject(rated.schedule);
    expect((await reviewRows(cardId)).map((row) => row.kind)).toEqual([
      "rating",
    ]);
  });

  test("a reset Card rated the same day goes through FSRS", async () => {
    await service.rate(userId, cardId, 3, 1000);
    await service.reset(userId, cardId);

    const { affectsSchedule } = await service.rate(userId, cardId, 3, 1000);

    expect(affectsSchedule).toBe(true);
  });

  test("refuses a New Card", async () => {
    await expect(service.reset(userId, cardId)).rejects.toThrow(
      ConflictException
    );
    expect(await reviewRows(cardId)).toEqual([]);
  });
});
