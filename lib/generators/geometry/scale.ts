import { $, num, plain, round, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Skala (inspired by Matteboken åk 7: 1:100 = 1 cm på ritningen är 100 cm i verkligheten).
// Lätt: ritning i 1:50/1:100 → verklig längd i meter.
// Medel: karta 1:10 000–1:100 000 → verklig sträcka; förstoring 5:1 → verklig storlek.
// Svår: bestäm skalan, verklighet → ritning.

const scaleTex = (a: number, b: number) => `${num(a)}:${num(b)}`;

function drawingToReality(rng: Rng): GeneratedTask {
  const scale = rng.pick([50, 100, 200]);
  const drawn = rng.int(2, 12) + rng.pick([0, 0, 0.5]);
  const realCm = drawn * scale;
  const realM = round(realCm / 100);
  return {
    prompt: `En ritning av ett hus är i skala ${$(scaleTex(1, scale))}. Ett rum är ${$(withUnit(drawn, "cm"))} långt på ritningen. Hur långt är rummet i verkligheten? Svara i **meter**.`,
    answer: { kind: "number", value: realM, display: withUnit(realM, "m"), unit: "m" },
    hint: `Skalan 1:${scale} betyder att 1 cm på ritningen är ${scale} cm i verkligheten. Glöm inte att göra om till meter (100 cm = 1 m).`,
    solutionSteps: [
      { text: `Multiplicera med ${scale}.`, tex: `${num(drawn)} \\cdot ${scale} = ${withUnit(realCm, "cm")}` },
      { text: "Gör om till meter.", tex: `${num(realCm)}\\text{ cm} = ${withUnit(realM, "m")}` },
    ],
  };
}

function mapDistance(rng: Rng): GeneratedTask {
  const scale = rng.pick([10_000, 20_000, 25_000, 50_000, 100_000]);
  const drawn = rng.int(2, 12);
  const realCm = drawn * scale;
  const realKm = round(realCm / 100_000);
  const inMeters = realKm < 1;
  const value = inMeters ? round(realCm / 100) : realKm;
  const unit = inMeters ? "m" : "km";
  return {
    prompt: `På en karta i skala ${$(scaleTex(1, scale))} är avståndet mellan två hus ${$(withUnit(drawn, "cm"))}. Hur långt är det i verkligheten? Svara i **${inMeters ? "meter" : "kilometer"}**.`,
    answer: { kind: "number", value, display: withUnit(value, unit), unit },
    hint: `1 cm på kartan är ${plain(scale)} cm i verkligheten. ${inMeters ? "100 cm = 1 m." : "100 000 cm = 1 km."}`,
    solutionSteps: [
      { text: `Multiplicera med ${plain(scale)}.`, tex: `${drawn} \\cdot ${num(scale)} = ${withUnit(realCm, "cm")}` },
      inMeters
        ? { text: "Dela med 100 för att få meter.", tex: `${num(realCm)} / 100 = ${withUnit(value, "m")}` }
        : { text: "Dela med 100 000 för att få kilometer (1 km = 1 000 m = 100 000 cm).", tex: `${num(realCm)} / ${num(100_000)} = ${withUnit(value, "km")}` },
    ],
  };
}

const SMALL = [
  { name: "En myra", real: [4, 5, 6, 8] },
  { name: "En nyckelpiga", real: [5, 6, 7] },
  { name: "Ett riskorn", real: [3, 4, 5] },
];

function enlargement(rng: Rng): GeneratedTask {
  const thing = rng.pick(SMALL);
  const scale = rng.pick([5, 10, 20]);
  const real = rng.pick(thing.real);
  const drawn = real * scale;
  return {
    prompt: `${thing.name} är förstorad i skala ${$(scaleTex(scale, 1))} på en bild. På bilden är den ${$(withUnit(drawn, "mm"))} lång. Hur lång är den i verkligheten? Svara i **mm**.`,
    answer: { kind: "number", value: real, display: withUnit(real, "mm"), unit: "mm" },
    hint: `${scale}:1 är en förstoring – bilden är ${scale} gånger större än verkligheten. Ska du då multiplicera eller dividera?`,
    solutionSteps: [
      { text: `Bilden är ${scale} gånger större, så dela med ${scale}.`, tex: `${drawn} / ${scale} = ${withUnit(real, "mm")}` },
    ],
  };
}

function findScale(rng: Rng): GeneratedTask {
  const meters = rng.pick([50, 100, 200, 250, 500, 1000]);
  const scale = meters * 100;
  return {
    prompt: `På en karta motsvarar ${$(withUnit(1, "cm"))} hela ${$(withUnit(meters, "m"))} i verkligheten. Skalan skrivs ${$("1:x")}. Vilket tal är ${$("x")}?`,
    answer: { kind: "number", value: scale, display: num(scale) },
    hint: "Båda talen i en skala ska ha samma enhet. Gör om metrarna till centimeter.",
    solutionSteps: [
      { text: "Gör om till centimeter.", tex: `${meters}\\text{ m} = ${meters} \\cdot 100 = ${withUnit(scale, "cm")}` },
      { text: "1 cm motsvarar alltså", tex: `${num(scale)}\\text{ cm} \\quad\\Rightarrow\\quad 1:${num(scale)}` },
    ],
  };
}

function realityToDrawing(rng: Rng): GeneratedTask {
  const scale = rng.pick([20, 50, 100]);
  const cmOnDrawing = rng.int(3, 15);
  const realM = round((cmOnDrawing * scale) / 100);
  return {
    prompt: `Ett rum är ${$(withUnit(realM, "m"))} långt. Hur långt blir det på en ritning i skala ${$(scaleTex(1, scale))}? Svara i **cm**.`,
    answer: { kind: "number", value: cmOnDrawing, display: withUnit(cmOnDrawing, "cm"), unit: "cm" },
    hint: `Gör om metrarna till cm först. På ritningen är allt ${scale} gånger mindre.`,
    solutionSteps: [
      { text: "Gör om till cm.", tex: `${num(realM)}\\text{ m} = ${withUnit(realM * 100, "cm")}` },
      { text: `Dela med ${scale}.`, tex: `${num(realM * 100)} / ${scale} = ${withUnit(cmOnDrawing, "cm")}` },
    ],
  };
}

export const generator: Generator = {
  key: "geometry/scale",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return drawingToReality(rng);
      case 2:
        return rng.pick([() => mapDistance(rng), () => enlargement(rng)])();
      case 3:
        return rng.pick([() => findScale(rng), () => realityToDrawing(rng), () => mapDistance(rng)])();
    }
  },
};
