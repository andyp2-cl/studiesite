// TeX helpers shared by generators. Numbers are shown the Swedish way
// (decimal comma, thin-space thousands separator).

/** Removes floating-point noise: 0.1 + 0.2 → 0.3. */
export function round(n: number, places = 9): number {
  return Number(n.toFixed(places));
}

export function num(n: number): string {
  const clean = round(n);
  const [int, dec] = String(Math.abs(clean)).split(".");
  const grouped = int.length >= 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, "\\,") : int;
  return `${clean < 0 ? "-" : ""}${grouped}${dec ? `{,}${dec}` : ""}`;
}

/** Plain-text number for SVG labels and hints outside math: 3,5 and 12 500. */
export function plain(n: number): string {
  const clean = round(n);
  const [int, dec] = String(Math.abs(clean)).split(".");
  const grouped = int.length >= 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : int;
  return `${clean < 0 ? "−" : ""}${grouped}${dec ? `,${dec}` : ""}`;
}

/** Negative numbers in parentheses when they follow an operator: 3 - (-2). */
export function term(n: number): string {
  return n < 0 ? `(${num(n)})` : num(n);
}

export function frac(numerator: number | string, denominator: number | string): string {
  return `\\frac{${numerator}}{${denominator}}`;
}

/** A number with a unit in TeX: 12\text{ cm}. */
export function withUnit(value: number | string, unit: string): string {
  const tex = typeof value === "number" ? num(value) : value;
  if (unit === "%") return `${tex}\\,\\%`;
  if (unit === "°") return `${tex}^\\circ`;
  const power = unit.match(/^(.*?)([²³])$/);
  if (power) return `${tex}\\text{ ${power[1]}}^${power[2] === "²" ? 2 : 3}`;
  return `${tex}\\text{ ${unit}}`;
}

/** Inline math for prompts/steps. */
export const $ = (tex: string) => `$${tex}$`;
