import { z } from "zod";
import { deckNameSchema } from "./decks.js";
import { cardLabelSchema } from "./labels.js";
import { richTextSchema } from "./rich-text.js";

// Novo / Em aprendizado / Maduro. Being due is not a state (see GLOSSARY.md).
export const cardStateSchema = z.enum(["new", "learning", "mature"]);
export type CardState = z.infer<typeof cardStateSchema>;

// A Day on the user's calendar, 'YYYY-MM-DD'.
const daySchema = z.iso.date();

const cardSummarySchema = z.object({
  answerText: z.string(),
  commentCount: z.number().int(),
  deckId: z.uuid(),
  deckName: z.string(),
  // null for a New Card.
  due: daySchema.nullable(),
  id: z.uuid(),
  // By name.
  labels: z.array(cardLabelSchema),
  questionText: z.string(),
  state: cardStateSchema,
});

// A row in a list: plain text only. During a search, matchedComment is the first Comment with
// the term (null when the question or answer has it, or when nothing is searched).
export const cardListItemSchema = cardSummarySchema.extend({
  matchedComment: z.string().nullable(),
});
export type CardListItem = z.infer<typeof cardListItemSchema>;

export const cardSchema = cardSummarySchema.extend({
  answer: richTextSchema,
  question: richTextSchema,
  resetAt: z.iso.datetime().nullable(),
});
export type Card = z.infer<typeof cardSchema>;

// GET /api/cards. due=today keeps Cards due today or overdue. q matches the question, the
// answer and the Comments, ignoring accents and case.
export const cardsQuerySchema = z.object({
  deckId: z.uuid().optional(),
  due: z.literal("today").optional(),
  labelId: z.uuid().optional(),
  q: z.string().trim().max(200).optional(),
  state: cardStateSchema.optional(),
});
export type CardsQuery = z.infer<typeof cardsQuerySchema>;

// The batch carries Card ids from the editor; order is the order they were saved.
export const studyQueueBodySchema = z.discriminatedUnion("origin", [
  z.object({ origin: z.literal("daily") }),
  z.object({ deckId: z.uuid(), origin: z.literal("deck") }),
  z.object({
    cardIds: z.array(z.uuid()).min(1).max(1000),
    origin: z.literal("batch"),
  }),
]);
export type StudyQueueBody = z.infer<typeof studyQueueBodySchema>;
export const studyQueueResponseSchema = z.object({
  cards: z.array(cardSchema),
  today: daySchema,
});

// `today` is the user's local day, so due dates can be shown as "Hoje" or "Atrasado".
export const cardsResponseSchema = z.object({
  cards: z.array(cardListItemSchema),
  today: daySchema,
});
export const cardResponseSchema = z.object({
  card: cardSchema,
  today: daySchema,
});

const labelIdsSchema = z.array(z.uuid()).max(100);

const contentSchema = z.object({
  answer: richTextSchema,
  labelIds: labelIdsSchema.optional(),
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

// Editing content, Labels or the Deck never touches the schedule. labelIds replaces the set.
export const updateCardBodySchema = z
  .object({
    answer: richTextSchema,
    deckId: z.uuid(),
    labelIds: labelIdsSchema,
    question: richTextSchema,
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Nada para salvar.");
export type UpdateCardBody = z.infer<typeof updateCardBodySchema>;

// Selection actions on several Cards at once (the Cards tab, a Deck).
const cardIdsSchema = z.array(z.uuid()).min(1).max(1000);

export const cardIdsBodySchema = z.object({ cardIds: cardIdsSchema });
export type CardIdsBody = z.infer<typeof cardIdsBodySchema>;

export const moveCardsBodySchema = z.object({
  cardIds: cardIdsSchema,
  deckId: z.uuid(),
});
export type MoveCardsBody = z.infer<typeof moveCardsBodySchema>;

// Puts the Label on every Card (add: true) or takes it off every Card.
export const cardsLabelBodySchema = z.object({
  add: z.boolean(),
  cardIds: cardIdsSchema,
  labelId: z.uuid(),
});
export type CardsLabelBody = z.infer<typeof cardsLabelBodySchema>;

export const imageResponseSchema = z.object({ src: z.string() });
