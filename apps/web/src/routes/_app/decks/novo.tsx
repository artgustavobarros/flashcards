import { createFileRoute } from "@tanstack/react-router";
import { CardEditor } from "~/components/editor/card-editor";

export const Route = createFileRoute("/_app/decks/novo")({
  component: () => <CardEditor mode={NEW_DECK} />,
  head: () => ({ meta: [{ title: "Novo Deck · Daruma" }] }),
  staticData: { focus: true, title: "Novo Deck" },
});

const NEW_DECK = { kind: "new-deck" } as const;
