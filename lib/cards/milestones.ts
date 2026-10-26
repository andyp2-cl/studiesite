import type { Tier } from "./catalog";

// Card milestones, each worth one card. Every 5 correct answers give bronze.
// An area gives a card when it is finished. Level moments (math): every one
// cleared at Lätt, Medel or Svår (stars >= level). "Läs och svara" moments
// (fact subjects): every quiz passed. Hidden moments are left out by the caller.

export type AreaMoment = { mode: "levels" | "read"; stars: number; quizPassed: boolean };
export type Milestone = { key: string; tier: Tier };

const LEVEL_TIER: Record<1 | 2 | 3, Tier> = { 1: "bronze", 2: "silver", 3: "gold" };

export function areaMilestones(areaId: string, moments: AreaMoment[]): Milestone[] {
  const levels = moments.filter((m) => m.mode === "levels");
  const reads = moments.filter((m) => m.mode === "read");
  const reached: Milestone[] = [];
  if (levels.length) {
    for (const level of [1, 2, 3] as const) {
      if (levels.every((m) => m.stars >= level)) reached.push({ key: `area:${areaId}:level:${level}`, tier: LEVEL_TIER[level] });
    }
  }
  if (reads.length && reads.every((m) => m.quizPassed)) reached.push({ key: `area:${areaId}:read`, tier: "silver" });
  return reached;
}

/** A bronze card for every this many correct answers, across all subjects. */
export const CORRECT_PER_CARD = 5;

/** Milestones for a student's total number of correct answers: 5, 10, 15, … */
export function answerMilestones(correctCount: number): Milestone[] {
  const reached = Math.floor(Math.max(0, correctCount) / CORRECT_PER_CARD);
  return Array.from({ length: reached }, (_, i) => ({ key: `correct:${(i + 1) * CORRECT_PER_CARD}`, tier: "bronze" as const }));
}
