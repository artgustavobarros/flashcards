import { createFileRoute } from "@tanstack/react-router";
import { ChartColumn } from "lucide-react";
import { EmptyState } from "~/components/empty-state";

export const Route = createFileRoute("/_app/progresso")({
  component: Page,
  head: () => ({ meta: [{ title: "Progresso · Daruma" }] }),
  staticData: { title: "Progresso" },
});

function Page() {
  return (
    <div className="space-y-6">
      <h2 className="hidden font-heading font-semibold text-3xl md:block">
        Progresso
      </h2>
      <EmptyState
        icon={ChartColumn}
        title="Sua evolução aparece aqui depois que você estudar os primeiros Cards."
      />
    </div>
  );
}
