import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { CardEditor } from "~/components/editor/card-editor";
import { isMissing } from "~/lib/api";
import { deckQuery } from "~/lib/queries";

export const Route = createFileRoute("/_app/decks/$deckId/adicionar")({
  component: Page,
  head: () => ({ meta: [{ title: "Adicionar Cards · Daruma" }] }),
  loader: async ({ context: { queryClient }, params: { deckId } }) => {
    try {
      await queryClient.ensureQueryData(deckQuery(deckId));
    } catch (error) {
      if (isMissing(error)) {
        throw notFound();
      }
      throw error;
    }
  },
  staticData: { focus: true, title: "Adicionar Cards" },
});

function Page() {
  const { deckId } = Route.useParams();
  const { deck } = useSuspenseQuery(deckQuery(deckId)).data;
  // The batch belongs to the Deck it started in, even if the Deck is renamed meanwhile.
  const [mode] = useState(() => ({
    deck: { id: deck.id, name: deck.name },
    kind: "batch" as const,
  }));
  return <CardEditor key={deckId} mode={mode} />;
}
