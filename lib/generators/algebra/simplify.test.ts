import { describe, expect, it } from "vitest";
import { generator } from "@/lib/generators/algebra/simplify";
import { LEVELS } from "@/lib/generators/types";
import { checkAnswer } from "@/lib/math/check-answer";

describe("algebra/simplify", () => {
  it.each(LEVELS)("level %i: copying the unsimplified task is not accepted as done", (level) => {
    for (let seed = 1; seed < 150; seed++) {
      const task = generator.generate(level, seed);
      const original = task.prompt.match(/\$(.+)\$/)![1];
      const result = checkAnswer(original, task.answer);
      // Same value, so not "wrong" – but the student is asked to simplify further.
      expect(result, `${task.prompt}`).toEqual({ status: "retry", reason: "not-simplified-expression" });
    }
  });
});
