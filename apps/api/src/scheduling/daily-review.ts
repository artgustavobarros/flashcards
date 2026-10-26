import { and, asc, count, eq, isNull, lt, lte, ne, or, sql } from "drizzle-orm";
import { State } from "ts-fsrs";
import type { Db } from "../db/db.module.js";
import { cards, decks, reviews, userSettings } from "../db/domain-schema.js";
import { retrievability } from "./schedule.js";
import type { Day } from "./today.js";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

// From this many overdue Cards on, Início offers to pause New Cards.
export const BACKLOG_OVERDUE = 30;

export interface DailyReview {
  // Due Cards not rated yet today, lowest retrievability first. Overdue ones included.
  due: { deckId: string; due: Day; id: string }[];
  // New Cards still allowed today, in queue order.
  fresh: { deckId: string; id: string }[];
  // The pause asked for on Início, while it still applies (see newCardsPaused below).
  newCardsPaused: boolean;
}

const liveCards = (userId: string) =>
  and(
    eq(cards.userId, userId),
    isNull(cards.deletedAt),
    isNull(decks.deletedAt)
  );

// A Day's Daily Review, computed from the Cards: it is never stored. Every Rating made today
// moves its Card out of it, whichever Study Session it came from.
export async function dailyReview(
  db: Db | Tx,
  userId: string,
  today: Day
): Promise<DailyReview> {
  const due = await db
    .select({
      deckId: cards.deckId,
      difficulty: cards.difficulty,
      due: cards.due,
      id: cards.id,
      lapses: cards.lapses,
      lastReviewedOn: cards.lastReviewedOn,
      reps: cards.reps,
      scheduledDays: cards.scheduledDays,
      stability: cards.stability,
      state: cards.state,
    })
    .from(cards)
    .innerJoin(decks, eq(decks.id, cards.deckId))
    .where(
      and(
        liveCards(userId),
        ne(cards.state, State.New),
        lte(cards.due, today),
        or(isNull(cards.lastReviewedOn), ne(cards.lastReviewedOn, today))
      )
    )
    .orderBy(asc(cards.due), asc(cards.id));
  due.sort((a, b) => retrievability(a, today) - retrievability(b, today));

  const [settings] = await db
    .select({
      limit: userSettings.newCardsPerDay,
      paused: userSettings.newCardsPaused,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));
  const newCardsPaused =
    !!settings?.paused && (await overdueAtDayStart(db, userId, today)) > 0;
  const [studied] = await db
    .select({ value: count() })
    .from(reviews)
    .where(
      and(
        eq(reviews.userId, userId),
        eq(reviews.reviewedOn, today),
        eq(reviews.kind, "rating"),
        eq(reviews.affectsSchedule, true),
        eq(reviews.prevState, State.New)
      )
    );
  const allowance = newCardsPaused
    ? 0
    : Math.max(0, (settings?.limit ?? 0) - (studied?.value ?? 0));
  const fresh = allowance ? await newQueue(db, userId, allowance) : [];

  return {
    // biome-ignore lint/style/noNonNullAssertion: due <= today means it is not null.
    due: due.map((row) => ({ deckId: row.deckId, due: row.due!, id: row.id })),
    fresh,
    newCardsPaused,
  };
}

// The first New Cards in queue order.
export const newQueue = (db: Db | Tx, userId: string, limit: number) =>
  db
    .select({ deckId: cards.deckId, id: cards.id })
    .from(cards)
    .innerJoin(decks, eq(decks.id, cards.deckId))
    .where(and(liveCards(userId), eq(cards.state, State.New)))
    .orderBy(asc(cards.newQueuedAt), asc(cards.id))
    .limit(limit);

// Overdue Cards as the Day began: still overdue now, or rated today while overdue. The pause
// of New Cards lasts while this is above zero, so it ends on the first Day that starts with
// nothing overdue, never in the middle of the Day it was cleared on.
async function overdueAtDayStart(db: Db | Tx, userId: string, today: Day) {
  const [overdue] = await db
    .select({ value: count() })
    .from(cards)
    .innerJoin(decks, eq(decks.id, cards.deckId))
    .where(
      and(liveCards(userId), ne(cards.state, State.New), lt(cards.due, today))
    );
  const [ratedOverdue] = await db
    .select({ value: sql<number>`count(distinct ${reviews.cardId})` })
    .from(reviews)
    .where(
      and(
        eq(reviews.userId, userId),
        eq(reviews.reviewedOn, today),
        eq(reviews.kind, "rating"),
        eq(reviews.affectsSchedule, true),
        lt(reviews.prevDue, today)
      )
    );
  return (overdue?.value ?? 0) + Number(ratedOverdue?.value ?? 0);
}
