import type { Today } from "@daruma/shared";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Layers, Plus } from "lucide-react";
import { EmptyState } from "~/components/empty-state";
import { RecentDecks } from "~/components/home/recent-decks";
import { ReviewStrip } from "~/components/home/review-strip";
import { useTodayActions } from "~/components/home/use-today-actions";
import { Button } from "~/components/ui/button";
import { sessionQuery } from "~/lib/auth";
import { todayQuery } from "~/lib/queries";
import { dayLine, greeting, welcome } from "~/lib/today";

export const Route = createFileRoute("/_app/")({
  component: Home,
  head: () => ({ meta: [{ title: "Início · Daruma" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(todayQuery),
  staticData: { title: "Início" },
});

function Home() {
  const { today } = useSuspenseQuery(todayQuery).data;
  const { data: session } = useQuery(sessionQuery);
  const name = session?.user.name;
  const { study } = useTodayActions();
  const empty = today.status === "empty";

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-balance font-heading font-semibold text-2xl tracking-tight md:text-3xl">
          {empty ? welcome(name) : greeting(name)}
        </h2>
        <p className="mt-1 text-pretty text-muted-foreground tabular-nums">
          {dayLine(today)}
          {today.status === "seen" ? (
            <>
              {" "}
              <button
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={study}
                type="button"
              >
                Revisar mesmo assim
              </button>
            </>
          ) : null}
        </p>
      </div>
      {today.status === "open" ? <ReviewStrip today={today} /> : null}
      {empty ? (
        <EmptyState
          description="Um Deck junta os Cards de um assunto. Depois de criar, você já começa a escrever os Cards."
          icon={Layers}
          title="Crie seu primeiro Deck"
        >
          <Button asChild className="mt-1">
            <Link to="/decks/novo">
              <Plus data-icon="inline-start" />
              Criar Deck
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <RecentDecks today={today} />
      )}
      {today.hasRatings ? null : <ReviewTimeHint today={today} />}
    </div>
  );
}

// Until the first Rating: when the notice comes, with a way to change it.
function ReviewTimeHint({ today }: { today: Today }) {
  return (
    <p className="flex items-start gap-1.5 text-muted-foreground text-sm">
      <Clock className="mt-0.5 size-4 shrink-0" />
      <span>
        O aviso da revisão chega às{" "}
        <span className="tabular-nums">{today.reviewTime}</span>, no app e no
        e-mail.{" "}
        <Link
          className="font-medium text-primary underline-offset-4 hover:underline"
          to="/configuracoes"
        >
          Mudar
        </Link>
      </span>
    </p>
  );
}
