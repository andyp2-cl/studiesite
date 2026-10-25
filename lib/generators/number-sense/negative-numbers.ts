import { $, num, plain, term } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Negativa tal.
// Lätt: addition där svaret kan bli negativt, största av två negativa tal, termometer.
// Medel: subtraktion, minus ett negativt tal, temperaturskillnad.
// Svår: multiplikation och division med negativa tal, blandade uttryck, bankkonto.

const nonZero = (rng: Rng, min: number, max: number): number => {
  for (;;) {
    const n = rng.int(min, max);
    if (n !== 0) return n;
  }
};

function addition(rng: Rng): GeneratedTask {
  const a = rng.int(-12, -1);
  const b = rng.int(1, 15);
  const value = a + b;
  return {
    prompt: `Räkna ut. ${$(`${num(a)} + ${num(b)}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Tänk på en tallinje: starta på ${plain(a)} och gå ${b} steg åt höger.`,
    solutionSteps: [
      { text: `Starta på ${$(num(a))} och gå ${b} steg åt höger på tallinjen.` },
      { text: "Du hamnar på", tex: `${num(a)} + ${num(b)} = ${num(value)}` },
    ],
  };
}

function largest(rng: Rng): GeneratedTask {
  const a = rng.int(-20, -1);
  let b = rng.int(-20, -1);
  if (a === b) b = a - rng.int(1, 5);
  const value = Math.max(a, b);
  return {
    prompt: `Vilket tal är **störst**, ${$(num(a))} eller ${$(num(b))}?`,
    answer: { kind: "number", value, display: num(value) },
    hint: "På tallinjen är talet längst till höger störst. Vilket negativt tal ligger närmast noll?",
    solutionSteps: [
      { text: "Ju närmare noll ett negativt tal är, desto större är det." },
      { text: `${$(num(value))} ligger närmast noll.`, tex: `${num(Math.min(a, b))} < ${num(value)}` },
    ],
  };
}

function thermometer(rng: Rng): GeneratedTask {
  const start = rng.int(-15, -2);
  const warmer = rng.int(3, 18);
  const value = start + warmer;
  return {
    prompt: `Termometern visar ${$(`${num(start)}^\\circ\\text{C}`)} på morgonen. Till lunch har det blivit **${warmer} grader varmare**. Vad visar termometern då?`,
    answer: { kind: "number", value, display: `${num(value)}^\\circ\\text{C}`, unit: "°C" },
    hint: `Varmare betyder att temperaturen går uppåt. Börja på ${plain(start)} och räkna ${warmer} steg uppåt.`,
    solutionSteps: [
      { text: "Varmare betyder plus.", tex: `${num(start)} + ${warmer} = ${num(value)}` },
      { text: `Termometern visar ${$(`${num(value)}^\\circ\\text{C}`)}.` },
    ],
  };
}

function subtraction(rng: Rng): GeneratedTask {
  const variant = rng.int(0, 2);
  if (variant === 0) {
    // a - b with b > a: answer negative
    const a = rng.int(1, 10);
    const b = a + rng.int(2, 12);
    const value = a - b;
    return {
      prompt: `Räkna ut. ${$(`${a} - ${b}`)}`,
      answer: { kind: "number", value, display: num(value) },
      hint: `Starta på ${a} på tallinjen och gå ${b} steg åt vänster. Du passerar noll.`,
      solutionSteps: [
        { text: `Gå först ${a} steg ner till noll, sedan ${b - a} steg till.` },
        { text: "Svaret blir negativt.", tex: `${a} - ${b} = ${num(value)}` },
      ],
    };
  }
  if (variant === 1) {
    const a = rng.int(-10, 10);
    const b = rng.int(2, 12);
    const value = a + b;
    return {
      prompt: `Räkna ut. ${$(`${num(a)} - (${num(-b)})`)}`,
      answer: { kind: "number", value, display: num(value) },
      hint: "Minus ett negativt tal blir plus: att ta bort en skuld är samma sak som att få pengar.",
      solutionSteps: [
        { text: "Två minustecken i rad blir plus.", tex: `${num(a)} - (${num(-b)}) = ${num(a)} + ${b}` },
        { text: "Räkna ut.", tex: `${num(a)} + ${b} = ${num(value)}` },
      ],
    };
  }
  const a = rng.int(2, 12);
  const b = rng.int(2, 12);
  const value = -a - b;
  return {
    prompt: `Räkna ut. ${$(`-${a} - ${b}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Du startar på −${a} och ska gå ${b} steg till åt vänster.`,
    solutionSteps: [{ text: `Från ${$(`-${a}`)} går du ${b} steg åt vänster.`, tex: `-${a} - ${b} = ${num(value)}` }],
  };
}

function temperatureDifference(rng: Rng): GeneratedTask {
  const day = rng.int(1, 15);
  const night = rng.int(-15, -1);
  const value = day - night;
  return {
    prompt: `På dagen var det ${$(`${day}^\\circ\\text{C}`)} och på natten ${$(`${num(night)}^\\circ\\text{C}`)}. Hur många grader **skillnad** var det?`,
    answer: { kind: "number", value, display: `${value}\\text{ grader}`, unit: "°C" },
    hint: "Skillnaden är det högre värdet minus det lägre. Rita gärna en termometer och räkna stegen.",
    solutionSteps: [
      { text: "Skillnaden = högsta − lägsta.", tex: `${day} - (${num(night)}) = ${day} + ${-night} = ${value}` },
      { text: `Det skiljer ${value} grader.` },
    ],
  };
}

function multiplyDivide(rng: Rng): GeneratedTask {
  const a = nonZero(rng, -9, 9);
  const b = nonZero(rng, -9, 9);
  if (a > 0 && b > 0) return multiplyDivide(rng);
  const product = a * b;
  const sign = product > 0 ? "positivt" : "negativt";
  if (rng.chance(0.5)) {
    return {
      prompt: `Räkna ut. ${$(`${term(a)} \\cdot ${term(b)}`)}`,
      answer: { kind: "number", value: product, display: num(product) },
      hint: "Räkna först utan tecken. Sedan: lika tecken ger plus, olika tecken ger minus.",
      solutionSteps: [
        { text: "Utan tecken:", tex: `${Math.abs(a)} \\cdot ${Math.abs(b)} = ${Math.abs(product)}` },
        { text: `${a < 0 && b < 0 ? "Två minus ger plus" : "Ett minus ger minus"}, så svaret är ${sign}.`, tex: `${term(a)} \\cdot ${term(b)} = ${num(product)}` },
      ],
    };
  }
  return {
    prompt: `Räkna ut. ${$(`${num(product)} / ${term(b)}`)}`,
    answer: { kind: "number", value: a, display: num(a) },
    hint: "Dela först utan tecken. Lika tecken ger plus, olika tecken ger minus – precis som vid multiplikation.",
    solutionSteps: [
      { text: "Utan tecken:", tex: `${Math.abs(product)} / ${Math.abs(b)} = ${Math.abs(a)}` },
      { text: `Tecknen avgör: svaret är ${a > 0 ? "positivt" : "negativt"}.`, tex: `${num(product)} / ${term(b)} = ${num(a)}` },
    ],
  };
}

function mixedExpression(rng: Rng): GeneratedTask {
  const a = rng.int(2, 6);
  const b = rng.int(2, 6);
  const c = rng.int(-15, 15);
  const value = -a * b + c;
  return {
    prompt: `Räkna ut. ${$(`${c} + (-${a}) \\cdot ${b}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: "Multiplikationen först. Vilket tecken får ett negativt tal gånger ett positivt?",
    solutionSteps: [
      { text: "Multiplikation först. Olika tecken ger minus.", tex: `(-${a}) \\cdot ${b} = -${a * b}` },
      { text: "Addera sedan.", tex: `${c} + (-${a * b}) = ${num(value)}` },
    ],
  };
}

function bankAccount(rng: Rng): GeneratedTask {
  const debt = rng.int(2, 30) * 10;
  const deposit = rng.int(2, 60) * 10;
  const value = -debt + deposit;
  return {
    prompt: `Saldot på Sams konto är ${$(`-${debt}\\text{ kr}`)}. Han sätter in ${$(`${deposit}\\text{ kr}`)}. Vad blir saldot?`,
    answer: { kind: "number", value, display: `${num(value)}\\text{ kr}`, unit: "kr" },
    hint: "Ett negativt saldo betyder att man är skyldig pengar. Insättningen är ett plus.",
    solutionSteps: [{ text: "Insättning betyder plus.", tex: `-${debt} + ${deposit} = ${num(value)}` }],
  };
}

export const generator: Generator = {
  key: "number-sense/negative-numbers",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => addition(rng), () => largest(rng), () => thermometer(rng)])();
      case 2:
        return rng.pick([() => subtraction(rng), () => subtraction(rng), () => temperatureDifference(rng)])();
      case 3:
        return rng.pick([() => multiplyDivide(rng), () => mixedExpression(rng), () => bankAccount(rng)])();
    }
  },
};
