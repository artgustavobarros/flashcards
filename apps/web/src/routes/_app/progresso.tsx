import type { Progress } from "@daruma/shared";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { cn } from "cn";
import { ChartColumn, Play, Plus } from "lucide-react";
import { type MouseEvent, useCallback } from "react";
import { useTodayActions } from "~/components/home/use-today-actions";
import { Activity } from "~/components/progress/activity";
import {
  Accuracy,
  CardStates,
  DeckFocus,
  DeckList,
  Forecast,
  Ghost,
  Panel,
  Streak,
} from "~/components/progress/blocks";
import { Carousel } from "~/components/progress/carousel";
import { ChartTips } from "~/components/progress/chart-tip";
import { DeckCombo } from "~/components/progress/deck-combo";
import { Evolution, EvolutionLegend } from "~/components/progress/evolution";
import { Button } from "~/components/ui/button";
import { useMediaQuery } from "~/hooks/use-media-query";
import { isMissing } from "~/lib/api";
import {
  PERIODS,
  type PeriodOption,
  periodOf,
  progressSearchSchema,
  toProgressQuery,
  withPeriod,
} from "~/lib/progress";
import { progressQuery } from "~/lib/queries";
import { plural } from "~/lib/schedule";

export const Route = createFileRoute("/_app/progresso")({
  component: Page,
  head: () => ({ meta: [{ title: "Progresso · Daruma" }] }),
  // Before the loader, so TanStack types its deps.
  validateSearch: progressSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    try {
      await context.queryClient.ensureQueryData(
        progressQuery(toProgressQuery(deps))
      );
    } catch (error) {
      // A Deck deleted since the link was made: show every Deck instead.
      if (deps.deck && isMissing(error)) {
        throw redirect({
          replace: true,
          search: { ...deps, deck: undefined },
          to: "/progresso",
        });
      }
      throw error;
    }
  },
  staticData: { title: "Progresso" },
});

function Page() {
  const search = Route.useSearch();
  const period = periodOf(search);
  const { progress } = useSuspenseQuery(
    progressQuery(toProgressQuery(search))
  ).data;
  const navigate = useNavigate({ from: Route.fullPath });
  const desktop = useMediaQuery("(min-width: 768px)");

  const pickDeck = useCallback(
    (deck: string | undefined) => {
      navigate({ search: (prev) => ({ ...prev, deck }) });
      window.scrollTo({ behavior: "smooth", top: 0 });
    },
    [navigate]
  );
  const pickPeriod = useCallback(
    (value: PeriodOption) =>
      navigate({ replace: true, search: (prev) => withPeriod(prev, value) }),
    [navigate]
  );

  return (
    <ChartTips>
      <div className="mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-center">
        <h2 className="hidden font-heading font-semibold text-3xl tracking-tight md:block">
          Progresso
        </h2>
        {progress.hasRatings ? (
          <div className="flex flex-col gap-2 sm:flex-row md:ml-auto">
            <DeckCombo
              deckId={search.deck}
              decks={progress.decks}
              onPick={pickDeck}
            />
            <PeriodTabs onPick={pickPeriod} period={period} />
          </div>
        ) : null}
      </div>
      {progress.hasRatings ? (
        <Dashboard
          deckId={search.deck}
          desktop={desktop}
          onPickDeck={pickDeck}
          period={period}
          progress={progress}
        />
      ) : (
        <BeforeFirstRating progress={progress} />
      )}
    </ChartTips>
  );
}

