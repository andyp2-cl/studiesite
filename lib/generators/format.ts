// TeX helpers shared by generators. Numbers are shown the Swedish way
// (decimal comma, thin-space thousands separator).

export function num(n: number): string {
  const [int, dec] = String(Math.abs(n)).split(".");
  const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, "\\,") : int;
  return `${n < 0 ? "-" : ""}${grouped}${dec ? `{,}${dec}` : ""}`;
}

/** Negative numbers in parentheses when they follow an operator: 3 - (-2). */
export function term(n: number): string {
  return n < 0 ? `(${num(n)})` : num(n);
}

export function frac(numerator: number | string, denominator: number | string): string {
  return `\\frac{${numerator}}{${denominator}}`;
}

/** Inline math for prompts/steps. */
export const $ = (tex: string) => `$${tex}$`;
