import type { Health } from "@daruma/shared";
import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { useCallback } from "react";
import { EmptyState } from "~/components/empty-state";
import { Button } from "~/components/ui/button";
import { getHealth, getStudyQueue } from "~/lib/api";
import { plural } from "~/lib/schedule";
import { clearStudy } from "~/lib/study-storage";

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
  const daily = useQuery({
    queryFn: () => getStudyQueue({ origin: "daily" }),
    queryKey: ["study-queue", "home"],
  });
  const navigate = useNavigate();
  const startStudy = useCallback(() => {
    clearStudy();
    navigate({ search: { origem: "daily" }, to: "/estudar" });
  }, [navigate]);

  return (
    <div className="space-y-6">
      <h2 className="hidden font-heading font-semibold text-3xl md:block">
        Início
      </h2>
      <EmptyState
        icon={CalendarCheck}
        title={
          daily.data?.cards.length
            ? `Revisão de hoje: ${plural(daily.data.cards.length, "Card", "Cards")}`
            : "A revisão de hoje aparece aqui."
        }
      >
        {daily.data?.cards.length ? (
          <Button onClick={startStudy}>Começar</Button>
        ) : null}
      </EmptyState>
      <p className="text-muted-foreground text-xs" data-testid="health">
        {healthText(health)}
      </p>
    </div>
  );
}
