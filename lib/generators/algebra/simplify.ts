import { $ } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";
import { linear, type Term } from "./shared";

// Förenkla uttryck. The answer must be fully simplified (checked by form).
// Lätt: slå ihop termer av samma sort.
// Medel: termer och tal blandat, två variabler.
// Svår: multiplicera in i parentes, minus framför parentes.

const nz = (rng: Rng, min: number, max: number) => {
  for (;;) {
    const n = rng.int(min, max);
    if (n !== 0) return n;
  }
};

function answer(result: Term[], variables: string[]) {
  const { tex, text } = linear(result);
  return { kind: "expression" as const, expr: text, variables, display: tex, requireSimplified: true };
}

/** Joins terms as written in the task (no simplification). */
function written(terms: Term[]): string {
  return linear(terms).tex;
}

function likeTerms(rng: Rng): GeneratedTask {
  const v = rng.pick(["x", "a", "y"]);
  const coefs = [rng.int(2, 9), nz(rng, -6, 8), ...(rng.chance(0.5) ? [nz(rng, -4, 5)] : [])];
  const sum = coefs.reduce((s, c) => s + c, 0);
  if (sum === 0) return likeTerms(rng);
  const terms = coefs.map((coef) => ({ coef, v }));
  return {
    prompt: `Förenkla. ${$(written(terms))}`,
    answer: answer([{ coef: sum, v }], [v]),
    hint: `Alla termer är ${v}-termer. Räkna ihop hur många ${v} det blir (${v} betyder 1${v}).`,
    solutionSteps: [{ text: `Slå ihop ${v}-termerna.`, tex: `${written(terms)} = ${linear([{ coef: sum, v }]).tex}` }],
  };
}

function termsAndNumbers(rng: Rng): GeneratedTask {
  const a = rng.int(2, 8);
  const b = nz(rng, -9, 9);
  const c = nz(rng, -6, 7);
  const d = nz(rng, -9, 9);
  if (a + c === 0) return termsAndNumbers(rng);
  const terms: Term[] = [
    { coef: a, v: "x" },
    { coef: b, v: "" },
    { coef: c, v: "x" },
    { coef: d, v: "" },
  ];
  const result: Term[] = [
    { coef: a + c, v: "x" },
    { coef: b + d, v: "" },
  ];
  return {
    prompt: `Förenkla. ${$(written(terms))}`,
    answer: answer(result, ["x"]),
    hint: "Samla x-termerna för sig och talen för sig. Tecknet framför hör till termen.",
    solutionSteps: [
      { text: "Sortera: x-termer och tal.", tex: linear([terms[0], terms[2], terms[1], terms[3]]).tex },
      { text: "Slå ihop.", tex: linear(result).tex },
    ],
  };
}

function twoVariables(rng: Rng): GeneratedTask {
  const a1 = rng.int(1, 6);
  const b1 = rng.int(1, 6);
  const a2 = nz(rng, -4, 5);
  const b2 = nz(rng, -4, 5);
  if (a1 + a2 === 0 || b1 + b2 === 0) return twoVariables(rng);
  const terms: Term[] = [
    { coef: a1, v: "a" },
    { coef: b1, v: "b" },
    { coef: a2, v: "a" },
    { coef: b2, v: "b" },
  ];
  const result: Term[] = [
    { coef: a1 + a2, v: "a" },
    { coef: b1 + b2, v: "b" },
  ];
  return {
    prompt: `Förenkla. ${$(written(terms))}`,
    answer: answer(result, ["a", "b"]),
    hint: "a-termer kan bara slås ihop med a-termer, och b-termer med b-termer – som äpplen och päron.",
    solutionSteps: [
      { text: "a-termerna:", tex: `${linear([terms[0], terms[2]]).tex} = ${linear([result[0]]).tex}` },
      { text: "b-termerna:", tex: `${linear([terms[1], terms[3]]).tex} = ${linear([result[1]]).tex}` },
      { text: "Tillsammans:", tex: linear(result).tex },
    ],
  };
}

function expandBrackets(rng: Rng): GeneratedTask {
  const k = rng.int(2, 5);
  const inner = nz(rng, -7, 7);
  const extra = nz(rng, -5, 6);
  if (k + extra === 0) return expandBrackets(rng);
  const result: Term[] = [
    { coef: k + extra, v: "x" },
    { coef: k * inner, v: "" },
  ];
  const task = `${k}(${linear([{ coef: 1, v: "x" }, { coef: inner, v: "" }]).tex}) ${extra < 0 ? "-" : "+"} ${linear([{ coef: Math.abs(extra), v: "x" }]).tex}`;
  return {
    prompt: `Förenkla. ${$(task)}`,
    answer: answer(result, ["x"]),
    hint: `Multiplicera in ${k} i parentesen: båda termerna inuti ska multipliceras med ${k}.`,
    solutionSteps: [
      { text: `Multiplicera in ${k}.`, tex: `${k}(${linear([{ coef: 1, v: "x" }, { coef: inner, v: "" }]).tex}) = ${linear([{ coef: k, v: "x" }, { coef: k * inner, v: "" }]).tex}` },
      { text: "Slå ihop x-termerna.", tex: `${linear([{ coef: k, v: "x" }, { coef: k * inner, v: "" }, { coef: extra, v: "x" }]).tex} = ${linear(result).tex}` },
    ],
  };
}

function minusBracket(rng: Rng): GeneratedTask {
  const a = rng.int(4, 9);
  const b = rng.int(1, a - 1);
  const c = nz(rng, -8, 8);
  const result: Term[] = [
    { coef: a - b, v: "x" },
    { coef: -c, v: "" },
  ];
  const inner = linear([{ coef: b, v: "x" }, { coef: c, v: "" }]).tex;
  return {
    prompt: `Förenkla. ${$(`${a}x - (${inner})`)}`,
    answer: answer(result, ["x"]),
    hint: "Ett minustecken framför en parentes byter tecken på **alla** termer inuti när parentesen tas bort.",
    solutionSteps: [
      { text: "Ta bort parentesen – byt tecken inuti.", tex: `${a}x - (${inner}) = ${linear([{ coef: a, v: "x" }, { coef: -b, v: "x" }, { coef: -c, v: "" }]).tex}` },
      { text: "Slå ihop x-termerna.", tex: linear(result).tex },
    ],
  };
}

export const generator: Generator = {
  key: "algebra/simplify",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return likeTerms(rng);
      case 2:
        return rng.pick([() => termsAndNumbers(rng), () => twoVariables(rng)])();
      case 3:
        return rng.pick([() => expandBrackets(rng), () => minusBracket(rng)])();
    }
  },
};
