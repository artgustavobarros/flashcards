import { z } from "zod";
import { deckNameSchema } from "./decks.js";
import { richTextSchema } from "./rich-text.js";

// Novo / Em aprendizado / Maduro. Being due is not a state (see GLOSSARY.md).
export const cardStateSchema = z.enum(["new", "learning", "mature"]);
export type CardState = z.infer<typeof cardStateSchema>;

// A Day on the user's calendar, 'YYYY-MM-DD'.
const daySchema = z.iso.date();

// A row in a list: plain text only.
export const cardListItemSchema = z.object({
  answerText: z.string(),
  deckId: z.uuid(),
  deckName: z.string(),
  // null for a New Card.
  due: daySchema.nullable(),
  id: z.uuid(),
  questionText: z.string(),
  state: cardStateSchema,
});
export type CardListItem = z.infer<typeof cardListItemSchema>;

export const cardSchema = cardListItemSchema.extend({
  answer: richTextSchema,
  question: richTextSchema,
});
export type Card = z.infer<typeof cardSchema>;

// `today` is the user's local day, so due dates can be shown as "Hoje" or "Atrasado".
export const cardsResponseSchema = z.object({
  cards: z.array(cardListItemSchema),
  today: daySchema,
});
export const cardResponseSchema = z.object({
  card: cardSchema,
  today: daySchema,
});

const contentSchema = z.object({
  answer: richTextSchema,
  question: richTextSchema,
});

// A Card goes into an existing Deck, or into a new one created with it ("Novo Deck": the Deck
// only exists once its first Card is saved).
export const createCardBodySchema = z.union([
  contentSchema.extend({ deckId: z.uuid() }),
  contentSchema.extend({ deckName: deckNameSchema }),
]);
export type CreateCardBody = z.infer<typeof createCardBodySchema>;

export const createCardResponseSchema = z.object({
  card: z.object({ deckId: z.uuid(), id: z.uuid() }),
});

// Editing content or moving to another Deck never touches the schedule.
export const updateCardBodySchema = z
  .object({
    answer: richTextSchema,
    deckId: z.uuid(),
    question: richTextSchema,
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Nada para salvar.");
export type UpdateCardBody = z.infer<typeof updateCardBodySchema>;

export const imageResponseSchema = z.object({ src: z.string() });
