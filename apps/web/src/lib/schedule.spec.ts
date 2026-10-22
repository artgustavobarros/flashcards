import { expect, test } from "vitest";
import { nextReviewText } from "./schedule";

test("a restarted Card is New but has a distinct next review message", () => {
  expect(
    nextReviewText(
      { due: null, resetAt: "2026-10-21T12:00:00.000Z", state: "new" },
      "2026-10-22"
    )
  ).toBe("Entra como novo numa próxima Daily Review");
});
