import { $, frac, num, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Hur många procent? andel = delen / det hela.
// Lätt: delen av ett "snällt" helt (10, 20, 25, 50, 100, 200).
// Medel: vardagsuppgifter (elever, mål, rätt på provet).
// Svår: procentuell ökning och minskning.

const percentAnswer = (p: number) => ({ kind: "number" as const, value: p, display: withUnit(p, "%"), unit: "%" });

function basic(rng: Rng): GeneratedTask {
  const whole = rng.pick([10, 20, 25, 50, 100, 200]);
  const part = rng.int(1, whole - 1);
  const p = (part * 100) / whole;
  if (!Number.isInteger(p)) return basic(rng);
  return {
    prompt: `Hur många procent är ${$(num(part))} av ${$(num(whole))}?`,
    answer: percentAnswer(p),
    hint: `Skriv som ett bråk, ${$(frac(part, whole))}, och förläng så att nämnaren blir 100.`,
    solutionSteps: [
      { text: "Andelen är delen delat med det hela.", tex: `${frac(part, whole)}` },
      { text: "Förläng till hundradelar.", tex: `${frac(part, whole)} = ${frac(p, 100)} = ${withUnit(p, "%")}` },
    ],
  };
}

const STORIES = [
  (part: number, whole: number) => `${part} av klassens ${whole} elever cyklar till skolan. Hur många procent cyklar?`,
  (part: number, whole: number) => `Ida hade ${part} rätt av ${whole} på provet. Hur många procent rätt hade hon?`,
  (part: number, whole: number) => `Laget gjorde ${part} mål på ${whole} skott. Hur många procent av skotten blev mål?`,
  (part: number, whole: number) => `${part} av ${whole} tillfrågade gillar pizza bäst. Hur många procent är det?`,
];

function story(rng: Rng): GeneratedTask {
  for (;;) {
    const whole = rng.pick([20, 24, 25, 30, 32, 40, 50, 60, 80]);
    const part = rng.int(1, whole - 1);
    const p = (part * 100) / whole;
    if (!Number.isInteger(p * 2)) continue;
    return {
      prompt: rng.pick(STORIES)(part, whole),
      answer: percentAnswer(p),
      hint: `Andelen = delen / det hela = ${$(frac(part, whole))}. Gör om till procent.`,
      solutionSteps: [
        { text: "Dela delen med det hela.", tex: `${frac(part, whole)} = ${part} / ${whole} = ${num(p / 100)}` },
        { text: "Gånger 100 ger procent.", tex: `${num(p / 100)} = ${withUnit(p, "%")}` },
      ],
    };
  }
}

function change(rng: Rng): GeneratedTask {
  const p = rng.pick([10, 20, 25, 30, 40, 50]);
  const old = rng.int(2, 20) * 20;
  const increase = rng.chance(0.5);
  const diff = (old * p) / 100;
  const now = increase ? old + diff : old - diff;
  return {
    prompt: increase
      ? `Priset på en biobiljett höjdes från ${$(withUnit(old, "kr"))} till ${$(withUnit(now, "kr"))}. Med hur många procent **ökade** priset?`
      : `En jacka sänktes i pris från ${$(withUnit(old, "kr"))} till ${$(withUnit(now, "kr"))}. Med hur många procent **minskade** priset?`,
    answer: percentAnswer(p),
    hint: "Räkna först ut hur mycket priset ändrades. Jämför sedan ändringen med det **gamla** priset.",
    solutionSteps: [
      { text: "Ändringen:", tex: `${increase ? `${num(now)} - ${num(old)}` : `${num(old)} - ${num(now)}`} = ${num(diff)}` },
      { text: "Jämför med det gamla priset.", tex: `${frac(num(diff), num(old))} = ${num(p / 100)} = ${withUnit(p, "%")}` },
    ],
  };
}

export const generator: Generator = {
  key: "decimals-percent/what-percent",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return basic(rng);
      case 2:
        return story(rng);
      case 3:
        return rng.pick([() => change(rng), () => change(rng), () => story(rng)])();
    }
  },
};
