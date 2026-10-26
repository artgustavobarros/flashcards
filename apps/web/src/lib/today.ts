import type { Today, TodayDeck } from "@daruma/shared";
import { plural } from "~/lib/schedule";

const cards = (count: number) => plural(count, "card", "cards");

const WORDS = /\s+/;

// "Bom dia, Ana", or "Boas-vindas, Ana" when hello is given.
const withName = (hello: string, name: string | undefined) => {
  const first = name?.trim().split(WORDS)[0];
  return first ? `${hello}, ${first}` : hello;
};

export const welcome = (name: string | undefined) =>
  withName("Boas-vindas", name);

// By the device clock: "Bom dia" until noon, "Boa tarde" until 18:00.
export function greeting(name: string | undefined, now = new Date()) {
  const hour = now.getHours();
  let hello = "Boa noite";
  if (hour >= 5 && hour < 12) {
    hello = "Bom dia";
  } else if (hour >= 12 && hour < 18) {
    hello = "Boa tarde";
  }
  return withName(hello, name);
}

const tomorrowText = (today: Today) =>
  today.tomorrow ? ` Amanhã: ${cards(today.tomorrow)}.` : "";

// The line under the greeting. "seen" adds the "Revisar mesmo assim" link after it.
export function dayLine(today: Today) {
  switch (today.status) {
    case "empty":
      return "Comece criando um Deck. Os Cards que você escrever nele viram a sua revisão de cada dia.";
    case "open":
      return today.done
        ? `${today.remaining === 1 ? "Falta" : "Faltam"} ${cards(today.remaining)} na revisão de hoje.`
        : `Você tem ${cards(today.remaining)} para hoje.`;
    case "seen":
      return `Revisão de hoje marcada como vista. ${plural(today.remaining, "card fica", "cards ficam")} para amanhã.`;
    case "completed":
      if (today.firstDay) {
        return today.tomorrow
          ? `Primeira sessão feita. Amanhã: ${cards(today.tomorrow)}, com aviso às ${today.reviewTime}.`
          : "Primeira sessão feita.";
      }
      return `Revisão de hoje concluída.${tomorrowText(today)}`;
    default:
      if (!(today.hasRatings || today.tomorrow)) {
        return "Escreva Cards nos seus Decks. Eles viram a sua revisão de cada dia.";
      }
      return `Nada para revisar hoje.${tomorrowText(today)}`;
  }
}

// "12 revisões · 5 novos · 4 atrasados", leaving out what is zero.
export function reviewParts(today: Today) {
  const parts: { overdue?: boolean; text: string }[] = [];
  if (today.reviews || !today.fresh) {
    parts.push({ text: plural(today.reviews, "revisão", "revisões") });
  }
  if (today.fresh) {
    parts.push({ text: plural(today.fresh, "novo", "novos") });
  }
  if (today.overdue) {
    parts.push({
      overdue: true,
      text: plural(today.overdue, "atrasado", "atrasados"),
    });
  }
  return parts;
}

export type DeckBadge =
  | { kind: "today"; fresh: number; remaining: number }
  | { kind: "tomorrow"; count: number }
  | { kind: "done" }
  | { kind: "clear" }
  | null;

// What a Deck card on Início says about today.
export function deckBadge(deck: TodayDeck, today: Today): DeckBadge {
  if (deck.remaining) {
    return today.status === "open"
      ? { fresh: deck.fresh, kind: "today", remaining: deck.remaining }
      : { count: deck.remaining, kind: "tomorrow" };
  }
  if (deck.done) {
    // The first Day points at tomorrow's notice, so the Deck shows what comes then.
    return today.firstDay && deck.tomorrow
      ? { count: deck.tomorrow, kind: "tomorrow" }
      : { kind: "done" };
  }
  return deck.cardCount ? { kind: "clear" } : null;
}

// 'YYYY-MM-DD' plus whole days.
export const addDays = (day: string, days: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
