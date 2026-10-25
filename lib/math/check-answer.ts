import {
  isConstantNode,
  isFunctionNode,
  isOperatorNode,
  isParenthesisNode,
  isSymbolNode,
  parse,
  type MathNode,
} from "mathjs";
import type { Answer } from "@/lib/generators/types";
import { gcd } from "@/lib/random";
import { normalizeInput, stripVariableAssignment } from "./normalize";

/**
 * - correct / wrong: recorded as an attempt.
 * - retry: we could not read the answer, or the value is right but the form is
 *   not (e.g. not simplified). Not recorded; the student just tries again.
 */
export type CheckResult =
  | { status: "correct" }
  | { status: "wrong" }
  | { status: "retry"; reason: "unreadable" | "not-simplified" };

const ALLOWED_OPERATORS = new Set(["add", "subtract", "multiply", "divide", "pow", "unaryMinus", "unaryPlus"]);
const ALLOWED_FUNCTIONS = new Set(["sqrt"]);
const ALLOWED_SYMBOLS = new Set(["pi"]);

/** Whitelist the parse tree so only plain arithmetic (plus the given variables) is ever evaluated. */
function isSafe(root: MathNode, variables: readonly string[] = []): boolean {
  let safe = true;
  root.traverse((node, path, parent) => {
    if (isConstantNode(node) || isParenthesisNode(node)) return;
    if (isOperatorNode(node) && ALLOWED_OPERATORS.has(node.fn)) return;
    if (isFunctionNode(node) && ALLOWED_FUNCTIONS.has(node.fn.name)) return;
    if (isSymbolNode(node)) {
      // The name of an (already vetted) function call.
      if (parent && isFunctionNode(parent) && path === "fn") return;
      if (ALLOWED_SYMBOLS.has(node.name) || variables.includes(node.name)) return;
    }
    safe = false;
  });
  return safe;
}

function safeParse(input: string, variables: readonly string[] = []): MathNode | null {
  if (!input || input.length > 200) return null;
  try {
    const node = parse(input);
    return isSafe(node, variables) ? node : null;
  } catch {
    return null;
  }
}

function evaluateNode(node: MathNode, scope: Record<string, number> = {}): number | null {
  try {
    const value: unknown = node.evaluate({ ...scope });
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function readNumber(input: string): { value: number; node: MathNode } | null {
  const node = safeParse(input);
  const value = node ? evaluateNode(node) : null;
  return node && value !== null ? { value, node } : null;
}

/** Reads a number the way students may type it ("3/4", "0,75", "√2"). Null if unreadable. */
export function parseNumber(raw: string): number | null {
  return readNumber(normalizeInput(raw))?.value ?? null;
}

/** Single-letter variables used in an expression, e.g. "2x + 3y" → ["x", "y"]. */
export function expressionVariables(raw: string): string[] {
  const letters = normalizeInput(raw).replace(/sqrt|pi/g, "").match(/[a-z]/g) ?? [];
  return [...new Set(letters)].sort();
}

/** True if the expression can be read with the given variables. */
export function isValidExpression(raw: string, variables: readonly string[]): boolean {
  return safeParse(splitLetters(normalizeInput(raw)), variables) !== null;
}

// Fixed sample points (not round numbers) used to compare expressions.
const SAMPLES = [1.37, -2.41, 0.53, 3.17, -0.89];

/** "5ab" means 5·a·b: split letter runs (but keep sqrt and pi). */
function splitLetters(s: string): string {
  return s.replace(/[a-z]{2,}/g, (m) => (m === "sqrt" || m === "pi" ? m : m.split("").join("*")));
}

function sameExpression(input: string, expected: string, variables: readonly string[]): boolean | null {
  const a = safeParse(splitLetters(input), variables);
  const b = safeParse(splitLetters(expected), variables);
  if (!a || !b) return null;
  return SAMPLES.every((sample, i) => {
    const scope = Object.fromEntries(variables.map((v, j) => [v, sample + j * 0.71 + i * 0.13]));
    const va = evaluateNode(a, scope);
    const vb = evaluateNode(b, scope);
    return va !== null && vb !== null && sameNumber(va, vb);
  });
}

function sameNumber(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
}

function unwrap(node: MathNode): MathNode {
  return isParenthesisNode(node) ? unwrap(node.content) : node;
}

function intConstant(node: MathNode): number | null {
  const n = unwrap(node);
  if (isConstantNode(n)) {
    return typeof n.value === "number" && Number.isInteger(n.value) ? n.value : null;
  }
  if (isOperatorNode(n) && n.fn === "unaryMinus") {
    const inner = intConstant(n.args[0]);
    return inner === null ? null : -inner;
  }
  return null;
}

/** An integer, or ±a/b with integers that share no factor and b > 1. */
function isSimplifiedFraction(node: MathNode): boolean {
  let n = unwrap(node);
  if (intConstant(n) !== null) return true;
  if (isOperatorNode(n) && n.fn === "unaryMinus") n = unwrap(n.args[0]);
  if (!isOperatorNode(n) || n.fn !== "divide") return false;
  const num = intConstant(n.args[0]);
  const den = intConstant(n.args[1]);
  if (num === null || den === null) return false;
  return Math.abs(den) > 1 && gcd(num, den) === 1;
}

export function checkAnswer(raw: string, answer: Answer): CheckResult {
  let input = normalizeInput(raw);
  if (answer.kind === "expression") {
    const same = sameExpression(input, normalizeInput(answer.expr), answer.variables);
    if (same === null) return { status: "retry", reason: "unreadable" };
    return { status: same ? "correct" : "wrong" };
  }
  if (answer.kind === "equation") input = stripVariableAssignment(input, answer.variable);

  const read = readNumber(input);
  if (!read) return { status: "retry", reason: "unreadable" };
  if (!sameNumber(read.value, answer.value)) return { status: "wrong" };

  if (answer.kind === "number" && answer.requireSimplified && !isSimplifiedFraction(read.node)) {
    return { status: "retry", reason: "not-simplified" };
  }
  return { status: "correct" };
}
