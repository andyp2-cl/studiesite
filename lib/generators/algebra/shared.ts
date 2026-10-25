// Linear expressions like 7x - 3 or 3a + 2b, written nicely (x not 1x, - 3 not + -3).

export type Term = { coef: number; v: string };

/** Terms in order; v "" is the constant. Zero terms are skipped. Returns both TeX and plain text. */
export function linear(terms: Term[]): { tex: string; text: string } {
  const parts: string[] = [];
  for (const { coef, v } of terms) {
    if (coef === 0) continue;
    const abs = Math.abs(coef);
    const body = v === "" ? String(abs) : `${abs === 1 ? "" : abs}${v}`;
    if (parts.length === 0) parts.push(coef < 0 ? `-${body}` : body);
    else parts.push(coef < 0 ? `- ${body}` : `+ ${body}`);
  }
  const text = parts.length ? parts.join(" ") : "0";
  return { tex: text, text };
}

/** "3x" / "-x" / "x" for a single term. */
export function coefTex(coef: number, v: string): string {
  return linear([{ coef, v }]).tex;
}

/** "+ 5" / "- 5" for a constant following a term. */
export function signed(n: number): string {
  return n < 0 ? `- ${-n}` : `+ ${n}`;
}
