// When a student may ask the AI for "Mer om det här": a new reading section
// with questions. It is for a student who has answered every question the
// moment has, passed or not: without it, a student who missed the pass mark
// on a short quiz would have nothing left to practise on. Capped so the
// moment and the AI bill stay small.

/** Reading sections a moment can grow to through extensions. */
export const MAX_READING_SECTIONS = 10;
/** Extensions one student can ask for per (Swedish) day, across all moments. */
export const EXTENSIONS_PER_DAY = 3;

export type ExtensionState = {
  /** Published questions this student has not answered yet. */
  unseen: number;
  readingSections: number;
  usedToday: number;
  aiAvailable: boolean;
};

export function extensionAllowed(s: ExtensionState): boolean {
  return (
    s.unseen === 0 &&
    s.readingSections > 0 &&
    s.readingSections < MAX_READING_SECTIONS &&
    s.usedToday < EXTENSIONS_PER_DAY &&
    s.aiAvailable
  );
}
