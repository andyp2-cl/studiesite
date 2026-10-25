import { $, frac } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, gcd, type Rng } from "@/lib/random";
import { add, F, lcm, mixedTex, properFraction, sub, tex, value, type Frac } from "./shared";

// Addition och subtraktion av bråk.
// Lätt: samma nämnare.
// Medel: den ena nämnaren är en multipel av den andra.
// Svår: olika nämnare utan gemensam faktor, vardagsuppgifter, blandad form.

const answerFor = (f: Frac) => ({ kind: "number" as const, value: value(f), display: tex(f) });

/** "\frac{5}{8} = \frac{1}{2}" when the result can be simplified. */
function simplified(n: number, d: number): string {
  const s = F(n, d);
  return s.n === n && s.d === d ? frac(n, d) : `${frac(n, d)} = ${tex(s)}`;
}

function sameDenominator(rng: Rng): GeneratedTask {
  const d = rng.int(3, 12);
  const a = rng.int(1, d - 1);
  const plus = rng.chance(0.55);
  const b = plus ? rng.int(1, d - 1) : rng.int(1, Math.max(1, a - 1));
  if (!plus && b >= a) return sameDenominator(rng);
  const n = plus ? a + b : a - b;
  const op = plus ? "+" : "-";
  return {
    prompt: `Räkna ut. ${$(`${frac(a, d)} ${op} ${frac(b, d)}`)}`,
    answer: answerFor(F(n, d)),
    hint: `Nämnarna är lika, så du ${plus ? "adderar" : "subtraherar"} bara täljarna. Nämnaren ändras inte!`,
    solutionSteps: [
      { text: "Samma nämnare – räkna med täljarna.", tex: `${frac(a, d)} ${op} ${frac(b, d)} = ${frac(`${a} ${op} ${b}`, d)}` },
      { text: "Räkna ut (och förkorta om det går).", tex: simplified(n, d) },
    ],
  };
}

function multipleDenominator(rng: Rng): GeneratedTask {
  let a: Frac;
  let b: Frac;
  do {
    a = properFraction(rng, 2, 6);
    const k = rng.int(2, 3);
    b = properFraction(rng, a.d * k, a.d * k);
  } while (b.d % a.d !== 0 || b.d === a.d);
  // Subtraction only when the result stays positive.
  const plus = rng.chance(0.5) || value(a) <= value(b);
  const [first, second] = [a, b];
  const common = b.d;
  const firstExpanded = first.n * (common / first.d);
  const result = plus ? add(first, second) : sub(first, second);
  const n = plus ? firstExpanded + second.n : firstExpanded - second.n;
  const op = plus ? "+" : "-";
  return {
    prompt: `Räkna ut. ${$(`${tex(first)} ${op} ${tex(second)}`)}`,
    answer: answerFor(result),
    hint: `${common} är delbart med ${first.d}. Förläng det första bråket så att det också får nämnaren ${common}.`,
    solutionSteps: [
      { text: `Förläng så att båda får nämnaren ${common}.`, tex: `${tex(first)} = ${frac(firstExpanded, common)}` },
      { text: `Räkna med täljarna.`, tex: `${frac(firstExpanded, common)} ${op} ${tex(second)} = ${simplified(n, common)}` },
    ],
  };
}

function coprimeDenominators(rng: Rng): GeneratedTask {
  let a: Frac;
  let b: Frac;
  do {
    a = properFraction(rng, 2, 6);
    b = properFraction(rng, 3, 7);
  } while (a.d === b.d || gcd(a.d, b.d) !== 1);
  const plus = rng.chance(0.5) || value(a) <= value(b);
  const common = lcm(a.d, b.d);
  const an = a.n * (common / a.d);
  const bn = b.n * (common / b.d);
  const n = plus ? an + bn : an - bn;
  const result = F(n, common);
  const op = plus ? "+" : "-";
  return {
    prompt: `Räkna ut. ${$(`${tex(a)} ${op} ${tex(b)}`)}`,
    answer: answerFor(result),
    hint: `Hitta en gemensam nämnare. ${a.d} · ${b.d} = ${common} fungerar alltid när nämnarna inte har någon gemensam faktor.`,
    solutionSteps: [
      { text: `Gemensam nämnare: ${common}.`, tex: `${tex(a)} = ${frac(an, common)} \\qquad ${tex(b)} = ${frac(bn, common)}` },
      { text: "Räkna med täljarna.", tex: `${frac(an, common)} ${op} ${frac(bn, common)} = ${simplified(n, common)}` },
      ...(result.n > result.d ? [{ text: "I blandad form:", tex: `${tex(result)} = ${mixedTex(result)}` }] : []),
    ],
  };
}

const PEOPLE = [
  ["Ali", "Sara"],
  ["Nora", "Elias"],
  ["Maja", "Omar"],
  ["Ella", "Liam"],
];

function pizzaStory(rng: Rng): GeneratedTask {
  const [p1, p2] = rng.pick(PEOPLE);
  let a: Frac;
  let b: Frac;
  do {
    a = F(1, rng.int(2, 6));
    b = properFraction(rng, 3, 8);
  } while (a.d === b.d || value(a) + value(b) >= 1);
  const eaten = add(a, b);
  const left = sub(F(1, 1), eaten);
  const common = lcm(a.d, b.d);
  return {
    prompt: `${p1} äter ${$(tex(a))} av en pizza och ${p2} äter ${$(tex(b))} av samma pizza. Hur stor del av pizzan är **kvar**?`,
    answer: answerFor(left),
    hint: "Räkna först ut hur mycket de åt tillsammans. Hela pizzan är 1, alltså lika många delar som nämnaren.",
    solutionSteps: [
      { text: `Tillsammans (gemensam nämnare ${common}):`, tex: `${tex(a)} + ${tex(b)} = ${frac(a.n * (common / a.d) + b.n * (common / b.d), common)}${tex(eaten) !== frac(a.n * (common / a.d) + b.n * (common / b.d), common) ? ` = ${tex(eaten)}` : ""}` },
      { text: "Dra bort från hela pizzan.", tex: `1 - ${tex(eaten)} = ${frac(eaten.d, eaten.d)} - ${tex(eaten)} = ${tex(left)}` },
    ],
  };
}

export const generator: Generator = {
  key: "fractions/add-subtract",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return sameDenominator(rng);
      case 2:
        return multipleDenominator(rng);
      case 3:
        return rng.pick([() => coprimeDenominators(rng), () => coprimeDenominators(rng), () => pizzaStory(rng)])();
    }
  },
};
