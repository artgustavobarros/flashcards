import { describe, expect, test } from "vitest";
import {
  applyRating,
  createStudySession,
  studyCounts,
  undoRating,
} from "./study-session";

const ids = ["first", "second"];
const cards = [
  { id: "first", state: "new" as const },
  { id: "second", state: "learning" as const },
];

describe("Study Session", () => {
  test("Errei returns at the end and a repeat completes without changing the first Rating", () => {
    const start = createStudySession(ids, "daily", 1000);
    const erro = applyRating(start, "first", 1, "review-1", "2026-10-23");
    expect(erro.queue).toEqual(["second", "first"]);
    expect(studyCounts(erro, cards)).toEqual({ new: 0, review: 1, repeat: 1 });

    const next = applyRating(erro, "second", 3, "review-2", "2026-10-24");
    const done = applyRating(next, "first", 3, "review-3", "2026-10-23");
    expect(done.queue).toEqual([]);
    expect(done.finished).toEqual(["second", "first"]);
    expect(done.first).toEqual({ first: 1, second: 3 });
    expect(done.due.first).toBe("2026-10-23");
  });

  test("Undo brings back the last Card with its answer visible", () => {
    const start = createStudySession(ids, "daily", 1000);
    const rated = applyRating(start, "first", 1, "review-1", "2026-10-23");
    const undone = undoRating(rated);
    expect(undone.queue).toEqual(ids);
    expect(undone.first).toEqual({});
    expect(undone.revealed).toBe(true);
    expect(undone.history).toEqual([]);
  });
});
