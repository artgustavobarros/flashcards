import { z } from "zod";

const count = z.number().int().min(0);

// 7, 30 or 90 days ending today, or everything since the first Rating.
export const progressPeriodSchema = z.enum(["7", "30", "90", "all"]);
export type ProgressPeriod = z.infer<typeof progressPeriodSchema>;

// GET /api/progress. Without deckId, every Deck.
export const progressQuerySchema = z.object({
  deckId: z.uuid().optional(),
  period: progressPeriodSchema.default("30"),
});
export type ProgressQuery = z.infer<typeof progressQuerySchema>;

// How a Day went for the Streak, whatever the Deck filter. completed: the Daily Review was
// done. seen: marked as seen. missed: Cards were due and left. free: nothing was due.
// pending: today, still open.
export const dayMarkSchema = z.enum([
  "completed",
  "seen",
  "missed",
  "free",
  "pending",
]);
export type DayMark = z.infer<typeof dayMarkSchema>;

// Ratings on a Day, in the Deck filter. errors are the Errei among them.
export const progressDaySchema = z.object({
  day: z.iso.date(),
  errors: count,
  mark: dayMarkSchema,
  reviews: count,
});
export type ProgressDay = z.infer<typeof progressDaySchema>;

// A Deck in "Por Deck" and the Deck filter. reviews and errors cover the period.
export const progressDeckSchema = z.object({
  cardCount: count,
  errors: count,
  id: z.uuid(),
  name: z.string(),
  reviews: count,
  // Cards still in today's Daily Review, New Cards included.
  today: count,
});
export type ProgressDeck = z.infer<typeof progressDeckSchema>;

export const progressSchema = z.object({
  cardStates: z.object({ learning: count, mature: count, new: count }),
  // Every Day of the period, oldest first, ending today.
  days: z.array(progressDaySchema),
  // Every Deck, whatever the filter.
  decks: z.array(progressDeckSchema),
  // Cards due on each of the next 7 Days, today first (today: still due, overdue included).
  forecast: z.array(count).length(7),
  hasRatings: z.boolean(),
  // Counts consecutive completed Daily Reviews, across every Deck.
  streak: z.object({ best: count, current: count }),
});
export type Progress = z.infer<typeof progressSchema>;

export const progressResponseSchema = z.object({ progress: progressSchema });
