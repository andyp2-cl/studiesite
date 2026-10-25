import { describe, expect, it } from "vitest";
import { answerValue } from "@/lib/generators/types";
import { generator } from "@/lib/generators/algebra/one-step-equations";
import { checkAnswer } from "@/lib/math/check-answer";

describe("algebra/one-step-equations", () => {
  it("level 1 and 2 have positive whole solutions", () => {
    for (let seed = 1; seed < 200; seed++) {
      for (const level of [1, 2] as const) {
        const { answer } = generator.generate(level, seed);
        expect(Number.isInteger(answerValue(answer)!) && answerValue(answer)! > 0).toBe(true);
      }
    }
  });

  it("level 3 includes negative solutions", () => {
    const values = Array.from({ length: 200 }, (_, s) => answerValue(generator.generate(3, s).answer)!);
    expect(values.some((v) => v < 0)).toBe(true);
    expect(values.every(Number.isInteger)).toBe(true);
  });

  it("accepts 'x = …' as well as the bare number", () => {
    const task = generator.generate(2, 5);
    expect(checkAnswer(`x = ${answerValue(task.answer)!}`, task.answer).status).toBe("correct");
    expect(checkAnswer(`${answerValue(task.answer)!}`, task.answer).status).toBe("correct");
  });
});
