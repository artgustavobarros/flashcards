import type { Health } from "@daruma/shared";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { EmptyState } from "~/components/empty-state";
import { getHealth } from "~/lib/api";

export const Route = createFileRoute("/_app/")({
  component: Home,
  head: () => ({ meta: [{ title: "Início · Daruma" }] }),
  staticData: { title: "Início" },
});

function healthText(health: UseQueryResult<Health>) {
  if (health.isPending) {
    return "Checando a API…";
  }
  if (health.isError) {
    return `API fora do ar: ${health.error.message}`;
  }
  return `API ok · banco ${health.data.db === "up" ? "conectado" : "fora do ar"}`;
}

function Home() {
  const health = useQuery({ queryFn: getHealth, queryKey: ["health"] });

  return (
    <div className="space-y-6">
      <h2 className="hidden font-heading font-semibold text-3xl md:block">
        Início
      </h2>
      <EmptyState
        icon={CalendarCheck}
        title="A revisão de hoje aparece aqui."
      />
      <p className="text-muted-foreground text-xs" data-testid="health">
        {healthText(health)}
      </p>
    </div>
  );
}
