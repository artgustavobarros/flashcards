import { z } from "zod";

export const ratingBodySchema = z.object({
  durationMs: z.number().int().min(0).max(43_200_000),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});
export type RatingBody = z.infer<typeof ratingBodySchema>;

export const ratingResponseSchema = z.object({
  affectsSchedule: z.boolean(),
  due: z.iso.date().nullable(),
  reviewId: z.uuid(),
});

export const resetResponseSchema = z.object({ reviewId: z.uuid() });
export const undoResponseSchema = z.object({ cardId: z.uuid() });
