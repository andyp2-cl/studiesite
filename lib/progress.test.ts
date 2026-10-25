import { describe, expect, it } from "vitest";
import { levelProgress, suggestedLevel } from "@/lib/progress";

const attempts = (pattern: string) => [...pattern].map((c) => c === "1");

describe("levelProgress", () => {
  it("clears with 8 of the latest 10", () => {
    expect(levelProgress(attempts("1111111100")).cleared).toBe(true);
    expect(levelProgress(attempts("1111111000")).cleared).toBe(false);
  });

  it("only counts the latest 10 (newest first)", () => {
    // 7 right in the latest 10, older ones do not help.
    expect(levelProgress(attempts("1111111000" + "1111111111"))).toEqual({
      correct: 7,
      attempts: 10,
      cleared: false,
    });
  });

  it("cannot clear with fewer than 8 attempts", () => {
    expect(levelProgress(attempts("1111111")).cleared).toBe(false);
  });
});

describe("suggestedLevel", () => {
  it("suggests the first level without a star", () => {
    expect(suggestedLevel(0)).toBe(1);
    expect(suggestedLevel(1)).toBe(2);
    expect(suggestedLevel(3)).toBe(3);
  });
});
