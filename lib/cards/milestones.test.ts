import { describe, expect, it } from "vitest";
import { answerMilestones, areaMilestones, type AreaMoment } from "./milestones";

const level = (stars: number): AreaMoment => ({ mode: "levels", stars, quizPassed: false });
const read = (quizPassed: boolean): AreaMoment => ({ mode: "read", stars: quizPassed ? 2 : 1, quizPassed });

describe("areaMilestones", () => {
  it("needs every moment in the area to clear a level", () => {
    expect(areaMilestones("a", [level(1), level(0)])).toEqual([]);
    expect(areaMilestones("a", [level(1), level(3)])).toEqual([{ key: "area:a:level:1", tier: "bronze" }]);
  });

  it("gives bronze, silver and gold for Lätt, Medel and Svår", () => {
    expect(areaMilestones("a", [level(3), level(3)])).toEqual([
      { key: "area:a:level:1", tier: "bronze" },
      { key: "area:a:level:2", tier: "silver" },
      { key: "area:a:level:3", tier: "gold" },
    ]);
  });

  it("gives silver when every quiz in a fact area is passed", () => {
    expect(areaMilestones("f", [read(true), read(false)])).toEqual([]);
    expect(areaMilestones("f", [read(true), read(true)])).toEqual([{ key: "area:f:read", tier: "silver" }]);
  });

  it("gives nothing for an empty area", () => {
    expect(areaMilestones("e", [])).toEqual([]);
  });
});

describe("answerMilestones", () => {
  it("gives a bronze card for every 5 correct answers", () => {
    expect(answerMilestones(4)).toEqual([]);
    expect(answerMilestones(8)).toEqual([{ key: "correct:5", tier: "bronze" }]);
    expect(answerMilestones(10).map((m) => m.key)).toEqual(["correct:5", "correct:10"]);
  });
});
