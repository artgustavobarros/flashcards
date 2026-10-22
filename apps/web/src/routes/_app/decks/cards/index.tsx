import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { CardBrowser } from "~/components/cards/card-browser";
import { DeckTabs } from "~/components/decks/deck-tabs";
import { type CardFilters, cardFiltersSchema } from "~/lib/card-filters";
import { decksQuery, labelsQuery } from "~/lib/queries";

export const Route = createFileRoute("/_app/decks/cards/")({
  component: Page,
  head: () => ({ meta: [{ title: "Cards · Daruma" }] }),
  // The chips' menus; the list itself loads in the page, keeping the last result on screen.
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(decksQuery),
      queryClient.ensureQueryData(labelsQuery),
    ]),
  staticData: { title: "Decks" },
  validateSearch: cardFiltersSchema,
});

function Page() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const setFilters = useCallback(
    (search: CardFilters) => navigate({ replace: true, search }),
    [navigate]
  );

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="hidden font-heading font-semibold text-3xl tracking-tight md:block">
          Decks
        </h2>
        <DeckTabs className="md:ml-6" />
      </div>
      <CardBrowser
        backLabel="Cards"
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
