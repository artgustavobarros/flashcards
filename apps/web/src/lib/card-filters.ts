import { type CardsQuery, cardStateSchema } from "@daruma/shared";
import { z } from "zod";

// The Cards tab and a Deck keep the search and filters in the URL, so "voltar" from a Card
// returns to the same list. A bad value is dropped rather than failing the page.
export const cardFiltersSchema = z.object({
  deckId: z.uuid().optional().catch(undefined),
  due: z.literal("today").optional().catch(undefined),
  labelId: z.uuid().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  state: cardStateSchema.optional().catch(undefined),
});
export type CardFilters = z.infer<typeof cardFiltersSchema>;

// The API query for a list. A Deck page fixes deckId.
export const toCardsQuery = (
  filters: CardFilters,
  deckId?: string
): CardsQuery => ({
  deckId: deckId ?? filters.deckId,
  due: filters.due,
  labelId: filters.labelId,
  q: filters.q?.trim() || undefined,
  state: filters.state,
});

// Filters other than the search; on a Deck page its own Deck doesn't count.
export const hasFilter = (filters: CardFilters, inDeck: boolean) =>
  Boolean(
    filters.labelId ||
      filters.state ||
      filters.due ||
      (!inDeck && filters.deckId)
  );
