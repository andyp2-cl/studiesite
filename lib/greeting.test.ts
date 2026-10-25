import { describe, expect, it } from "vitest";
import { greetingFor } from "@/lib/greeting";
import { strings } from "@/lib/strings";

const at = (hour: number) => new Date(2026, 0, 1, hour, 30);

describe("greetingFor", () => {
  it("picks a greeting based on the hour", () => {
    expect(greetingFor(at(7))).toBe(strings.home.greeting.morning);
    expect(greetingFor(at(13))).toBe(strings.home.greeting.day);
    expect(greetingFor(at(20))).toBe(strings.home.greeting.evening);
    expect(greetingFor(at(2))).toBe(strings.home.greeting.night);
  });
});
