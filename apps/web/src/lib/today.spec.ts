import type { Today } from "@daruma/shared";
import { describe, expect, test } from "vitest";
import { dayLine, deckBadge, greeting, reviewParts } from "./today";

const today = (fields: Partial<Today>): Today => ({
  backlog: false,
  completedAt: null,
  day: "2026-10-26",
  decks: [],
  done: 0,
  firstDay: false,
  fresh: 0,
  hasRatings: true,
  newCardsPaused: false,
  notice: false,
  overdue: 0,
  remaining: 0,
  reviews: 0,
  reviewTime: "19:00",
  status: "open",
  tomorrow: 0,
  yesterday: null,
  ...fields,
});

const deck = {
  cardCount: 5,
  done: 0,
  fresh: 0,
  id: "d",
  name: "D",
  remaining: 0,
  tomorrow: 0,
};

describe("Início copy", () => {
  test("greets by the first name and the time of day", () => {
    expect(greeting("Ana Souza", new Date(2026, 9, 26, 14))).toBe(
      "Boa tarde, Ana"
    );
    expect(greeting(undefined, new Date(2026, 9, 26, 8))).toBe("Bom dia");
    expect(greeting("Ana", new Date(2026, 9, 26, 2))).toBe("Boa noite, Ana");
  });

  test("the line follows the Day", () => {
    expect(dayLine(today({ remaining: 12 }))).toBe(
      "Você tem 12 cards para hoje."
    );
    expect(dayLine(today({ done: 3, remaining: 1 }))).toBe(
      "Falta 1 card na revisão de hoje."
    );
    expect(dayLine(today({ remaining: 1, status: "seen" }))).toBe(
      "Revisão de hoje marcada como vista. 1 card fica para amanhã."
    );
    expect(dayLine(today({ done: 5, status: "completed", tomorrow: 14 }))).toBe(
      "Revisão de hoje concluída. Amanhã: 14 cards."
    );
    expect(
      dayLine(
        today({ done: 5, firstDay: true, status: "completed", tomorrow: 5 })
      )
    ).toBe("Primeira sessão feita. Amanhã: 5 cards, com aviso às 19:00.");
    expect(dayLine(today({ status: "free" }))).toBe("Nada para revisar hoje.");
  });

  test("the detail leaves out zero counts", () => {
    expect(reviewParts(today({ fresh: 5, overdue: 4, reviews: 12 }))).toEqual([
      { text: "12 revisões" },
      { text: "5 novos" },
      { overdue: true, text: "4 atrasados" },
    ]);
    expect(reviewParts(today({ fresh: 3 }))).toEqual([{ text: "3 novos" }]);
  });

  test("Deck badges", () => {
    expect(deckBadge({ ...deck, fresh: 1, remaining: 3 }, today({}))).toEqual({
      fresh: 1,
      kind: "today",
      remaining: 3,
    });
    expect(
      deckBadge({ ...deck, remaining: 3 }, today({ status: "seen" }))
    ).toEqual({
      count: 3,
      kind: "tomorrow",
    });
    expect(
      deckBadge({ ...deck, done: 2 }, today({ status: "completed" }))
    ).toEqual({
      kind: "done",
    });
    expect(
      deckBadge(
        { ...deck, done: 5, tomorrow: 5 },
        today({ firstDay: true, status: "completed" })
      )
    ).toEqual({ count: 5, kind: "tomorrow" });
    expect(deckBadge(deck, today({ status: "free" }))).toEqual({
      kind: "clear",
    });
    expect(
      deckBadge({ ...deck, cardCount: 0 }, today({ status: "free" }))
    ).toBeNull();
  });
});
