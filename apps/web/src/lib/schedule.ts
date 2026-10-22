import type { Card, CardListItem, CardState } from "@daruma/shared";

const MS_PER_DAY = 86_400_000;
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export const STATE_LABEL: Record<CardState, string> = {
  learning: "Em aprendizado",
  mature: "Maduro",
  new: "Novo",
};

export const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

// Days are 'YYYY-MM-DD' on the user's calendar; `today` comes from the API.
const dayDate = (day: string) => new Date(`${day}T00:00:00Z`);
const daysBetween = (from: string, to: string) =>
  Math.round((dayDate(to).getTime() - dayDate(from).getTime()) / MS_PER_DAY);

type Schedule = Pick<CardListItem, "due" | "state"> &
  Partial<Pick<Card, "resetAt">>;

export type DueTone = "new" | "today" | "late";

// The badge on a Card row: Novo, Vencido hoje or Atrasado. Nothing for a Card due later.
export function dueBadge(card: Schedule, today: string) {
  if (card.state === "new" || !card.due) {
    return { label: "Novo", tone: "new" as const };
  }
  const days = daysBetween(today, card.due);
  if (days < 0) {
    return { label: "Atrasado", tone: "late" as const };
  }
  return days === 0 ? { label: "Vencido hoje", tone: "today" as const } : null;
}

// "Próxima revisão" on the Card page.
export function nextReviewText(card: Schedule, today: string) {
  if (card.state === "new" || !card.due) {
    if (card.resetAt) {
      return "Entra como novo numa próxima Daily Review";
    }
    return "Ainda não estudado. Entra numa Daily Review dentro do limite de novos por dia.";
  }
  const days = daysBetween(today, card.due);
  if (days < 0) {
    return `Atrasado ${plural(-days, "dia", "dias")}`;
  }
  if (days === 0) {
    return "Hoje";
  }
  if (days === 1) {
    return "Amanhã";
  }
  const date = dayDate(card.due);
  return `Em ${days} dias, ${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}
