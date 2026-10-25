import { describe, expect, it } from "vitest";
import { generatorKeys, getGenerator } from "@/lib/generators";
import { answerValue, LEVELS } from "@/lib/generators/types";
import { checkAnswer } from "@/lib/math/check-answer";
import { mathSubject } from "@/lib/seed/math";

// Contract tests that every generator must pass. Per-generator tests live next
// to each generator.

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 13);

describe.each(generatorKeys)("generator %s", (key) => {
  const generator = getGenerator(key)!;

  it("is used by a seeded moment", () => {
    const keys = mathSubject.areas.flatMap((a) => a.moments.map((m) => m.generatorKey));
    expect(keys).toContain(key);
  });

  it.each(LEVELS)("level %i is deterministic for a seed", (level) => {
    expect(generator.generate(level, 42)).toEqual(generator.generate(level, 42));
  });

  it.each(LEVELS)("level %i: its own answer is accepted and well-formed", (level) => {
    for (const seed of SEEDS) {
      const task = generator.generate(level, seed);
      expect(task.prompt.length).toBeGreaterThan(0);
      expect(task.solutionSteps.length).toBeGreaterThan(0);
      expect(task.hint.length).toBeGreaterThan(10);
      expect(task.hint).not.toMatch(/undefined|NaN/);
      const value = answerValue(task.answer);
      if (task.answer.kind !== "expression") expect(Number.isFinite(value)).toBe(true);
      expect(task.prompt).not.toMatch(/undefined|NaN|Infinity/);
      // The value written as a decimal is always readable and right…
      const typed = task.answer.kind === "expression" ? task.answer.expr : String(value);
      const result = checkAnswer(typed, task.answer);
      if (task.answer.kind === "number" && task.answer.requireSimplified) {
        // …except where the simplest fraction is required.
        expect(["correct", "retry"]).toContain(result.status);
      } else {
        expect(result.status, `${key} L${level} seed ${seed}: ${task.prompt}`).toBe("correct");
      }
    }
  });

  it("produces varied tasks", () => {
    const prompts = new Set(SEEDS.slice(0, 50).map((s) => generator.generate(1, s).prompt));
    expect(prompts.size).toBeGreaterThan(15);
  });
});
