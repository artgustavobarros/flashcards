import {
  type Card as FsrsCard,
  fsrs,
  type Grade,
  generatorParameters,
  State,
} from "ts-fsrs";
import { type Day, dayStart, toDay } from "./today.js";

// 1 Errei, 2 Difícil, 3 Bom, 4 Fácil.
export type Rating = Grade;

// FSRS-6 with its default weights, the same for every user (never optimized per user).
// No learning steps: every Rating schedules the Card for tomorrow or later. Errei brings the
// Card back at the end of the current Study Session instead (see SchedulingService.rate).
const scheduler = fsrs(
  generatorParameters({
    enable_fuzz: true,
    enable_short_term: false,
    request_retention: 0.9,
  })
);

// Shown as Maduro from this interval on, Em aprendizado below it.
const MATURE_DAYS = 21;

// The FSRS columns of a Card. A New Card has no due Day and no last review.
export interface Schedule {
  difficulty: number;
  due: Day | null;
  lapses: number;
  lastReviewedOn: Day | null;
  reps: number;
  scheduledDays: number;
  stability: number;
  state: State;
}

export const NEW_SCHEDULE: Schedule = {
  difficulty: 0,
  due: null,
  lapses: 0,
  lastReviewedOn: null,
  reps: 0,
  scheduledDays: 0,
  stability: 0,
  state: State.New,
};

export function nextSchedule(
  schedule: Schedule,
  rating: Rating,
  today: Day
): Schedule {
  const now = dayStart(today);
  const card: FsrsCard = {
    difficulty: schedule.difficulty,
    due: schedule.due ? dayStart(schedule.due) : now,
    elapsed_days: 0,
    lapses: schedule.lapses,
    last_review: schedule.lastReviewedOn
      ? dayStart(schedule.lastReviewedOn)
      : undefined,
    learning_steps: 0,
    reps: schedule.reps,
    scheduled_days: schedule.scheduledDays,
    stability: schedule.stability,
    state: schedule.state,
  };
  const next = scheduler.next(card, now, rating).card;
  return {
    difficulty: next.difficulty,
    // Without learning steps the interval is at least 1 day, so this is never today.
    due: toDay(next.due),
    lapses: next.lapses,
    lastReviewedOn: today,
    reps: next.reps,
    scheduledDays: next.scheduled_days,
    stability: next.stability,
    state: next.state,
  };
}

export type CardState = "new" | "learning" | "mature";

// Novo / Em aprendizado / Maduro, derived from the schedule. Being due is not a state.
export function cardState(
  schedule: Pick<Schedule, "scheduledDays" | "state">
): CardState {
  if (schedule.state === State.New) {
    return "new";
  }
  return schedule.scheduledDays < MATURE_DAYS ? "learning" : "mature";
}
