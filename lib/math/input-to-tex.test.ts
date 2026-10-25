import { describe, expect, it } from "vitest";
import { inputToTex } from "@/lib/math/input-to-tex";

describe("inputToTex", () => {
  it("renders fractions, powers, roots and products", () => {
    expect(inputToTex("3/4")).toBe("\\frac{3}{4}");
    expect(inputToTex("(1+2)/5")).toBe("\\frac{1+2}{5}");
    expect(inputToTex("2^10")).toBe("2^{10}");
    expect(inputToTex("√49")).toBe("\\sqrt{49}");
    expect(inputToTex("3·4")).toBe("3 \\cdot 4");
    expect(inputToTex("2π")).toBe("2\\pi ");
  });

  it("shows a Swedish decimal comma", () => {
    expect(inputToTex("0,75")).toBe("0{,}75");
    expect(inputToTex("x = 2.5")).toBe("x = 2{,}5");
  });
});

describe("inputToTex – units", () => {
  it("shows units as text", () => {
    expect(inputToTex("22 cm")).toBe("22\\text{ cm}");
    expect(inputToTex("40 cm²")).toBe("40\\text{ cm}^2");
    expect(inputToTex("13 grader")).toBe("13\\text{ grader}");
    expect(inputToTex("-4 °C")).toBe("-4^\\circ\\text{C}");
    expect(inputToTex("5 m")).toBe("5\\text{ m}");
  });

  it("keeps algebra as algebra", () => {
    expect(inputToTex("2x + 6")).toBe("2x + 6");
    expect(inputToTex("3a")).toBe("3a");
  });
});
