import { $, frac, num, term, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";
import { coefTex, signed } from "./shared";

// Ekvationer i två steg.
// Lätt: ax + b = c med positiva heltal.
// Medel: ax − b = c och x/a + b = c, negativa tal i högerledet.
// Svår: x i båda leden, "tänk på ett tal", biljettpris.

const eq = (value: number) => ({ kind: "equation" as const, variable: "x", value, display: `x = ${num(value)}` });

function axPlusB(rng: Rng, allowNegative: boolean): GeneratedTask {
  const a = rng.int(2, 9);
  const x = allowNegative ? rng.int(-9, 12) || 3 : rng.int(1, 12);
  const b = allowNegative ? rng.int(-15, 15) || 4 : rng.int(1, 20);
  const c = a * x + b;
  const lhs = `${a}x ${signed(b)}`;
  return {
    prompt: `Lös ekvationen. ${$(`${lhs} = ${num(c)}`)}`,
    answer: eq(x),
    hint: `Ta först bort ${b > 0 ? `+ ${b}` : `− ${-b}`} från vänsterledet genom att göra motsatsen på båda sidor. Dela sedan med ${a}.`,
    solutionSteps: [
      { text: b > 0 ? `Dra bort ${b} från båda sidor.` : `Lägg till ${-b} på båda sidor.`, tex: `${a}x = ${num(c)} ${b > 0 ? `- ${b}` : `+ ${-b}`} = ${num(c - b)}` },
      { text: `Dela båda sidor med ${a}.`, tex: `x = ${frac(num(c - b), a)} = ${num(x)}` },
      { text: "Pröva:", tex: `${a} \\cdot ${term(x)} ${signed(b)} = ${num(c)} \\;\\checkmark` },
    ],
  };
}

function xOverA(rng: Rng): GeneratedTask {
  const a = rng.int(2, 6);
  const q = rng.int(-5, 9);
  const x = a * q;
  const b = rng.int(1, 12);
  const c = q + b;
  return {
    prompt: `Lös ekvationen. ${$(`${frac("x", a)} + ${b} = ${num(c)}`)}`,
    answer: eq(x),
    hint: `Ta bort + ${b} först. Sedan: om x delat med ${a} är något, är x ${a} gånger så mycket.`,
    solutionSteps: [
      { text: `Dra bort ${b} från båda sidor.`, tex: `${frac("x", a)} = ${num(c)} - ${b} = ${num(q)}` },
      { text: `Multiplicera båda sidor med ${a}.`, tex: `x = ${num(q)} \\cdot ${a} = ${num(x)}` },
    ],
  };
}

function bothSides(rng: Rng): GeneratedTask {
  const c = rng.int(1, 5);
  const a = c + rng.int(1, 4);
  const x = rng.int(-6, 10);
  const b = rng.int(-10, 12);
  const d = (a - c) * x + b;
  const lhs = `${a}x ${b === 0 ? "" : signed(b)}`.trim();
  const rhs = `${coefTex(c, "x")} ${d === 0 ? "" : signed(d)}`.trim();
  return {
    prompt: `Lös ekvationen. ${$(`${lhs} = ${rhs}`)}`,
    answer: eq(x),
    hint: `Samla x-termerna på ena sidan: dra bort ${coefTex(c, "x")} från båda sidor. Lös sedan som vanligt.`,
    solutionSteps: [
      { text: `Dra bort ${$(coefTex(c, "x"))} från båda sidor.`, tex: `${coefTex(a - c, "x")} ${b === 0 ? "" : signed(b)} = ${num(d)}` },
      { text: b === 0 ? "Inget tal att flytta." : b > 0 ? `Dra bort ${b}.` : `Lägg till ${-b}.`, tex: `${coefTex(a - c, "x")} = ${num(d - b)}` },
      { text: `Dela med ${a - c}.`, tex: `x = ${num(x)}` },
    ],
  };
}

function thinkOfNumber(rng: Rng): GeneratedTask {
  const k = rng.int(2, 6);
  const add = rng.int(2, 15);
  const x = rng.int(2, 15);
  const result = k * x + add;
  return {
    prompt: `Jag tänker på ett tal. Om jag multiplicerar det med ${k} och sedan lägger till ${add} får jag ${result}. Vilket tal tänker jag på?`,
    answer: eq(x),
    hint: `Skriv en ekvation: ${k}x + ${add} = ${result}. Eller räkna baklänges: ta bort ${add}, dela med ${k}.`,
    solutionSteps: [
      { text: "Ställ upp en ekvation.", tex: `${k}x + ${add} = ${result}` },
      { text: `Dra bort ${add}.`, tex: `${k}x = ${result - add}` },
      { text: `Dela med ${k}.`, tex: `x = ${x}` },
    ],
  };
}

function ticketStory(rng: Rng): GeneratedTask {
  const count = rng.int(2, 6);
  const price = rng.int(6, 25) * 5;
  const fee = rng.pick([20, 25, 30, 40, 50]);
  const total = count * price + fee;
  return {
    prompt: `${count} biljetter till en konsert kostar tillsammans ${$(withUnit(total, "kr"))}, inklusive en avgift på ${$(withUnit(fee, "kr"))}. Vad kostar en biljett? (Lös gärna med en ekvation.)`,
    answer: { kind: "number", value: price, display: withUnit(price, "kr"), unit: "kr" },
    hint: `Kalla priset för en biljett x. Då är ${count}x + ${fee} = ${total}.`,
    solutionSteps: [
      { text: "Ekvation:", tex: `${count}x + ${fee} = ${total}` },
      { text: `Dra bort avgiften.`, tex: `${count}x = ${total - fee}` },
      { text: `Dela med ${count}.`, tex: `x = ${price}` },
    ],
  };
}

export const generator: Generator = {
  key: "algebra/two-step-equations",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return axPlusB(rng, false);
      case 2:
        return rng.pick([() => axPlusB(rng, true), () => xOverA(rng)])();
      case 3:
        return rng.pick([() => bothSides(rng), () => thinkOfNumber(rng), () => ticketStory(rng)])();
    }
  },
};
