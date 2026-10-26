import type { Level } from "@/lib/generators/types";
import type { Rng } from "@/lib/random";

// "Dagens mix": simple spaced repetition over moments the student has practised.
// A moment weighs more the more of its latest answers were wrong and the longer
// ago it was practised. Only practised levels are used, so tasks are known to exist.

export const MIX_SIZE = 10;
/** At most this many moments in one mix, so each gets a few tasks in a row. */
export const MIX_MAX_MOMENTS = 4;
const RECENT = 10;
const DAY_MS = 86_400_000;
/** Days without practice stop adding weight after this. */
const MAX_IDLE_DAYS = 30;

export type MixAttempt = { momentId: string; level: Level; correct: boolean; createdAt: Date };
export type MixStep = { momentId: string; level: Level };

type Candidate = { momentId: string; level: Level; weight: number };

/** Attempts newest first. Returns one candidate per moment. */
export function mixCandidates(attempts: MixAttempt[], now: Date): Candidate[] {
  const byMoment = new Map<string, MixAttempt[]>();
  for (const a of attempts) byMoment.set(a.momentId, [...(byMoment.get(a.momentId) ?? []), a]);

  return [...byMoment].map(([momentId, list]) => {
    const recent = list.slice(0, RECENT);
    const wrong = recent.filter((a) => !a.correct);
    const idleDays = Math.min((now.getTime() - recent[0].createdAt.getTime()) / DAY_MS, MAX_IDLE_DAYS);
    return {
      momentId,
      // Practise where it went wrong most recently, else where the student was last.
      level: (wrong[0] ?? recent[0]).level,
      weight: 1 + wrong.length + idleDays / 3,
    };
  });
}

/** Picks up to MIX_MAX_MOMENTS moments by weight and splits MIX_SIZE tasks between them. */
export function planMix(attempts: MixAttempt[], now: Date, rng: Rng): MixStep[] {
  const pool = mixCandidates(attempts, now);
  const picked: Candidate[] = [];
  while (pool.length && picked.length < MIX_MAX_MOMENTS) {
    const total = pool.reduce((s, c) => s + c.weight, 0);
    let r = rng.next() * total;
    const i = Math.max(0, pool.findIndex((c) => (r -= c.weight) < 0));
    picked.push(...pool.splice(i, 1));
  }
  if (!picked.length) return [];

  // Heavier moments first get the remainder: 10 over 4 moments is 3, 3, 2, 2.
  picked.sort((a, b) => b.weight - a.weight);
  const counts = picked.map((_, i) => Math.floor(MIX_SIZE / picked.length) + (i < MIX_SIZE % picked.length ? 1 : 0));
  return rng
    .shuffle(picked.map((c, i) => ({ c, n: counts[i] })))
    .flatMap(({ c, n }) => Array.from({ length: n }, () => ({ momentId: c.momentId, level: c.level })));
}
