import type { Progress, ProgressDay, ProgressDeck } from "@daruma/shared";
import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { ArrowRight, Check, ChevronRight, Flame, Target } from "lucide-react";
import { type MouseEvent, type ReactNode, useCallback } from "react";
import { useTip } from "~/components/progress/chart-tip";
import {
  addDays,
  GOAL,
  goalText,
  longDay,
  MARK_TEXT,
  niceMax,
  type PeriodOption,
  percent,
  periodText,
  reviewsText,
  weekday,
} from "~/lib/progress";
import { dayDate, plural, STATE_LABEL } from "~/lib/schedule";

export function Panel({
  children,
  className,
  extra,
  title,
}: {
  children: ReactNode;
  className?: string;
  extra?: ReactNode;
  title?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border bg-card p-4 shadow-card md:p-5",
        className
      )}
    >
      {title ? (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-heading font-semibold text-base">{title}</h3>
          {extra}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function Figure({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Flame;
  label: string;
  unit?: string;
  value: string;
}) {
  return (
    <>
      <h3 className="flex items-center gap-1.5 text-muted-foreground text-sm">
        <Icon className="size-4" />
        {label}
      </h3>
      <p className="mt-1 font-heading font-semibold text-4xl tabular-nums tracking-tight md:text-5xl">
        {value}
        {unit ? (
          <span className="ml-1.5 font-medium text-lg text-muted-foreground md:text-xl">
            {unit}
          </span>
        ) : null}
      </p>
    </>
  );
}

const INITIAL = ["D", "S", "T", "Q", "Q", "S", "S"];

// The last 7 Days of the Streak: done (filled, ✓), seen (dashed), today pending (ring), other
// Days grey with the weekday's initial.
function StreakWeek({ days }: { days: ProgressDay[] }) {
  const tip = useTip();
  const today = days.at(-1)?.day;
  return (
    <div className="flex justify-between gap-1">
      {days.slice(-7).map((day) => {
        const initial = INITIAL[dayDate(day.day).getUTCDay()];
        return (
          <span
            className={cn(
              "grid size-8 place-items-center rounded-full font-medium text-[11px]",
              day.mark === "completed" &&
                "bg-chart-ok text-white dark:text-background",
              day.mark === "pending" &&
                "text-foreground ring-2 ring-chart-ok/60 ring-inset",
              day.mark === "seen" &&
                "border border-muted-foreground/60 border-dashed text-muted-foreground",
              (day.mark === "free" || day.mark === "missed") &&
                "bg-muted text-muted-foreground"
            )}
            key={day.day}
            {...tip(
              day.day === today ? "Hoje" : longDay(day.day),
              MARK_TEXT[day.mark]
            )}
          >
            {day.mark === "completed" ? (
              <Check aria-hidden className="size-3.5" strokeWidth={3} />
            ) : (
              <span aria-hidden>{initial}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function Streak({
  days,
  filtered,
  streak,
}: {
  days: ProgressDay[];
  filtered: boolean;
  streak: Progress["streak"];
}) {
  const pending = days.at(-1)?.mark === "pending";
  let note = "";
  if (filtered) {
    note = " A Sequência vale para todos os Decks.";
  } else if (pending) {
    note = " A revisão de hoje ainda conta.";
  }
  return (
    <Panel className="flex flex-col">
      <Figure
        icon={Flame}
        label="Sequência"
        unit={streak.current === 1 ? "dia" : "dias"}
        value={String(streak.current)}
      />
      <p className="mt-1 text-muted-foreground text-xs">
        Recorde: {plural(streak.best, "dia", "dias")}.{note}
      </p>
      <div className="mt-auto pt-4">
        <StreakWeek days={days} />
      </div>
    </Panel>
  );
}

export function Accuracy({
  days,
  period,
}: {
  days: ProgressDay[];
  period: PeriodOption;
}) {
  const reviews = days.reduce((sum, day) => sum + day.reviews, 0);
  const errors = days.reduce((sum, day) => sum + day.errors, 0);
  const pct = percent(reviews, errors);
  return (
    <Panel className="flex flex-col">
      <Figure
        icon={Target}
        label="Acertos"
        value={pct === null ? "—" : `${pct}%`}
      />
      <p className="mt-1 text-muted-foreground text-xs tabular-nums">
        {pct === null
          ? `Nenhuma revisão ${periodText(period)}`
          : `${reviews - errors} de ${reviewsText(reviews)} ${periodText(period)}`}
      </p>
      <div className="mt-auto pt-4">
        <div className="relative mt-3 h-2 rounded-full bg-chart-ok/15">
          <div
            className="h-full rounded-full bg-chart-ok"
            style={{ width: `${pct ?? 0}%` }}
          />
          <div
            className="absolute -top-1 h-4 w-0.5 rounded-full bg-foreground/70"
            style={{ left: `${GOAL}%` }}
          />
        </div>
        <p className="mt-2 text-muted-foreground text-xs tabular-nums">
          {pct === null ? `Meta: ${GOAL}% de acertos` : goalText(pct)}
        </p>
      </div>
    </Panel>
  );
}

const STATES = [
  { className: "bg-chart-ok/30", hint: "Nunca recebeu Rating", key: "new" },
  {
    className: "bg-chart-ok/60",
    hint: "Intervalo menor que 21 dias",
    key: "learning",
  },
  {
    className: "bg-chart-ok",
    hint: "Intervalo de 21 dias ou mais",
    key: "mature",
  },
] as const;

export function CardStates({ states }: { states: Progress["cardStates"] }) {
  const tip = useTip();
  const total = states.new + states.learning + states.mature;
  const shown = STATES.filter((state) => states[state.key]);
  return (
    <Panel title="Cards por estado">
      <div className="flex h-3 gap-0.5">
        {shown.length ? (
          shown.map((state, i) => (
            <div
              className={cn(
                state.className,
                i === 0 && "rounded-l-[4px]",
                i === shown.length - 1 && "rounded-r-[4px]"
              )}
              key={state.key}
              style={{ flexGrow: states[state.key] }}
              {...tip(
                STATE_LABEL[state.key],
                `${plural(states[state.key], "card", "cards")} · ${state.hint}`
              )}
            />
          ))
        ) : (
          <div className="flex-1 rounded-[4px] bg-muted" />
        )}
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {STATES.map((state) => (
          <li className="flex items-center gap-2" key={state.key}>
            <span className={cn("size-2.5 rounded-[3px]", state.className)} />
            <span className="flex-1">{STATE_LABEL[state.key]}</span>
            <span className="font-medium tabular-nums">
              {states[state.key]}
            </span>
            <span className="w-10 text-right text-muted-foreground tabular-nums">
              {total ? Math.round((states[state.key] / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// One bar per Day, today to 6 Days from now, with the value on top.
export function Forecast({
  barsClassName = "h-32",
  forecast,
  today,
}: {
  barsClassName?: string;
  forecast: number[];
  today: string;
}) {
  const tip = useTip();
  const max = niceMax(Math.max(...forecast));
  const total = forecast.reduce((sum, value) => sum + value, 0);
  const dayOf = (k: number) => addDays(today, k);
  const name = (k: number) => {
    if (k === 0) {
      return "Hoje";
    }
    return k === 1 ? "Amanhã" : longDay(dayOf(k));
  };
  return (
    <Panel
      extra={
        <span className="text-muted-foreground text-xs tabular-nums">
          {plural(total, "card", "cards")}
        </span>
      }
      title="Próximos 7 dias"
    >
      <div className={cn("flex items-end gap-0.5 border-b", barsClassName)}>
        {forecast.map((value, k) => (
          <div
            className="flex h-full flex-1 flex-col items-center justify-end"
            // biome-ignore lint/suspicious/noArrayIndexKey: one bar per Day from today.
            key={k}
            {...tip(name(k), plural(value, "card vence", "cards vencem"))}
          >
            <span
              aria-hidden
              className="mb-1 font-medium text-[11px] tabular-nums"
            >
              {value}
            </span>
            <div
              className="w-full max-w-6 bg-chart-ok"
              style={{ height: `${(value / max) * 80}%` }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-2 flex gap-0.5">
        {forecast.map((_, k) => (
          <span
            className="flex-1 text-center text-[11px] text-muted-foreground"
            // biome-ignore lint/suspicious/noArrayIndexKey: one label per Day from today.
            key={k}
          >
            {k === 0 ? "hoje" : weekday(dayOf(k))}
          </span>
        ))}
      </div>
    </Panel>
  );
}

const deckLine = (deck: ProgressDeck) =>
  `${deck.today ? `${deck.today} para hoje · ` : ""}${plural(deck.cardCount, "card", "cards")}`;

// "Por Deck": tapping a row filters the page by that Deck.
export function DeckList({
  decks,
  onPick,
}: {
  decks: ProgressDeck[];
  onPick: (deckId: string) => void;
}) {
  const pick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      onPick(event.currentTarget.dataset.value as string),
    [onPick]
  );
  return (
    <Panel
      extra={
        <span className="text-muted-foreground text-xs">% de acertos</span>
      }
      title="Por Deck"
    >
      {decks.length ? (
        <ul className="-mx-2">
          {decks.map((deck) => {
            const pct = percent(deck.reviews, deck.errors);
            return (
              <li key={deck.id}>
                <button
                  className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-accent"
                  data-value={deck.id}
                  onClick={pick}
                  type="button"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{deck.name}</p>
                    <p className="text-muted-foreground text-xs tabular-nums">
                      {deckLine(deck)}
                    </p>
                  </div>
                  <div className="w-20 shrink-0 text-right">
                    <p className="font-medium text-sm tabular-nums">
                      {pct === null ? "—" : `${pct}%`}
                    </p>
                    <div className="mt-1 h-1.5 rounded-full bg-chart-ok/15">
                      <div
                        className="h-full rounded-full bg-chart-ok"
                        style={{ width: `${pct ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">Nenhum Deck ainda.</p>
      )}
    </Panel>
  );
}

// With a Deck filtered, "Por Deck" becomes that Deck, with a way out.
export function DeckFocus({
  deck,
  onClear,
}: {
  deck: ProgressDeck;
  onClear: () => void;
}) {
  return (
    <Panel title={deck.name}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <p className="text-muted-foreground tabular-nums">{deckLine(deck)}</p>
        <Link
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
          params={{ deckId: deck.id }}
          to="/decks/$deckId"
        >
          Abrir Deck
          <ArrowRight className="size-4" />
        </Link>
        <button
          className="font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={onClear}
          type="button"
        >
          Ver todos os Decks
        </button>
      </div>
    </Panel>
  );
}

// A block that has nothing to show before the first Rating.
export function Ghost({
  className,
  title,
}: {
  className?: string;
  title: string;
}) {
  return (
    <section
      className={cn("rounded-lg border border-dashed p-4 md:p-5", className)}
    >
      <h3 className="font-medium text-muted-foreground text-sm">{title}</h3>
      <p className="mt-2 font-heading font-semibold text-3xl text-muted-foreground/50">
        —
      </p>
    </section>
  );
}
