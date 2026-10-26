import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { State } from "ts-fsrs";
import { DB, type Db } from "../db/db.module.js";
import { cards, reviews, userDays, userSettings } from "../db/domain-schema.js";
import { dailyReview } from "./daily-review.js";
import {
  NEW_SCHEDULE,
  nextSchedule,
  type Rating,
  type Schedule,
} from "./schedule.js";
import { type Day, localDay } from "./today.js";

export const CLOCK = Symbol("CLOCK");
export type Clock = () => Date;

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type ReviewRow = typeof reviews.$inferSelect;

const scheduleColumns = {
  difficulty: cards.difficulty,
  due: cards.due,
  lapses: cards.lapses,
  lastReviewedOn: cards.lastReviewedOn,
  reps: cards.reps,
  scheduledDays: cards.scheduledDays,
  stability: cards.stability,
  state: cards.state,
};

const previousColumns = (schedule: Schedule) => ({
  prevDifficulty: schedule.difficulty,
  prevDue: schedule.due,
  prevLapses: schedule.lapses,
  prevLastReviewedOn: schedule.lastReviewedOn,
  prevReps: schedule.reps,
  prevScheduledDays: schedule.scheduledDays,
  prevStability: schedule.stability,
  prevState: schedule.state,
});

const previousSchedule = (review: ReviewRow): Schedule => ({
  difficulty: review.prevDifficulty,
  due: review.prevDue,
  lapses: review.prevLapses,
  lastReviewedOn: review.prevLastReviewedOn,
  reps: review.prevReps,
  scheduledDays: review.prevScheduledDays,
  stability: review.prevStability,
  state: review.prevState,
});

// Ratings, Undo and Schedule Reset. Each one writes the Card's schedule and the reviews log
// in a single transaction, with the Card row locked.
@Injectable()
export class SchedulingService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(CLOCK) private readonly clock: Clock
  ) {}

  today(userId: string): Promise<Day> {
    return this.localToday(this.db, userId, this.clock());
  }

  // The first Rating of the day goes through FSRS. A Card rated again the same day is a repeat
  // after Errei in the Study Session: it is logged with affects_schedule = false and changes
  // nothing.
  rate(userId: string, cardId: string, rating: Rating, durationMs: number) {
    return this.db.transaction(async (tx) => {
      const now = this.clock();
      const schedule = await this.lockCard(tx, userId, cardId);
      const today = await this.localToday(tx, userId, now);
      const affectsSchedule = schedule.lastReviewedOn !== today;
      const next = affectsSchedule
        ? nextSchedule(schedule, rating, today)
        : schedule;
      if (affectsSchedule) {
        await tx.update(cards).set(next).where(eq(cards.id, cardId));
      }
      const reviewId = await this.log(tx, {
        ...previousColumns(schedule),
        affectsSchedule,
        cardId,
        durationMs,
        kind: "rating",
        rating,
        reviewedAt: now,
        reviewedOn: today,
        userId,
      });
      await this.completeIfDone(tx, userId, today, now);
      return { affectsSchedule, reviewId, schedule: next };
    });
  }

  // Turns the Card back into a New Card at the end of the New Card queue. The Ratings stay in
  // the log; the reset row keeps the old schedule so Undo can bring it back.
  reset(userId: string, cardId: string) {
    return this.db.transaction(async (tx) => {
      const now = this.clock();
      const schedule = await this.lockCard(tx, userId, cardId);
      if (schedule.state === State.New) {
        throw new ConflictException("A New Card has no schedule to reset.");
      }
      const today = await this.localToday(tx, userId, now);
      await tx
        .update(cards)
        .set({ ...NEW_SCHEDULE, newQueuedAt: now })
        .where(eq(cards.id, cardId));
      const reviewId = await this.log(tx, {
        ...previousColumns(schedule),
        cardId,
        kind: "reset",
        reviewedAt: now,
        reviewedOn: today,
        userId,
      });
      return { reviewId, schedule: NEW_SCHEDULE };
    });
  }

  // Undoes a Rating or a Schedule Reset, but only the user's latest one: anything older has
  // been built on since.
  undo(userId: string, reviewId: string) {
    return this.db.transaction(async (tx) => {
      const [latest] = await tx
        .select()
        .from(reviews)
        .where(eq(reviews.userId, userId))
        .orderBy(desc(reviews.reviewedAt))
        .limit(1)
        .for("update");
      if (latest?.id !== reviewId) {
        throw new ConflictException("Only the last Rating can be undone.");
      }
      const schedule = previousSchedule(latest);
      await tx
        .update(cards)
        .set(schedule)
        .where(and(eq(cards.id, latest.cardId), eq(cards.userId, userId)));
      await tx.delete(reviews).where(eq(reviews.id, latest.id));
      // The Rating that completed the Day takes the completion with it.
      await tx
        .update(userDays)
        .set({ completedAt: null })
        .where(
          and(
            eq(userDays.userId, userId),
            eq(userDays.day, latest.reviewedOn),
            gte(userDays.completedAt, latest.reviewedAt)
          )
        );
      return { cardId: latest.cardId, schedule };
    });
  }

  // The Daily Review is complete once a Rating leaves nothing in it, which is what the Streak
  // counts. A Day that reopens later (Cards written, a higher limit) keeps its completion.
  async completeIfDone(db: Db | Tx, userId: string, today: Day, now: Date) {
    const { due, fresh } = await dailyReview(db, userId, today);
    if (due.length + fresh.length) {
      return;
    }
    await db
      .insert(userDays)
      .values({ completedAt: now, day: today, userId })
      .onConflictDoUpdate({
        set: {
          completedAt: sql`coalesce(${userDays.completedAt}, excluded.completed_at)`,
        },
        target: [userDays.userId, userDays.day],
      });
  }

  private async lockCard(
    tx: Tx,
    userId: string,
    cardId: string
  ): Promise<Schedule> {
    const [card] = await tx
      .select(scheduleColumns)
      .from(cards)
      .where(
        and(
          eq(cards.id, cardId),
          eq(cards.userId, userId),
          isNull(cards.deletedAt)
        )
      )
      .for("update");
    if (!card) {
      throw new NotFoundException("Card not found.");
    }
    return card;
  }

  private async localToday(db: Db | Tx, userId: string, now: Date) {
    const [settings] = await db
      .select({ timezone: userSettings.timezone })
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    if (!settings) {
      throw new Error(`User ${userId} has no settings row.`);
    }
    return localDay(now, settings.timezone);
  }

  private async log(tx: Tx, review: typeof reviews.$inferInsert) {
    const [row] = await tx
      .insert(reviews)
      .values(review)
      .returning({ id: reviews.id });
    // biome-ignore lint/style/noNonNullAssertion: INSERT … RETURNING yields the inserted row.
    return row!.id;
  }
}
