import type { CardListItem } from "@daruma/shared";
import { Link } from "@tanstack/react-router";
import { plural } from "~/lib/schedule";
import { DueBadge } from "./due-badge";

// The Cards of a Deck, one row each: question, answer in gray, schedule badge.
// Search, filters, Labels and selection join it with the Cards tab.
export function CardList({
  cards,
  today,
}: {
  cards: CardListItem[];
  today: string;
}) {
  return (
    <div>
      <p className="flex h-11 items-center text-muted-foreground text-sm tabular-nums">
        {plural(cards.length, "card", "cards")}
      </p>
      <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-card">
        {cards.map((card) => (
          <li key={card.id}>
            <Link
              className="block px-4 py-3.5 transition hover:bg-accent/50"
              params={{ cardId: card.id }}
              to="/decks/cards/$cardId"
            >
              <p className="line-clamp-2 font-medium text-sm">
                {card.questionText}
              </p>
              <p className="mt-0.5 line-clamp-1 text-muted-foreground text-sm">
                {card.answerText}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 empty:hidden">
                <DueBadge card={card} today={today} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
