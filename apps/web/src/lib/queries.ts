import type { CardsQuery } from "@daruma/shared";
import {
  keepPreviousData,
  type QueryClient,
  queryOptions,
} from "@tanstack/react-query";
import {
  getCard,
  getCards,
  getComments,
  getDeck,
  getDecks,
  getLabels,
} from "~/lib/api";

// Keys: ["decks"] for every Deck query, ["cards"] for every Card query, ["labels"] for Labels.
// Any change to a Card moves Deck and Label counts too, so mutations refresh all three
// (see refreshLibrary).
export const decksQuery = queryOptions({
  queryFn: getDecks,
  queryKey: ["decks"],
});

export const deckQuery = (id: string) =>
  queryOptions({
    queryFn: () => getDeck(id),
    queryKey: ["decks", id],
  });

// A list keeps showing the previous result while the next search or filter loads.
export const cardsQuery = (query: CardsQuery) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryFn: () => getCards(query),
    queryKey: ["cards", "list", query],
  });

// Under ["cards"], so refreshLibrary refreshes them too.
export const commentsQuery = (cardId: string) =>
  queryOptions({
    queryFn: () => getComments(cardId),
    queryKey: ["cards", cardId, "comments"],
  });

export const labelsQuery = queryOptions({
  queryFn: getLabels,
  queryKey: ["labels"],
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
    queryClient.invalidateQueries({ queryKey: ["labels"] }),
  ]);
}
