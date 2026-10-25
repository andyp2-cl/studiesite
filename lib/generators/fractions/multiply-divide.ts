import { $, frac, num } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";
import { div, F, mixedTex, mul, partName, properFraction, tex, value, type Frac } from "./shared";

// Multiplikation och division med bråk.
// Lätt: heltal · bråk, och "2/3 av 24".
// Medel: bråk · bråk, bråk ÷ heltal.
// Svår: bråk ÷ bråk, vardagsuppgifter (hur många glas?), "hälften av tre fjärdedelar".

const answerFor = (f: Frac) => ({ kind: "number" as const, value: value(f), display: tex(f) });

/** "\frac{6}{8} = \frac{3}{4}" when the result can be simplified. */
function simplified(n: number, d: number): string {
  const s = F(n, d);
  return s.n === n && s.d === d ? frac(n, d) : `${frac(n, d)} = ${tex(s)}`;
}

function wholeTimesFraction(rng: Rng): GeneratedTask {
  const f = properFraction(rng, 3, 9);
  const k = rng.int(2, 6);
  const result = F(k * f.n, f.d);
  return {
    prompt: `Räkna ut. ${$(`${k} \\cdot ${tex(f)}`)}`,
    answer: answerFor(result),
    hint: `${k} gånger ${$(tex(f))} betyder ${k} stycken sådana delar. Multiplicera bara täljaren.`,
    solutionSteps: [
      { text: "Multiplicera täljaren med heltalet. Nämnaren är samma.", tex: `${k} \\cdot ${tex(f)} = ${frac(`${k} \\cdot ${f.n}`, f.d)} = ${simplified(k * f.n, f.d)}` },
      ...(result.n > result.d && result.d > 1 ? [{ text: "I blandad form:", tex: `${tex(result)} = ${mixedTex(result)}` }] : []),
    ],
  };
}

const QUANTITIES = [
  { unit: "kr", what: "av 240 kr", total: 240 },
  { unit: "elever", what: "av klassens 24 elever", total: 24 },
  { unit: "min", what: "av en timme (60 minuter)", total: 60 },
  { unit: "st", what: "av 36 kulor", total: 36 },
  { unit: "kr", what: "av 150 kr", total: 150 },
];

function fractionOf(rng: Rng): GeneratedTask {
  for (;;) {
    const q = rng.pick(QUANTITIES);
    const f = properFraction(rng, 2, 6);
    if (q.total % f.d !== 0) continue;
    const part = q.total / f.d;
    const result = part * f.n;
    return {
      prompt: `Hur mycket är ${$(tex(f))} ${q.what}?`,
      answer: { kind: "number", value: result, display: num(result), unit: q.unit },
      hint: `Dela först i ${f.d} lika stora delar. Ta sedan ${f.n} av dem.`,
      solutionSteps: [
        { text: `En ${partName(f.d)}:`, tex: `${q.total} / ${f.d} = ${part}` },
        { text: `${f.n} ${partName(f.d, f.n > 1)}:`, tex: `${f.n} \\cdot ${part} = ${result}` },
      ],
    };
  }
}

function fractionTimesFraction(rng: Rng): GeneratedTask {
  const a = properFraction(rng, 2, 7);
  const b = properFraction(rng, 2, 7);
  const n = a.n * b.n;
  const d = a.d * b.d;
  return {
    prompt: `Räkna ut. ${$(`${tex(a)} \\cdot ${tex(b)}`)}`,
    answer: answerFor(mul(a, b)),
    hint: "Täljare gånger täljare och nämnare gånger nämnare.",
    solutionSteps: [{ text: "Multiplicera täljarna och nämnarna var för sig.", tex: `${tex(a)} \\cdot ${tex(b)} = ${frac(`${a.n} \\cdot ${b.n}`, `${a.d} \\cdot ${b.d}`)} = ${simplified(n, d)}` }],
  };
}

