import { $, num, plain, round, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Enhetsomvandling.
// Lätt: längd (km, m, dm, cm, mm).
// Medel: volym (l, dl, cl, ml) och massa (kg, hg, g).
// Svår: area (m², dm², cm²) och volym (dm³, cm³, liter).

type Unit = { name: string; factor: number };

// factor = how many of the smallest unit in the family one unit is.
const LENGTH: Unit[] = [
  { name: "km", factor: 1_000_000 },
  { name: "m", factor: 1000 },
  { name: "dm", factor: 100 },
  { name: "cm", factor: 10 },
  { name: "mm", factor: 1 },
];
const VOLUME: Unit[] = [
  { name: "l", factor: 1000 },
  { name: "dl", factor: 100 },
  { name: "cl", factor: 10 },
  { name: "ml", factor: 1 },
];
const MASS: Unit[] = [
  { name: "kg", factor: 1000 },
  { name: "hg", factor: 100 },
  { name: "g", factor: 1 },
];
const AREA: Unit[] = [
  { name: "m²", factor: 10_000 },
  { name: "dm²", factor: 100 },
  { name: "cm²", factor: 1 },
];
const CUBIC: Unit[] = [
  { name: "dm³", factor: 1000 },
  { name: "liter", factor: 1000 },
  { name: "cm³", factor: 1 },
  { name: "ml", factor: 1 },
];

/** Picks two different units (not km ↔ mm) and a value that converts to something readable. */
function convert(rng: Rng, units: Unit[], context: string): GeneratedTask {
  let from: Unit;
  let to: Unit;
  do {
    from = rng.pick(units);
    to = rng.pick(units);
  } while (from.factor === to.factor || Math.max(from.factor, to.factor) / Math.min(from.factor, to.factor) > 10_000);

  const ratio = from.factor / to.factor;
  const bigger = ratio > 1;
  // Choose a value so the answer has at most two decimals.
  const value = bigger ? rng.int(2, 95) / rng.pick([1, 10]) : rng.int(1, 99) * (to.factor / from.factor) / rng.pick([1, 10, 100]);
  const result = round(value * ratio);
  if (result >= 1_000_000 || result < 0.01 || value < 0.01) return convert(rng, units, context);

  const step = bigger ? ratio : 1 / ratio;
  return {
    prompt: `Hur många ${to.name} är ${$(withUnit(round(value), from.name))}?`,
    answer: { kind: "number", value: result, display: withUnit(result, to.name), unit: to.name },
    hint: `${bigger ? `1 ${from.name} = ${plain(ratio)} ${to.name}` : `1 ${to.name} = ${plain(1 / ratio)} ${from.name}`}. ${bigger ? "Till en mindre enhet blir talet större – multiplicera." : "Till en större enhet blir talet mindre – dividera."} ${context}`,
    solutionSteps: [
      { text: `Samband:`, tex: bigger ? `1\\text{ ${tex(from.name)}} = ${num(ratio)}\\text{ ${tex(to.name)}}` : `1\\text{ ${tex(to.name)}} = ${num(1 / ratio)}\\text{ ${tex(from.name)}}` },
      { text: bigger ? `Multiplicera med ${plain(step)}.` : `Dividera med ${plain(step)}.`, tex: `${num(round(value))} ${bigger ? "\\cdot" : "/"} ${num(step)} = ${num(result)}` },
    ],
  };
}

/** Unit names in \text{}: superscripts must be outside text mode. */
function tex(name: string): string {
  return name.replace("²", "}^2\\text{").replace("³", "}^3\\text{").replace(/\\text\{\}$/, "");
}

export const generator: Generator = {
  key: "geometry/unit-conversion",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return convert(rng, LENGTH, "Mellan mm, cm, dm och m är varje steg gånger 10, och 1 km = 1 000 m.");
      case 2:
        return rng.pick([
          () => convert(rng, VOLUME, "Mellan l, dl, cl och ml är varje steg gånger 10."),
          () => convert(rng, MASS, "1 kg = 10 hg = 1 000 g."),
        ])();
      case 3:
        return rng.pick([
          () => convert(rng, AREA, "För area är varje steg gånger 100 (10 · 10)."),
          () => convert(rng, CUBIC, "1 dm³ = 1 liter = 1 000 cm³, och 1 cm³ = 1 ml."),
        ])();
    }
  },
};
