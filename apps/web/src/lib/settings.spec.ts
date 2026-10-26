import { expect, test } from "vitest";
import { timezoneLabel } from "./settings";

test("shows automatic timezone using the local name", () => {
  expect(timezoneLabel("America/Sao_Paulo", true)).toBe(
    "Horário de Brasília (automático)"
  );
});

test("shows a manual timezone without the automatic marker", () => {
  expect(timezoneLabel("Europe/Lisbon", false)).toBe("Lisboa");
});
