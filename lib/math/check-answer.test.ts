import { describe, expect, it } from "vitest";
import type { Answer } from "@/lib/generators/types";
import { checkAnswer } from "@/lib/math/check-answer";

const threeQuarters: Answer = { kind: "number", value: 0.75, display: "\\frac{3}{4}" };
const simplified: Answer = { ...threeQuarters, requireSimplified: true };
const xIsFour: Answer = { kind: "equation", variable: "x", value: 4, display: "x = 4" };

const status = (input: string, answer: Answer) => checkAnswer(input, answer).status;

describe("checkAnswer – numbers", () => {
  it("accepts equivalent forms (SPEC 6)", () => {
    for (const input of ["3/4", "0.75", "0,75", "6/8", " 3 / 4 ", "(3)/(4)", "75/100"]) {
      expect(status(input, threeQuarters), input).toBe("correct");
    }
  });

  it("rejects wrong values", () => {
    expect(status("4/3", threeQuarters)).toBe("wrong");
    expect(status("0.7", threeQuarters)).toBe("wrong");
  });

  it("handles symbol-row characters and Swedish formatting", () => {
    const n = (value: number): Answer => ({ kind: "number", value, display: String(value) });
    expect(status("3·4", n(12))).toBe("correct");
    expect(status("3×4", n(12))).toBe("correct");
    expect(status("12÷4", n(3))).toBe("correct");
    expect(status("−5", n(-5))).toBe("correct");
    expect(status("2^3", n(8))).toBe("correct");
    expect(status("√49", n(7))).toBe("correct");
    expect(status("√(16)", n(4))).toBe("correct");
    expect(status("1 000", n(1000))).toBe("correct");
    expect(status("2π", n(2 * Math.PI))).toBe("correct");
  });

  it("asks to retry when the answer cannot be read", () => {
    expect(checkAnswer("", threeQuarters)).toEqual({ status: "retry", reason: "unreadable" });
    expect(checkAnswer("tre fjärdedelar", threeQuarters)).toEqual({ status: "retry", reason: "unreadable" });
    expect(checkAnswer("3/", threeQuarters)).toEqual({ status: "retry", reason: "unreadable" });
  });

  it("never evaluates anything but arithmetic", () => {
    for (const input of ["import({})", "evaluate('1')", "x", "f(x)=1", "a=1", "cos(0)", "[1,2]"]) {
      expect(status(input, threeQuarters), input).toBe("retry");
    }
  });
});

describe("checkAnswer – simplified fractions", () => {
  it("requires the simplest form when asked", () => {
    expect(status("3/4", simplified)).toBe("correct");
    expect(checkAnswer("6/8", simplified)).toEqual({ status: "retry", reason: "not-simplified" });
    expect(checkAnswer("0,75", simplified)).toEqual({ status: "retry", reason: "not-simplified" });
  });

  it("accepts integers and negative fractions", () => {
    expect(status("2", { kind: "number", value: 2, display: "2", requireSimplified: true })).toBe("correct");
    expect(status("-2/3", { kind: "number", value: -2 / 3, display: "", requireSimplified: true })).toBe("correct");
    expect(checkAnswer("4/2", { kind: "number", value: 2, display: "2", requireSimplified: true }).status).toBe(
      "retry",
    );
  });
});

describe("checkAnswer – equations", () => {
  it("accepts x = 4 or just 4 (SPEC 6)", () => {
    for (const input of ["4", "x = 4", "x=4", "X = 4", "4 = x", "8/2"]) {
      expect(status(input, xIsFour), input).toBe("correct");
    }
  });

  it("rejects the wrong value", () => {
    expect(status("x = 5", xIsFour)).toBe("wrong");
  });
});

describe("checkAnswer – units, percent, tolerance", () => {
  const cm: Answer = { kind: "number", value: 12, display: "12 \\text{ cm}", unit: "cm" };
  const area: Answer = { kind: "number", value: 40, display: "40", unit: "cm²" };
  const pct: Answer = { kind: "number", value: 25, display: "25 \\%", unit: "%" };

  it("lets the student type the unit", () => {
    expect(checkAnswer("12 cm", cm).status).toBe("correct");
    expect(checkAnswer("12cm", cm).status).toBe("correct");
    expect(checkAnswer("12", cm).status).toBe("correct");
    expect(checkAnswer("40 cm2", area).status).toBe("correct");
    expect(checkAnswer("40 cm²", area).status).toBe("correct");
  });

  it("reads percent both as a unit and as a number", () => {
    expect(checkAnswer("25 %", pct).status).toBe("correct");
    expect(checkAnswer("25", pct).status).toBe("correct");
    const half: Answer = { kind: "number", value: 0.5, display: "\\frac{1}{2}" };
    expect(checkAnswer("50 %", half).status).toBe("correct");
  });

  it("accepts rounded answers within the tolerance", () => {
    const circle: Answer = { kind: "number", value: 78.5, display: "78{,}5", tolerance: 0.1 };
    expect(checkAnswer("78,5", circle).status).toBe("correct");
    expect(checkAnswer("78,54", circle).status).toBe("correct");
    expect(checkAnswer("78", circle).status).toBe("wrong");
  });
});

describe("checkAnswer – mixed numbers and forms", () => {
  const mixed: Answer = { kind: "number", value: 7 / 3, display: "2\\frac{1}{3}", requireForm: "mixed" };
  const fraction: Answer = { kind: "number", value: 17 / 5, display: "\\frac{17}{5}", requireForm: "fraction" };

  it("reads mixed numbers", () => {
    expect(checkAnswer("2 1/3", { kind: "number", value: 7 / 3, display: "" }).status).toBe("correct");
    expect(checkAnswer("-1 1/2", { kind: "number", value: -1.5, display: "" }).status).toBe("correct");
  });

  it("can require a mixed number", () => {
    expect(checkAnswer("2 1/3", mixed).status).toBe("correct");
    expect(checkAnswer("7/3", mixed)).toEqual({ status: "retry", reason: "not-mixed" });
    expect(checkAnswer("2 2/6", mixed)).toEqual({ status: "retry", reason: "not-mixed" });
  });

  it("can require a fraction", () => {
    expect(checkAnswer("17/5", fraction).status).toBe("correct");
    expect(checkAnswer("3 2/5", fraction)).toEqual({ status: "retry", reason: "not-fraction" });
    expect(checkAnswer("3,4", fraction)).toEqual({ status: "retry", reason: "not-fraction" });
  });
});

describe("checkAnswer – simplified expressions", () => {
  const simplified: Answer = { kind: "expression", expr: "7x - 3", variables: ["x"], display: "", requireSimplified: true };

  it("requires collected terms and no brackets", () => {
    expect(checkAnswer("7x - 3", simplified).status).toBe("correct");
    expect(checkAnswer("-3 + 7x", simplified).status).toBe("correct");
    expect(checkAnswer("3x + 4x - 3", simplified)).toEqual({ status: "retry", reason: "not-simplified-expression" });
    expect(checkAnswer("7(x - 1) + 4", simplified)).toEqual({ status: "retry", reason: "not-simplified-expression" });
    expect(checkAnswer("7x - 4", simplified).status).toBe("wrong");
  });

  it("handles two variables", () => {
    const ab: Answer = { kind: "expression", expr: "3a + 2b", variables: ["a", "b"], display: "", requireSimplified: true };
    expect(checkAnswer("2b + 3a", ab).status).toBe("correct");
    expect(checkAnswer("a + 2a + 2b", ab).status).toBe("retry");
  });
});
