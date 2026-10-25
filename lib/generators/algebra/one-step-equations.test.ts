import { describe, expect, it } from "vitest";
import { generator } from "@/lib/generators/algebra/one-step-equations";
import { checkAnswer } from "@/lib/math/check-answer";

describe("algebra/one-step-equations", () => {
  it("level 1 and 2 have positive whole solutions", () => {
    for (let seed = 1; seed < 200; seed++) {
      for (const level of [1, 2] as const) {
        const { answer } = generator.generate(level, seed);
        expect(Number.isInteger(answer.value) && answer.value > 0).toBe(true);
      }
    }
  });

  it("level 3 includes negative solutions", () => {
    const values = Array.from({ length: 200 }, (_, s) => generator.generate(3, s).answer.value);
    expect(values.some((v) => v < 0)).toBe(true);
    expect(values.every(Number.isInteger)).toBe(true);
  });

  it("accepts 'x = …' as well as the bare number", () => {
    const task = generator.generate(2, 5);
    expect(checkAnswer(`x = ${task.answer.value}`, task.answer).status).toBe("correct");
    expect(checkAnswer(`${task.answer.value}`, task.answer).status).toBe("correct");
  });
});
