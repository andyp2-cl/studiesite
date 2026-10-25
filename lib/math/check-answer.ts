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

/** Whitelist the parse tree so only plain arithmetic is ever evaluated. */
function isSafe(root: MathNode): boolean {
  let safe = true;
  root.traverse((node, path, parent) => {
    if (isConstantNode(node) || isParenthesisNode(node)) return;
    if (isOperatorNode(node) && ALLOWED_OPERATORS.has(node.fn)) return;
    if (isFunctionNode(node) && ALLOWED_FUNCTIONS.has(node.fn.name)) return;
    if (isSymbolNode(node)) {
      // The name of an (already vetted) function call.
      if (parent && isFunctionNode(parent) && path === "fn") return;
      if (ALLOWED_SYMBOLS.has(node.name)) return;
    }
    safe = false;
  });
  return safe;
}

function readNumber(input: string): { value: number; node: MathNode } | null {
  if (!input || input.length > 100) return null;
  let node: MathNode;
  try {
    node = parse(input);
  } catch {
    return null;
  }
  if (!isSafe(node)) return null;
  try {
    const value: unknown = node.evaluate();
    return typeof value === "number" && Number.isFinite(value) ? { value, node } : null;
  } catch {
    return null;
  }
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
  if (answer.kind === "equation") input = stripVariableAssignment(input, answer.variable);

  const read = readNumber(input);
  if (!read) return { status: "retry", reason: "unreadable" };
  if (!sameNumber(read.value, answer.value)) return { status: "wrong" };

  if (answer.kind === "number" && answer.requireSimplified && !isSimplifiedFraction(read.node)) {
    return { status: "retry", reason: "not-simplified" };
  }
  return { status: "correct" };
}
