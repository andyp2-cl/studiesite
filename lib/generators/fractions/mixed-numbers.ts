import { $, frac } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, gcd, type Rng } from "@/lib/random";
import { add, F, mixedTex, partName, tex, value, type Frac } from "./shared";

// Blandad form.
// Lätt: oäkta bråk → blandad form.
// Medel: blandad form → bråk, och större oäkta bråk.
// Svår: vardagsuppgifter och addition av tal i blandad form.

/** An improper fraction n/d (not a whole number) in simplest form. */
function improper(rng: Rng, maxDen: number, maxWhole: number): Frac {
  for (;;) {
    const d = rng.int(2, maxDen);
    const n = d * rng.int(1, maxWhole) + rng.int(1, d - 1);
    if (gcd(n, d) === 1) return { n, d };
  }
}

function toMixed(rng: Rng, maxDen: number, maxWhole: number): GeneratedTask {
  const f = improper(rng, maxDen, maxWhole);
  const whole = Math.floor(f.n / f.d);
  const rest = f.n % f.d;
  return {
    prompt: `Skriv ${$(tex(f))} i **blandad form**.`,
    answer: { kind: "number", value: value(f), display: mixedTex(f), requireForm: "mixed" },
    hint: `Hur många hela gånger får ${f.d} plats i ${f.n}? Det som blir över är den nya täljaren. Skriv t.ex. 2 1/3.`,
    solutionSteps: [
      { text: `${f.d} får plats ${whole} hela gånger i ${f.n}, och ${rest} blir över.`, tex: `${f.n} / ${f.d} = ${whole} \\text{ rest } ${rest}` },
      { text: "Heltalet blir heltalsdelen, resten blir täljaren.", tex: `${tex(f)} = ${mixedTex(f)}` },
    ],
  };
}

function toFraction(rng: Rng): GeneratedTask {
  const f = improper(rng, 8, 5);
  const whole = Math.floor(f.n / f.d);
  const rest = f.n % f.d;
  return {
    prompt: `Skriv ${$(mixedTex(f))} som ett **bråk** (utan heltal framför).`,
    answer: { kind: "number", value: value(f), display: tex(f), requireForm: "fraction" },
    hint: `Hur många ${partName(f.d, true)} finns det i ${whole} hela? Lägg sedan till de ${rest} som redan finns.`,
    solutionSteps: [
      { text: `Varje hel är ${f.d} ${partName(f.d, true)}, så ${whole} hela är ${whole * f.d} ${partName(f.d, true)}.`, tex: `${whole} \\cdot ${f.d} = ${whole * f.d}` },
      { text: `Lägg till de ${rest} ${partName(f.d, rest > 1)}.`, tex: `${mixedTex(f)} = ${frac(`${whole * f.d} + ${rest}`, f.d)} = ${tex(f)}` },
    ],
  };
}

const BAKING = [
  { thing: "kanelbullar", container: "En plåt", plural: "plåtar", fits: [6, 8, 12] },
  { thing: "muffins", container: "En form", plural: "formar", fits: [6, 12] },
  { thing: "ägg", container: "En kartong", plural: "kartonger", fits: [6, 10, 12] },
];

function containersStory(rng: Rng): GeneratedTask {
  const ctx = rng.pick(BAKING);
  const per = rng.pick(ctx.fits);
  let total = rng.int(per + 1, per * 4);
  if (total % per === 0) total += 1;
  const f = F(total, per);
  return {
    prompt: `Det finns ${total} ${ctx.thing}. ${ctx.container} rymmer ${per}. Hur många ${ctx.plural} blir det? Svara i **blandad form**.`,
    answer: { kind: "number", value: value(f), display: mixedTex(f), requireForm: "mixed" },
    hint: `Dela ${total} med ${per}. Hur många blir hela, och hur stor del blir över?`,
    solutionSteps: [
      { text: "Dela.", tex: `${total} / ${per} = ${Math.floor(total / per)} \\text{ rest } ${total % per}` },
      { text: `Resten är ${total % per} av ${per}, alltså ${$(frac(total % per, per))}${gcd(total % per, per) > 1 ? ` = ${$(tex(F(total % per, per)))}` : ""}.`, tex: `${frac(total, per)} = ${mixedTex(f)}` },
    ],
  };
}

function addMixed(rng: Rng): GeneratedTask {
  const d = rng.pick([2, 3, 4, 5, 6, 8]);
  const a = F(d * rng.int(1, 3) + rng.int(1, d - 1), d);
  const b = F(d * rng.int(1, 3) + rng.int(1, d - 1), d);
  const sum = add(a, b);
  return {
    prompt: `Räkna ut och svara i blandad form. ${$(`${mixedTex(a)} + ${mixedTex(b)}`)}`,
    answer: { kind: "number", value: value(sum), display: mixedTex(sum), requireForm: "mixed" },
    hint: "Addera heltalen för sig och bråken för sig. Blir bråkdelen större än en hel växlar du in den.",
    solutionSteps: [
      { text: "Addera heltalen och bråkdelarna var för sig, eller gör om till bråk.", tex: `${mixedTex(a)} + ${mixedTex(b)} = ${tex(a)} + ${tex(b)} = ${tex(sum)}` },
      { text: "Skriv i blandad form.", tex: `${tex(sum)} = ${mixedTex(sum)}` },
    ],
  };
}

export const generator: Generator = {
  key: "fractions/mixed-numbers",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return toMixed(rng, 6, 3);
      case 2:
        return rng.pick([() => toFraction(rng), () => toMixed(rng, 10, 6)])();
      case 3:
        return rng.pick([() => containersStory(rng), () => addMixed(rng)])();
    }
  },
};
