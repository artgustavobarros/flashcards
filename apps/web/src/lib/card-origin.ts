// The list a Card was opened from (the Cards tab or a Deck, with its search and filters), so
// the Card page's "voltar" returns there, even after a trip through the editor.
interface Origin {
  cardId: string;
  href: string;
  label: string;
}

let origin: Origin | null = null;

export function rememberOrigin(next: Origin) {
  origin = next;
}

// Its Deck when the Card was opened some other way (a link, a reload).
export function cardOrigin(card: {
  deckId: string;
  deckName: string;
  id: string;
}) {
  return origin?.cardId === card.id
    ? origin
    : { href: `/decks/${card.deckId}`, label: card.deckName };
}
