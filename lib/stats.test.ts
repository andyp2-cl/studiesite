import { describe, expect, it } from "vitest";
import { dailyActivity, momentAccuracy, percent, totals, type StatsAttempt } from "./stats";

const attempt = (created_at: string, correct: boolean, moment_id = "m1", duration_ms: number | null = 60_000): StatsAttempt => ({
  created_at,
  correct,
  duration_ms,
  moment_id,
});

describe("dailyActivity", () => {
  const now = new Date("2026-10-26T12:00:00Z");

  it("buckets attempts by Stockholm day, oldest first, with empty days kept", () => {
    const days = dailyActivity(
      [
        attempt("2026-10-26T08:00:00Z", true),
        attempt("2026-10-26T09:00:00Z", false),
        attempt("2026-10-24T22:30:00Z", true), // 00:30 on the 25th in Stockholm
      ],
      3,
      now,
    );
    expect(days.map((d) => d.date)).toEqual(["2026-10-24", "2026-10-25", "2026-10-26"]);
    expect(days.map((d) => d.tasks)).toEqual([0, 1, 2]);
    expect(days[2]).toMatchObject({ correct: 1, minutes: 2 });
  });

  it("caps long answers so idle time is not counted", () => {
    const [day] = dailyActivity([attempt("2026-10-26T08:00:00Z", true, "m1", 60 * 60_000)], 1, now);
    expect(day.minutes).toBe(3);
  });

  it("ignores attempts outside the window", () => {
    const days = dailyActivity([attempt("2026-09-01T08:00:00Z", true)], 7, now);
    expect(totals(days).tasks).toBe(0);
  });
});

describe("totals", () => {
  it("sums days and counts active ones", () => {
    expect(
      totals([
        { date: "a", tasks: 3, correct: 2, minutes: 5 },
        { date: "b", tasks: 0, correct: 0, minutes: 0 },
        { date: "c", tasks: 1, correct: 1, minutes: 1 },
      ]),
    ).toEqual({ tasks: 4, correct: 3, minutes: 6, activeDays: 2 });
  });
});

describe("momentAccuracy", () => {
  it("flags weak moments only with enough attempts and puts the weakest first", () => {
    const t = "2026-10-26T08:00:00Z";
    const rows = momentAccuracy([
      ...Array.from({ length: 5 }, (_, i) => attempt(t, i < 2, "weak")), // 40 %
      ...Array.from({ length: 5 }, (_, i) => attempt(t, i < 1, "weaker")), // 20 %
      ...Array.from({ length: 2 }, () => attempt(t, false, "few")), // 0 % but too few
      ...Array.from({ length: 8 }, () => attempt(t, true, "strong")),
    ]);
    expect(rows.map((r) => [r.momentId, r.weak])).toEqual([
      ["weaker", true],
      ["weak", true],
      ["strong", false],
      ["few", false],
    ]);
  });
});

describe("percent", () => {
  it("rounds and handles zero", () => {
    expect(percent(2, 3)).toBe(67);
    expect(percent(0, 0)).toBeNull();
  });
});
