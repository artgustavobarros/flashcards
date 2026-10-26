import type { ProgressDay } from "@daruma/shared";
import { describe, expect, test } from "vitest";
import {
  buckets,
  dayText,
  goalText,
  niceMax,
  progressSearchSchema,
  toProgressQuery,
  withPeriod,
} from "~/lib/progress";

// Days from..to (inclusive), each with one Rating and no Errei.
const daysFrom = (from: string, count: number): ProgressDay[] =>
  Array.from({ length: count }, (_, i) => ({
    day: new Date(Date.parse(`${from}T00:00:00Z`) + i * 86_400_000)
      .toISOString()
      .slice(0, 10),
    errors: 0,
    mark: "completed",
    reviews: 1,
  }));

describe("search", () => {
  test("drops bad values and maps Tudo to the API's all", () => {
    const search = progressSearchSchema.parse({ deck: "x", periodo: "5" });
    expect(search).toEqual({ deck: undefined, periodo: undefined });
    expect(toProgressQuery(search)).toEqual({
      deckId: undefined,
      period: "30",
    });
    expect(toProgressQuery({ periodo: "tudo" }).period).toBe("all");
    expect(progressSearchSchema.parse({ periodo: 7 })).toEqual({ periodo: 7 });
    expect(toProgressQuery({ periodo: 7 }).period).toBe("7");
  });

  test("30 days stays out of the URL", () => {
    expect(withPeriod({ periodo: 7 }, "30")).toEqual({ periodo: undefined });
    expect(withPeriod({}, "90")).toEqual({ periodo: 90 });
  });
});

describe("buckets", () => {
  test("7 days: one bar a Day, today named", () => {
    const bars = buckets(daysFrom("2026-10-16", 7), "7");
    expect(bars.map((bar) => bar.label)).toEqual([
      "sex",
      "sáb",
      "dom",
      "seg",
      "ter",
      "qua",
      "hoje",
    ]);
    expect(bars.at(-1)?.range).toBe("qui, 22 out (hoje)");
  });

  test("90 days: weeks ending today", () => {
    const days = daysFrom("2026-07-25", 90);
    days[89] = { ...(days[89] as ProgressDay), errors: 1, reviews: 4 };
    const bars = buckets(days, "90");
    expect(bars).toHaveLength(13);
    expect(bars[0]).toMatchObject({ range: "25 jul – 30 jul", reviews: 6 });
    expect(bars.at(-1)).toMatchObject({ errors: 1, pct: 90, reviews: 10 });
  });

  test("Tudo: one bar a month", () => {
    const bars = buckets(daysFrom("2026-09-29", 3), "tudo");
    expect(bars.map((bar) => [bar.label, bar.range, bar.reviews])).toEqual([
      ["set", "set 2026", 2],
      ["out", "out 2026", 1],
    ]);
  });
});

test("copy", () => {
  expect(goalText(87)).toBe("3 pontos abaixo da meta de 90%");
  expect(goalText(90)).toBe("Acima da meta de 90%");
  expect(niceMax(13)).toBe(20);
  expect(niceMax(0)).toBe(10);
  const day = { day: "2026-10-22", errors: 0, reviews: 3 };
  expect(dayText({ ...day, mark: "completed" })).toBe(
    "Revisão concluída · 3 revisões"
  );
  expect(dayText({ ...day, mark: "free" })).toBe("3 revisões");
});
