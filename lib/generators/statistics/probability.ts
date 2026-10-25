import { frac, num, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, gcd, type Rng } from "@/lib/random";

// Enkel sannolikhet: P = gynnsamma utfall / möjliga utfall.
// Lätt: tärning, slant, påse med kulor (svara med bråk).
// Medel: komplement (”inte röd”), svara i procent.
// Svår: två tärningar, förväntat antal, två slantar.

const simplest = (n: number, d: number) => {
  const g = gcd(n, d);
  return frac(n / g, d / g);
};

/** Fraction answer; any equivalent form (2/4, 0,5, 50 %) is accepted. */
const fractionAnswer = (n: number, d: number) => ({ kind: "number" as const, value: n / d, display: simplest(n, d) });

function step(n: number, d: number, what: string) {
  return { text: `${what}:`, tex: `P = ${frac(n, d)}${gcd(n, d) > 1 ? ` = ${simplest(n, d)}` : ""}` };
}

const DIE_EVENTS = [
  { text: "en sexa", count: 1 },
  { text: "ett jämnt tal", count: 3 },
  { text: "mer än 4", count: 2 },
  { text: "högst 2", count: 2 },
  { text: "ett udda tal", count: 3 },
  { text: "en etta eller en tvåa", count: 2 },
];

function die(rng: Rng): GeneratedTask {
  const e = rng.pick(DIE_EVENTS);
  return {
    prompt: `Du kastar en vanlig tärning. Hur stor är sannolikheten att få **${e.text}**? Svara med ett bråk.`,
    answer: fractionAnswer(e.count, 6),
    hint: "En tärning har 6 lika troliga utfall. Hur många av dem är gynnsamma?",
    solutionSteps: [
      { text: `Gynnsamma utfall: ${e.count}. Möjliga utfall: 6.` },
      step(e.count, 6, "Sannolikheten"),
    ],
  };
}

const COLORS = ["röda", "blå", "gröna", "gula"];

function bag(rng: Rng): GeneratedTask {
  const [c1, c2] = rng.shuffle(COLORS);
  const a = rng.int(1, 8);
  const b = rng.int(1, 8);
  const total = a + b;
  return {
    prompt: `I en påse finns ${a} ${c1} och ${b} ${c2} kulor. Du tar en kula utan att titta. Hur stor är sannolikheten att den är **${singular(c1)}**?`,
    answer: fractionAnswer(a, total),
    hint: "Räkna alla kulor – det är de möjliga utfallen. Hur många av dem har rätt färg?",
    solutionSteps: [
      { text: `Möjliga utfall: ${a} + ${b} = ${total} kulor. Gynnsamma: ${a}.` },
      step(a, total, "Sannolikheten"),
    ],
  };
}

/** röda → röd, blå → blå, gröna → grön, gula → gul */
function singular(color: string): string {
  return color === "blå" ? "blå" : color.replace(/a$/, "");
}

function complement(rng: Rng): GeneratedTask {
  const total = rng.pick([10, 20, 25, 50]);
  const red = rng.int(1, total - 1);
  const p = ((total - red) * 100) / total;
  if (!Number.isInteger(p)) return complement(rng);
  return {
    prompt: `I en burk finns ${total} godisbitar. ${red} av dem är röda. Du tar en utan att titta. Hur stor är sannolikheten att den **inte** är röd? Svara i procent.`,
    answer: { kind: "number", value: p, display: withUnit(p, "%"), unit: "%" },
    hint: "Hur många är inte röda? Eller: sannolikheten för röd plus sannolikheten för inte röd är alltid 1 (100 %).",
    solutionSteps: [
      { text: "Inte röda:", tex: `${total} - ${red} = ${total - red}` },
      { text: "Sannolikheten:", tex: `${frac(total - red, total)} = ${num(p / 100)} = ${withUnit(p, "%")}` },
    ],
  };
}

function cards(rng: Rng): GeneratedTask {
  const n = rng.pick([10, 12, 20]);
  const kinds = [
    { text: "ett jämnt tal", count: n / 2 },
    { text: `ett tal som är större än ${n - 3}`, count: 3 },
    { text: "ett tal i femmans tabell", count: Math.floor(n / 5) },
  ];
  const k = rng.pick(kinds);
  return {
    prompt: `Lappar med talen 1–${n} läggs i en hatt. Du drar en lapp. Hur stor är sannolikheten att den visar **${k.text}**?`,
    answer: fractionAnswer(k.count, n),
    hint: `Det finns ${n} lappar. Skriv upp vilka tal som är gynnsamma och räkna dem.`,
    solutionSteps: [{ text: `Gynnsamma: ${k.count} av ${n}.` }, step(k.count, n, "Sannolikheten")],
  };
}

function twoDice(rng: Rng): GeneratedTask {
  const sum = rng.int(3, 11);
  const ways = 6 - Math.abs(7 - sum);
  return {
    prompt: `Du kastar två tärningar och lägger ihop prickarna. Hur stor är sannolikheten att summan blir **${sum}**?`,
    answer: fractionAnswer(ways, 36),
    hint: "Två tärningar ger 6 · 6 = 36 lika troliga kombinationer. Skriv upp alla par som ger summan.",
    solutionSteps: [
      {
        text: `Par som ger ${sum}:`,
        tex: Array.from({ length: 6 }, (_, i) => i + 1)
          .filter((a) => sum - a >= 1 && sum - a <= 6)
          .map((a) => `(${a},${sum - a})`)
          .join(",\\;"),
      },
      { text: `${ways} gynnsamma av 36.` },
      step(ways, 36, "Sannolikheten"),
    ],
  };
}

function expected(rng: Rng): GeneratedTask {
  const throws = rng.pick([30, 60, 120, 300]);
  const value = throws / 6;
  return {
    prompt: `Du kastar en tärning ${throws} gånger. Ungefär hur många **sexor** kan du räkna med att få?`,
    answer: { kind: "number", value, display: `${num(value)}\\text{ sexor}`, unit: "sexor" },
    hint: "Sannolikheten för en sexa är 1/6. Hur mycket är en sjättedel av antalet kast?",
    solutionSteps: [{ text: "Förväntat antal = sannolikhet · antal försök.", tex: `${frac(1, 6)} \\cdot ${throws} = ${num(value)}` }],
  };
}

function twoCoins(): GeneratedTask {
  return {
    prompt: "Du singlar två slantar. Hur stor är sannolikheten att **båda** visar krona?",
    answer: fractionAnswer(1, 4),
    hint: "Skriv upp alla möjliga utfall: krona–krona, krona–klave, … Hur många är de?",
    solutionSteps: [
      { text: "Möjliga utfall: krona–krona, krona–klave, klave–krona, klave–klave. Det är 4." },
      step(1, 4, "Bara ett är krona–krona"),
    ],
  };
}

export const generator: Generator = {
  key: "statistics/probability",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => die(rng), () => bag(rng)])();
      case 2:
        return rng.pick([() => complement(rng), () => cards(rng)])();
      case 3:
        return rng.pick([() => twoDice(rng), () => twoDice(rng), () => expected(rng), () => twoCoins()])();
    }
  },
};
