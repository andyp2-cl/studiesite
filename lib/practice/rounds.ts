import { ROUND_SIZES } from "@/lib/practice/ref";

// A new round only contains questions the student has not already been given.
// When the bank is empty, a reading text can supply another round only if it
// is long enough that the existing questions cannot have used it up.

/** Words of reading already needed per question, plus one more full round of 5. */
export const WORDS_PER_QUESTION = 75;
const EXTRA_ROUND = 5;

/** Round sizes that can be filled without repeating a question. Empty means offer nothing. */
export function offeredRounds(unseen: number, generate = false): number[] {
  if (unseen <= 0) return generate ? [...ROUND_SIZES] : [];
  const sizes = new Set<number>(ROUND_SIZES.filter((n) => n <= unseen));
  // A short remainder (3, 8, …) is its own round, so those questions are not dropped or repeated.
  if (unseen < ROUND_SIZES[ROUND_SIZES.length - 1]) sizes.add(unseen);
  return [...sizes].sort((a, b) => a - b);
}

/** Rough word count of a markdown reading text. */
export function wordCount(markdown: string): number {
  const plain = markdown
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\$[^$\n]+\$/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/[#>*_`]/g, " ");
  return plain.split(/\s+/).filter((word) => /\p{L}|\p{N}/u.test(word)).length;
}

/**
 * True when the reading is long enough for another round of questions about
 * things that matter, not leftover trivia. A normal moment (about 600–900
 * words and 8–12 questions) is already spent.
 */
export function readingCanSupportMore(words: number, existingQuestions: number): boolean {
  return words >= (existingQuestions + EXTRA_ROUND) * WORDS_PER_QUESTION;
}

/** Settings key: the reading was already asked for more questions and had nothing left. */
export function quizClosedKey(momentId: string): string {
  return `quiz_closed_${momentId}`;
}
