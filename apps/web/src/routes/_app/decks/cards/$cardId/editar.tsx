import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CardEditor, type EditorMode } from "~/components/editor/card-editor";
import { isMissing } from "~/lib/api";
import { cardQuery } from "~/lib/queries";

export const Route = createFileRoute("/_app/decks/cards/$cardId/editar")({
  component: Page,
  head: () => ({ meta: [{ title: "Editar Card · Daruma" }] }),
  loader: async ({ context: { queryClient }, params: { cardId } }) => {
    try {
      await queryClient.ensureQueryData(cardQuery(cardId));
    } catch (error) {
      if (isMissing(error)) {
        throw notFound();
      }
      throw error;
    }
  },
  staticData: { focus: true, title: "Editar Card" },
  validateSearch: z.object({ de: z.enum(["card", "sessao"]).optional() }),
});

function Page() {
  const { cardId } = Route.useParams();
  const { de } = Route.useSearch();
  const queryClient = useQueryClient();
  // The Card as it was when the editor opened; a refetch must not reset the text being edited.
  const [mode] = useState<EditorMode | null>(() => {
    const data = queryClient.getQueryData(cardQuery(cardId).queryKey);
    return data ? { card: data.card, kind: "edit" } : null;
  });
  return mode ? (
    <CardEditor key={cardId} mode={mode} returnToStudy={de === "sessao"} />
  ) : null;
}
