import { z } from "zod";
import { foldText } from "./text.js";

export const labelNameSchema = z
  .string()
  .trim()
  .min(1, "Dê um nome à Label.")
  .max(40, "Use até 40 caracteres.");

// Two Labels can't share a name, even with other accents, case or spacing.
export const labelKey = (name: string) =>
  foldText(name).replace(/\s+/g, " ").trim();

export const labelBodySchema = z.object({ name: labelNameSchema });
export type LabelBody = z.infer<typeof labelBodySchema>;

// A Label as a Card carries it.
export const cardLabelSchema = z.object({ id: z.uuid(), name: z.string() });
export type CardLabel = z.infer<typeof cardLabelSchema>;

export const labelSchema = cardLabelSchema.extend({
  cardCount: z.number().int(),
});
export type Label = z.infer<typeof labelSchema>;

export const labelsResponseSchema = z.object({ labels: z.array(labelSchema) });
export const labelResponseSchema = z.object({ label: cardLabelSchema });
