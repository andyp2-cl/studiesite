import { $, frac } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, gcd, type Rng } from "@/lib/random";

// Förlänga och förkorta.
// Lätt: förkorta med en liten faktor. Medel: hitta saknad täljare vid
// förlängning, eller förkorta med större faktor. Svår: större tal, saknad tal
// åt båda hållen.

/** A proper fraction in simplest form with denominator in [minDen, maxDen]. */
function baseFraction(rng: Rng, minDen: number, maxDen: number): [number, number] {
  for (;;) {
    const den = rng.int(minDen, maxDen);
    const n = rng.int(1, den - 1);
    if (gcd(n, den) === 1) return [n, den];
  }
}

function simplifyTask(rng: Rng, maxDen: number, factors: number[]): GeneratedTask {
  const [n, d] = baseFraction(rng, 3, maxDen);
  const k = rng.pick(factors);
  const bigN = n * k;
  const bigD = d * k;
  return {
    prompt: `Förkorta ${$(frac(bigN, bigD))} så långt det går.`,
    answer: { kind: "number", value: n / d, display: frac(n, d), requireSimplified: true },
    solutionSteps: [
      {
        text: `Hitta det största tal som går jämnt upp i både ${bigN} och ${bigD}.`,
        tex: `\\text{SGD}(${bigN}, ${bigD}) = ${k}`,
      },
      {
        text: `Dividera täljaren och nämnaren med ${k}.`,
        tex: `${frac(bigN, bigD)} = ${frac(`${bigN} / ${k}`, `${bigD} / ${k}`)} = ${frac(n, d)}`,
      },
    ],
  };
}

function missingNumeratorTask(rng: Rng, maxDen: number, factors: number[]): GeneratedTask {
  const [n, d] = baseFraction(rng, 2, maxDen);
  const k = rng.pick(factors);
  return {
    prompt: `Vilket tal ska stå i rutan? $${frac(n, d)} = ${frac("\\square", d * k)}$`,
    answer: { kind: "number", value: n * k, display: String(n * k) },
    solutionSteps: [
      { text: `Nämnaren har gått från ${d} till ${d * k}. Den har multiplicerats med ${k}.`, tex: `${d} \\cdot ${k} = ${d * k}` },
      { text: `Förläng täljaren med samma tal.`, tex: `${n} \\cdot ${k} = ${n * k}` },
      { text: `Svaret är ${n * k}.`, tex: `${frac(n, d)} = ${frac(n * k, d * k)}` },
    ],
  };
}

function missingDenominatorTask(rng: Rng, maxDen: number, factors: number[]): GeneratedTask {
  const [n, d] = baseFraction(rng, 3, maxDen);
  const k = rng.pick(factors);
  return {
    prompt: `Vilket tal ska stå i rutan? $${frac(n * k, "\\square")} = ${frac(n, d)}$`,
    answer: { kind: "number", value: d * k, display: String(d * k) },
    solutionSteps: [
      { text: `Täljaren har gått från ${n} till ${n * k}. Den har multiplicerats med ${k}.`, tex: `${n} \\cdot ${k} = ${n * k}` },
      { text: `Nämnaren ska multipliceras med samma tal.`, tex: `${d} \\cdot ${k} = ${d * k}` },
    ],
  };
}

export const generator: Generator = {
  key: "fractions/expand-simplify",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return simplifyTask(rng, 9, [2, 3, 4, 5]);
      case 2:
        return rng.chance(0.5) ? missingNumeratorTask(rng, 10, [2, 3, 4, 5, 6]) : simplifyTask(rng, 12, [4, 6, 7, 8, 9]);
      case 3:
        return rng.pick([
          () => simplifyTask(rng, 15, [6, 7, 8, 9, 11, 12, 15]),
          () => missingNumeratorTask(rng, 15, [3, 4, 6, 7, 8, 9]),
          () => missingDenominatorTask(rng, 15, [3, 4, 6, 7, 8, 9]),
        ])();
    }
  },
};
