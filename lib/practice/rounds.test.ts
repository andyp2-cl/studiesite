import { describe, expect, it } from "vitest";
import { offeredRounds, readingCanSupportMore, wordCount } from "./rounds";

describe("offeredRounds", () => {
  it("offers 5 and 10 when at least 10 questions are still unseen", () => {
    expect(offeredRounds(10)).toEqual([5, 10]);
    expect(offeredRounds(12)).toEqual([5, 10]);
  });

  it("offers the questions that are left instead of padding with repeats", () => {
    expect(offeredRounds(8)).toEqual([5, 8]);
    expect(offeredRounds(5)).toEqual([5]);
    expect(offeredRounds(3)).toEqual([3]);
  });

  it("offers nothing once every question has been used, unless more can be written", () => {
    expect(offeredRounds(0)).toEqual([]);
    expect(offeredRounds(0, true)).toEqual([5, 10]);
  });
});

describe("readingCanSupportMore", () => {
  it("does not ask for more questions from a moment that already spent its text", () => {
    expect(readingCanSupportMore(800, 10)).toBe(false);
    expect(readingCanSupportMore(900, 12)).toBe(false);
  });

  it("allows another round when the text is clearly longer than the questions it has", () => {
    expect(readingCanSupportMore(1600, 10)).toBe(true);
    expect(readingCanSupportMore(900, 6)).toBe(true);
  });
});

describe("wordCount", () => {
  it("counts words and skips markdown and math", () => {
    expect(wordCount("Karl **XII** förlorade vid $Poltava$ 1709.")).toBe(5);
  });
});
