import { describe, expect, it } from "vitest";
import { MIX_SIZE, mixCandidates, planMix, type MixAttempt } from "@/lib/practice/mix";
import { createRng } from "@/lib/random";
import type { Level } from "@/lib/generators/types";

const now = new Date("2026-10-26T12:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);
const attempt = (momentId: string, correct: boolean, days = 0, level: Level = 1): MixAttempt => ({
  momentId,
  level,
  correct,
  createdAt: daysAgo(days),
});

describe("mixCandidates", () => {
  it("weighs recent mistakes and time since practice", () => {
    const [fresh, wrong, idle] = mixCandidates(
      [attempt("fresh", true), attempt("wrong", false), attempt("wrong", false), attempt("idle", true, 9)],
      now,
    );
    expect(fresh.weight).toBe(1);
    expect(wrong.weight).toBe(3);
    expect(idle.weight).toBe(4);
  });

  it("only counts the latest 10 answers and caps idle time", () => {
    const old = Array.from({ length: 5 }, () => attempt("a", false, 100));
    const latest = Array.from({ length: 10 }, () => attempt("a", true, 100));
    expect(mixCandidates([...latest, ...old], now)[0].weight).toBe(1 + 30 / 3);
  });

  it("uses the level of the latest mistake, else the latest level", () => {
    const [a, b] = mixCandidates(
      [attempt("a", true, 0, 3), attempt("a", false, 1, 2), attempt("b", true, 0, 3), attempt("b", true, 1, 1)],
      now,
    );
    expect(a.level).toBe(2);
    expect(b.level).toBe(3);
  });
});

describe("planMix", () => {
  it("is empty without practice", () => {
    expect(planMix([], now, createRng(1))).toEqual([]);
  });

  it("fills 10 tasks from a single moment", () => {
    const plan = planMix([attempt("a", true)], now, createRng(1));
    expect(plan).toHaveLength(MIX_SIZE);
    expect(new Set(plan.map((s) => s.momentId))).toEqual(new Set(["a"]));
  });

  it("uses at most 4 moments, in blocks, and gives the remainder to the heaviest", () => {
    const attempts = ["a", "b", "c", "d", "e", "f"].map((id, i) => attempt(id, i > 0, i));
    for (let seed = 1; seed < 50; seed++) {
      const plan = planMix(attempts, now, createRng(seed));
      expect(plan).toHaveLength(MIX_SIZE);
      const ids = plan.map((s) => s.momentId);
      const blocks = ids.filter((id, i) => id !== ids[i - 1]);
      expect(new Set(ids).size).toBe(4);
      expect(blocks).toHaveLength(4);
      expect([...new Set(ids)].map((id) => ids.filter((x) => x === id).length).sort()).toEqual([2, 2, 3, 3]);
    }
  });

  it("picks heavy moments more often", () => {
    const attempts = [
      ...Array.from({ length: 10 }, () => attempt("weak", false, 20)),
      ...["b", "c", "d", "e", "f", "g", "h"].map((id) => attempt(id, true)),
    ];
    let withWeak = 0;
    for (let seed = 1; seed <= 200; seed++) {
      if (planMix(attempts, now, createRng(seed)).some((s) => s.momentId === "weak")) withWeak++;
    }
    expect(withWeak).toBeGreaterThan(190);
  });
});
