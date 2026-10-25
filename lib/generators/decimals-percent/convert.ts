import { $, frac, num, round, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, gcd, type Rng } from "@/lib/random";

// Bråk, decimaltal och procent – tre sätt att skriva samma sak.
// Lätt: enkla bråk → decimaltal, procent → decimaltal.
// Medel: decimaltal → procent, bråk → procent, procent → bråk i enklaste form.
// Svår: åttondelar, små procentsatser, 1/3 ≈ 33,3 %.

/** Fractions with denominators that give "nice" decimals and percents. */
function niceFraction(rng: Rng, denominators: number[]): [number, number] {
  for (;;) {
    const d = rng.pick(denominators);
    const n = rng.int(1, d - 1);
    if (gcd(n, d) === 1) return [n, d];
  }
}

const percentAnswer = (p: number) => ({ kind: "number" as const, value: p, display: withUnit(p, "%"), unit: "%" });

function fractionToDecimal(rng: Rng): GeneratedTask {
  const [n, d] = niceFraction(rng, [2, 4, 5, 10]);
  const value = round(n / d);
  const expand = 10 % d === 0 ? 10 / d : 100 / d;
  const target = 10 % d === 0 ? 10 : 100;
  return {
    prompt: `Skriv ${$(frac(n, d))} som ett **decimaltal**.`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Förläng så att nämnaren blir ${target}. Då kan du läsa av ${target === 10 ? "tiondelarna" : "hundradelarna"} direkt.`,
    solutionSteps: [
      { text: `Förläng med ${expand}.`, tex: `${frac(n, d)} = ${frac(n * expand, target)}` },
      { text: `${n * expand} ${target === 10 ? "tiondelar" : "hundradelar"}:`, tex: `${frac(n * expand, target)} = ${num(value)}` },
    ],
  };
}

function percentToDecimal(rng: Rng): GeneratedTask {
  const p = rng.pick([5, 8, 15, 25, 35, 40, 60, 75, 90, 120]);
  const value = round(p / 100);
  return {
    prompt: `Skriv ${$(withUnit(p, "%"))} som ett **decimaltal**.`,
    answer: { kind: "number", value, display: num(value) },
    hint: "Procent betyder hundradelar. Dela med 100 – flytta decimaltecknet två steg åt vänster.",
    solutionSteps: [{ text: "Procent = hundradelar.", tex: `${withUnit(p, "%")} = ${frac(p, 100)} = ${num(value)}` }],
  };
}

function decimalToPercent(rng: Rng): GeneratedTask {
  const hundredths = rng.pick([3, 7, 12, 25, 45, 60, 85, 125, 150]);
  const x = hundredths / 100;
  return {
    prompt: `Skriv ${$(num(x))} i **procent**.`,
    answer: percentAnswer(hundredths),
    hint: "Multiplicera med 100 – flytta decimaltecknet två steg åt höger.",
    solutionSteps: [{ text: "Gånger 100 ger antalet hundradelar, alltså procent.", tex: `${num(x)} = ${frac(hundredths, 100)} = ${withUnit(hundredths, "%")}` }],
  };
}

function fractionToPercent(rng: Rng): GeneratedTask {
  const [n, d] = niceFraction(rng, [2, 4, 5, 10, 20, 25, 50]);
  const p = (n * 100) / d;
  return {
    prompt: `Hur många **procent** är ${$(frac(n, d))}?`,
    answer: percentAnswer(p),
    hint: `Förläng bråket så att nämnaren blir 100. Täljaren är då antalet procent.`,
    solutionSteps: [
      { text: `Förläng med ${100 / d}.`, tex: `${frac(n, d)} = ${frac(p, 100)}` },
      { text: "Hundradelar är procent.", tex: `${frac(p, 100)} = ${withUnit(p, "%")}` },
    ],
  };
}

function percentToFraction(rng: Rng): GeneratedTask {
  const p = rng.pick([10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90]);
  const g = gcd(p, 100);
  const [n, d] = [p / g, 100 / g];
  return {
    prompt: `Skriv ${$(withUnit(p, "%"))} som ett **bråk i enklaste form**.`,
    answer: { kind: "number", value: n / d, display: frac(n, d), requireSimplified: true, requireForm: "fraction" },
    hint: `Börja med ${$(frac(p, 100))} och förkorta så långt det går.`,
    solutionSteps: [
      { text: "Procent = hundradelar.", tex: `${withUnit(p, "%")} = ${frac(p, 100)}` },
      { text: `Förkorta med ${g}.`, tex: `${frac(p, 100)} = ${frac(n, d)}` },
    ],
  };
}

function eighths(rng: Rng): GeneratedTask {
  const n = rng.pick([1, 3, 5, 7]);
  const p = (n * 100) / 8;
  return {
    prompt: `Hur många **procent** är ${$(frac(n, 8))}?`,
    answer: percentAnswer(p),
    hint: `${$(frac(1, 8))} är hälften av ${$(frac(1, 4))}, alltså hälften av 25 %.`,
    solutionSteps: [
      { text: "En åttondel i procent:", tex: `${frac(1, 8)} = 1 / 8 = 0{,}125 = ${withUnit(12.5, "%")}` },
      { text: `${n} åttondelar:`, tex: `${n} \\cdot ${withUnit(12.5, "%")} = ${withUnit(p, "%")}` },
    ],
  };
}

function smallPercent(rng: Rng): GeneratedTask {
  const thousandths = rng.pick([5, 15, 25, 45, 75, 105, 335]);
  const x = thousandths / 1000;
  const p = thousandths / 10;
  return {
    prompt: `Skriv ${$(num(x))} i **procent**.`,
    answer: percentAnswer(p),
    hint: "Multiplicera med 100. Procentsatsen kan bli ett decimaltal.",
    solutionSteps: [{ text: "Gånger 100:", tex: `${num(x)} \\cdot 100 = ${num(p)} \\quad\\Rightarrow\\quad ${withUnit(p, "%")}` }],
  };
}

function thirds(rng: Rng): GeneratedTask {
  const [n, d] = rng.pick([
    [1, 3],
    [2, 3],
    [1, 6],
    [5, 6],
  ] as const);
  const exact = (n * 100) / d;
  const rounded = Math.round(exact * 10) / 10;
  return {
    prompt: `Hur många **procent** är ${$(frac(n, d))}? Avrunda till en decimal.`,
    answer: { ...percentAnswer(rounded), tolerance: 0.051 },
    hint: `Dela ${n} med ${d} på miniräknaren (eller i huvudet) och multiplicera med 100.`,
    solutionSteps: [
      { text: "Dela täljaren med nämnaren.", tex: `${n} / ${d} = ${num(Math.round((n / d) * 10000) / 10000)}\\ldots` },
      { text: "Gånger 100 och avrunda.", tex: `\\approx ${withUnit(rounded, "%")}` },
    ],
  };
}

export const generator: Generator = {
  key: "decimals-percent/convert",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => fractionToDecimal(rng), () => percentToDecimal(rng)])();
      case 2:
        return rng.pick([() => decimalToPercent(rng), () => fractionToPercent(rng), () => percentToFraction(rng)])();
      case 3:
        return rng.pick([() => eighths(rng), () => smallPercent(rng), () => thirds(rng)])();
    }
  },
};
