import { frac } from "@/lib/generators/format";
import { gcd, type Rng } from "@/lib/random";

// Exact fraction arithmetic for the fraction generators (no floating point).

export type Frac = { n: number; d: number };

export const F = (n: number, d: number): Frac => simplify({ n, d });

export function simplify({ n, d }: Frac): Frac {
  const g = gcd(n, d) || 1;
  const sign = d < 0 ? -1 : 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
}

export const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
export const add = (a: Frac, b: Frac) => F(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Frac, b: Frac) => F(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Frac, b: Frac) => F(a.n * b.n, a.d * b.d);
export const div = (a: Frac, b: Frac) => F(a.n * b.d, a.d * b.n);
export const value = (f: Frac) => f.n / f.d;
export const equals = (a: Frac, b: Frac) => a.n * b.d === b.n * a.d;

/** TeX: integers plainly, otherwise \frac{n}{d} (sign in front). */
export function tex(f: Frac): string {
  if (f.d === 1) return String(f.n);
  return `${f.n < 0 ? "-" : ""}${frac(Math.abs(f.n), f.d)}`;
}

/** TeX in mixed form: 2\frac{1}{3}. */
export function mixedTex(f: Frac): string {
  const s = simplify(f);
  const whole = Math.trunc(s.n / s.d);
  const rest = Math.abs(s.n % s.d);
  if (rest === 0) return String(whole);
  if (whole === 0) return tex(s);
  return `${whole}${frac(rest, s.d)}`;
}

/** Plain text for typing: "2 1/3". */
export function mixedText(f: Frac): string {
  const s = simplify(f);
  const whole = Math.trunc(s.n / s.d);
  const rest = Math.abs(s.n % s.d);
  if (rest === 0) return String(whole);
  return whole === 0 ? `${s.n}/${s.d}` : `${whole} ${rest}/${s.d}`;
}

/** A proper fraction in simplest form with denominator in [minDen, maxDen]. */
export function properFraction(rng: Rng, minDen: number, maxDen: number): Frac {
  for (;;) {
    const d = rng.int(minDen, maxDen);
    const n = rng.int(1, d - 1);
    if (gcd(n, d) === 1) return { n, d };
  }
}

/** Expanded to a given denominator, as TeX: \frac{3}{4} = \frac{9}{12}. */
export function expandTo(f: Frac, d: number): string {
  return frac(f.n * (d / f.d), d);
}

const PART_NAMES: Record<number, [string, string]> = {
  2: ["halv", "halvor"],
  3: ["tredjedel", "tredjedelar"],
  4: ["fjärdedel", "fjärdedelar"],
  5: ["femtedel", "femtedelar"],
  6: ["sjättedel", "sjättedelar"],
  7: ["sjundedel", "sjundedelar"],
  8: ["åttondel", "åttondelar"],
  9: ["niondel", "niondelar"],
  10: ["tiondel", "tiondelar"],
  12: ["tolftedel", "tolftedelar"],
};

/** Swedish name of a part: (4) → "fjärdedel", (4, true) → "fjärdedelar". */
export function partName(d: number, plural = false): string {
  const names = PART_NAMES[d];
  if (!names) return plural ? `${d}-delar` : `${d}-del`;
  return plural ? names[1] : names[0];
}
