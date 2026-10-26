import type { Tier } from "./catalog";

// Which card milestones an area has reached. Level moments (math): every one
// cleared at Lätt, Medel or Svår (stars >= level). "Läs och svara" moments
// (fact subjects): every quiz passed. Hidden moments are left out by the caller.

export type AreaMoment = { mode: "levels" | "read"; stars: number; quizPassed: boolean };
export type AreaMilestone = { key: string; tier: Tier };

const LEVEL_TIER: Record<1 | 2 | 3, Tier> = { 1: "bronze", 2: "silver", 3: "gold" };

export function areaMilestones(areaId: string, moments: AreaMoment[]): AreaMilestone[] {
  const levels = moments.filter((m) => m.mode === "levels");
  const reads = moments.filter((m) => m.mode === "read");
  const reached: AreaMilestone[] = [];
  if (levels.length) {
    for (const level of [1, 2, 3] as const) {
      if (levels.every((m) => m.stars >= level)) reached.push({ key: `area:${areaId}:level:${level}`, tier: LEVEL_TIER[level] });
    }
  }
  if (reads.length && reads.every((m) => m.quizPassed)) reached.push({ key: `area:${areaId}:read`, tier: "silver" });
  return reached;
}
