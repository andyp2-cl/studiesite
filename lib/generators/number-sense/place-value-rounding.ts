import { $, num, plain, round } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Positionssystemet och avrundning.
// Lätt: vilken siffra står var, avrunda till tiotal/hundratal.
// Medel: siffrans värde, avrunda till tusental och till en decimal.
// Svår: avrunda till två decimaler, textuppgift, resonemang (minsta tal som avrundas till …).

const PLACES = ["ental", "tiotal", "hundratal", "tusental", "tiotusental", "hundratusental"] as const;
const PLACE_VALUE = [1, 10, 100, 1000, 10000, 100000];

const roundHint = (place: string) =>
  `Titta på siffran direkt till höger om ${place}ssiffran. Är den 5 eller större avrundar du uppåt, annars nedåt.`;

function digitAt(n: number, position: number): number {
  return Math.floor(n / PLACE_VALUE[position]) % 10;
}

/** A number with `digits` digits whose digit at `position` is not 0 (more interesting). */
function numberWith(rng: Rng, digits: number, position: number): number {
  for (;;) {
    const n = rng.int(10 ** (digits - 1), 10 ** digits - 1);
    if (digitAt(n, position) !== 0) return n;
  }
}

function whichDigit(rng: Rng): GeneratedTask {
  const position = rng.int(0, 3);
  const n = numberWith(rng, 4, position);
  const d = digitAt(n, position);
  return {
    prompt: `Vilken siffra står på **${PLACES[position]}splatsen** i talet ${$(num(n))}?`,
    answer: { kind: "number", value: d, display: String(d) },
    hint: "Räkna från höger: ental, tiotal, hundratal, tusental.",
    solutionSteps: [
      { text: `Från höger är platserna ental, tiotal, hundratal och tusental.` },
      { text: `På ${PLACES[position]}splatsen står ${d}.` },
    ],
  };
}

