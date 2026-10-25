import { $, num, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// De fyra räknesätten.
// Lätt: addition/subtraktion med tre siffror, multiplikationstabellen, jämn division.
// Medel: flersiffrig multiplikation och division, enkla vardagsuppgifter med pengar.
// Svår: textuppgifter i två steg och tolkning av rest (hur många bussar behövs?).

function addSub(rng: Rng): GeneratedTask {
  const a = rng.int(120, 899);
  const b = rng.int(25, 99) + rng.int(0, 3) * 100;
  if (rng.chance(0.5)) {
    const value = a + b;
    return {
      prompt: `Räkna ut. ${$(`${a} + ${b}`)}`,
      answer: { kind: "number", value, display: num(value) },
      hint: "Dela upp talen: addera hundratal, tiotal och ental för sig.",
      solutionSteps: [{ text: "Addera hundratal, tiotal och ental (eller ställ upp).", tex: `${a} + ${b} = ${num(value)}` }],
    };
  }
  const [big, small] = a > b ? [a, b] : [b, a];
  const value = big - small;
  return {
    prompt: `Räkna ut. ${$(`${big} - ${small}`)}`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Du kan räkna uppåt från ${small} till ${big} – hur långt är det?`,
    solutionSteps: [
      { text: "Ställ upp eller räkna uppåt från det mindre talet.", tex: `${big} - ${small} = ${num(value)}` },
      { text: "Kontrollera med addition:", tex: `${small} + ${value} = ${big}` },
    ],
  };
}

function table(rng: Rng): GeneratedTask {
  const a = rng.int(3, 10);
  const b = rng.int(3, 12);
  if (rng.chance(0.5)) {
    return {
      prompt: `Räkna ut. ${$(`${a} \\cdot ${b}`)}`,
      answer: { kind: "number", value: a * b, display: num(a * b) },
      hint: `${a} gånger ${b} är ${b} + ${b} + … (${a} gånger). Kan du en närliggande tabell?`,
      solutionSteps: [{ text: "Multiplikationstabellen:", tex: `${a} \\cdot ${b} = ${a * b}` }],
    };
  }
  return {
    prompt: `Räkna ut. ${$(`${a * b} / ${a}`)}`,
    answer: { kind: "number", value: b, display: num(b) },
    hint: `Vilket tal gånger ${a} blir ${a * b}?`,
    solutionSteps: [
      { text: `Division är motsatsen till multiplikation: vilket tal gånger ${a} blir ${a * b}?`, tex: `${a} \\cdot ${b} = ${a * b}` },
      { text: "Alltså:", tex: `${a * b} / ${a} = ${b}` },
    ],
  };
}

function multiDigit(rng: Rng): GeneratedTask {
  if (rng.chance(0.5)) {
    const a = rng.int(12, 49);
    const b = rng.int(3, 9);
    const tens = Math.floor(a / 10) * 10;
    const ones = a % 10;
    return {
      prompt: `Räkna ut. ${$(`${a} \\cdot ${b}`)}`,
      answer: { kind: "number", value: a * b, display: num(a * b) },
      hint: `Dela upp ${a} i ${tens} och ${ones}. Multiplicera båda delarna med ${b} och lägg ihop.`,
      solutionSteps: [
        { text: `Dela upp ${a} = ${tens} + ${ones}.`, tex: `${tens} \\cdot ${b} = ${tens * b} \\quad ${ones} \\cdot ${b} = ${ones * b}` },
        { text: "Lägg ihop.", tex: `${tens * b} + ${ones * b} = ${a * b}` },
      ],
    };
  }
  const b = rng.int(3, 9);
  const q = rng.int(21, 99);
  const a = b * q;
  return {
    prompt: `Räkna ut. ${$(`${a} / ${b}`)}`,
    answer: { kind: "number", value: q, display: num(q) },
    hint: `Hur många gånger går ${b} i ${a}? Börja med hundratalen eller tiotalen, t.ex. ${b} · 10 = ${b * 10}.`,
    solutionSteps: [
      { text: `Dela upp ${a} i delar som ${b} går jämnt upp i.`, tex: `${b * Math.floor(q / 10) * 10} + ${b * (q % 10)} = ${a}` },
      { text: "Dela varje del och lägg ihop.", tex: `${Math.floor(q / 10) * 10} + ${q % 10} = ${q}` },
    ],
  };
}

const ITEMS = [
  { item: "biobiljetter", price: [95, 105, 115, 125] },
  { item: "pizzor", price: [89, 95, 109, 119] },
  { item: "fotbollar", price: [149, 179, 199] },
  { item: "böcker", price: [79, 99, 129, 149] },
];

function shopping(rng: Rng): GeneratedTask {
  const { item, price: prices } = rng.pick(ITEMS);
  const price = rng.pick(prices);
  const count = rng.int(2, 6);
  const total = price * count;
  return {
    prompt: `${item[0].toUpperCase()}${item.slice(1)} kostar ${$(withUnit(price, "kr"))} styck. Vad kostar ${count} ${item}?`,
    answer: { kind: "number", value: total, display: withUnit(total, "kr"), unit: "kr" },
    hint: `Det är samma pris ${count} gånger. Vilket räknesätt passar?`,
    solutionSteps: [{ text: `Multiplicera priset med antalet.`, tex: `${price} \\cdot ${count} = ${num(total)}` }],
  };
}

function busesNeeded(rng: Rng): GeneratedTask {
  const seats = rng.pick([8, 9, 12, 15]);
  let pupils = rng.int(20, 90);
  if (pupils % seats === 0) pupils += rng.int(1, seats - 1);
  const buses = Math.ceil(pupils / seats);
  return {
    prompt: `${pupils} elever ska åka på utflykt. En minibuss rymmer ${seats} elever. Hur många minibussar behövs **minst**?`,
    answer: { kind: "number", value: buses, display: `${buses}\\text{ minibussar}`, unit: "st" },
    hint: "Dela antalet elever med antalet platser. Blir det en rest – kan några elever stanna hemma?",
    solutionSteps: [
      { text: "Dela antalet elever med platserna per buss.", tex: `${pupils} / ${seats} = ${Math.floor(pupils / seats)} \\text{ rest } ${pupils % seats}` },
      { text: `Resten (${pupils % seats} elever) behöver också en buss, så vi avrundar **uppåt**.`, tex: `${Math.floor(pupils / seats)} + 1 = ${buses}` },
    ],
  };
}

function change(rng: Rng): GeneratedTask {
  const price = rng.pick([149, 179, 199, 229, 249, 279]);
  const count = rng.int(2, 3);
  const paid = Math.ceil((price * count) / 500) * 500;
  const total = price * count;
  const back = paid - total;
  return {
    prompt: `Ellen köper ${count} tröjor för ${$(withUnit(price, "kr"))} styck och betalar med ${$(withUnit(paid, "kr"))}. Hur mycket får hon **tillbaka**?`,
    answer: { kind: "number", value: back, display: withUnit(back, "kr"), unit: "kr" },
    hint: "Räkna först ut vad tröjorna kostar tillsammans. Hur mycket är kvar av det hon betalade?",
    solutionSteps: [
      { text: "Vad kostar tröjorna?", tex: `${price} \\cdot ${count} = ${num(total)}` },
      { text: "Dra bort från det hon betalade.", tex: `${num(paid)} - ${num(total)} = ${num(back)}` },
    ],
  };
}

function shareBill(rng: Rng): GeneratedTask {
  const friends = rng.int(3, 6);
  const each = rng.int(8, 25) * 10;
  const bill = each * friends;
  return {
    prompt: `${friends} kompisar äter på restaurang. Notan blir ${$(withUnit(bill, "kr"))} och de delar lika. Hur mycket betalar **var och en**?`,
    answer: { kind: "number", value: each, display: withUnit(each, "kr"), unit: "kr" },
    hint: `Notan ska delas i ${friends} lika stora delar.`,
    solutionSteps: [{ text: "Dela notan med antalet kompisar.", tex: `${num(bill)} / ${friends} = ${each}` }],
  };
}

export const generator: Generator = {
  key: "number-sense/four-operations",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => addSub(rng), () => table(rng)])();
      case 2:
        return rng.pick([() => multiDigit(rng), () => multiDigit(rng), () => shopping(rng)])();
      case 3:
        return rng.pick([() => busesNeeded(rng), () => change(rng), () => shareBill(rng)])();
    }
  },
};
