import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { getCard, getCards, getDeck, getDecks } from "~/lib/api";

// Keys: ["decks"] for every Deck query, ["cards"] for every Card query. Any change to a Card
// moves Deck counts too, so mutations refresh both (see refreshLibrary).
export const decksQuery = queryOptions({
  queryFn: getDecks,
  queryKey: ["decks"],
});

export const deckQuery = (id: string) =>
  queryOptions({
    queryFn: () => getDeck(id),
    queryKey: ["decks", id],
  });

export const deckCardsQuery = (deckId: string) =>
  queryOptions({
    queryFn: () => getCards({ deckId }),
    queryKey: ["cards", "list", { deckId }],
  });

export const cardQuery = (id: string) =>
  queryOptions({
    queryFn: () => getCard(id),
    queryKey: ["cards", id],
  });

export function refreshLibrary(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["decks"] }),
    queryClient.invalidateQueries({ queryKey: ["cards"] }),
  ]);
}