function PeriodTabs({
  onPick,
  period,
}: {
  onPick: (period: PeriodOption) => void;
  period: PeriodOption;
}) {
  const pick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      onPick(event.currentTarget.dataset.value as PeriodOption),
    [onPick]
  );
  return (
    <fieldset className="inline-flex w-full rounded-full bg-muted p-1 sm:w-auto">
      <legend className="sr-only">Período</legend>
      {PERIODS.map((option) => (
        <button
          aria-pressed={option.value === period}
          className={cn(
            "h-8 flex-1 whitespace-nowrap rounded-full px-3 text-sm transition",
            option.value === period
              ? "bg-card font-medium text-foreground shadow-card"
              : "text-muted-foreground hover:text-foreground"
          )}
          data-value={option.value}
          key={option.value}
          onClick={pick}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}

function Dashboard({
  deckId,
  desktop,
  onPickDeck,
  period,
  progress,
}: {
  deckId: string | undefined;
  desktop: boolean;
  onPickDeck: (deckId: string | undefined) => void;
  period: PeriodOption;
  progress: Progress;
}) {
  const { days } = progress;
  const today = days.at(-1)?.day as string;
  const focused = progress.decks.find((deck) => deck.id === deckId);
  const showAll = useCallback(() => onPickDeck(undefined), [onPickDeck]);

  const streak = (
    <Streak days={days} filtered={!!focused} streak={progress.streak} />
  );
  const accuracy = <Accuracy days={days} period={period} />;
  const states = <CardStates states={progress.cardStates} />;
  const decks = focused ? (
    <DeckFocus deck={focused} onClear={showAll} />
  ) : (
    <DeckList decks={progress.decks} onPick={onPickDeck} />
  );

  if (desktop) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {streak}
        {accuracy}
        {states}
        <Panel
          className="col-span-2"
          extra={<EvolutionLegend days={days} />}
          title="Evolução"
        >
          <Evolution days={days} period={period} />
        </Panel>
        <Forecast
          barsClassName="h-54"
          forecast={progress.forecast}
          today={today}
        />
        <Panel className="col-span-2" title="Atividade">
          <Activity days={days} period={period} />
        </Panel>
        {decks}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Carousel title="Resumo">
        {streak}
        {accuracy}
        {states}
      </Carousel>
      <Carousel title="Ao longo do tempo">
        <Panel title="Evolução">
          <div className="mb-4">
            <EvolutionLegend days={days} />
          </div>
          <Evolution days={days} period={period} />
        </Panel>
        <Forecast
          barsClassName="h-48"
          forecast={progress.forecast}
          today={today}
        />
        <Panel title="Atividade">
          <Activity compact days={days} period={period} />
        </Panel>
      </Carousel>
      {decks}
    </div>
  );
}

// No Rating yet: no filters, one way in, and ghosts of the blocks to come. Card States is real.
function BeforeFirstRating({ progress }: { progress: Progress }) {
  const { study } = useTodayActions();
  const today = progress.decks.reduce((sum, deck) => sum + deck.today, 0);

  let action = (
    <Button className="w-full sm:w-auto" onClick={study}>
      <Play data-icon="inline-start" />
      Começar revisão de hoje
    </Button>
  );
  let text =
    "Estude os Cards de hoje. Depois, aqui você vê a Sequência, os acertos e o que vence nos próximos dias.";
  if (!progress.decks.length) {
    text =
      "Crie um Deck e escreva os primeiros Cards. Depois da primeira revisão, eles aparecem aqui.";
    action = (
      <Button asChild className="w-full sm:w-auto">
        <Link to="/decks/novo">
          <Plus data-icon="inline-start" />
          Criar Deck
        </Link>
      </Button>
    );
  } else if (!today) {
    text = `Nada para estudar hoje. ${plural(
      progress.cardStates.new +
        progress.cardStates.learning +
        progress.cardStates.mature,
      "card espera",
      "cards esperam"
    )} nos seus Decks.`;
    action = (
      <Button asChild className="w-full sm:w-auto" variant="outline">
        <Link to="/decks">Ver Decks</Link>
      </Button>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      <Panel className="col-span-2 md:col-span-3">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <ChartColumn className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-balance font-heading font-semibold text-lg">
              Seu progresso aparece depois da primeira revisão
            </p>
            <p className="mt-1 text-pretty text-muted-foreground text-sm">
              {text}
            </p>
          </div>
          {action}
        </div>
      </Panel>
      <Ghost title="Sequência" />
      <Ghost title="Acertos" />
      <div className="col-span-2 md:col-span-1">
        <CardStates states={progress.cardStates} />
      </div>
      <Ghost className="col-span-2" title="Evolução" />
      <Ghost className="col-span-2 md:col-span-1" title="Próximos 7 dias" />
    </div>
  );
}
