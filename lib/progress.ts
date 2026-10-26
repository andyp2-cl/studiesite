import type { Level } from "@/lib/generators/types";

// SPEC 4: a level is cleared with at least 8 correct of the latest 10 attempts.
export const WINDOW = 10;
export const REQUIRED_CORRECT = 8;

/** `recent` is newest first; only the latest WINDOW attempts count. */
export function levelProgress(recent: readonly boolean[], required: number = REQUIRED_CORRECT) {
  const window = recent.slice(0, WINDOW);
  const correct = window.filter(Boolean).length;
  return { correct, attempts: window.length, cleared: correct >= required };
}

/** Correct answers of the latest 10 this student needs (set per student in admin, else 8). */
export function passCorrectFor(profile: { pass_correct: number | null }): number {
  return profile.pass_correct ?? REQUIRED_CORRECT;
}

/** Level to suggest when opening a moment (all levels can be chosen freely). */
export function suggestedLevel(stars: number): Level {
  return Math.min(stars + 1, 3) as Level;
}

export type ReadMilestones = { read: boolean; quiz: boolean; writing: boolean };

/** "Läs och svara": one star each for reading, passing the quiz and an approved text. */
export function readStars(m: ReadMilestones): number {
  return Number(m.read) + Number(m.quiz) + Number(m.writing);
}
