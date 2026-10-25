import { describe, expect, it } from "vitest";
import { greetingFor } from "@/lib/greeting";
import { strings } from "@/lib/strings";

// Summer: Stockholm = UTC + 2.
const atStockholm = (hour: number) => new Date(Date.UTC(2026, 6, 1, hour - 2, 30));

describe("greetingFor", () => {
  it("picks a greeting based on the Swedish hour", () => {
    expect(greetingFor(atStockholm(7))).toBe(strings.home.greeting.morning);
    expect(greetingFor(atStockholm(13))).toBe(strings.home.greeting.day);
    expect(greetingFor(atStockholm(20))).toBe(strings.home.greeting.evening);
    expect(greetingFor(atStockholm(2))).toBe(strings.home.greeting.night);
  });
});
