import type { TaskAnswer } from "@/lib/tasks/answers";

// Turns a pasted word list ("perdón – ursäkta, förlåt", one pair per line)
// into a reading text and auto-graded questions for a "Läs och svara" moment.
// No AI: everything is built from the list itself.

export type VocabPair = { foreign: string; swedish: string };

export type VocabQuestionKind = "toSwedish" | "toForeign" | "choice";
export const VOCAB_QUESTION_KINDS: readonly VocabQuestionKind[] = ["toSwedish", "toForeign", "choice"];

export type VocabQuestion = {
  type: "free_text" | "multiple_choice";
  prompt: string;
  answer: TaskAnswer;
  choices: string[] | null;
  solution: string;
};

// The first separator wins: en dash, em dash, " - ", "=", tab or ";".
const SEPARATOR = /\s*[–—=\t;]\s*|\s+-\s+/;
const MAX_PAIRS = 200;
const MAX_VARIANTS = 30;

/** One pair per line. Lines without a separator are returned as rejected so the admin can fix them. */
export function parseVocab(text: string): { pairs: VocabPair[]; rejected: string[] } {
  const pairs: VocabPair[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^[-*•]\s+/, "");
    if (!line) continue;
    const match = line.match(SEPARATOR);
    if (!match || match.index === undefined) {
      rejected.push(line);
      continue;
    }
    const foreign = line.slice(0, match.index).trim();
    const swedish = line.slice(match.index + match[0].length).trim();
    if (!foreign || !swedish) {
      rejected.push(line);
      continue;
    }
    const key = foreign.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({ foreign, swedish });
    if (pairs.length >= MAX_PAIRS) break;
  }
  return { pairs, rejected };
}

/** "dieciséis" → "dieciseis", "¿Cómo?" → "Como?". Used so a missing accent is not counted as wrong. */
export function stripAccents(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¿¡]/g, "");
}

/** All combinations of "a/b" words: "han/hon har" → ["han har", "hon har"]. */
function expandSlashes(s: string): string[] {
  let results = [""];
  for (const token of s.split(/(\s+)/)) {
    const options = /^\S+\/\S+$/.test(token) ? token.split("/").filter(Boolean) : [token];
    results = results.flatMap((r) => options.map((o) => r + o)).slice(0, MAX_VARIANTS);
  }
  return results;
}

/**
 * Every answer that should count as correct for a meaning such as
 * "(han/hon/den) har" or "Hur sa? Ursäkta?": the whole text, each part
 * separated by comma or question/exclamation mark, the part without the
 * bracketed words and with each of them.
 */
export function acceptedAnswers(meaning: string): string[] {
  const out = new Set<string>([meaning.trim()]);
  const parts = meaning
    .split(/[,;]|(?<=[?!])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    const withoutBrackets = part.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
    const withBrackets = part.replace(/[()]/g, "").replace(/\s+/g, " ").trim();
    for (const variant of [part, withoutBrackets, withBrackets]) {
      if (!variant) continue;
      for (const expanded of expandSlashes(variant)) out.add(expanded.trim());
    }
  }
  return [...out].filter(Boolean).slice(0, 20);
}

/** The foreign word as typed, plus a version without accents and ¿ ¡. */
function acceptedForeign(foreign: string): string[] {
  const variants = new Set<string>();
  for (const v of acceptedAnswers(foreign)) {
    variants.add(v);
    variants.add(stripAccents(v));
  }
  return [...variants].slice(0, 20);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The word list as a reading text the student goes through before the quiz. */
export function vocabReading(pairs: VocabPair[], language: string): string {
  return [`Lär dig orden på ${language} och vad de betyder.`, "", ...pairs.map((p) => `- **${p.foreign}** – ${p.swedish}`)].join(
    "\n",
  );
}

/**
 * Questions for each pair: what the word means (typed), how to say it in the
 * foreign language (typed), and what it means as multiple choice with the
 * other words' meanings as wrong options (needs at least two pairs).
 */
export function vocabQuestions(
  pairs: VocabPair[],
  language: string,
  kinds: readonly VocabQuestionKind[],
  random: () => number = Math.random,
): VocabQuestion[] {
  const questions: VocabQuestion[] = [];
  for (const pair of pairs) {
    const solution = `**${pair.foreign}** – ${pair.swedish}`;
    if (kinds.includes("toSwedish")) {
      questions.push({
        type: "free_text",
        prompt: `Vad betyder **${pair.foreign}**?`,
        answer: { kind: "text", accepted: acceptedAnswers(pair.swedish), keywords: [] },
        choices: null,
        solution,
      });
    }
    if (kinds.includes("toForeign")) {
      questions.push({
        type: "free_text",
        prompt: `Hur säger man **${pair.swedish}** på ${language}?`,
        answer: { kind: "text", accepted: acceptedForeign(pair.foreign), keywords: [] },
        choices: null,
        solution,
      });
    }
    if (kinds.includes("choice")) {
      const others = [...new Set(pairs.filter((p) => p !== pair && p.swedish !== pair.swedish).map((p) => p.swedish))];
      if (others.length === 0) continue;
      const choices = shuffle([pair.swedish, ...shuffle(others, random).slice(0, 3)], random);
      questions.push({
        type: "multiple_choice",
        prompt: `Vad betyder **${pair.foreign}**?`,
        answer: { kind: "choice", index: choices.indexOf(pair.swedish) },
        choices,
        solution,
      });
    }
  }
  return questions;
}

const LANGUAGE_SUBJECTS = new Set(["spanska", "tyska", "franska", "engelska"]);

/** Subjects where the admin can paste word lists. */
export function isLanguageSubject(slug: string): boolean {
  return LANGUAGE_SUBJECTS.has(slug);
}
