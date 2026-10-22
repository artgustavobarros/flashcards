import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Layers, Plus } from "lucide-react";
import { deckCountsLine, TodayBadge } from "~/components/decks/deck-counts";
import { EmptyState } from "~/components/empty-state";
import { notifyEditorSoon } from "~/components/shell/new-menu";
import { Button } from "~/components/ui/button";
import { decksQuery } from "~/lib/queries";

export const Route = createFileRoute("/_app/decks/")({
  component: Page,
  head: () => ({ meta: [{ title: "Decks · Daruma" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(decksQuery),
  staticData: { title: "Decks" },
});

function Page() {
  const { decks } = useSuspenseQuery(decksQuery).data;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="hidden font-heading font-semibold text-3xl tracking-tight md:block">
          Decks
        </h2>
        {decks.length ? (
          <Button
            className="ml-auto hidden sm:inline-flex"
            onClick={notifyEditorSoon}
            variant="outline"
          >
            <Plus data-icon="inline-start" />
            Novo Deck
          </Button>
        ) : null}
      </div>
      {decks.length ? (
        <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-card">
          {decks.map((deck) => (
            <li key={deck.id}>
              <Link
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-accent/50"
                params={{ deckId: deck.id }}
                to="/decks/$deckId"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                  <Layers className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {deck.name}
                  </span>
                  <span className="block text-muted-foreground text-sm tabular-nums">
                    {deckCountsLine(deck)}
                  </span>
                  <span className="mt-1.5 flex empty:hidden sm:hidden">
                    <TodayBadge deck={deck} />
                  </span>
                </span>
                <span className="hidden sm:flex">
                  <TodayBadge deck={deck} />
                </span>
                <ChevronRight className="size-5 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          description="Um Deck junta os Cards de um assunto. Depois de criar, você já começa a escrever os Cards."
          icon={Layers}
          title="Crie seu primeiro Deck"
        >
          <Button className="mt-1" onClick={notifyEditorSoon}>
            <Plus data-icon="inline-start" />
            Novo Deck
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
