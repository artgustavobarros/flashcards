import type {
  DayMark,
  ProgressDay,
  ProgressPeriod,
  ProgressQuery,
} from "@daruma/shared";
import { z } from "zod";
import { dayDate, MONTHS, plural, WEEKDAYS } from "~/lib/schedule";

export const GOAL = 90;

// Progresso keeps its filters in the URL, so the Deck page can link to it filtered. A bad value
// is dropped rather than failing the page. No periodo means 30 days. The router reads
// ?periodo=7 as a number, so the days are numbers there.
export const progressSearchSchema = z.object({
  deck: z.uuid().optional().catch(undefined),
  periodo: z
    .union([z.literal(7), z.literal(90), z.literal("tudo")])
    .optional()
    .catch(undefined),
});
export type ProgressSearch = z.infer<typeof progressSearchSchema>;

export type PeriodOption = "7" | "30" | "90" | "tudo";

export const PERIODS: { label: string; value: PeriodOption }[] = [
  { label: "7 dias", value: "7" },
  { label: "30 dias", value: "30" },
  { label: "90 dias", value: "90" },
  { label: "Tudo", value: "tudo" },
];

export const periodOf = (search: ProgressSearch): PeriodOption =>
  search.periodo ? (String(search.periodo) as PeriodOption) : "30";

export const toProgressQuery = (search: ProgressSearch): ProgressQuery => {
  const period = periodOf(search);
  return {
    deckId: search.deck,
    period: (period === "tudo" ? "all" : period) satisfies ProgressPeriod,
  };
};

const periodParam: Record<PeriodOption, ProgressSearch["periodo"]> = {
  "7": 7,
  "30": undefined,
  "90": 90,
  tudo: "tudo",
};

export const withPeriod = (
  search: ProgressSearch,
  period: PeriodOption
): ProgressSearch => ({
  ...search,
  periodo: periodParam[period],
});

export const addDays = (day: string, days: number) =>
  new Date(dayDate(day).getTime() + days * 86_400_000)
    .toISOString()
    .slice(0, 10);

// "21 out"
export function shortDay(day: string) {
  const date = dayDate(day);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

export const weekday = (day: string) =>
  WEEKDAYS[dayDate(day).getUTCDay()] as string;

// "qua, 21 out"
export const longDay = (day: string) => `${weekday(day)}, ${shortDay(day)}`;

export const percent = (reviews: number, errors: number) =>
  reviews ? Math.round(((reviews - errors) / reviews) * 100) : null;

export const reviewsText = (count: number) =>
  plural(count, "revisão", "revisões");

export function goalText(pct: number) {
  if (pct >= GOAL) {
    return `Acima da meta de ${GOAL}%`;
  }
  return `${plural(GOAL - pct, "ponto", "pontos")} abaixo da meta de ${GOAL}%`;
}

export const periodText = (period: PeriodOption) =>
  period === "tudo" ? "desde o início" : `nos últimos ${period} dias`;

export const MARK_TEXT: Record<DayMark, string> = {
  completed: "Revisão concluída",
  free: "Nada para revisar",
  missed: "Não revisou",
  pending: "Revisão de hoje pendente",
  seen: "Marcada como vista",
};

// A Day's tooltip line. A free Day with Ratings (New Cards studied, nothing due) shows just them.
export function dayText(day: ProgressDay) {
  if (day.mark === "free" && day.reviews) {
    return reviewsText(day.reviews);
  }
  return `${MARK_TEXT[day.mark]}${day.reviews ? ` · ${reviewsText(day.reviews)}` : ""}`;
}

export interface Bucket {
  errors: number;
  // Under the bar.
  label: string;
  pct: number | null;
  // In the tooltip.
  range: string;
  reviews: number;
}

// The bars of Evolução: a Day each in 7 and 30 days, a week (ending today) in 90 days, a month
// in Tudo.
export function buckets(days: ProgressDay[], period: PeriodOption): Bucket[] {
  const today = days.at(-1)?.day;
  let groups: ProgressDay[][];
  if (period === "90") {
    groups = [];
    for (let end = days.length; end > 0; end -= 7) {
      groups.unshift(days.slice(Math.max(0, end - 7), end));
    }
  } else if (period === "tudo") {
    const byMonth = new Map<string, ProgressDay[]>();
    for (const day of days) {
      const month = day.day.slice(0, 7);
      byMonth.set(month, [...(byMonth.get(month) ?? []), day]);
    }
    groups = [...byMonth.values()];
  } else {
    groups = days.map((day) => [day]);
  }
  return groups.map((group) => {
    const first = group[0] as ProgressDay;
    const last = group.at(-1) as ProgressDay;
    const reviews = group.reduce((sum, day) => sum + day.reviews, 0);
    const errors = group.reduce((sum, day) => sum + day.errors, 0);
    const date = dayDate(first.day);
    let label = shortDay(first.day);
    let range = `${shortDay(first.day)} – ${shortDay(last.day)}`;
    if (period === "tudo") {
      label = MONTHS[date.getUTCMonth()] as string;
      range = `${label} ${date.getUTCFullYear()}`;
    } else if (group.length === 1) {
      const isToday = first.day === today;
      if (period === "7") {
        label = isToday ? "hoje" : weekday(first.day);
      }
      range = `${longDay(first.day)}${isToday ? " (hoje)" : ""}`;
    }
    return { errors, label, pct: percent(reviews, errors), range, reviews };
  });
}

// A round axis maximum at or above value: 1, 2, 2.5 or 5 times a power of ten.
export function niceMax(value: number) {
  if (value <= 0) {
    return 10;
  }
  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((x) => x * power >= value) ?? 10;
  return step * power;
}
