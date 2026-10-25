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
