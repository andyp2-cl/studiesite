// Shared contract for all task generators (CLAUDE.md):
//   generate(level, seed) → { prompt, answer, solutionSteps, figure? }

export type Level = 1 | 2 | 3;

export const LEVELS: readonly Level[] = [1, 2, 3];

export function isLevel(value: unknown): value is Level {
  return value === 1 || value === 2 || value === 3;
}

/** How the student's answer is checked (lib/math/check-answer.ts). */
export type Answer =
  | {
      kind: "number";
      value: number;
      /** TeX shown as the correct answer. */
      display: string;
      /** Only a fully simplified fraction (or integer) counts as correct. */
      requireSimplified?: boolean;
      /** "mixed": answer must be written as a mixed number (2 1/3); "fraction": as a/b. */
      requireForm?: "mixed" | "fraction";
      /** Unit the student may type after the number ("cm", "%", "kr" …). */
      unit?: string;
      /** Accepted absolute difference, e.g. for answers rounded with π ≈ 3,14. */
      tolerance?: number;
    }
  | {
      kind: "equation";
      variable: string;
      value: number;
      display: string;
    }
  | {
      /** Algebraic expression; any equivalent form is correct (2(x+3) = 2x+6). */
      kind: "expression";
      expr: string;
      variables: string[];
      display: string;
      /** Must be fully simplified: no brackets, like terms collected. */
      requireSimplified?: boolean;
    };

export type SolutionStep = {
  /** Markdown, may contain inline $…$. */
  text: string;
  /** Optional formula shown on its own line. */
  tex?: string;
};

/** Simple SVG figures for geometry (step 5). */
export type Figure = { kind: "svg"; svg: string; alt: string };

export type GeneratedTask = {
  /** Markdown + KaTeX. */
  prompt: string;
  answer: Answer;
  /** A nudge in the right direction (Markdown + KaTeX) – must not give away the answer. */
  hint: string;
  solutionSteps: SolutionStep[];
  figure?: Figure;
};

export type Generator = {
  key: string;
  generate(level: Level, seed: number): GeneratedTask;
};

/** Numeric value of an answer, or null for expression answers. */
export function answerValue(answer: Answer): number | null {
  return answer.kind === "expression" ? null : answer.value;
}

