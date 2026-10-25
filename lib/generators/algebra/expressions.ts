import { $, num, term } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";
import { linear, signed } from "./shared";

// Skriva och tolka uttryck.
// Lätt: beräkna ett uttryck för ett givet x, skriva enkla uttryck från ord.
// Medel: två variabler eller negativt x, uttryck från vardagssituationer.
// Svår: uttryck med kvadrat, omkrets som uttryck, "tänk på ett tal".

function evaluate(rng: Rng): GeneratedTask {
  const a = rng.int(2, 9);
  const b = rng.int(1, 15);
  const x = rng.int(2, 10);
  const value = a * x + b;
  return {
    prompt: `Beräkna värdet av ${$(`${a}x + ${b}`)} när ${$(`x = ${x}`)}.`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Byt ut $x$ mot ${x}. Kom ihåg att ${a}x betyder ${a} · x.`,
    solutionSteps: [
      { text: `Sätt in ${$(`x = ${x}`)}.`, tex: `${a} \\cdot ${x} + ${b}` },
      { text: "Multiplikation först.", tex: `${a * x} + ${b} = ${value}` },
    ],
  };
}

const PHRASES: { words: (n: number) => string; expr: (n: number) => string; tex: (n: number) => string }[] = [
  { words: (n) => `${n} mer än x`, expr: (n) => `x + ${n}`, tex: (n) => `x + ${n}` },
  { words: (n) => `${n} mindre än x`, expr: (n) => `x - ${n}`, tex: (n) => `x - ${n}` },
  { words: (n) => `${n} gånger så mycket som x`, expr: (n) => `${n}x`, tex: (n) => `${n}x` },
  { words: (n) => `x delat med ${n}`, expr: (n) => `x / ${n}`, tex: (n) => `\\frac{x}{${n}}` },
  { words: (n) => `dubbelt så mycket som x, plus ${n}`, expr: (n) => `2x + ${n}`, tex: (n) => `2x + ${n}` },
];

function fromWords(rng: Rng): GeneratedTask {
  const phrase = rng.pick(PHRASES);
  const n = rng.int(2, 9);
  return {
    prompt: `Skriv ett uttryck för: **${phrase.words(n)}**.`,
    answer: { kind: "expression", expr: phrase.expr(n), variables: ["x"], display: phrase.tex(n) },
    hint: "”Mer än” är plus, ”mindre än” är minus, ”gånger så mycket” är multiplikation. Skriv till exempel x + 3.",
    solutionSteps: [{ text: `Översätt orden till matematik.`, tex: phrase.tex(n) }],
  };
}

function twoVariables(rng: Rng): GeneratedTask {
  const a = rng.int(2, 6);
  const b = rng.int(1, 5);
  const av = rng.int(2, 8);
  const bv = rng.int(-6, -1);
  const value = a * av + b * bv;
  return {
    prompt: `Beräkna värdet av ${$(`${a}a + ${b === 1 ? "" : b}b`)} när ${$(`a = ${av}`)} och ${$(`b = ${bv}`)}.`,
    answer: { kind: "number", value, display: num(value) },
    hint: "Sätt in talen på rätt plats. Ett negativt tal sätts inom parentes.",
    solutionSteps: [
      { text: "Sätt in värdena.", tex: `${a} \\cdot ${av} + ${b} \\cdot ${term(bv)}` },
      { text: "Räkna ut.", tex: `${a * av} ${signed(b * bv)} = ${num(value)}` },
    ],
  };
}

const SHOP = [
  { a: "ett äpple", aPl: "äpplen", b: "en banan", bPl: "bananer" },
  { a: "en penna", aPl: "pennor", b: "ett sudd", bPl: "sudd" },
  { a: "en glass", aPl: "glassar", b: "en dricka", bPl: "drickor" },
];

function shopExpression(rng: Rng): GeneratedTask {
  const s = rng.pick(SHOP);
  const m = rng.int(2, 6);
  const k = rng.int(2, 5);
  const expr = linear([
    { coef: m, v: "a" },
    { coef: k, v: "b" },
  ]);
  return {
    prompt: `${s.a[0].toUpperCase()}${s.a.slice(1)} kostar $a$ kr och ${s.b} kostar $b$ kr. Skriv ett uttryck för vad **${m} ${s.aPl} och ${k} ${s.bPl}** kostar.`,
    answer: { kind: "expression", expr: expr.text, variables: ["a", "b"], display: expr.tex },
    hint: `${m} ${s.aPl} kostar ${m} gånger så mycket som ett. Skriv det som ${m}a.`,
    solutionSteps: [
      { text: `${m} ${s.aPl} kostar ${$(`${m}a`)} och ${k} ${s.bPl} kostar ${$(`${k}b`)}.` },
      { text: "Tillsammans:", tex: expr.tex },
    ],
  };
}

function squareExpression(rng: Rng): GeneratedTask {
  const x = rng.int(-5, -1);
  const b = rng.int(1, 5);
  const value = x * x - b * x;
  return {
    prompt: `Beräkna värdet av ${$(`x^2 - ${b === 1 ? "" : b}x`)} när ${$(`x = ${x}`)}.`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Sätt in ${x} inom parentes: (${x})². Minus gånger minus blir plus.`,
    solutionSteps: [
      { text: "Sätt in värdet med parentes.", tex: `(${x})^2 - ${b} \\cdot (${x})` },
      { text: "Potensen och multiplikationen först.", tex: `${x * x} - (${b * x}) = ${x * x} + ${-b * x} = ${value}` },
    ],
  };
}

