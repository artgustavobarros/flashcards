import { z } from "zod";

export const deckNameSchema = z
  .string()
  .trim()
  .min(1, "Dê um nome ao Deck.")
  .max(80, "Use até 80 caracteres.");

export const deckBodySchema = z.object({ name: deckNameSchema });
export type DeckBody = z.infer<typeof deckBodySchema>;

// dueCount: Cards with a schedule due today or overdue. New Cards are counted apart.
export const deckSchema = z.object({
  cardCount: z.number().int(),
  dueCount: z.number().int(),
  id: z.uuid(),
  name: z.string(),
  newCount: z.number().int(),
});
export type Deck = z.infer<typeof deckSchema>;

export const decksResponseSchema = z.object({ decks: z.array(deckSchema) });
export const deckResponseSchema = z.object({ deck: deckSchema });
