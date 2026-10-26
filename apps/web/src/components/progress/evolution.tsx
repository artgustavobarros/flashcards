import type { ProgressDay } from "@daruma/shared";
import { cn } from "cn";
import { useTip } from "~/components/progress/chart-tip";
import {
  type Bucket,
  buckets,
  GOAL,
  niceMax,
  type PeriodOption,
  reviewsText,
} from "~/lib/progress";
import { plural } from "~/lib/schedule";

const AXIS = "text-[11px] text-muted-foreground leading-none tabular-nums";

// Below this share of the panel's height, the errors' maximum would sit on the 0.
const MIN_GAP = 12;

const PER = { "7": "dia", "30": "dia", "90": "semana", tudo: "mês" } as const;

export function EvolutionLegend({ days }: { days: ProgressDay[] }) {
  const studied = days.filter((day) => day.reviews).length;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-chart-ok" />
        Acertos
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] bg-chart-err" />
        Erros (abaixo do zero)
      </span>
      <span className="tabular-nums">
        · estudado em {studied} de {days.length} dias
      </span>
    </div>
  );
}

// Two panels on one timeline, so there is no second Y axis: the % of right answers with the
// goal on top, and the Ratings below, right ones going up from zero and Errei going down.
export function Evolution({
  days,
  period,
  barsClassName = "h-36",
}: {
  barsClassName?: string;
  days: ProgressDay[];
  period: PeriodOption;
}) {
  const bars = buckets(days, period);
  const count = bars.length;
  const tip = useTip();

  const pcts = bars.flatMap((bar) => (bar.pct === null ? [] : [bar.pct]));
  const low = Math.max(
    0,
    Math.min(80, Math.floor((Math.min(...pcts, 100) - 5) / 10) * 10)
  );
  const y = (pct: number) => ((100 - pct) / (100 - low)) * 100;
  const x = (i: number) => ((i + 0.5) / count) * 100;

  // The line breaks where a bar has no Ratings.
  const segments: string[][] = [];
  let run: string[] = [];
  bars.forEach((bar, i) => {
    if (bar.pct === null) {
      if (run.length) {
        segments.push(run);
      }
      run = [];
    } else {
      run.push(`${x(i)},${y(bar.pct)}`);
    }
  });
  if (run.length) {
    segments.push(run);
  }
  const lastWithPct = bars.findLastIndex((bar) => bar.pct !== null);
  // Dense charts keep only the last dot, unless a lone point has no line to sit on.
  const sparse = count <= 13 || segments.some((s) => s.length === 1);

  const up = niceMax(Math.max(...bars.map((bar) => bar.reviews - bar.errors)));
  const down = niceMax(Math.max(1, ...bars.map((bar) => bar.errors)));
  const zero = (up / (up + down)) * 100;

  const shown = new Set(
    count <= 7
      ? bars.map((_, i) => i)
      : [0, Math.floor((count - 1) / 2), count - 1]
  );

  const tipText = (bar: Bucket) =>
    bar.reviews
      ? `${reviewsText(bar.reviews)} · ${plural(bar.reviews - bar.errors, "acerto", "acertos")} · ${plural(bar.errors, "erro", "erros")} · ${bar.pct}% de acertos`
      : "Sem revisões";

  return (
    <div>
      <div className="flex">
        <div aria-hidden className="w-10 shrink-0 pr-2">
          <div className="relative h-16">
            <span
              className={cn(AXIS, "absolute top-0 right-2 -translate-y-1/2")}
            >
              100%
            </span>
            <span
              className={cn(AXIS, "absolute right-2 bottom-0 translate-y-1/2")}
            >
              {low}%
            </span>
          </div>
          <div className="h-7" />
          <div className={cn("relative", barsClassName)}>
            <span
              className={cn(AXIS, "absolute top-0 right-2 -translate-y-1/2")}
            >
              {up}
            </span>
            <span
              className={cn(AXIS, "absolute right-2 -translate-y-1/2")}
              style={{ top: `${zero}%` }}
            >
              0
            </span>
            {100 - zero < MIN_GAP ? null : (
              <span
                className={cn(
                  AXIS,
                  "absolute right-2 bottom-0 translate-y-1/2"
                )}
              >
                {down}
              </span>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative">
            <div aria-hidden className="relative h-16">
              <div className="absolute inset-x-0 top-0 h-px bg-border" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
              <div
                className="absolute inset-x-0 border-muted-foreground/60 border-t border-dashed"
                style={{ top: `${y(GOAL)}%` }}
              />
              <span
                className="absolute right-0 -translate-y-full bg-card pl-1 text-[11px] text-muted-foreground"
                style={{ top: `${y(GOAL)}%` }}
              >
                meta {GOAL}%
              </span>
              <svg
                aria-hidden
                className="absolute inset-0 size-full overflow-visible"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                {segments
                  .filter((s) => s.length > 1)
                  .map((s) => (
                    <polyline
                      fill="none"
                      key={s[0]}
                      points={s.join(" ")}
                      stroke="var(--chart-ok)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
              </svg>
              {bars.map((bar, i) =>
                bar.pct === null || !(sparse || i === lastWithPct) ? null : (
                  <span
                    className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-ok ring-2 ring-card"
                    // biome-ignore lint/suspicious/noArrayIndexKey: bars are positional.
                    key={i}
                    style={{ left: `${x(i)}%`, top: `${y(bar.pct)}%` }}
                  />
                )
              )}
            </div>
            <div className="h-7" />
            <div aria-hidden className={cn("relative", barsClassName)}>
              <div className="absolute inset-x-0 top-0 h-px bg-border" />
              <div
                className="absolute inset-x-0 h-px bg-muted-foreground/40"
                style={{ top: `${zero}%` }}
              />
              <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
              <div className="relative flex h-full">
                {bars.map((bar, i) => (
                  <div
                    className="flex h-full flex-1 flex-col items-center px-px"
                    // biome-ignore lint/suspicious/noArrayIndexKey: bars are positional.
                    key={i}
                  >
                    <div
                      className="flex w-full items-end justify-center"
                      style={{ height: `${zero}%` }}
                    >
                      <div
                        className="w-full max-w-6 bg-chart-ok"
                        style={{
                          height: `${((bar.reviews - bar.errors) / up) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex w-full flex-1 items-start justify-center pt-0.5">
                      <div
                        className="w-full max-w-6 bg-chart-err"
                        style={{ height: `${(bar.errors / down) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex">
              {bars.map((bar, i) => (
                <div
                  className="h-full flex-1 rounded-sm hover:bg-foreground/5"
                  // biome-ignore lint/suspicious/noArrayIndexKey: bars are positional.
                  key={i}
                  {...tip(bar.range, tipText(bar))}
                />
              ))}
            </div>
          </div>
          <div aria-hidden className="relative mt-2 h-3">
            {bars.map((bar, i) => {
              if (!shown.has(i)) {
                return null;
              }
              const edge = count > 7 && (i === 0 || i === count - 1);
              return (
                <span
                  className={cn(
                    AXIS,
                    "absolute whitespace-nowrap",
                    edge && i === 0 && "left-0",
                    edge && i > 0 && "right-0",
                    !edge && "-translate-x-1/2"
                  )}
                  // biome-ignore lint/suspicious/noArrayIndexKey: bars are positional.
                  key={i}
                  style={edge ? undefined : { left: `${x(i)}%` }}
                >
                  {bar.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-3 text-muted-foreground text-xs">
        Em cima, a % de acertos. Embaixo, o nº de revisões por {PER[period]}.
      </p>
    </div>
  );
}
