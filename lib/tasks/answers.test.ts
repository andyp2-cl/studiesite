import { describe, expect, it } from "vitest";
import { buildAnswer, checkTaskAnswer, correctAnswerDisplay, type TaskAnswer } from "@/lib/tasks/answers";

const answerOf = (...args: Parameters<typeof buildAnswer>): TaskAnswer => buildAnswer(...args)!.answer;
const status = (answer: TaskAnswer, input: string) => checkTaskAnswer(answer, input).status;

describe("numeric tasks", () => {
  it("accepts equivalent values", () => {
    const answer = answerOf("numeric", { value: "3/4" });
    expect(status(answer, "0,75")).toBe("correct");
    expect(status(answer, "6/8")).toBe("correct");
    expect(status(answer, "0,7")).toBe("wrong");
  });

  it("can require the simplest form", () => {
    const answer = answerOf("numeric", { value: "3/4", requireSimplified: true });
    expect(status(answer, "6/8")).toBe("retry");
    expect(status(answer, "3/4")).toBe("correct");
  });

  it("rejects an unreadable answer key", () => {
    expect(buildAnswer("numeric", { value: "tre" })).toBeNull();
  });
});

describe("expression tasks", () => {
  it("treats 'x = 4' as an equation", () => {
    const answer = answerOf("expression", { value: "x = 4" });
    expect(answer.kind).toBe("equation");
    expect(status(answer, "4")).toBe("correct");
    expect(status(answer, "x=4")).toBe("correct");
    expect(status(answer, "x = 5")).toBe("wrong");
  });

  it("accepts any equivalent expression", () => {
    const answer = answerOf("expression", { value: "2x + 6" });
    expect(status(answer, "2(x+3)")).toBe("correct");
    expect(status(answer, "6 + x·2")).toBe("correct");
    expect(status(answer, "2x + 5")).toBe("wrong");
  });

  it("handles several variables", () => {
    const answer = answerOf("expression", { value: "3a + 2b" });
    expect(status(answer, "2b + 3a")).toBe("correct");
    expect(status(answer, "5ab")).toBe("wrong");
  });

  it("asks to retry on unknown letters", () => {
    const answer = answerOf("expression", { value: "2x + 6" });
    expect(status(answer, "2y + 6")).toBe("retry");
  });
});

describe("multiple choice and true/false", () => {
  it("checks the chosen index", () => {
    const built = buildAnswer("multiple_choice", { choices: ["2", "3", "", "4"], correctIndex: 1 })!;
    expect(built.choices).toEqual(["2", "3", "4"]);
    expect(status(built.answer, "1")).toBe("correct");
    expect(status(built.answer, "0")).toBe("wrong");
    expect(correctAnswerDisplay(built.answer, built.choices)).toEqual({ text: "3" });
  });

  it("needs at least two choices and a valid correct one", () => {
    expect(buildAnswer("multiple_choice", { choices: ["bara en"], correctIndex: 0 })).toBeNull();
    expect(buildAnswer("multiple_choice", { choices: ["a", "b"], correctIndex: 5 })).toBeNull();
  });

  it("checks true/false", () => {
    const answer = answerOf("true_false", { correctBoolean: false });
    expect(status(answer, "false")).toBe("correct");
    expect(status(answer, "true")).toBe("wrong");
  });
});

describe("free text", () => {
  it("matches accepted answers loosely", () => {
    const answer = answerOf("free_text", { accepted: ["Täljare"] });
    expect(status(answer, " täljare. ")).toBe("correct");
    expect(status(answer, "nämnare")).toBe("wrong");
  });

  it("accepts answers containing all keywords", () => {
    const answer = answerOf("free_text", { keywords: ["samma", "nämnare"] });
    expect(status(answer, "Man måste ha samma nämnare först")).toBe("correct");
    expect(status(answer, "Man måste ha samma täljare")).toBe("wrong");
  });
});
