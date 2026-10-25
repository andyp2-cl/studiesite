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
    }
  | {
      kind: "equation";
      variable: string;
      value: number;
      display: string;
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
  solutionSteps: SolutionStep[];
  figure?: Figure;
};

export type Generator = {
  key: string;
  generate(level: Level, seed: number): GeneratedTask;
};
