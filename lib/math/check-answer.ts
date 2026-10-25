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

export type RetryReason = "unreadable" | "not-simplified" | "not-mixed" | "not-fraction" | "not-simplified-expression";

/**
 * - correct / wrong: recorded as an attempt.
 * - retry: we could not read the answer, or the value is right but the form is
 *   not (e.g. not simplified). Not recorded; the student just tries again.
 */
export type CheckResult = { status: "correct" } | { status: "wrong" } | { status: "retry"; reason: RetryReason };

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

/** "25 %" → "(25/100)" so percentages can be typed for any number answer. */
function percentToNumber(s: string): string {
  return s.replace(/(\d+(?:\.\d+)?)\s*%/g, "($1/100)");
}

/** Reads a number the way students may type it ("3/4", "0,75", "√2", "2 1/3", "25 %"). */
export function parseNumber(raw: string): number | null {
  return readNumber(percentToNumber(normalizeInput(raw)))?.value ?? null;
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

function sameExpression(a: MathNode, b: MathNode, variables: readonly string[]): boolean {
  return SAMPLES.every((sample, i) => {
    const scope = Object.fromEntries(variables.map((v, j) => [v, sample + j * 0.71 + i * 0.13]));
    const va = evaluateNode(a, scope);
    const vb = evaluateNode(b, scope);
    return va !== null && vb !== null && sameNumber(va, vb);
  });
}

function sameNumber(a: number, b: number, tolerance = 0): boolean {
  return Math.abs(a - b) <= Math.max(tolerance, 1e-9 * Math.max(1, Math.abs(b)));
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

/** ±a/b with integers (any a, b ≠ 0), or an integer. Returns [a, b]. */
function asFraction(node: MathNode): [number, number] | null {
  let n = unwrap(node);
  const whole = intConstant(n);
  if (whole !== null) return [whole, 1];
  let sign = 1;
  if (isOperatorNode(n) && n.fn === "unaryMinus") {
    n = unwrap(n.args[0]);
    sign = -1;
  }
  if (!isOperatorNode(n) || n.fn !== "divide") return null;
  const num = intConstant(n.args[0]);
  const den = intConstant(n.args[1]);
  if (num === null || den === null || den === 0) return null;
  return [sign * num, den];
}

/** An integer, or ±a/b with integers that share no factor and b > 1. */
function isSimplifiedFraction(node: MathNode): boolean {
  const f = asFraction(node);
  if (!f) return false;
  return f[1] === 1 || (Math.abs(f[1]) > 1 && gcd(f[0], f[1]) === 1);
}

/** "2 1/3" (whole part and a proper fraction in simplest form), or a whole number. */
function isMixedNumber(raw: string): boolean {
  const s = raw.trim().replace(/[−–]/g, "-");
  if (/^-?\d+$/.test(s)) return true;
  const m = s.match(/^-?\d+\s+(\d+)\s*\/\s*(\d+)$/);
  return Boolean(m && Number(m[1]) < Number(m[2]) && gcd(Number(m[1]), Number(m[2])) === 1);
}

/** Terms of a sum: a + b - c → [a, b, -c]. */
function sumTerms(node: MathNode): MathNode[] {
  const n = unwrap(node);
  if (isOperatorNode(n) && (n.fn === "add" || n.fn === "subtract")) return [...sumTerms(n.args[0]), ...sumTerms(n.args[1])];
  if (isOperatorNode(n) && n.fn === "unaryMinus") return sumTerms(n.args[0]);
  return [n];
}

/** Collected like terms and no brackets left: "7x - 3" yes, "3x + 4x" or "2(x + 3)" no. */
function isSimplifiedExpression(node: MathNode): boolean {
  const signatures = new Set<string>();
  for (const term of sumTerms(node)) {
    let hasInnerSum = false;
    const letters: string[] = [];
    term.traverse((n) => {
      if (isOperatorNode(n) && (n.fn === "add" || n.fn === "subtract")) hasInnerSum = true;
      if (isSymbolNode(n) && n.name !== "pi") letters.push(n.name);
    });
    if (hasInnerSum) return false;
    const signature = letters.sort().join("·");
    if (signatures.has(signature)) return false;
    signatures.add(signature);
  }
  return true;
}

// Other ways students write the same unit.
const UNIT_ALIASES: Record<string, string[]> = {
  "°C": ["° C", "°", "grader", "grad", "C"],
  "°": ["grader", "grad"],
  kr: ["kronor", ":-"],
  st: ["stycken"],
  "%": ["procent"],
};

/** Removes a typed unit: "12 cm" → "12", "40 cm2" → "40" (unit "cm²"), "13 grader" → "13" (unit "°C"). */
function stripUnit(raw: string, unit: string): string {
  const variants = [
    unit,
    unit.replace("²", "2"),
    unit.replace("²", "^2"),
    unit.replace("³", "3"),
    unit.replace("³", "^3"),
    ...(UNIT_ALIASES[unit] ?? []),
  ].sort((a, b) => b.length - a.length);
  const escaped = [...new Set(variants)].map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const stripped = raw.replace(new RegExp(`\\s*(?:${escaped.join("|")})\\s*$`, "i"), "");
  // Fallback: a number followed by any word ("5 bussar", "12 kronor").
  return stripped.replace(/(\d)\s*[a-zåäö]+\.?\s*$/i, "$1");
}

export function checkAnswer(raw: string, answer: Answer): CheckResult {
  if (answer.kind === "expression") {
    const input = safeParse(splitLetters(normalizeInput(raw)), answer.variables);
    const expected = safeParse(splitLetters(normalizeInput(answer.expr)), answer.variables);
    if (!input || !expected) return { status: "retry", reason: "unreadable" };
    if (!sameExpression(input, expected, answer.variables)) return { status: "wrong" };
    if (answer.requireSimplified && !isSimplifiedExpression(input)) {
      return { status: "retry", reason: "not-simplified-expression" };
    }
    return { status: "correct" };
  }

  const typed = answer.kind === "number" && answer.unit ? stripUnit(raw, answer.unit) : raw;
  let input = normalizeInput(typed);
  if (answer.kind === "equation") input = stripVariableAssignment(input, answer.variable);
  if (!(answer.kind === "number" && answer.unit === "%")) input = percentToNumber(input);

  const read = readNumber(input);
  if (!read) return { status: "retry", reason: "unreadable" };
  const tolerance = answer.kind === "number" ? (answer.tolerance ?? 0) : 0;
  if (!sameNumber(read.value, answer.value, tolerance)) return { status: "wrong" };

  if (answer.kind === "number") {
    if (answer.requireForm === "mixed" && !isMixedNumber(typed)) return { status: "retry", reason: "not-mixed" };
    if (answer.requireForm === "fraction" && !asFraction(read.node)) return { status: "retry", reason: "not-fraction" };
    if (answer.requireSimplified && !isSimplifiedFraction(read.node)) return { status: "retry", reason: "not-simplified" };
  }
  return { status: "correct" };
}
