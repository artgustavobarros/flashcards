import type { Deck } from "@daruma/shared";
import { plural } from "~/lib/schedule";

// "12 cards · 3 novos".
export const deckCountsLine = (deck: Deck) =>
  plural(deck.cardCount, "card", "cards") +
  (deck.newCount ? ` · ${plural(deck.newCount, "novo", "novos")}` : "");

// "N para hoje" in amber, "Em dia" when nothing is due, nothing for an empty Deck.
export function TodayBadge({ deck }: { deck: Deck }) {
  if (deck.dueCount) {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-warning/15 px-2.5 py-0.5 font-medium text-warning text-xs tabular-nums">
        {deck.dueCount} para hoje
      </span>
    );
  }
  if (!deck.cardCount) {
    return null;
  }
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
      Em dia
    </span>
  );
}
