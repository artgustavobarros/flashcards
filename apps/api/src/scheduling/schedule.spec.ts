import { State } from "ts-fsrs";
import { describe, expect, test } from "vitest";
import {
  cardState,
  NEW_SCHEDULE,
  nextSchedule,
  type Rating,
} from "./schedule.js";
import { addDays, dayStart } from "./today.js";

const daysBetween = (from: string, to: string) =>
  (dayStart(to).getTime() - dayStart(from).getTime()) / 86_400_000;

// Fuzz spreads intervals of 3 days or more, seeded by the review date, so check two months
// of first Ratings.
const TODAYS = Array.from({ length: 60 }, (_, i) => addDays("2026-10-01", i));

const firstInterval = (rating: Rating, today: string) => {
  const next = nextSchedule(NEW_SCHEDULE, rating, today);
  // biome-ignore lint/style/noNonNullAssertion: a rated Card always has a due Day.
  return daysBetween(today, next.due!);
};

describe("first Rating of a New Card", () => {
  test("Errei and Difícil come back in 1 and 2 days, without fuzz", () => {
    for (const today of TODAYS) {
      expect(firstInterval(1, today)).toBe(1);
      expect(firstInterval(2, today)).toBe(2);
    }
  });

  test("Bom comes back in 2 to 4 days and Fácil in 6 to 10", () => {
    const good = new Set(TODAYS.map((today) => firstInterval(3, today)));
    const easy = new Set(TODAYS.map((today) => firstInterval(4, today)));
    for (const days of good) {
      expect(days).toBeGreaterThanOrEqual(2);
      expect(days).toBeLessThanOrEqual(4);
    }
    for (const days of easy) {
      expect(days).toBeGreaterThanOrEqual(6);
      expect(days).toBeLessThanOrEqual(10);
    }
    // Fuzz is on: Cards rated the same way on different days don't all land together.
    expect(easy.size).toBeGreaterThan(1);
  });

  test("records the review and leaves the New state", () => {
    const next = nextSchedule(NEW_SCHEDULE, 3, "2026-10-22");
    expect(next.state).not.toBe(State.New);
    expect(next.reps).toBe(1);
    expect(next.lapses).toBe(0);
    expect(next.lastReviewedOn).toBe("2026-10-22");
    expect(next.scheduledDays).toBe(daysBetween("2026-10-22", next.due ?? ""));
  });

  test("is the same for the same Day, so the result doesn't depend on the clock", () => {
    expect(nextSchedule(NEW_SCHEDULE, 4, "2026-10-22")).toEqual(
      nextSchedule(NEW_SCHEDULE, 4, "2026-10-22")
    );
  });
});

describe("later Ratings", () => {
  const today = "2026-10-22";
  const learned = nextSchedule(NEW_SCHEDULE, 3, today);
  // biome-ignore lint/style/noNonNullAssertion: a rated Card always has a due Day.
  const dueDay = learned.due!;

  test("Bom on the due Day grows the interval", () => {
    const next = nextSchedule(learned, 3, dueDay);
    expect(next.scheduledDays).toBeGreaterThan(learned.scheduledDays);
    expect(next.stability).toBeGreaterThan(learned.stability);
    expect(next.reps).toBe(2);
  });

  test("Errei is a lapse and brings the Card back tomorrow", () => {
    const next = nextSchedule(learned, 1, dueDay);
    expect(next.lapses).toBe(1);
    expect(next.due).toBe(addDays(dueDay, 1));
    expect(next.stability).toBeLessThan(learned.stability);
  });

  test("an overdue Card is scheduled from the Day it is rated", () => {
    const late = addDays(dueDay, 10);
    const next = nextSchedule(learned, 3, late);
    // biome-ignore lint/style/noNonNullAssertion: a rated Card always has a due Day.
    expect(next.due! > late).toBe(true);
    expect(next.lastReviewedOn).toBe(late);
  });

  test("every Rating schedules tomorrow or later", () => {
    let schedule = learned;
    for (const rating of [1, 1, 2, 3, 4, 1] as const) {
      // biome-ignore lint/style/noNonNullAssertion: a rated Card always has a due Day.
      const day = schedule.due!;
      schedule = nextSchedule(schedule, rating, day);
      expect(daysBetween(day, schedule.due ?? "")).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("cardState", () => {
  test("Novo, then Em aprendizado under 21 days, then Maduro", () => {
    expect(cardState(NEW_SCHEDULE)).toBe("new");
    expect(cardState({ scheduledDays: 20, state: State.Review })).toBe(
      "learning"
    );
    expect(cardState({ scheduledDays: 21, state: State.Review })).toBe(
      "mature"
    );
  });
});
