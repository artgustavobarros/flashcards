import type { ProgressDay } from "@daruma/shared";
import { cn } from "cn";
import { useLayoutEffect, useRef } from "react";
import { useTip } from "~/components/progress/chart-tip";
import { dayText, longDay, type PeriodOption, weekday } from "~/lib/progress";
import { dayDate, MONTHS, WEEKDAYS } from "~/lib/schedule";

const SHADES = [
  "bg-muted",
  "bg-chart-ok/25",
  "bg-chart-ok/50",
  "bg-chart-ok/75",
  "bg-chart-ok",
];

const SEEN = "border border-muted-foreground/60 border-dashed";

// Color by the number of Ratings; a Day marked as seen without Ratings gets a dashed outline,
// and today, while pending, a ring.
function shade(day: ProgressDay, max: number) {
  const ring =
    day.mark === "pending" ? "ring-2 ring-chart-ok/60 ring-inset" : "";
  if (!day.reviews) {
    return cn(day.mark === "seen" ? SEEN : "bg-muted", ring);
  }
  const level = Math.min(3, Math.floor((day.reviews / max) * 4));
  return cn(SHADES[level + 1], ring);
}

// GitHub-style calendar of the period, one column per week, scrolled to today. In 7 days it
// turns into a strip of 7 blocks.
export function Activity({
  compact = false,
  days,
  period,
}: {
  compact?: boolean;
  days: ProgressDay[];
  period: PeriodOption;
}) {
  const tip = useTip();
  const scroller = useRef<HTMLDivElement>(null);
  const max = Math.max(1, ...days.map((day) => day.reviews));
  const today = days.at(-1)?.day;
  const label = (day: ProgressDay) =>
    day.day === today ? "Hoje" : longDay(day.day);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll back to today on a new period.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) {
      el.scrollLeft = el.scrollWidth;
    }
  }, [days.length]);

  let grid: React.ReactNode;
  if (period === "7") {
    grid = (
      <div className="flex gap-2">
        {days.map((day) => (
          <div
            className="flex flex-1 flex-col items-center gap-1.5"
            key={day.day}
          >
            <div
              className={cn("h-10 w-full rounded-md", shade(day, max))}
              {...tip(label(day), dayText(day))}
            />
            <span aria-hidden className="text-[11px] text-muted-foreground">
              {day.day === today ? "hoje" : weekday(day.day)}
            </span>
          </div>
        ))}
      </div>
    );
  } else {
    const pad = dayDate(days[0]?.day ?? "2000-01-02").getUTCDay();
    const cells: (ProgressDay | null)[] = [
      ...Array.from({ length: pad }, () => null),
      ...days,
    ];
    const columns = Math.ceil(cells.length / 7);
    let size = 13;
    if (period === "30") {
      size = 22;
    } else if (compact) {
      size = columns > 16 ? 8 : 12;
    }
    const months = Array.from({ length: columns }, (_, c) => {
      const first = cells.slice(c * 7, c * 7 + 7).find(Boolean);
      if (!first) {
        return "";
      }
      const date = dayDate(first.day);
      return c === 0 || date.getUTCDate() <= 7
        ? MONTHS[date.getUTCMonth()]
        : "";
    });
    // A month's name needs 3 columns: the first column's gives way to the next month's.
    if (months.slice(1, 3).some(Boolean)) {
      months[0] = "";
    }
    grid = (
      <div className="overflow-x-auto [scrollbar-width:none]" ref={scroller}>
        <div className="inline-flex gap-2">
          <div
            aria-hidden
            className="grid gap-[3px] pt-5 text-[10px] text-muted-foreground leading-none"
            style={{ gridTemplateRows: `repeat(7, ${size}px)` }}
          >
            {WEEKDAYS.map((name, i) => (
              <span className="flex items-center" key={name}>
                {i % 2 ? name : ""}
              </span>
            ))}
          </div>
          <div>
            <div
              aria-hidden
              className="mb-1.5 grid h-3.5 gap-[3px] text-[10px] text-muted-foreground leading-none"
              style={{ gridTemplateColumns: `repeat(${columns}, ${size}px)` }}
            >
              {months.map((month, c) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional.
                <span className="whitespace-nowrap" key={c}>
                  {month}
                </span>
              ))}
            </div>
            <div
              className="grid grid-flow-col gap-[3px]"
              style={{
                gridAutoColumns: `${size}px`,
                gridTemplateRows: `repeat(7, ${size}px)`,
              }}
            >
              {cells.map((day, i) =>
                day ? (
                  <div
                    className={cn("rounded-[3px]", shade(day, max))}
                    key={day.day}
                    {...tip(label(day), dayText(day))}
                  />
                ) : (
                  // biome-ignore lint/suspicious/noArrayIndexKey: padding before the first Day.
                  <div key={i} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {grid}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-xs">
        <span className="inline-flex items-center gap-1">
          Menos
          {SHADES.map((cls) => (
            <span className={cn("size-3 rounded-[3px]", cls)} key={cls} />
          ))}
          Mais
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={cn("size-3 rounded-[3px]", SEEN)} />
          Marcada como vista
        </span>
      </div>
    </div>
  );
}
