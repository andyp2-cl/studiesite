// Turns what a student types (Swedish conventions, symbol-row characters)
// into plain math syntax that mathjs and the TeX preview understand.

export function normalizeInput(raw: string): string {
  let s = raw.trim();
  s = s.replace(/[−–—]/g, "-");
  s = s.replace(/[·×⋅]/g, "*");
  s = s.replace(/[÷:]/g, "/");
  s = s.replace(/π/g, "pi");
  // √9, √2.5 and √(…) → sqrt(…)
  s = s.replace(/√\s*(\d+(?:[.,]\d+)?)/g, "sqrt($1)");
  s = s.replace(/√\s*\(/g, "sqrt(");
  // Thousands separators: "1 000" → "1000" (only spaces between digit groups of 3).
  s = s.replace(/(\d)\s+(?=\d{3}\b)/g, "$1");
  // Decimal comma: "0,75" → "0.75".
  s = s.replace(/(\d),(\d)/g, "$1.$2");
  return s;
}

/**
 * For equations: "x = 4", "x=4" and "4 = x" all mean 4. Returns the side that
 * is not the bare variable, or the input unchanged if there is no "=".
 */
export function stripVariableAssignment(input: string, variable: string): string {
  const parts = input.split("=");
  if (parts.length !== 2) return input;
  const [left, right] = parts.map((p) => p.trim());
  if (left.toLowerCase() === variable.toLowerCase()) return right;
  if (right.toLowerCase() === variable.toLowerCase()) return left;
  return input;
}
