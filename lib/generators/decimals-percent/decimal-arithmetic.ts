import { $, num, plain, round } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Räkna med decimaltal. Internally numbers are integers of tenths/hundredths,
// so results are exact (no 0.30000000000000004).
// Lätt: addition/subtraktion med en decimal, gånger/delat med 10, 100, 1000.
// Medel: decimaltal gånger heltal, decimaltal gånger decimaltal, priser.
// Svår: division med decimaltal, vardagsuppgift med växel.

/** Money in TeX with two decimals: 24{,}90\text{ kr}. */
export function money(kr: number): string {
  const [int, dec] = kr.toFixed(2).split(".");
  return `${int}{,}${dec}\\text{ kr}`;
}

function addSub(rng: Rng): GeneratedTask {
  const a = rng.int(12, 99) / 10;
  const b = rng.int(12, 99) / 10;
  if (rng.chance(0.5)) {
    const value = round(a + b);
    return {
      prompt: `Räkna ut. ${$(`${num(a)} + ${num(b)}`)}`,
      answer: { kind: "number", value, display: num(value) },
      hint: "Addera heltalen för sig och tiondelarna för sig. Tio tiondelar blir en hel.",
      solutionSteps: [
        { text: "Ställ upp så att decimaltecknen hamnar under varandra.", tex: `${num(a)} + ${num(b)} = ${num(value)}` },
      ],
    };
  }
  const [big, small] = a >= b ? [a, b] : [b, a];
  const value = round(big - small);
  return {
    prompt: `Räkna ut. ${$(`${num(big)} - ${num(small)}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Räkna uppåt från ${plain(small)} till ${plain(big)}, eller ställ upp med decimaltecknen under varandra.`,
    solutionSteps: [
      { text: "Ställ upp med decimaltecknen under varandra.", tex: `${num(big)} - ${num(small)} = ${num(value)}` },
      { text: "Kontrollera:", tex: `${num(small)} + ${num(value)} = ${num(big)}` },
    ],
  };
}

function powersOfTen(rng: Rng): GeneratedTask {
  const x = rng.int(12, 9999) / rng.pick([10, 100]);
  const factor = rng.pick([10, 100, 1000]);
  const multiply = rng.chance(0.5);
  const value = round(multiply ? x * factor : x / factor);
  const zeros = String(factor).length - 1;
  return {
    prompt: `Räkna ut. ${$(`${num(x)} ${multiply ? "\\cdot" : "/"} ${num(factor)}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: `${multiply ? "Gånger" : "Delat med"} ${factor} flyttar decimaltecknet ${zeros} steg åt ${multiply ? "höger" : "vänster"} (lika många som antalet nollor).`,
    solutionSteps: [
      { text: `Flytta decimaltecknet ${zeros} steg åt ${multiply ? "höger – talet blir större" : "vänster – talet blir mindre"}.`, tex: `${num(x)} ${multiply ? "\\cdot" : "/"} ${num(factor)} = ${num(value)}` },
    ],
  };
}

function decimalTimesWhole(rng: Rng): GeneratedTask {
  const hundredths = rng.int(105, 995);
  const x = hundredths / 100;
  const k = rng.int(2, 9);
  const value = (hundredths * k) / 100;
  return {
    prompt: `Räkna ut. ${$(`${num(x)} \\cdot ${k}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Räkna ${hundredths} · ${k} som heltal. Sätt sedan tillbaka två decimaler.`,
    solutionSteps: [
      { text: "Räkna utan decimaltecken.", tex: `${hundredths} \\cdot ${k} = ${hundredths * k}` },
      { text: `${num(x)} har två decimaler, så svaret får två decimaler.`, tex: `${num(x)} \\cdot ${k} = ${num(value)}` },
    ],
  };
}

function decimalTimesDecimal(rng: Rng): GeneratedTask {
  const a = rng.int(2, 9);
  const b = rng.int(2, 9);
  const ai = rng.chance(0.5) ? a : a + 10 * rng.int(1, 3);
  const x = ai / 10;
  const y = b / 10;
  const value = (ai * b) / 100;
  return {
    prompt: `Räkna ut. ${$(`${num(x)} \\cdot ${num(y)}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: "Räkna som heltal och sätt tillbaka lika många decimaler som faktorerna har tillsammans.",
    solutionSteps: [
      { text: "Utan decimaltecken:", tex: `${ai} \\cdot ${b} = ${ai * b}` },
      { text: "Faktorerna har en decimal var – två decimaler totalt.", tex: `${num(x)} \\cdot ${num(y)} = ${num(value)}` },
    ],
  };
}

const PRODUCTS = [
  { name: "äpplen", unit: "kg", price: [19.9, 24.9, 29.5] },
  { name: "lösgodis", unit: "hg", price: [9.9, 12.5, 7.9] },
  { name: "bananer", unit: "kg", price: [22.9, 25.5, 18.9] },
];

function pricePerUnit(rng: Rng): GeneratedTask {
  const p = rng.pick(PRODUCTS);
  const price = rng.pick(p.price);
  const amount = rng.int(2, 5);
  const cents = Math.round(price * 100) * amount;
  const value = cents / 100;
  return {
    prompt: `${p.name[0].toUpperCase()}${p.name.slice(1)} kostar ${$(`${money(price)}/\\text{${p.unit}}`)}. Vad kostar ${amount} ${p.unit}?`,
    answer: { kind: "number", value, display: money(value), unit: "kr" },
    hint: `Det är samma pris ${amount} gånger. Räkna i ören om det blir lättare: ${Math.round(price * 100)} öre · ${amount}.`,
    solutionSteps: [{ text: "Multiplicera priset med mängden.", tex: `${num(price)} \\cdot ${amount} = ${num(value)}` }],
  };
}

function decimalDivision(rng: Rng): GeneratedTask {
  if (rng.chance(0.5)) {
    // a / b with b one decimal: 7,2 / 0,8 = 9
    const b = rng.int(2, 9);
    const q = rng.int(2, 12);
    const a = (b * q) / 10;
    return {
      prompt: `Räkna ut. ${$(`${num(a)} / ${num(b / 10)}`)}`,
      answer: { kind: "number", value: q, display: num(q) },
      hint: "Multiplicera båda talen med 10 så slipper du decimaltecknet i nämnaren. Kvoten blir densamma.",
      solutionSteps: [
        { text: "Förläng med 10 – kvoten ändras inte.", tex: `${num(a)} / ${num(b / 10)} = ${num(a * 10)} / ${b}` },
        { text: "Räkna ut.", tex: `${num(a * 10)} / ${b} = ${q}` },
      ],
    };
  }
  // a / k with a decimal answer: 9,6 / 4 = 2,4
  const k = rng.int(2, 8);
  let tenths = rng.int(11, 60);
  // The dividend must itself be a decimal number (not 5 / 2).
  while ((tenths * k) % 10 === 0) tenths++;
  const a = (tenths * k) / 10;
  const value = tenths / 10;
  return {
    prompt: `Räkna ut. ${$(`${num(a)} / ${k}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Räkna med tiondelar: ${plain(a)} är ${tenths * k} tiondelar. Dela dem med ${k}.`,
    solutionSteps: [
      { text: "Räkna i tiondelar.", tex: `${tenths * k} / ${k} = ${tenths} \\text{ tiondelar}` },
      { text: `${tenths} tiondelar är`, tex: num(value) },
    ],
  };
}

function changeStory(rng: Rng): GeneratedTask {
  const a = rng.pick([12.5, 14.9, 18.5, 9.9]);
  const countA = rng.int(2, 3);
  const b = rng.pick([7.5, 8.75, 11.25, 6.9]);
  const totalCents = Math.round(a * 100) * countA + Math.round(b * 100);
  const paid = Math.ceil(totalCents / 5000) * 50;
  const backCents = paid * 100 - totalCents;
  return {
    prompt: `Maja köper ${countA} smörgåsar för ${$(money(a))} styck och en dricka för ${$(money(b))}. Hon betalar med ${$(`${paid}\\text{ kr}`)}. Hur mycket får hon **tillbaka**?`,
    answer: { kind: "number", value: backCents / 100, display: money(backCents / 100), unit: "kr" },
    hint: "Räkna först ut vad allt kostar tillsammans. Dra sedan bort det från det hon betalade.",
    solutionSteps: [
      { text: "Smörgåsarna:", tex: `${num(a)} \\cdot ${countA} = ${num(round(a * countA))}` },
      { text: "Totalt:", tex: `${num(round(a * countA))} + ${num(b)} = ${num(totalCents / 100)}` },
      { text: "Växel:", tex: `${paid} - ${num(totalCents / 100)} = ${num(backCents / 100)}` },
    ],
  };
}

export const generator: Generator = {
  key: "decimals-percent/decimal-arithmetic",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => addSub(rng), () => powersOfTen(rng)])();
      case 2:
        return rng.pick([() => decimalTimesWhole(rng), () => decimalTimesDecimal(rng), () => pricePerUnit(rng)])();
      case 3:
        return rng.pick([() => decimalDivision(rng), () => decimalDivision(rng), () => changeStory(rng)])();
    }
  },
};
