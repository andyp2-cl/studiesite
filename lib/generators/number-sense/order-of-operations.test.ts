import { evaluate } from "mathjs";
import { describe, expect, it } from "vitest";
import { generator } from "@/lib/generators/number-sense/order-of-operations";
import { LEVELS } from "@/lib/generators/types";

// Independent check: evaluate the printed expression with mathjs and compare
// with the generator's own answer.
function expressionFromPrompt(prompt: string): string {
  const tex = prompt.match(/\$(.+)\$/)![1];
  return tex.replace(/\\cdot/g, "*");
}

describe("number-sense/order-of-operations", () => {
  it.each(LEVELS)("level %i answer matches the expression", (level) => {
    for (let seed = 1; seed < 200; seed++) {
      const task = generator.generate(level, seed);
      expect(evaluate(expressionFromPrompt(task.prompt))).toBeCloseTo(task.answer.value, 9);
    }
  });

  it("level 1 and 2 answers are positive integers", () => {
    for (let seed = 1; seed < 200; seed++) {
      for (const level of [1, 2] as const) {
        const { value } = generator.generate(level, seed).answer;
        expect(Number.isInteger(value) && value > 0).toBe(true);
      }
    }
  });
});
