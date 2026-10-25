import {
  crossingLinesFigure,
  rightAngleSplitFigure,
  straightAngleFigure,
  triangleAnglesFigure,
} from "@/lib/generators/figures";
import { $, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Vinklar. Figures show the known angles; x is the unknown.
// Lätt: vinklar längs en rät linje (180°) och i en rät vinkel (90°).
// Medel: vinkelsumman i en triangel.
// Svår: likbent triangel, vertikalvinklar och sidovinklar, fyrhörning.

const deg = (n: number) => `${n}°`;
const answer = (value: number) => ({ kind: "number" as const, value, display: withUnit(value, "°"), unit: "°" });

function straightLine(rng: Rng): GeneratedTask {
  const a = rng.int(3, 15) * 10 + rng.pick([0, 5]);
  const x = 180 - a;
  return {
    prompt: "Hur stor är vinkeln $x$?",
    figure: straightAngleFigure(a, deg(a), "x"),
    answer: answer(x),
    hint: "Vinklarna längs en rät linje är tillsammans 180°.",
    solutionSteps: [
      { text: "En rät linje är 180°.", tex: `x + ${a}^\\circ = 180^\\circ` },
      { text: "Räkna ut.", tex: `x = 180^\\circ - ${a}^\\circ = ${x}^\\circ` },
    ],
  };
}

function rightAngle(rng: Rng): GeneratedTask {
  const a = rng.int(2, 8) * 10 + rng.pick([0, 5]);
  const x = 90 - a;
  return {
    prompt: "Vinkeln i hörnet är rät. Hur stor är vinkeln $x$?",
    figure: rightAngleSplitFigure(a, deg(a), "x"),
    answer: answer(x),
    hint: "Den lilla fyrkanten betyder rät vinkel, alltså 90°.",
    solutionSteps: [
      { text: "En rät vinkel är 90°.", tex: `x + ${a}^\\circ = 90^\\circ` },
      { text: "Räkna ut.", tex: `x = 90^\\circ - ${a}^\\circ = ${x}^\\circ` },
    ],
  };
}

function triangleSum(rng: Rng): GeneratedTask {
  const a = rng.int(30, 80);
  const b = rng.int(30, 150 - a);
  const c = 180 - a - b;
  const which = rng.int(0, 2) as 0 | 1 | 2;
  const angles = [a, b, c];
  const known = angles.filter((_, i) => i !== which);
  const labels = angles.map((v, i) => (i === which ? "x" : deg(v))) as [string, string, string];
  return {
    prompt: "Hur stor är vinkeln $x$ i triangeln?",
    figure: triangleAnglesFigure(a, b, labels, which),
    answer: answer(angles[which]),
    hint: "Vinklarna i en triangel är alltid tillsammans 180°.",
    solutionSteps: [
      { text: "Vinkelsumman i en triangel är 180°.", tex: `x + ${known[0]}^\\circ + ${known[1]}^\\circ = 180^\\circ` },
      { text: "Räkna ut.", tex: `x = 180^\\circ - ${known[0] + known[1]}^\\circ = ${angles[which]}^\\circ` },
    ],
  };
}

function isosceles(rng: Rng): GeneratedTask {
  const top = rng.int(2, 14) * 10;
  const base = (180 - top) / 2;
  return {
    prompt: `En likbent triangel har toppvinkeln ${$(`${top}^\\circ`)}. De två basvinklarna är lika stora. Hur stor är **en** basvinkel?`,
    figure: triangleAnglesFigure(base, base, ["x", "x", deg(top)], 0),
    answer: answer(base),
    hint: "De två basvinklarna är lika stora och tillsammans med toppvinkeln blir det 180°.",
    solutionSteps: [
      { text: "Basvinklarna tillsammans:", tex: `180^\\circ - ${top}^\\circ = ${180 - top}^\\circ` },
      { text: "Dela på två.", tex: `${180 - top}^\\circ / 2 = ${base}^\\circ` },
    ],
  };
}

function crossing(rng: Rng): GeneratedTask {
  const a = rng.int(3, 15) * 10 + rng.pick([0, 5]);
  const vertical = rng.chance(0.5);
  const x = vertical ? a : 180 - a;
  return {
    prompt: "Två räta linjer korsar varandra. Hur stor är vinkeln $x$?",
    figure: crossingLinesFigure(a, deg(a), "x", vertical),
    answer: answer(x),
    hint: vertical
      ? "Vinklar som ligger mittemot varandra (vertikalvinklar) är lika stora."
      : "Vinklar som ligger bredvid varandra längs en linje (sidovinklar) är tillsammans 180°.",
    solutionSteps: vertical
      ? [{ text: "x och den kända vinkeln är vertikalvinklar – de är lika stora.", tex: `x = ${a}^\\circ` }]
      : [{ text: "x och den kända vinkeln är sidovinklar – tillsammans 180°.", tex: `x = 180^\\circ - ${a}^\\circ = ${x}^\\circ` }],
  };
}

function quadrilateral(rng: Rng): GeneratedTask {
  const a = rng.int(6, 13) * 10;
  const b = rng.int(6, 13) * 10;
  const c = rng.int(5, 12) * 10;
  const x = 360 - a - b - c;
  if (x < 30 || x > 170) return quadrilateral(rng);
  return {
    prompt: `Tre av vinklarna i en fyrhörning är ${$(`${a}^\\circ`)}, ${$(`${b}^\\circ`)} och ${$(`${c}^\\circ`)}. Hur stor är den fjärde vinkeln?`,
    answer: answer(x),
    hint: "En fyrhörning kan delas i två trianglar. Vad blir då vinkelsumman?",
    solutionSteps: [
      { text: "Vinkelsumman i en fyrhörning är 360° (två trianglar).", tex: `x = 360^\\circ - ${a}^\\circ - ${b}^\\circ - ${c}^\\circ` },
      { text: "Räkna ut.", tex: `x = ${x}^\\circ` },
    ],
  };
}

export const generator: Generator = {
  key: "geometry/angles",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => straightLine(rng), () => rightAngle(rng)])();
      case 2:
        return triangleSum(rng);
      case 3:
        return rng.pick([() => isosceles(rng), () => crossing(rng), () => quadrilateral(rng)])();
    }
  },
};