function perimeterExpression(rng: Rng): GeneratedTask {
  const extra = rng.int(2, 9);
  const expr = linear([
    { coef: 4, v: "x" },
    { coef: 2 * extra, v: "" },
  ]);
  return {
    prompt: `En rektangel har sidorna ${$("x")} cm och ${$(`x + ${extra}`)} cm. Skriv ett uttryck för rektangelns **omkrets**. Förenkla så långt det går.`,
    answer: { kind: "expression", expr: expr.text, variables: ["x"], display: expr.tex, requireSimplified: true },
    hint: "Omkretsen är alla fyra sidor tillsammans: två sidor är x och två är x + " + extra + ".",
    solutionSteps: [
      { text: "Lägg ihop alla fyra sidor.", tex: `x + x + (x + ${extra}) + (x + ${extra})` },
      { text: "Slå ihop x-termerna och talen.", tex: expr.tex },
    ],
  };
}

function thinkOfNumber(rng: Rng): GeneratedTask {
  const k = rng.int(2, 5);
  const m = rng.int(1, 9);
  const minus = rng.chance(0.5);
  const expr = linear([
    { coef: k, v: "x" },
    { coef: minus ? -m : m, v: "" },
  ]);
  const times = ["", "", "dubbla", "tredubbla", "fyrdubbla", "femdubbla"][k];
  return {
    prompt: `Tänk på ett tal ${$("x")}. **${times[0].toUpperCase()}${times.slice(1)}** talet och ${minus ? `dra sedan bort ${m}` : `lägg sedan till ${m}`}. Skriv ett uttryck för resultatet.`,
    answer: { kind: "expression", expr: expr.text, variables: ["x"], display: expr.tex },
    hint: `Att ${times} ett tal betyder att multiplicera det med ${k}.`,
    solutionSteps: [
      { text: `${times[0].toUpperCase()}${times.slice(1)}:`, tex: `${k}x` },
      { text: minus ? `Dra bort ${m}:` : `Lägg till ${m}:`, tex: expr.tex },
    ],
  };
}

export const generator: Generator = {
  key: "algebra/expressions",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => evaluate(rng), () => fromWords(rng)])();
      case 2:
        return rng.pick([() => twoVariables(rng), () => shopExpression(rng)])();
      case 3:
        return rng.pick([() => squareExpression(rng), () => perimeterExpression(rng), () => thinkOfNumber(rng)])();
    }
  },
};
