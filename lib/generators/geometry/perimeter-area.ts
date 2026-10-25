import { circleFigure, houseFigure, parallelogramFigure, rectangleFigure, triangleFigure } from "@/lib/generators/figures";
import { $, frac, num, plain, round, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Omkrets och area: rektangel, triangel, parallellogram och cirkel (π ≈ 3,14).
// Lätt: rektangelns omkrets och area.
// Medel: triangel och parallellogram, sida ur area.
// Svår: cirkel, sammansatt figur.

const cm = (n: number) => `${plain(n)} cm`;

function rectangle(rng: Rng): GeneratedTask {
  const w = rng.int(3, 15);
  let h = rng.int(2, 12);
  if (h === w) h += 1;
  const figure = rectangleFigure(w, h, { bottom: cm(w), side: cm(h) });
  if (rng.chance(0.5)) {
    const value = 2 * (w + h);
    return {
      prompt: "Hur stor är rektangelns **omkrets**?",
      figure,
      answer: { kind: "number", value, display: withUnit(value, "cm"), unit: "cm" },
      hint: "Omkretsen är längden runt hela figuren – alla fyra sidor tillsammans.",
      solutionSteps: [
        { text: "Två sidor är lika långa på varje håll.", tex: `${w} + ${h} + ${w} + ${h}` },
        { text: "Räkna ut.", tex: `2 \\cdot ${w} + 2 \\cdot ${h} = ${value}\\text{ cm}` },
      ],
    };
  }
  const value = w * h;
  return {
    prompt: "Hur stor är rektangelns **area**?",
    figure,
    answer: { kind: "number", value, display: withUnit(value, "cm²"), unit: "cm²" },
    hint: "Arean av en rektangel är basen gånger höjden. Svara i kvadratcentimeter (cm²).",
    solutionSteps: [{ text: "Area = bas · höjd.", tex: `${w} \\cdot ${h} = ${withUnit(value, "cm²")}` }],
  };
}

function triangle(rng: Rng): GeneratedTask {
  let b = rng.int(4, 16);
  const h = rng.int(3, 12);
  if ((b * h) % 2 !== 0) b += 1;
  const value = (b * h) / 2;
  return {
    prompt: "Hur stor är triangelns **area**?",
    figure: triangleFigure(b, h, { base: cm(b), height: cm(h) }, rng.pick([0.3, 0.5, 0.7])),
    answer: { kind: "number", value, display: withUnit(value, "cm²"), unit: "cm²" },
    hint: "En triangel är hälften av en rektangel (eller parallellogram) med samma bas och höjd.",
    solutionSteps: [
      { text: "Area = bas · höjd / 2.", tex: `${frac(`${b} \\cdot ${h}`, 2)} = ${frac(b * h, 2)}` },
      { text: "Räkna ut.", tex: withUnit(value, "cm²") },
    ],
  };
}

function parallelogram(rng: Rng): GeneratedTask {
  const b = rng.int(4, 15);
  const h = rng.int(3, 10);
  const value = b * h;
  return {
    prompt: "Hur stor är parallellogrammens **area**?",
    figure: parallelogramFigure(b, h, { base: cm(b), height: cm(h) }),
    answer: { kind: "number", value, display: withUnit(value, "cm²"), unit: "cm²" },
    hint: "En parallellogram kan klippas om till en rektangel. Använd höjden (den streckade linjen), inte den sneda sidan.",
    solutionSteps: [{ text: "Area = bas · höjd.", tex: `${b} \\cdot ${h} = ${withUnit(value, "cm²")}` }],
  };
}

function sideFromArea(rng: Rng): GeneratedTask {
  const w = rng.int(4, 12);
  const h = rng.int(3, 9);
  const area = w * h;
  return {
    prompt: `En rektangel har arean ${$(withUnit(area, "cm²"))}. Den ena sidan är ${$(withUnit(w, "cm"))}. Hur lång är den andra sidan?`,
    answer: { kind: "number", value: h, display: withUnit(h, "cm"), unit: "cm" },
    hint: `Arean är sida gånger sida. Vilket tal gånger ${w} blir ${area}?`,
    solutionSteps: [{ text: "Dela arean med den kända sidan.", tex: `${area} / ${w} = ${withUnit(h, "cm")}` }],
  };
}

function circle(rng: Rng): GeneratedTask {
  const useRadius = rng.chance(0.6);
  const r = rng.int(2, 10);
  const d = 2 * r;
  const askArea = rng.chance(0.5);
  const value = round(askArea ? 3.14 * r * r : 3.14 * d);
  const rounded = Math.round(value * 10) / 10;
  const unit = askArea ? "cm²" : "cm";
  return {
    prompt: `Cirkeln har ${useRadius ? `radien ${$(withUnit(r, "cm"))}` : `diametern ${$(withUnit(d, "cm"))}`}. Hur stor är cirkelns **${askArea ? "area" : "omkrets"}**? Använd ${$("\\pi \\approx 3{,}14")} och avrunda till en decimal.`,
    figure: circleFigure(useRadius ? cm(r) : cm(d), useRadius ? "radius" : "diameter"),
    // Also accept answers computed with the exact π (difference < 0.5 %).
    answer: { kind: "number", value: rounded, display: withUnit(rounded, unit), unit, tolerance: Math.max(0.06, rounded * 0.006) },
    hint: askArea
      ? `Arean är π · r · r.${useRadius ? "" : " Radien är halva diametern."}`
      : `Omkretsen är π · d.${useRadius ? " Diametern är dubbla radien." : ""}`,
    solutionSteps: askArea
      ? [
          ...(useRadius ? [] : [{ text: "Radien är halva diametern.", tex: `r = ${d} / 2 = ${r}` }]),
          { text: "Area = π · r².", tex: `3{,}14 \\cdot ${r}^2 = 3{,}14 \\cdot ${r * r} = ${num(value)}` },
          { text: "Avrunda.", tex: `\\approx ${withUnit(rounded, "cm²")}` },
        ]
      : [
          ...(useRadius ? [{ text: "Diametern är dubbla radien.", tex: `d = 2 \\cdot ${r} = ${d}` }] : []),
          { text: "Omkrets = π · d.", tex: `3{,}14 \\cdot ${d} = ${num(value)}` },
          { text: "Avrunda.", tex: `\\approx ${withUnit(rounded, "cm")}` },
        ],
  };
}

function house(rng: Rng): GeneratedTask {
  const w = rng.int(3, 8) * 2;
  const wall = rng.int(3, 9);
  const roof = rng.int(2, 6);
  const rect = w * wall;
  const tri = (w * roof) / 2;
  const value = rect + tri;
  return {
    prompt: "Figuren består av en rektangel och en triangel. Hur stor är figurens **area**?",
    figure: houseFigure({ width: cm(w), wallHeight: cm(wall), roofHeight: cm(roof) }),
    answer: { kind: "number", value, display: withUnit(value, "cm²"), unit: "cm²" },
    hint: "Dela upp figuren: räkna ut rektangelns area och triangelns area var för sig, och lägg ihop.",
    solutionSteps: [
      { text: "Rektangeln:", tex: `${w} \\cdot ${wall} = ${rect}` },
      { text: "Triangeln (samma bas):", tex: `${frac(`${w} \\cdot ${roof}`, 2)} = ${tri}` },
      { text: "Tillsammans:", tex: `${rect} + ${tri} = ${withUnit(value, "cm²")}` },
    ],
  };
}

export const generator: Generator = {
  key: "geometry/perimeter-area",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rectangle(rng);
      case 2:
        return rng.pick([() => triangle(rng), () => parallelogram(rng), () => sideFromArea(rng)])();
      case 3:
        return rng.pick([() => circle(rng), () => circle(rng), () => house(rng)])();
    }
  },
};
