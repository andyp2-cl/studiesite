import { describe, expect, it } from "vitest";
import { generator } from "@/lib/generators/fractions/expand-simplify";
import { checkAnswer } from "@/lib/math/check-answer";

describe("fractions/expand-simplify", () => {
  it("level 1 asks for the simplest form and rejects an unsimplified answer", () => {
    for (let seed = 1; seed < 100; seed++) {
      const task = generator.generate(1, seed);
      expect(task.answer.kind === "number" && task.answer.requireSimplified).toBe(true);
      const [, n, d] = task.prompt.match(/\\frac\{(\d+)\}\{(\d+)\}/)!;
      // Typing the original fraction back is the right value but not simplified.
      expect(checkAnswer(`${n}/${d}`, task.answer)).toEqual({ status: "retry", reason: "not-simplified" });
      // The displayed answer (\frac{a}{b}) typed as a/b is correct.
      const [, an, ad] = (task.answer.display.match(/\\frac\{(\d+)\}\{(\d+)\}/) ?? [])!;
      expect(checkAnswer(`${an}/${ad}`, task.answer).status).toBe("correct");
    }
  });

  it("missing-number tasks have whole-number answers", () => {
    for (let seed = 1; seed < 200; seed++) {
      for (const level of [2, 3] as const) {
        const task = generator.generate(level, seed);
        if (task.prompt.includes("\\square")) expect(Number.isInteger(task.answer.value)).toBe(true);
      }
    }
  });
});
