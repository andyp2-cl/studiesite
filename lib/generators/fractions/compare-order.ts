import { $, frac, num } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";
import { equals, F, lcm, properFraction, tex, value, type Frac } from "./shared";

// Jämföra och storleksordna bråk.
// Lätt: samma nämnare eller samma täljare.
// Medel: olika nämnare – förläng till gemensam nämnare.
// Svår: tre bråk, bråk mot decimaltal, talet mitt emellan två bråk.

function answerFor(f: Frac) {
  return { kind: "number" as const, value: value(f), display: tex(f) };
}

function sameDenominator(rng: Rng): GeneratedTask {
  const d = rng.int(5, 12);
  const a = rng.int(1, d - 1);
  let b = rng.int(1, d - 1);
  if (a === b) b = a === 1 ? 2 : a - 1;
  const largest = rng.chance(0.6);
  const pick = largest ? Math.max(a, b) : Math.min(a, b);
  return {
    prompt: `Vilket bråk är **${largest ? "störst" : "minst"}**, ${$(frac(a, d))} eller ${$(frac(b, d))}?`,
    answer: answerFor({ n: pick, d }),
    hint: "Nämnarna är lika, så bitarna är lika stora. Jämför hur många bitar det är.",
    solutionSteps: [
      { text: `Båda bråken har nämnaren ${d}, så delarna är lika stora.` },
      { text: `Jämför täljarna: ${Math.min(a, b)} < ${Math.max(a, b)}.`, tex: `${frac(Math.min(a, b), d)} < ${frac(Math.max(a, b), d)}` },
    ],
  };
}

function sameNumerator(rng: Rng): GeneratedTask {
  const n = rng.int(1, 4);
  const d1 = rng.int(n + 1, 9);
  let d2 = rng.int(n + 1, 12);
  if (d1 === d2) d2 = d1 + 2;
  const pick = Math.min(d1, d2);
  return {
    prompt: `Vilket bråk är **störst**, ${$(frac(n, d1))} eller ${$(frac(n, d2))}?`,
    answer: answerFor(F(n, pick)),
    hint: "Täljarna är lika. Tänk på en pizza: blir bitarna större eller mindre om man delar i fler bitar?",
    solutionSteps: [
      { text: `Täljarna är lika (${n}). Ju färre delar helheten delas i, desto större blir varje del.` },
      { text: `Den minsta nämnaren ger störst bråk.`, tex: `${frac(n, Math.max(d1, d2))} < ${frac(n, pick)}` },
    ],
  };
}

function differentDenominators(rng: Rng): GeneratedTask {
  let a: Frac;
  let b: Frac;
  do {
    a = properFraction(rng, 2, 8);
    b = properFraction(rng, 3, 10);
  } while (a.d === b.d || equals(a, b) || lcm(a.d, b.d) > 40);
  const common = lcm(a.d, b.d);
  const largest = value(a) > value(b) ? a : b;
  const smallest = largest === a ? b : a;
  return {
    prompt: `Vilket bråk är **störst**, ${$(tex(a))} eller ${$(tex(b))}?`,
    answer: answerFor(largest),
    hint: `Förläng båda bråken så att de får samma nämnare, till exempel ${common}. Jämför sedan täljarna.`,
    solutionSteps: [
      { text: `Gemensam nämnare: ${common}.`, tex: `${tex(a)} = ${frac(a.n * (common / a.d), common)} \\qquad ${tex(b)} = ${frac(b.n * (common / b.d), common)}` },
      { text: "Jämför täljarna.", tex: `${tex(smallest)} < ${tex(largest)}` },
    ],
  };
}

function threeFractions(rng: Rng): GeneratedTask {
  const pool: Frac[] = [];
  while (pool.length < 3) {
    const f = properFraction(rng, 3, 12);
    if (!pool.some((p) => equals(p, f))) pool.push(f);
  }
  const smallest = rng.chance(0.5);
  const sorted = [...pool].sort((x, y) => value(x) - value(y));
  const pick = smallest ? sorted[0] : sorted[2];
  return {
    prompt: `Vilket av bråken är **${smallest ? "minst" : "störst"}**? ${pool.map((f) => $(tex(f))).join(", ")}`,
    answer: answerFor(pick),
    hint: "Gör om bråken till decimaltal (täljaren delat med nämnaren) eller jämför med en halv.",
    solutionSteps: [
      { text: "Gör om till decimaltal (avrundat):", tex: pool.map((f) => `${tex(f)} \\approx ${num(Math.round(value(f) * 1000) / 1000)}`).join(" \\quad ") },
      { text: "Ordna från minst till störst.", tex: sorted.map(tex).join(" < ") },
    ],
  };
}

function fractionVsDecimal(rng: Rng): GeneratedTask {
  let f: Frac;
  let decimal: number;
  do {
    f = properFraction(rng, 3, 9);
    decimal = Math.round((value(f) + (rng.chance(0.5) ? 1 : -1) * rng.int(2, 12) / 100) * 100) / 100;
  } while (decimal <= 0 || decimal >= 1 || Math.abs(decimal - value(f)) < 0.005);
  const fractionBigger = value(f) > decimal;
  return {
    prompt: `Vilket tal är **störst**, ${$(tex(f))} eller ${$(num(decimal))}?`,
    answer: fractionBigger ? answerFor(f) : { kind: "number", value: decimal, display: num(decimal) },
    hint: `Gör om bråket till ett decimaltal: dela ${f.n} med ${f.d}.`,
    solutionSteps: [
      { text: "Gör om bråket till decimaltal.", tex: `${tex(f)} = ${f.n} / ${f.d} \\approx ${num(Math.round(value(f) * 1000) / 1000)}` },
      { text: "Jämför.", tex: fractionBigger ? `${tex(f)} > ${num(decimal)}` : `${tex(f)} < ${num(decimal)}` },
    ],
  };
}

function halfway(rng: Rng): GeneratedTask {
  const d = rng.pick([3, 4, 5, 6, 8]);
  const a = rng.int(1, d - 2);
  const lo = F(a, d);
  const hi = F(a + 1, d);
  const mid = F(lo.n * hi.d + hi.n * lo.d, 2 * lo.d * hi.d);
  return {
    prompt: `Vilket tal ligger **mitt emellan** ${$(tex(lo))} och ${$(tex(hi))}? Svara med ett bråk.`,
    answer: answerFor(mid),
    hint: `Förläng båda bråken så att nämnaren blir ${2 * d}. Vilken täljare hamnar då mitt emellan?`,
    solutionSteps: [
      { text: `Förläng till nämnaren ${2 * d}.`, tex: `${tex(lo)} = ${frac(2 * a, 2 * d)} \\qquad ${tex(hi)} = ${frac(2 * a + 2, 2 * d)}` },
      { text: "Mitt emellan ligger", tex: tex(mid) === frac(2 * a + 1, 2 * d) ? tex(mid) : `${frac(2 * a + 1, 2 * d)} = ${tex(mid)}` },
      { text: "Kontroll: medelvärdet av de två bråken.", tex: `\\frac{1}{2}\\left(${tex(lo)} + ${tex(hi)}\\right) = ${tex(mid)}` },
    ],
  };
}

export const generator: Generator = {
  key: "fractions/compare-order",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => sameDenominator(rng), () => sameNumerator(rng)])();
      case 2:
        return differentDenominators(rng);
      case 3:
        return rng.pick([() => threeFractions(rng), () => fractionVsDecimal(rng), () => halfway(rng)])();
    }
  },
};
