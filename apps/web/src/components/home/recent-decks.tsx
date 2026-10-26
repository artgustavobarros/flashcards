import type { Today } from "@daruma/shared";
import { Link } from "@tanstack/react-router";
import { Check, Layers } from "lucide-react";
import type { ReactNode } from "react";
import { plural } from "~/lib/schedule";
import { type DeckBadge, deckBadge } from "~/lib/today";
import { cn } from "~/lib/utils";

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 font-medium text-xs tabular-nums",
        className
      )}
    >
      {children}
    </span>
  );
}

function DeckBadges({ badge }: { badge: DeckBadge }) {
  switch (badge?.kind) {
    case "today":
      return (
        <>
          <Badge className="bg-warning/15 text-warning">
            {badge.remaining} para hoje
          </Badge>
          {badge.fresh ? (
            <Badge className="bg-primary/10 text-primary">
              {plural(badge.fresh, "novo", "novos")}
            </Badge>
          ) : null}
        </>
      );
    case "tomorrow":
      return (
        <Badge className="bg-muted text-muted-foreground">
          {badge.count} para amanhã
        </Badge>
      );
    case "done":
      return (
        <Badge className="bg-muted text-success">
          <Check className="size-3.5" />
          Feito hoje
        </Badge>
      );
    case "clear":
      return <Badge className="bg-muted text-muted-foreground">Em dia</Badge>;
    default:
      return null;
  }
}

// Up to four Decks, the ones most recently created or studied. The whole card opens the Deck.
export function RecentDecks({ today }: { today: Today }) {
  return (
    <section aria-labelledby="recent-decks-title">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3
          className="font-heading font-semibold text-lg"
          id="recent-decks-title"
        >
          Decks recentes
        </h3>
        <Link
          className="font-medium text-primary text-sm underline-offset-4 hover:underline"
          to="/decks"
        >
          Ver todos
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {today.decks.map((deck) => (
          <li key={deck.id}>
            <Link
              className="block h-full rounded-lg border bg-card p-4 shadow-card transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              params={{ deckId: deck.id }}
              to="/decks/$deckId"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                  <Layers className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading font-semibold">
                    {deck.name}
                  </p>
                  <p className="text-muted-foreground text-sm tabular-nums">
                    {plural(deck.cardCount, "card", "cards")}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 empty:hidden">
                <DeckBadges badge={deckBadge(deck, today)} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
