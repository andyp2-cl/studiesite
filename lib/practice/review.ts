// Review rounds ("Repetera"): questions the student has already answered,
// once the new ones have run out. The ones they got wrong come first.

/**
 * Picks the next review question. `lastCorrect` maps a task to whether the
 * student's latest answer to it was correct; tasks never answered count as
 * missed. `rand` is in [0, 1).
 */
export function pickReviewTask<T extends { id: string }>(
  tasks: readonly T[],
  lastCorrect: ReadonlyMap<string, boolean>,
  seen: ReadonlySet<string>,
  rand: number,
): T | null {
  const pool = tasks.filter((t) => !seen.has(t.id));
  if (pool.length === 0) return null;
  const missed = pool.filter((t) => lastCorrect.get(t.id) !== true);
  const from = missed.length ? missed : pool;
  return from[Math.min(from.length - 1, Math.floor(rand * from.length))];
}

/** Latest result per task, from attempts ordered newest first. */
export function latestResults(attempts: readonly { task_id: string | null; correct: boolean }[]): Map<string, boolean> {
  const latest = new Map<string, boolean>();
  for (const a of attempts) if (a.task_id && !latest.has(a.task_id)) latest.set(a.task_id, a.correct);
  return latest;
}