function digitValue(rng: Rng): GeneratedTask {
  const position = rng.int(1, 4);
  const n = numberWith(rng, rng.int(5, 6), position);
  const d = digitAt(n, position);
  const value = d * PLACE_VALUE[position];
  // Ask about the digit at this position, but only if the digit is unique in the number.
  if (String(n).split("").filter((c) => c === String(d)).length > 1) return digitValue(rng);
  return {
    prompt: `Vad är siffran **${d}** värd i talet ${$(num(n))}?`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Ta reda på vilken plats siffran ${d} står på. Står den på hundratalsplatsen är den värd ${d} hundra.`,
    solutionSteps: [
      { text: `Siffran ${d} står på ${PLACES[position]}splatsen.` },
      { text: `Den är alltså värd ${d} ${PLACES[position]}.`, tex: `${d} \\cdot ${num(PLACE_VALUE[position])} = ${num(value)}` },
    ],
  };
}

function roundWhole(rng: Rng, position: number, digits: number): GeneratedTask {
  const step = PLACE_VALUE[position];
  let n = rng.int(10 ** (digits - 1), 10 ** digits - 1);
  if (n % step === 0) n += rng.int(1, step - 1);
  const rounded = Math.round(n / step) * step;
  const next = digitAt(n, position - 1);
  return {
    prompt: `Avrunda ${$(num(n))} till närmaste **${PLACES[position]}**.`,
    answer: { kind: "number", value: rounded, display: num(rounded) },
    hint: roundHint(PLACES[position]),
    solutionSteps: [
      { text: `Siffran direkt till höger om ${PLACES[position]}ssiffran är ${next}.` },
      {
        text: next >= 5 ? `${next} är 5 eller större, så vi avrundar **uppåt**.` : `${next} är mindre än 5, så vi avrundar **nedåt**.`,
        tex: `${num(n)} \\approx ${num(rounded)}`,
      },
    ],
  };
}

/** Rounds a decimal given as an integer count of `unit` (e.g. 3465 thousandths) – exact, no float drift. */
function roundDecimal(rng: Rng, decimalsIn: number, decimalsOut: number): GeneratedTask {
  const scale = 10 ** decimalsIn;
  let units = rng.int(1 * scale, 30 * scale);
  const step = 10 ** (decimalsIn - decimalsOut);
  if (units % step === 0) units += rng.int(1, step - 1);
  const roundedUnits = Math.round(units / step) * step;
  const value = round(units / scale);
  const rounded = round(roundedUnits / scale);
  const placeName = decimalsOut === 1 ? "en decimal (tiondelar)" : "två decimaler (hundradelar)";
  const nextDigit = Math.floor(units / (step / 10)) % 10;
  return {
    prompt: `Avrunda ${$(num(value))} till **${placeName}**.`,
    answer: { kind: "number", value: rounded, display: num(rounded) },
    hint: `Titta på decimalen efter den ${decimalsOut === 1 ? "första" : "andra"} decimalen. Är den 5 eller större avrundar du uppåt.`,
    solutionSteps: [
      { text: `Siffran efter den ${decimalsOut === 1 ? "första" : "andra"} decimalen är ${nextDigit}.` },
      {
        text: nextDigit >= 5 ? "Den är 5 eller större – avrunda uppåt." : "Den är mindre än 5 – avrunda nedåt.",
        tex: `${num(value)} \\approx ${num(rounded)}`,
      },
    ],
  };
}

const CONTEXTS = [
  { what: "En konsert hade", unit: "besökare" },
  { what: "En fotbollsmatch hade", unit: "åskådare" },
  { what: "En stad har", unit: "invånare" },
  { what: "Ett spel laddades ner", unit: "gånger" },
];

function roundingStory(rng: Rng): GeneratedTask {
  const ctx = rng.pick(CONTEXTS);
  const position = rng.pick([2, 3]);
  const step = PLACE_VALUE[position];
  let n = rng.int(10000, 99999);
  if (n % step === 0) n += 37;
  const rounded = Math.round(n / step) * step;
  return {
    prompt: `${ctx.what} ${$(num(n))} ${ctx.unit}. En tidning avrundade talet till närmaste **${PLACES[position]}**. Vilket tal skrev tidningen?`,
    answer: { kind: "number", value: rounded, display: num(rounded) },
    hint: roundHint(PLACES[position]),
    solutionSteps: [
      { text: `Siffran till höger om ${PLACES[position]}ssiffran är ${digitAt(n, position - 1)}.` },
      { text: "Avrunda därefter.", tex: `${num(n)} \\approx ${num(rounded)}` },
    ],
  };
}

function smallestOrLargest(rng: Rng): GeneratedTask {
  const position = rng.pick([1, 2]);
  const step = PLACE_VALUE[position];
  const target = rng.int(3, 90) * step;
  const smallest = rng.chance(0.5);
  const value = smallest ? target - step / 2 : target + step / 2 - 1;
  return {
    prompt: `Ett heltal avrundas till närmaste ${PLACES[position]} och blir ${$(num(target))}. Vilket är det **${smallest ? "minsta" : "största"}** heltal det kan vara?`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Vid 5 avrundar man uppåt. Vilka heltal blir ${plain(target)} när man avrundar dem till närmaste ${PLACES[position]}?`,
    solutionSteps: [
      {
        text: `Tal från ${num(target - step / 2)} till ${num(target + step / 2 - 1)} avrundas till ${num(target)}.`,
      },
      { text: `Det ${smallest ? "minsta" : "största"} är alltså ${num(value)}.` },
    ],
  };
}

export const generator: Generator = {
  key: "number-sense/place-value-rounding",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => whichDigit(rng), () => roundWhole(rng, rng.pick([1, 2]), rng.pick([3, 4]))])();
      case 2:
        return rng.pick([
          () => digitValue(rng),
          () => roundWhole(rng, 3, 5),
          () => roundDecimal(rng, 2, 1),
        ])();
      case 3:
        return rng.pick([
          () => roundDecimal(rng, 3, 2),
          () => roundingStory(rng),
          () => smallestOrLargest(rng),
        ])();
    }
  },
};
