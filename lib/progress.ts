import type { Level } from "@/lib/generators/types";

// SPEC 4: a level is cleared with at least 8 correct of the latest 10 attempts.
export const WINDOW = 10;
export const REQUIRED_CORRECT = 8;

/** `recent` is newest first; only the latest WINDOW attempts count. */
export function levelProgress(recent: readonly boolean[]) {
  const window = recent.slice(0, WINDOW);
  const correct = window.filter(Boolean).length;
  return { correct, attempts: window.length, cleared: correct >= REQUIRED_CORRECT };
}

/** Levels up to stars + 1 are open (Lätt is always open). */
export function isLevelUnlocked(level: Level, stars: number): boolean {
  return level <= Math.min(stars + 1, 3);
}

/** Level to suggest when opening a moment. */
export function suggestedLevel(stars: number): Level {
  return Math.min(stars + 1, 3) as Level;
}
