import { $, num, plain, round } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Potensform.
// Lätt: räkna ut små potenser, skriv upprepad multiplikation som potens.
// Medel: tiopotenser, större potenser, potenser i uttryck.
// Svår: grundpotensform, negativ bas – (−2)⁴ jämfört med −2⁴.

function compute(rng: Rng, maxBase: number, maxExp: number): GeneratedTask {
  let base: number;
  let exp: number;
  do {
    base = rng.int(2, maxBase);
    exp = rng.int(2, maxExp);
  } while (base ** exp > 1000);
  const value = base ** exp;
  const repeated = Array(exp).fill(base).join(" \\cdot ");
  return {
    prompt: `Räkna ut. ${$(`${base}^{${exp}}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: `${$(`${base}^{${exp}}`)} betyder ${base} multiplicerat med sig självt – ${base} ska vara med ${exp} gånger. Det är **inte** ${base} · ${exp}.`,
    solutionSteps: [
      { text: `Basen ${base} multipliceras ${exp} gånger.`, tex: `${base}^{${exp}} = ${repeated}` },
      { text: "Räkna ut.", tex: `${repeated} = ${num(value)}` },
    ],
  };
}

function writeAsPower(rng: Rng): GeneratedTask {
  const base = rng.int(2, 9);
  const exp = rng.int(3, 6);
  const repeated = Array(exp).fill(base).join(" \\cdot ");
  return {
    prompt: `Skriv i potensform: ${$(`${repeated} = ${base}^{\\square}`)}. Vilket tal ska stå i rutan?`,
    answer: { kind: "number", value: exp, display: String(exp) },
    hint: `Räkna hur många gånger ${base} är med i multiplikationen.`,
    solutionSteps: [{ text: `${base} är med ${exp} gånger, så exponenten är ${exp}.`, tex: `${repeated} = ${base}^{${exp}}` }],
  };
}

function powersOfTen(rng: Rng): GeneratedTask {
  const exp = rng.int(2, 7);
  const value = 10 ** exp;
  if (rng.chance(0.5)) {
    return {
      prompt: `Räkna ut. ${$(`10^{${exp}}`)}`,
      answer: { kind: "number", value, display: num(value) },
      hint: "I en tiopotens är exponenten lika med antalet nollor efter ettan.",
      solutionSteps: [{ text: `Skriv en etta följd av ${exp} nollor.`, tex: `10^{${exp}} = ${num(value)}` }],
    };
  }
  return {
    prompt: `Skriv ${$(num(value))} som en tiopotens: ${$(`${num(value)} = 10^{\\square}`)}. Vilket tal ska stå i rutan?`,
    answer: { kind: "number", value: exp, display: String(exp) },
    hint: "Räkna nollorna.",
    solutionSteps: [{ text: `Talet har ${exp} nollor.`, tex: `${num(value)} = 10^{${exp}}` }],
  };
}

function powerInExpression(rng: Rng): GeneratedTask {
  const a = rng.int(2, 5);
  const b = rng.int(2, 4);
  const c = rng.int(2, 9);
  const plus = rng.chance(0.5);
  const v = plus ? a ** b + c : c * a ** b;
  return {
    prompt: `Räkna ut. ${$(plus ? `${a}^{${b}} + ${c}` : `${c} \\cdot ${a}^{${b}}`)}`,
    answer: { kind: "number", value: v, display: num(v) },
    hint: "Prioriteringsreglerna: potenser räknas före multiplikation och addition.",
    solutionSteps: [
      { text: "Potensen först.", tex: `${a}^{${b}} = ${a ** b}` },
      { text: "Sedan resten.", tex: plus ? `${a ** b} + ${c} = ${v}` : `${c} \\cdot ${a ** b} = ${v}` },
    ],
  };
}

function scientific(rng: Rng): GeneratedTask {
  const mantissaTenths = rng.int(11, 99);
  const mantissa = mantissaTenths / 10;
  const exp = rng.int(3, 8);
  const value = round(mantissa * 10 ** exp);
  return {
    prompt: `Skriv ${$(num(value))} i **grundpotensform**: ${$(`${num(value)} = ${num(mantissa)} \\cdot 10^{\\square}`)}. Vilket tal ska stå i rutan?`,
    answer: { kind: "number", value: exp, display: String(exp) },
    hint: `Hur många steg måste decimaltecknet flyttas för att ${plain(mantissa)} ska bli ${plain(value)}?`,
    solutionSteps: [
      { text: `Från ${$(num(mantissa))} till ${$(num(value))} flyttas decimaltecknet ${exp} steg åt höger.` },
      { text: "Det är samma sak som att multiplicera med", tex: `10^{${exp}} \\quad\\Rightarrow\\quad ${num(value)} = ${num(mantissa)} \\cdot 10^{${exp}}` },
    ],
  };
}

function negativeBase(rng: Rng): GeneratedTask {
  const base = rng.int(2, 5);
  const exp = rng.pick([2, 3, 4]);
  const withParens = rng.chance(0.5);
  const value = withParens ? (-base) ** exp : -(base ** exp);
  const repeated = Array(exp).fill(`(-${base})`).join(" \\cdot ");
  return {
    prompt: `Räkna ut. ${$(withParens ? `(-${base})^{${exp}}` : `-${base}^{${exp}}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: withParens
      ? `Parentesen betyder att hela −${base} upphöjs. Hur många minustecken multipliceras – ett jämnt eller udda antal?`
      : `Utan parentes upphöjs bara ${base}. Minustecknet sätts dit efteråt.`,
    solutionSteps: withParens
      ? [
          { text: `Hela ${$(`-${base}`)} multipliceras ${exp} gånger.`, tex: `(-${base})^{${exp}} = ${repeated}` },
          { text: exp % 2 === 0 ? "Ett jämnt antal minus ger plus." : "Ett udda antal minus ger minus.", tex: `= ${num(value)}` },
        ]
      : [
          { text: `Potensen räknas före minustecknet: ${$(`-${base}^{${exp}} = -(${base}^{${exp}})`)}.` },
          { text: "Räkna ut.", tex: `-(${base ** exp}) = ${num(value)}` },
        ],
  };
}

export const generator: Generator = {
  key: "powers/power-notation",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => compute(rng, 5, 3), () => writeAsPower(rng)])();
      case 2:
        return rng.pick([() => powersOfTen(rng), () => compute(rng, 9, 5), () => powerInExpression(rng)])();
      case 3:
        return rng.pick([() => scientific(rng), () => negativeBase(rng)])();
    }
  },
};
