import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { EmptyState } from "~/components/empty-state";

export const Route = createFileRoute("/_app/decks")({
  component: Page,
  head: () => ({ meta: [{ title: "Decks · Daruma" }] }),
  staticData: { title: "Decks" },
});

function Page() {
  return (
    <div className="space-y-6">
      <h2 className="hidden font-heading font-semibold text-3xl md:block">
        Decks
      </h2>
      <EmptyState icon={Layers} title="Seus Decks e Cards aparecem aqui." />
    </div>
  );
}
