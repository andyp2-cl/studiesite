import { $, num, round, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Kvadrater och kvadratrötter.
// Lätt: n² för n ≤ 12 och √ av kvadrattal upp till 144.
// Medel: större kvadrattal, kvadratens sida från arean.
// Svår: mellan vilka heltal ligger √n, decimaltal i kvadrat, uttryck med rötter.

function square(rng: Rng, max: number): GeneratedTask {
  const n = rng.int(2, max);
  return {
    prompt: `Räkna ut. ${$(`${n}^2`)}`,
    answer: { kind: "number", value: n * n, display: num(n * n) },
    hint: `${$(`${n}^2`)} betyder ${n} gånger ${n}.`,
    solutionSteps: [{ text: "Ett tal i kvadrat är talet gånger sig självt.", tex: `${n}^2 = ${n} \\cdot ${n} = ${n * n}` }],
  };
}

function root(rng: Rng, max: number): GeneratedTask {
  const n = rng.int(2, max);
  return {
    prompt: `Räkna ut. ${$(`\\sqrt{${n * n}}`)}`,
    answer: { kind: "number", value: n, display: num(n) },
    hint: `Vilket tal gånger sig självt blir ${n * n}?`,
    solutionSteps: [{ text: `Sök talet som gånger sig självt blir ${n * n}.`, tex: `${n} \\cdot ${n} = ${n * n} \\quad\\Rightarrow\\quad \\sqrt{${n * n}} = ${n}` }],
  };
}

function sideFromArea(rng: Rng): GeneratedTask {
  const side = rng.int(3, 15);
  const area = side * side;
  return {
    prompt: `En kvadrat har arean ${$(withUnit(area, "cm²"))}. Hur lång är en sida?`,
    answer: { kind: "number", value: side, display: withUnit(side, "cm"), unit: "cm" },
    hint: "Arean av en kvadrat är sidan gånger sidan. Vilket tal gånger sig självt blir arean?",
    solutionSteps: [
      { text: "Arean = sida · sida, så sidan är kvadratroten ur arean.", tex: `s = \\sqrt{${area}}` },
      { text: "Räkna ut.", tex: `\\sqrt{${area}} = ${side} \\quad (${side} \\cdot ${side} = ${area})` },
    ],
  };
}

function between(rng: Rng): GeneratedTask {
  let n: number;
  do n = rng.int(5, 150);
  while (Number.isInteger(Math.sqrt(n)));
  const lo = Math.floor(Math.sqrt(n));
  return {
    prompt: `${$(`\\sqrt{${n}}`)} ligger mellan två heltal som följer efter varandra. Vilket är det **mindre** av dem?`,
    answer: { kind: "number", value: lo, display: num(lo) },
    hint: `Vilka kvadrattal ligger närmast ${n}? Prova ${lo - 1}², ${lo}², ${lo + 1}² …`,
    solutionSteps: [
      { text: "Hitta kvadrattalen runt talet.", tex: `${lo}^2 = ${lo * lo} < ${n} < ${(lo + 1) ** 2} = ${lo + 1}^2` },
      { text: `Alltså ligger ${$(`\\sqrt{${n}}`)} mellan ${lo} och ${lo + 1}.`, tex: `${lo} < \\sqrt{${n}} < ${lo + 1}` },
    ],
  };
}

function decimalSquare(rng: Rng): GeneratedTask {
  const tenths = rng.int(2, 15);
  const x = tenths / 10;
  const value = round(x * x);
  return {
    prompt: `Räkna ut. ${$(`${num(x)}^2`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Räkna ${tenths} · ${tenths} och tänk på antalet decimaler: en decimal gånger en decimal ger två.`,
    solutionSteps: [
      { text: "Som heltal:", tex: `${tenths} \\cdot ${tenths} = ${tenths * tenths}` },
      { text: "Två decimaler:", tex: `${num(x)}^2 = ${num(value)}` },
    ],
  };
}

function rootExpression(rng: Rng): GeneratedTask {
  const a = rng.int(2, 10);
  const b = rng.int(2, 6);
  const value = a + b * b;
  return {
    prompt: `Räkna ut. ${$(`\\sqrt{${a * a}} + ${b}^2`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: "Räkna ut roten och kvadraten var för sig först, addera sedan.",
    solutionSteps: [
      { text: "Roten och kvadraten:", tex: `\\sqrt{${a * a}} = ${a} \\qquad ${b}^2 = ${b * b}` },
      { text: "Addera.", tex: `${a} + ${b * b} = ${value}` },
    ],
  };
}

export const generator: Generator = {
  key: "powers/squares-roots",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => square(rng, 12), () => root(rng, 12)])();
      case 2:
        return rng.pick([() => square(rng, 20), () => root(rng, 20), () => sideFromArea(rng)])();
      case 3:
        return rng.pick([() => between(rng), () => decimalSquare(rng), () => rootExpression(rng)])();
    }
  },
};
