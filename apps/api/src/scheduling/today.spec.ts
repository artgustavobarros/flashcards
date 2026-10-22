import { describe, expect, test } from "vitest";
import { addDays, dayStart, localDay, toDay } from "./today.js";

describe("localDay", () => {
  test("turns at the user's local midnight, not UTC's", () => {
    // São Paulo is UTC-3: its midnight is 03:00 UTC.
    expect(
      localDay(new Date("2026-10-22T02:59:59Z"), "America/Sao_Paulo")
    ).toBe("2026-10-21");
    expect(
      localDay(new Date("2026-10-22T03:00:00Z"), "America/Sao_Paulo")
    ).toBe("2026-10-22");
  });

  test("the same instant is a different day in another timezone", () => {
    const instant = new Date("2026-10-22T16:00:00Z");
    expect(localDay(instant, "America/Sao_Paulo")).toBe("2026-10-22");
    expect(localDay(instant, "Asia/Tokyo")).toBe("2026-10-23");
    expect(localDay(instant, "Pacific/Pago_Pago")).toBe("2026-10-22");
  });

  test("follows daylight saving time", () => {
    // New York falls back on 2026-11-01: midnight is 04:00 UTC before, 05:00 UTC after.
    expect(localDay(new Date("2026-11-01T03:59:59Z"), "America/New_York")).toBe(
      "2026-10-31"
    );
    expect(localDay(new Date("2026-11-01T04:00:00Z"), "America/New_York")).toBe(
      "2026-11-01"
    );
    expect(localDay(new Date("2026-11-02T04:59:59Z"), "America/New_York")).toBe(
      "2026-11-01"
    );
    expect(localDay(new Date("2026-11-02T05:00:00Z"), "America/New_York")).toBe(
      "2026-11-02"
    );
  });
});

describe("Day arithmetic", () => {
  test("a Day goes to UTC midnight and back", () => {
    expect(dayStart("2026-10-22").toISOString()).toBe(
      "2026-10-22T00:00:00.000Z"
    );
    expect(toDay(dayStart("2026-10-22"))).toBe("2026-10-22");
  });

  test("addDays crosses months and years", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-11-01", -1)).toBe("2026-10-31");
  });
});
