import { normalizeInput } from "./normalize";

// Lightweight preview of a typed answer as TeX ("Så här läser vi ditt svar").
// Deliberately regex-based so mathjs stays out of the browser bundle; the
// authoritative reading happens server-side in checkAnswer.

const OPERAND = String.raw`(\d+(?:\.\d+)?|[a-z]|\([^()]*\))`;

const stripParens = (s: string) => (s.startsWith("(") && s.endsWith(")") ? s.slice(1, -1) : s);

export function inputToTex(raw: string): string {
  // Mixed numbers first, before normalizeInput turns them into (2+1/3).
  const mixed = raw.replace(/(\d+)\s+([1-9]\d*)\s*\/\s*(\d+)/g, (m, w: string, n: string, d: string) =>
    Number(n) < Number(d) ? `${w}\\frac{${n}}{${d}}` : m,
  );
  let s = normalizeInput(mixed);
  s = s.replace(/sqrt\(([^()]*)\)/g, (_, inner: string) => `\\sqrt{${inner}}`);
  s = s.replace(new RegExp(`${OPERAND}\\s*\\^\\s*${OPERAND}`, "g"), (_, b: string, e: string) => `${b}^{${stripParens(e)}}`);
  s = s.replace(
    new RegExp(`${OPERAND}\\s*/\\s*${OPERAND}`, "g"),
    (_, n: string, d: string) => `\\frac{${stripParens(n)}}{${stripParens(d)}}`,
  );
  s = s.replace(/\*/g, " \\cdot ");
  s = s.replace(/pi(?![a-z])/g, "\\pi ");
  s = s.replace(/(\d)\.(\d)/g, "$1{,}$2");
  s = s.replace(/%/g, "\\%");
  return s;
}
