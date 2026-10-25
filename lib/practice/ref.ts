export type TaskRef = { kind: "generator"; seed: number } | { kind: "task"; taskId: string };

/** Stable key for a task reference, used to avoid repeats within a round. */
export function refKey(ref: TaskRef): string {
  return ref.kind === "generator" ? `g${ref.seed}` : `t${ref.taskId}`;
}

/** Round sizes a student can choose. */
export const ROUND_SIZES = [5, 10] as const;

