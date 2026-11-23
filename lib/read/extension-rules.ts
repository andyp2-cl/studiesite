// When a student may ask the AI for "Mer om det här": a new reading section
// with questions. It is only for a student who has finished everything the
// moment offers, and it is capped so the moment and the AI bill stay small.

/** Reading sections a moment can grow to through extensions. */
export const MAX_READING_SECTIONS = 10;
/** Extensions one student can ask for per (Swedish) day, across all moments. */
export const EXTENSIONS_PER_DAY = 3;

export type ExtensionState = {
  quizPassed: boolean;
  /** Published questions this student has not answered yet. */
  unseen: number;
  readingSections: number;
  usedToday: number;
  aiAvailable: boolean;
};

export function extensionAllowed(s: ExtensionState): boolean {
  return (
    s.quizPassed &&
    s.unseen === 0 &&
    s.readingSections > 0 &&
    s.readingSections < MAX_READING_SECTIONS &&
    s.usedToday < EXTENSIONS_PER_DAY &&
    s.aiAvailable
  );
}
