import type { Today } from "@daruma/shared";
import { Bell, CircleAlert, Pause, Play } from "lucide-react";
import { useCallback } from "react";
import { Button } from "~/components/ui/button";
import { plural } from "~/lib/schedule";
import { reviewParts } from "~/lib/today";
import { useTodayActions } from "./use-today-actions";

// "12 revisões · 5 novos · 4 atrasados", overdue in red.
export function ReviewDetail({ today }: { today: Today }) {
  return reviewParts(today).map((part, index) => (
    <span key={part.text}>
      {index ? " · " : null}
      <span className={part.overdue ? "text-destructive" : undefined}>
        {part.text}
      </span>
    </span>
  ));
}

export const reviewTitle = (today: Today) =>
  `Revisão de hoje: ${plural(today.remaining, "card", "cards")}${today.done ? " restantes" : ""}`;

// The Daily Review strip on Início, only while the Day is open.
export function ReviewStrip({ today }: { today: Today }) {
  const { pauseNew, seen, study } = useTodayActions();
  const total = today.done + today.remaining;

  return (
    <section
      aria-labelledby="review-strip-title"
      className="rounded-lg border border-primary/25 bg-primary/[.06] p-4 md:p-5"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
            <Bell className="size-5" />
          </span>
          <div className="min-w-0">
            <h3
              className="text-balance font-heading font-semibold text-lg tabular-nums leading-snug"
              id="review-strip-title"
            >
              {reviewTitle(today)}
            </h3>
            <p className="text-muted-foreground text-sm tabular-nums">
              <ReviewDetail today={today} />
            </p>
            {today.done ? (
              <div className="mt-2 flex items-center gap-2">
                <div
                  aria-label="Progresso da revisão de hoje"
                  aria-valuemax={total}
                  aria-valuemin={0}
                  aria-valuenow={today.done}
                  className="h-1.5 w-40 overflow-hidden rounded-full bg-primary/15"
                  role="progressbar"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                    style={{ width: `${(today.done / total) * 100}%` }}
                  />
                </div>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {today.done}/{total}
                </span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2 md:shrink-0">
          <Button
            className="flex-1 md:flex-none"
            onClick={seen}
            variant="ghost"
          >
            Marcar como vista
          </Button>
          <Button className="flex-1 md:flex-none" onClick={study}>
            <Play data-icon="inline-start" />
            {today.done ? "Continuar" : "Começar"}
          </Button>
        </div>
      </div>
      <BacklogNote onPause={pauseNew} today={today} />
    </section>
  );
}

function BacklogNote({
  onPause,
  today,
}: {
  onPause: (paused: boolean) => void;
  today: Today;
}) {
  const pause = useCallback(() => onPause(true), [onPause]);
  const resume = useCallback(() => onPause(false), [onPause]);
  if (today.newCardsPaused) {
    return (
      <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-sm">
        <Pause className="size-4 shrink-0" />
        Cards novos pausados até você pôr a revisão em dia.
        <button
          className="font-medium text-primary underline-offset-4 hover:underline"
          onClick={resume}
          type="button"
        >
          Retomar
        </button>
      </p>
    );
  }
  // Nothing to pause without New Cards in today's Daily Review.
  if (!(today.backlog && today.fresh)) {
    return null;
  }
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md bg-warning/10 px-3 py-2.5 text-sm">
      <CircleAlert className="size-4 shrink-0 text-warning" />
      <p className="min-w-0 flex-1 tabular-nums">
        {today.overdue} Cards atrasados. Pausar os novos até pôr em dia?
      </p>
      <button
        className="font-medium text-warning underline-offset-4 hover:underline"
        onClick={pause}
        type="button"
      >
        Pausar novos
      </button>
    </div>
  );
}
