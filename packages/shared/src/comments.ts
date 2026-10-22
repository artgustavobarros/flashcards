import { z } from "zod";

export const commentBodySchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Escreva o Comment.")
    .max(2000, "Use até 2000 caracteres."),
});
export type CommentBody = z.infer<typeof commentBodySchema>;

export const commentSchema = z.object({
  body: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});
export type Comment = z.infer<typeof commentSchema>;

// Oldest first.
export const commentsResponseSchema = z.object({
  comments: z.array(commentSchema),
});
export const commentResponseSchema = z.object({ comment: commentSchema });
