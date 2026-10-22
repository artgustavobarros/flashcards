import { createFileRoute } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { EmptyState } from "~/components/empty-state";

export const Route = createFileRoute("/_app/configuracoes")({
  component: Page,
  head: () => ({ meta: [{ title: "Configurações · Daruma" }] }),
  staticData: { title: "Configurações" },
});

function Page() {
  return (
    <div className="space-y-6">
      <h2 className="hidden font-heading font-semibold text-3xl md:block">
        Configurações
      </h2>
      <EmptyState
        icon={SlidersHorizontal}
        title="Horário da revisão, novos por dia e tema ficam aqui."
      />
    </div>
  );
}
