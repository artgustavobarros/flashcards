import type { DayStatus, Today, TodayDeck } from "@daruma/shared";
import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  count,
  desc,
  eq,
  inArray,
  isNull,
  lte,
  min,
  ne,
  sql,
} from "drizzle-orm";
import { State } from "ts-fsrs";
import { DB, type Db } from "../db/db.module.js";
import {
  cards,
  decks,
  reviews,
  userDays,
  userSettings,
} from "../db/domain-schema.js";
import {
  BACKLOG_OVERDUE,
  dailyReview,
  newQueue,
} from "../scheduling/daily-review.js";
import {
  CLOCK,
  type Clock,
  SchedulingService,
} from "../scheduling/scheduling.service.js";
import { addDays, type Day, localDay, localTime } from "../scheduling/today.js";

const RECENT_DECKS = 4;

const tally = (ids: string[]) => {
  const counts = new Map<string, number>();
  for (const id of ids) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return (id: string) => counts.get(id) ?? 0;
};

// Início and the bell: where today's Daily Review stands, and the Day's own marks (seen, bell
// opened). The Daily Review itself is computed by dailyReview; user_days only keeps the marks.
@Injectable()
export class TodayService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(SchedulingService) private readonly scheduling: SchedulingService
  ) {}

  async get(userId: string): Promise<Today> {
    const now = this.clock();
    const [settings] = await this.db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    if (!settings) {
      throw new Error(`User ${userId} has no settings row.`);
    }
    const today = localDay(now, settings.timezone);
    const yesterday = addDays(today, -1);

    const review = await dailyReview(this.db, userId, today);
    const done = await this.db
      .selectDistinct({ deckId: cards.deckId, id: reviews.cardId })
      .from(reviews)
      .innerJoin(cards, eq(cards.id, reviews.cardId))
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.reviewedOn, today),
          eq(reviews.kind, "rating"),
          eq(reviews.affectsSchedule, true)
        )
      );
    const days = await this.db
      .select()
      .from(userDays)
      .where(
        and(
          eq(userDays.userId, userId),
          inArray(userDays.day, [today, yesterday])
        )
      );
    const todayRow = days.find((row) => row.day === today);
    const yesterdayRow = days.find((row) => row.day === yesterday);
    const [firstRating] = await this.db
      .select({ day: min(reviews.reviewedOn) })
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.kind, "rating")));
    const recent = await this.recentDecks(userId);
    const tomorrow = await this.tomorrow(
      userId,
      addDays(today, 1),
      review.newCardsPaused ? 0 : settings.newCardsPerDay
    );

    const remaining = review.due.length + review.fresh.length;
    const status = dayStatus({
      decks: recent.length,
      done: done.length,
      remaining,
      seen: !!todayRow?.seenAt,
    });
    let completedAt = todayRow?.completedAt ?? null;
    // Cards deleted mid-Day can finish it without a Rating doing so.
    if (status === "completed" && !completedAt) {
      await this.scheduling.completeIfDone(this.db, userId, today, now);
      completedAt = now;
    }
    const overdue = review.due.filter((card) => card.due < today).length;
    const deckDue = tally(review.due.map((card) => card.deckId));
    const deckFresh = tally(review.fresh.map((card) => card.deckId));
    const deckDone = tally(done.map((card) => card.deckId));

    return {
      backlog: overdue >= BACKLOG_OVERDUE,
      completedAt: completedAt?.toISOString() ?? null,
      day: today,
      decks: recent.map(
        (deck): TodayDeck => ({
          cardCount: deck.cardCount,
          done: deckDone(deck.id),
          fresh: deckFresh(deck.id),
          id: deck.id,
          name: deck.name,
          remaining: deckDue(deck.id) + deckFresh(deck.id),
          tomorrow: tomorrow.byDeck(deck.id),
        })
      ),
      done: done.length,
      firstDay: firstRating?.day === today,
      fresh: review.fresh.length,
      hasRatings: !!firstRating?.day,
      newCardsPaused: review.newCardsPaused,
      notice:
        status === "open" &&
        settings.inAppReminder &&
        !todayRow?.bellOpenedAt &&
        localTime(now, settings.timezone) >= settings.reviewTime.slice(0, 5),
      overdue,
      remaining,
      reviews: review.due.length,
      reviewTime: settings.reviewTime.slice(0, 5),
      status,
      tomorrow: tomorrow.total,
      yesterday: yesterdayDay(yesterdayRow),
    };
  }

  // "Marcar como vista": no reminders until tomorrow. Undone by the toast.
  async markSeen(userId: string, seen: boolean) {
    const day = await this.scheduling.today(userId);
    const seenAt = seen ? this.clock() : null;
    await this.db
      .insert(userDays)
      .values({ day, seenAt, userId })
      .onConflictDoUpdate({
        set: { seenAt },
        target: [userDays.userId, userDays.day],
      });
  }

  // Clears the bell's dot for the rest of the Day.
  async openBell(userId: string) {
    const day = await this.scheduling.today(userId);
    await this.db
      .insert(userDays)
      .values({ bellOpenedAt: this.clock(), day, userId })
      .onConflictDoUpdate({
        set: {
          bellOpenedAt: sql`coalesce(${userDays.bellOpenedAt}, excluded.bell_opened_at)`,
        },
        target: [userDays.userId, userDays.day],
      });
  }

  // Live Decks by their latest activity: created, a Card written in it, or a Rating.
  private recentDecks(userId: string) {
    const lastRating = sql`(select max(${reviews.reviewedAt}) from ${reviews} where ${reviews.cardId} = ${cards.id})`;
    return this.db
      .select({
        cardCount: count(cards.id),
        id: decks.id,
        name: decks.name,
      })
      .from(decks)
      .leftJoin(cards, and(eq(cards.deckId, decks.id), isNull(cards.deletedAt)))
      .where(and(eq(decks.userId, userId), isNull(decks.deletedAt)))
      .groupBy(decks.id)
      .orderBy(
        desc(
          sql`greatest(${decks.createdAt}, max(${cards.createdAt}), max(${lastRating}))`
        ),
        desc(decks.id)
      )
      .limit(RECENT_DECKS);
  }

  // Tomorrow's Daily Review as things stand: every Card due by then, plus the New Cards limit.
  private async tomorrow(userId: string, tomorrow: Day, newLimit: number) {
    const due = await this.db
      .select({ deckId: cards.deckId })
      .from(cards)
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(
        and(
          eq(cards.userId, userId),
          isNull(cards.deletedAt),
          isNull(decks.deletedAt),
          ne(cards.state, State.New),
          lte(cards.due, tomorrow)
        )
      );
    const fresh = newLimit ? await newQueue(this.db, userId, newLimit) : [];
    const all = [...due, ...fresh];
    return {
      byDeck: tally(all.map((card) => card.deckId)),
      total: all.length,
    };
  }
}

function dayStatus(day: {
  decks: number;
  done: number;
  remaining: number;
  seen: boolean;
}): DayStatus {
  if (!day.decks) {
    return "empty";
  }
  if (!day.remaining) {
    return day.done ? "completed" : "free";
  }
  return day.seen ? "seen" : "open";
}

function yesterdayDay(row?: typeof userDays.$inferSelect) {
  if (row?.completedAt) {
    return "completed";
  }
  return row?.seenAt ? "seen" : null;
}
