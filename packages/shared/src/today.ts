import { z } from "zod";

const count = z.number().int().min(0);

// A Deck on Início, with its share of today's Daily Review.
export const todayDeckSchema = z.object({
  cardCount: count,
  // Cards rated today.
  done: count,
  // New Cards among remaining.
  fresh: count,
  id: z.uuid(),
  name: z.string(),
  // Cards still in today's Daily Review.
  remaining: count,
  // Cards in tomorrow's Daily Review if nothing else is studied.
  tomorrow: count,
});
export type TodayDeck = z.infer<typeof todayDeckSchema>;

// empty: no Decks yet. open: Cards remain. seen: Cards remain, marked as seen. completed: every
// Card done. free: nothing was due.
export const dayStatusSchema = z.enum([
  "empty",
  "open",
  "seen",
  "completed",
  "free",
]);
export type DayStatus = z.infer<typeof dayStatusSchema>;

// Today's Daily Review for Início and the bell.
export const todaySchema = z.object({
  // Many overdue Cards: Início offers to pause New Cards.
  backlog: z.boolean(),
  completedAt: z.iso.datetime().nullable(),
  day: z.iso.date(),
  // The Decks most recently created or studied, up to four.
  decks: z.array(todayDeckSchema),
  done: count,
  // The user has Ratings, and all of them are from today.
  firstDay: z.boolean(),
  fresh: count,
  hasRatings: z.boolean(),
  newCardsPaused: z.boolean(),
  // The bell's dot: the Review Time has passed, Cards remain and the bell wasn't opened.
  notice: z.boolean(),
  // Overdue Cards among remaining.
  overdue: count,
  remaining: count,
  // Due Cards among remaining, overdue included.
  reviews: count,
  // 'HH:MM' on the user's clock.
  reviewTime: z.string().regex(/^\d\d:\d\d$/),
  status: dayStatusSchema,
  tomorrow: count,
  yesterday: z.enum(["completed", "seen"]).nullable(),
});
export type Today = z.infer<typeof todaySchema>;

export const todayResponseSchema = z.object({ today: todaySchema });

// Partial: each setting is saved on its own.
export const settingsBodySchema = z
  .object({ newCardsPaused: z.boolean() })
  .partial()
  .strict();
export type SettingsBody = z.infer<typeof settingsBodySchema>;
