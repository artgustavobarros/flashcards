import type {
  DayMark,
  Progress,
  ProgressDay,
  ProgressQuery,
} from "@daruma/shared";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  and,
  asc,
  count,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
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
import { dailyReview } from "../scheduling/daily-review.js";
import { MATURE_DAYS } from "../scheduling/schedule.js";
import { CLOCK, type Clock } from "../scheduling/scheduling.service.js";
import { addDays, type Day, localDay } from "../scheduling/today.js";

const PERIOD_DAYS = { "7": 7, "30": 30, "90": 90 } as const;
const FORECAST_DAYS = 7;

const liveCards = (userId: string, deckId?: string) =>
  and(
    eq(cards.userId, userId),
    isNull(cards.deletedAt),
    isNull(decks.deletedAt),
    deckId ? eq(cards.deckId, deckId) : undefined
  );

// Ratings that count in the metrics: a repeat after Errei and a Schedule Reset don't.
const metricRatings = (userId: string) =>
  and(
    eq(reviews.userId, userId),
    eq(reviews.kind, "rating"),
    eq(reviews.affectsSchedule, true)
  );

const errors = sql<number>`count(*) filter (where ${reviews.rating} = 1)`;

// Progresso: the Streak and how each Day went, the Ratings of the period, what comes due next
// and where the Cards stand. Ratings count only on live Cards in live Decks.
@Injectable()
export class ProgressService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(CLOCK) private readonly clock: Clock
  ) {}

  async get(userId: string, query: ProgressQuery): Promise<Progress> {
    const { deckId } = query;
    const [settings] = await this.db
      .select({ timezone: userSettings.timezone })
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    if (!settings) {
      throw new Error(`User ${userId} has no settings row.`);
    }
    const today = localDay(this.clock(), settings.timezone);

    const deckList = await this.decks(userId);
    if (deckId && !deckList.some((deck) => deck.id === deckId)) {
      throw new NotFoundException("Deck not found.");
    }
    const [first] = await this.db
      .select({ day: min(reviews.reviewedOn) })
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.kind, "rating")));
    const from =
      query.period === "all"
        ? (first?.day ?? today)
        : addDays(today, 1 - PERIOD_DAYS[query.period]);

    const review = await dailyReview(this.db, userId, today);
    const { marks, streak } = await this.marks(
      userId,
      today,
      review.due.length + review.fresh.length
    );
    const perDay = await this.perDay(userId, from, today, deckId);
    const days: ProgressDay[] = [];
    for (let day = from; day <= today; day = addDays(day, 1)) {
      days.push({
        day,
        errors: perDay.get(day)?.errors ?? 0,
        mark: marks.get(day) ?? "free",
        reviews: perDay.get(day)?.reviews ?? 0,
      });
    }

    const perDeck = await this.perDeck(userId, from, today);
    const remaining = [...review.due, ...review.fresh];

    return {
      cardStates: await this.cardStates(userId, deckId),
      days,
      decks: deckList.map((deck) => ({
        ...deck,
        errors: perDeck.get(deck.id)?.errors ?? 0,
        reviews: perDeck.get(deck.id)?.reviews ?? 0,
        today: remaining.filter((card) => card.deckId === deck.id).length,
      })),
      forecast: [
        review.due.filter((card) => !deckId || card.deckId === deckId).length,
        ...(await this.forecast(userId, today, deckId)),
      ],
      hasRatings: !!first?.day,
      streak,
    };
  }

  // Each Day's mark and the Streak, over the whole history. A Day without a mark in user_days
  // was missed if a Card was due on it and still due the next Day: the Rating log keeps the due
  // day a Card had before each Rating or Schedule Reset, and still overdue Cards have theirs.
  private async marks(userId: string, today: Day, remaining: number) {
    const late = await this.db
      .select({ from: reviews.prevDue, until: reviews.reviewedOn })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          isNotNull(reviews.prevDue),
          lt(reviews.prevDue, reviews.reviewedOn)
        )
      );
    const overdue = await this.db
      .select({ from: cards.due })
      .from(cards)
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(
        and(liveCards(userId), ne(cards.state, State.New), lt(cards.due, today))
      );
    const rows = await this.db
      .select()
      .from(userDays)
      .where(eq(userDays.userId, userId));
    const [done] = await this.db
      .select({ value: count() })
      .from(reviews)
      .where(and(metricRatings(userId), eq(reviews.reviewedOn, today)));

    const marks = new Map<Day, DayMark>();
    const spans = [
      ...late.map((row) => ({ from: row.from, until: row.until })),
      ...overdue.map((row) => ({ from: row.from, until: today })),
    ] as { from: Day; until: Day }[];
    for (const day of daysIn(spans)) {
      marks.set(day, "missed");
    }
    for (const row of rows) {
      if (row.completedAt) {
        marks.set(row.day, "completed");
      } else if (row.seenAt) {
        marks.set(row.day, "seen");
      }
    }
    if (!marks.has(today)) {
      if (remaining) {
        marks.set(today, "pending");
      } else if (done?.value) {
        // Cards deleted mid-Day can finish it before Início writes completed_at.
        marks.set(today, "completed");
      }
    }

    // Seen, free and pending Days neither break nor extend it.
    let current = 0;
    let best = 0;
    for (const day of [...marks.keys()].sort()) {
      const mark = marks.get(day);
      if (mark === "completed") {
        current += 1;
        best = Math.max(best, current);
      } else if (mark === "missed") {
        current = 0;
      }
    }
    return { marks, streak: { best, current } };
  }

  private async perDay(userId: string, from: Day, to: Day, deckId?: string) {
    const rows = await this.db
      .select({ day: reviews.reviewedOn, errors, reviews: count() })
      .from(reviews)
      .innerJoin(cards, eq(cards.id, reviews.cardId))
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(
        and(
          metricRatings(userId),
          liveCards(userId, deckId),
          gte(reviews.reviewedOn, from),
          lte(reviews.reviewedOn, to)
        )
      )
      .groupBy(reviews.reviewedOn);
    return new Map(
      rows.map((row) => [
        row.day,
        { errors: Number(row.errors), reviews: row.reviews },
      ])
    );
  }

  private async perDeck(userId: string, from: Day, to: Day) {
    const rows = await this.db
      .select({ deckId: cards.deckId, errors, reviews: count() })
      .from(reviews)
      .innerJoin(cards, eq(cards.id, reviews.cardId))
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(
        and(
          metricRatings(userId),
          liveCards(userId),
          gte(reviews.reviewedOn, from),
          lte(reviews.reviewedOn, to)
        )
      )
      .groupBy(cards.deckId);
    return new Map(
      rows.map((row) => [
        row.deckId,
        { errors: Number(row.errors), reviews: row.reviews },
      ])
    );
  }

  // Live Decks in the order of the Decks tab.
  private decks(userId: string) {
    return this.db
      .select({ cardCount: count(cards.id), id: decks.id, name: decks.name })
      .from(decks)
      .leftJoin(cards, and(eq(cards.deckId, decks.id), isNull(cards.deletedAt)))
      .where(and(eq(decks.userId, userId), isNull(decks.deletedAt)))
      .groupBy(decks.id)
      .orderBy(asc(decks.createdAt), asc(decks.id));
  }

  // Cards due on each Day after today, up to the forecast's last.
  private async forecast(userId: string, today: Day, deckId?: string) {
    const rows = await this.db
      .select({ day: cards.due, value: count() })
      .from(cards)
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(
        and(
          liveCards(userId, deckId),
          ne(cards.state, State.New),
          gte(cards.due, addDays(today, 1)),
          lte(cards.due, addDays(today, FORECAST_DAYS - 1))
        )
      )
      .groupBy(cards.due);
    const byDay = new Map(rows.map((row) => [row.day, row.value]));
    return Array.from(
      { length: FORECAST_DAYS - 1 },
      (_, i) => byDay.get(addDays(today, i + 1)) ?? 0
    );
  }

  private async cardStates(userId: string, deckId?: string) {
    const [row] = await this.db
      .select({
        learning: sql<number>`count(*) filter (where ${cards.state} <> ${State.New} and ${cards.scheduledDays} < ${MATURE_DAYS})`,
        mature: sql<number>`count(*) filter (where ${cards.state} <> ${State.New} and ${cards.scheduledDays} >= ${MATURE_DAYS})`,
        new: sql<number>`count(*) filter (where ${cards.state} = ${State.New})`,
      })
      .from(cards)
      .innerJoin(decks, eq(decks.id, cards.deckId))
      .where(liveCards(userId, deckId));
    return {
      learning: Number(row?.learning ?? 0),
      mature: Number(row?.mature ?? 0),
      new: Number(row?.new ?? 0),
    };
  }
}

// Every Day in the spans, each from its first Day up to the Day before until.
function daysIn(spans: { from: Day; until: Day }[]) {
  const sorted = spans.toSorted((a, b) => a.from.localeCompare(b.from));
  const days: Day[] = [];
  let next: Day | undefined;
  for (const { from, until } of sorted) {
    let day = next && next > from ? next : from;
    for (; day < until; day = addDays(day, 1)) {
      days.push(day);
    }
    if (!next || day > next) {
      next = day;
    }
  }
  return days;
}
