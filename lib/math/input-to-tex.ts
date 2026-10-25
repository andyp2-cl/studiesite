import { normalizeInput } from "./normalize";

// Lightweight preview of a typed answer as TeX ("Så här läser vi ditt svar").
// Deliberately regex-based so mathjs stays out of the browser bundle; the
// authoritative reading happens server-side in checkAnswer.

const OPERAND = String.raw`(\d+(?:\.\d+)?|[a-z]|\([^()]*\))`;

const stripParens = (s: string) => (s.startsWith("(") && s.endsWith(")") ? s.slice(1, -1) : s);

export function inputToTex(raw: string): string {
  let s = normalizeInput(raw);
  s = s.replace(/sqrt\(([^()]*)\)/g, (_, inner: string) => `\\sqrt{${inner}}`);
  s = s.replace(new RegExp(`${OPERAND}\\s*\\^\\s*${OPERAND}`, "g"), (_, b: string, e: string) => `${b}^{${stripParens(e)}}`);
  s = s.replace(
    new RegExp(`${OPERAND}\\s*/\\s*${OPERAND}`, "g"),
    (_, n: string, d: string) => `\\frac{${stripParens(n)}}{${stripParens(d)}}`,
  );
  s = s.replace(/\*/g, " \\cdot ");
  s = s.replace(/pi(?![a-z])/g, "\\pi ");
  s = s.replace(/(\d)\.(\d)/g, "$1{,}$2");
  return s;
}