function fractionByWhole(rng: Rng): GeneratedTask {
  const f = properFraction(rng, 2, 6);
  const k = rng.int(2, 5);
  const result = F(f.n, f.d * k);
  return {
    prompt: `Räkna ut. ${$(`${tex(f)} \\div ${k}`)}`,
    answer: answerFor(result),
    hint: `Att dela med ${k} är samma sak som att ta ${$(frac(1, k))} av bråket. Multiplicera nämnaren med ${k}.`,
    solutionSteps: [
      { text: `Dela med ${k} = multiplicera med ${$(frac(1, k))}.`, tex: `${tex(f)} \\div ${k} = ${tex(f)} \\cdot ${frac(1, k)} = ${simplified(f.n, f.d * k)}` },
    ],
  };
}

function fractionByFraction(rng: Rng): GeneratedTask {
  const a = properFraction(rng, 2, 6);
  const b = properFraction(rng, 2, 6);
  const result = div(a, b);
  return {
    prompt: `Räkna ut. ${$(`${tex(a)} \\div ${tex(b)}`)}`,
    answer: answerFor(result),
    hint: `Vänd på det andra bråket och multiplicera: att dividera med ${$(tex(b))} är samma sak som att multiplicera med ${$(frac(b.d, b.n))}.`,
    solutionSteps: [
      { text: "Vänd på det andra bråket och multiplicera.", tex: `${tex(a)} \\div ${tex(b)} = ${tex(a)} \\cdot ${frac(b.d, b.n)}` },
      { text: "Täljare gånger täljare, nämnare gånger nämnare.", tex: `${frac(`${a.n} \\cdot ${b.d}`, `${a.d} \\cdot ${b.n}`)} = ${simplified(a.n * b.d, a.d * b.n)}` },
      ...(result.n > result.d && result.d > 1 ? [{ text: "I blandad form:", tex: `${tex(result)} = ${mixedTex(result)}` }] : []),
    ],
  };
}

function glassesStory(rng: Rng): GeneratedTask {
  const liters = rng.int(2, 5);
  const glass = F(1, rng.pick([3, 4, 5]));
  const count = liters * glass.d;
  return {
    prompt: `En flaska innehåller ${liters} liter saft. Ett glas rymmer ${$(`${tex(glass)}\\text{ liter}`)}. Hur många glas kan du fylla?`,
    answer: { kind: "number", value: count, display: `${count}\\text{ glas}`, unit: "glas" },
    hint: `Hur många glas på ${$(tex(glass))} liter går det på en liter? Gör sedan samma sak för ${liters} liter.`,
    solutionSteps: [
      { text: `En liter räcker till ${glass.d} glas.`, tex: `1 \\div ${tex(glass)} = ${glass.d}` },
      { text: `${liters} liter räcker till`, tex: `${liters} \\div ${tex(glass)} = ${liters} \\cdot ${glass.d} = ${count}` },
    ],
  };
}

function partOfPart(rng: Rng): GeneratedTask {
  const a = properFraction(rng, 2, 4);
  const b = properFraction(rng, 3, 6);
  const result = mul(a, b);
  return {
    prompt: `Det finns ${$(tex(b))} kvar av en tårta. Leo äter ${$(tex(a))} av det som är kvar. Hur stor del av **hela** tårtan äter Leo?`,
    answer: answerFor(result),
    hint: `"${$(tex(a))} av" betyder gånger.`,
    solutionSteps: [{ text: "\"Av\" betyder multiplikation.", tex: `${tex(a)} \\cdot ${tex(b)} = ${simplified(a.n * b.n, a.d * b.d)}` }],
  };
}

export const generator: Generator = {
  key: "fractions/multiply-divide",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => wholeTimesFraction(rng), () => fractionOf(rng)])();
      case 2:
        return rng.pick([() => fractionTimesFraction(rng), () => fractionByWhole(rng)])();
      case 3:
        return rng.pick([() => fractionByFraction(rng), () => glassesStory(rng), () => partOfPart(rng)])();
    }
  },
};
