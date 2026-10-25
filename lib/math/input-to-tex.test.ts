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
