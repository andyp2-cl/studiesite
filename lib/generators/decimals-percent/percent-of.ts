import { $, num, plain, round, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Procent av ett tal.
// Lätt: 10, 20, 25 och 50 % av jämna tal.
// Medel: valfri procentsats (hela 5-tal), rea – hur mycket sparar man?
// Svår: nytt pris efter rabatt/höjning (förändringsfaktor), udda procentsatser.

const EASY: Record<number, string> = {
  10: "10 % är en tiondel – dela med 10.",
  20: "20 % är dubbelt så mycket som 10 %.",
  25: "25 % är en fjärdedel – dela med 4.",
  50: "50 % är hälften – dela med 2.",
};

function easyPercent(rng: Rng): GeneratedTask {
  const p = rng.pick([10, 20, 25, 50]);
  const whole = rng.int(2, 40) * 20;
  const value = (p * whole) / 100;
  return {
    prompt: `Hur mycket är ${$(withUnit(p, "%"))} av ${$(num(whole))}?`,
    answer: { kind: "number", value, display: num(value) },
    hint: EASY[p],
    solutionSteps: [
      { text: EASY[p] },
      { text: "Räkna ut.", tex: `${num(p / 100)} \\cdot ${num(whole)} = ${num(value)}` },
    ],
  };
}

function anyPercent(rng: Rng): GeneratedTask {
  const p = rng.int(1, 19) * 5;
  const whole = rng.int(1, 30) * 20;
  const value = (p * whole) / 100;
  const tenth = whole / 10;
  return {
    prompt: `Hur mycket är ${$(withUnit(p, "%"))} av ${$(num(whole))}?`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Börja med 10 % (${plain(tenth)}) eller 5 %, och bygg ihop ${p} %.`,
    solutionSteps: [
      { text: "Gör om procenten till decimaltal och multiplicera.", tex: `${withUnit(p, "%")} = ${num(p / 100)}` },
      { text: "Räkna ut.", tex: `${num(p / 100)} \\cdot ${num(whole)} = ${num(value)}` },
    ],
  };
}

// Name with article, and the pronoun to use for it ("Den/Det säljs …").
const ITEMS = [
  { name: "en tröja", it: "Den", the: "tröjan" },
  { name: "ett par skor", it: "De", the: "skorna" },
  { name: "en jacka", it: "Den", the: "jackan" },
  { name: "ett spel", it: "Det", the: "spelet" },
  { name: "en cykel", it: "Den", the: "cykeln" },
];

const capitalize = (s: string) => `${s[0].toUpperCase()}${s.slice(1)}`;

function saleSaving(rng: Rng): GeneratedTask {
  const { name: item } = rng.pick(ITEMS);
  const price = rng.int(4, 40) * 50;
  const p = rng.pick([10, 15, 20, 25, 30, 40, 50]);
  const saving = (price * p) / 100;
  return {
    prompt: `Det är rea! ${capitalize(item)} som kostar ${$(withUnit(price, "kr"))} säljs med ${$(withUnit(p, "%"))} rabatt. Hur många kronor **sparar** du?`,
    answer: { kind: "number", value: saving, display: withUnit(saving, "kr"), unit: "kr" },
    hint: `Du sparar ${p} % av priset. Räkna ut ${p} % av ${price} kr.`,
    solutionSteps: [{ text: `${p} % av priset:`, tex: `${num(p / 100)} \\cdot ${num(price)} = ${num(saving)}` }],
  };
}

function newPrice(rng: Rng): GeneratedTask {
  const { name: item, it, the } = rng.pick(ITEMS);
  const price = rng.int(4, 40) * 50;
  const p = rng.pick([10, 15, 20, 25, 30, 40]);
  const raise = rng.chance(0.4);
  const factor = round(raise ? 1 + p / 100 : 1 - p / 100);
  const value = round(price * factor);
  return {
    prompt: raise
      ? `Priset på ${the} höjs med ${$(withUnit(p, "%"))}. Före höjningen kostade det ${$(withUnit(price, "kr"))}. Vad kostar det **nu**?`
      : `${capitalize(item)} kostar ${$(withUnit(price, "kr"))}. ${it} säljs med ${$(withUnit(p, "%"))} rabatt. Vad blir det **nya priset**?`,
    answer: { kind: "number", value, display: withUnit(value, "kr"), unit: "kr" },
    hint: raise
      ? `Efter höjningen betalar man 100 % + ${p} % = ${100 + p} % av det gamla priset.`
      : `Med ${p} % rabatt betalar man 100 % − ${p} % = ${100 - p} % av priset.`,
    solutionSteps: [
      { text: `Man betalar ${raise ? 100 + p : 100 - p} % av priset – förändringsfaktorn är ${plain(factor)}.` },
      { text: "Räkna ut.", tex: `${num(factor)} \\cdot ${num(price)} = ${num(value)}` },
    ],
  };
}

function oddPercent(rng: Rng): GeneratedTask {
  const p = rng.pick([12, 15, 35, 45, 6, 8, 2]);
  const whole = rng.int(1, 20) * 50;
  const value = round((p * whole) / 100);
  return {
    prompt: `Hur mycket är ${$(withUnit(p, "%"))} av ${$(num(whole))}?`,
    answer: { kind: "number", value, display: num(value) },
    hint: `1 % av ${whole} är ${plain(whole / 100)}. Hur mycket är då ${p} %?`,
    solutionSteps: [
      { text: "En procent:", tex: `${num(whole)} / 100 = ${num(whole / 100)}` },
      { text: `${p} procent:`, tex: `${p} \\cdot ${num(whole / 100)} = ${num(value)}` },
    ],
  };
}

export const generator: Generator = {
  key: "decimals-percent/percent-of",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return easyPercent(rng);
      case 2:
        return rng.pick([() => anyPercent(rng), () => saleSaving(rng)])();
      case 3:
        return rng.pick([() => newPrice(rng), () => newPrice(rng), () => oddPercent(rng)])();
    }
  },
};
