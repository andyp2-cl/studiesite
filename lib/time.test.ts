import { describe, expect, it } from "vitest";
import { startOfStockholmDay, stockholmDate, stockholmHour } from "@/lib/time";

describe("Swedish time helpers", () => {
  it("uses Swedish date even when UTC is still yesterday", () => {
    // 23:30 UTC on 14 Jan = 00:30 on 15 Jan in Stockholm (winter, +1).
    expect(stockholmDate(new Date("2026-01-14T23:30:00Z"))).toBe("2026-01-15");
  });

  it("finds midnight in winter (+01:00) and summer (+02:00)", () => {
    expect(startOfStockholmDay(new Date("2026-01-15T12:00:00Z")).toISOString()).toBe("2026-01-14T23:00:00.000Z");
    expect(startOfStockholmDay(new Date("2026-07-15T12:00:00Z")).toISOString()).toBe("2026-07-14T22:00:00.000Z");
  });

  it("handles the day clocks change", () => {
    // 25 Oct 2026: summer time ends at 03:00. Midnight is still +02:00.
    expect(startOfStockholmDay(new Date("2026-10-25T15:00:00Z")).toISOString()).toBe("2026-10-24T22:00:00.000Z");
  });

  it("gives the Swedish hour", () => {
    expect(stockholmHour(new Date("2026-07-15T05:00:00Z"))).toBe(7);
  });
});
