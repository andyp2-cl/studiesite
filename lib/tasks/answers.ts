import type { Answer } from "@/lib/generators/types";
import { checkAnswer, expressionVariables, isValidExpression, parseNumber, type CheckResult } from "@/lib/math/check-answer";
import { inputToTex } from "@/lib/math/input-to-tex";
import { normalizeInput } from "@/lib/math/normalize";

// Answer keys for admin-written tasks (tasks.answer jsonb). Numeric and
// expression answers reuse the generator Answer type, so they are checked
// exactly like generated tasks.

export const TASK_TYPES = ["numeric", "expression", "multiple_choice", "true_false", "free_text"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export type TaskAnswer =
  | (Answer & { source: string })
  | { kind: "choice"; index: number }
  | { kind: "boolean"; value: boolean }
  | { kind: "text"; accepted: string[]; keywords: string[] };

/** What the admin types in the editor, per task type. */
export type AnswerDraft = {
  value?: string;
  requireSimplified?: boolean;
  choices?: string[];
  correctIndex?: number;
  correctBoolean?: boolean;
  accepted?: string[];
  keywords?: string[];
};

const MAX_CHOICES = 6;

/** Validates the admin's draft and turns it into a stored answer key. Null if invalid. */
export function buildAnswer(type: TaskType, draft: AnswerDraft): { answer: TaskAnswer; choices: string[] | null } | null {
  switch (type) {
    case "numeric": {
      const source = String(draft.value ?? "").trim();
      const value = parseNumber(source);
      if (value === null) return null;
      return {
        answer: { kind: "number", value, display: inputToTex(source), requireSimplified: Boolean(draft.requireSimplified), source },
        choices: null,
      };
    }
    case "expression": {
      const source = String(draft.value ?? "").trim();
      // "x = 4" is an equation with a numeric solution.
      const equation = normalizeInput(source).match(/^([a-z])\s*=\s*(.+)$/);
      if (equation) {
        const value = parseNumber(equation[2]);
        if (value === null) return null;
        return {
          answer: { kind: "equation", variable: equation[1], value, display: inputToTex(source), source },
          choices: null,
        };
      }
      const variables = expressionVariables(source);
      if (!source || !isValidExpression(source, variables)) return null;
      return {
        answer: { kind: "expression", expr: source, variables, display: inputToTex(source), source },
        choices: null,
      };
    }
    case "multiple_choice": {
      const choices = (draft.choices ?? []).map((c) => String(c).trim()).filter(Boolean).slice(0, MAX_CHOICES);
      const index = Number(draft.correctIndex);
      if (choices.length < 2 || !Number.isInteger(index) || index < 0 || index >= choices.length) return null;
      return { answer: { kind: "choice", index }, choices };
    }
    case "true_false":
      if (typeof draft.correctBoolean !== "boolean") return null;
      return { answer: { kind: "boolean", value: draft.correctBoolean }, choices: null };
    case "free_text": {
      const clean = (list?: string[]) => (list ?? []).map((s) => String(s).trim()).filter(Boolean).slice(0, 20);
      const accepted = clean(draft.accepted);
      const keywords = clean(draft.keywords);
      if (accepted.length === 0 && keywords.length === 0) return null;
      return { answer: { kind: "text", accepted, keywords }, choices: null };
    }
  }
}

/** Lower-case, no punctuation, single spaces – for comparing free text. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:"'()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks a student's input. Choice tasks send the chosen index ("0", "1" …),
 * true/false tasks send "true" or "false".
 */
export function checkTaskAnswer(answer: TaskAnswer, input: string): CheckResult {
  switch (answer.kind) {
    case "choice": {
      const index = Number(input);
      if (input === "" || !Number.isInteger(index)) return { status: "retry", reason: "unreadable" };
      return { status: index === answer.index ? "correct" : "wrong" };
    }
    case "boolean":
      if (input !== "true" && input !== "false") return { status: "retry", reason: "unreadable" };
      return { status: (input === "true") === answer.value ? "correct" : "wrong" };
    case "text": {
      const given = normalizeText(input);
      if (!given) return { status: "retry", reason: "unreadable" };
      // Exact match with an accepted answer, or all keywords present.
      if (answer.accepted.some((a) => normalizeText(a) === given)) return { status: "correct" };
      const words = answer.keywords.map(normalizeText);
      if (words.length > 0 && words.every((w) => given.includes(w))) return { status: "correct" };
      return { status: "wrong" };
    }
    default:
      return checkAnswer(input, answer);
  }
}

/** The correct answer as shown to the student after answering. */
export function correctAnswerDisplay(answer: TaskAnswer, choices: string[] | null): { tex?: string; text?: string } {
  switch (answer.kind) {
    case "choice":
      return { text: choices?.[answer.index] ?? "" };
    case "boolean":
      return { text: answer.value ? "Sant" : "Falskt" };
    case "text":
      return { text: answer.accepted[0] ?? answer.keywords.join(", ") };
    default:
      return { tex: answer.display };
  }
}
