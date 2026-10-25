import { $, num } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";
import { linear } from "./shared";

// Talmönster.
// Lätt: nästa tal i en följd som ökar eller minskar lika mycket.
// Medel: tal nummer 10, följder som fördubblas.
// Svår: formel för tal nummer n, vilken plats har ett tal, tändstickmönster.

const listTex = (xs: number[]) => `${xs.map(num).join(",\\; ")},\\; \\ldots`;

function arithmetic(rng: Rng): { start: number; diff: number; seq: number[] } {
  const diff = rng.chance(0.75) ? rng.int(2, 9) : -rng.int(2, 6);
  const start = diff > 0 ? rng.int(1, 20) : rng.int(40, 90);
  return { start, diff, seq: [0, 1, 2, 3].map((i) => start + i * diff) };
}

function nextNumber(rng: Rng): GeneratedTask {
  const { diff, seq } = arithmetic(rng);
  const next = seq[3] + diff;
  return {
    prompt: `Vilket tal kommer härnäst? ${$(listTex(seq))}`,
    answer: { kind: "number", value: next, display: num(next) },
    hint: "Hur mycket ökar eller minskar talen varje gång?",
    solutionSteps: [
      { text: `Talen ${diff > 0 ? "ökar" : "minskar"} med ${Math.abs(diff)} varje gång.` },
      { text: "Nästa tal:", tex: `${num(seq[3])} ${diff > 0 ? "+" : "-"} ${Math.abs(diff)} = ${num(next)}` },
    ],
  };
}

function tenthNumber(rng: Rng): GeneratedTask {
  const diff = rng.int(2, 9);
  const start = rng.int(1, 15);
  const seq = [0, 1, 2, 3].map((i) => start + i * diff);
  const n = rng.pick([10, 12, 15, 20]);
  const value = start + (n - 1) * diff;
  return {
    prompt: `Vilket är tal nummer **${n}** i följden ${$(listTex(seq))}`,
    answer: { kind: "number", value, display: num(value) },
    hint: `Från tal nummer 1 till tal nummer ${n} är det ${n - 1} steg. Varje steg är +${diff}.`,
    solutionSteps: [
      { text: `Följden ökar med ${diff}. Till tal nummer ${n} är det ${n - 1} steg.` },
      { text: "Räkna ut.", tex: `${start} + ${n - 1} \\cdot ${diff} = ${start} + ${(n - 1) * diff} = ${value}` },
    ],
  };
}

function doubling(rng: Rng): GeneratedTask {
  const factor = rng.pick([2, 2, 3]);
  const start = rng.int(1, 5);
  const seq = [0, 1, 2, 3].map((i) => start * factor ** i);
  const next = seq[3] * factor;
  return {
    prompt: `Vilket tal kommer härnäst? ${$(listTex(seq))}`,
    answer: { kind: "number", value: next, display: num(next) },
    hint: "Ökar talen lika mycket varje gång – eller multipliceras de med samma tal?",
    solutionSteps: [
      { text: `Varje tal är ${factor} gånger det förra.` },
      { text: "Nästa tal:", tex: `${seq[3]} \\cdot ${factor} = ${next}` },
    ],
  };
}

function formula(rng: Rng): GeneratedTask {
  const diff = rng.int(2, 7);
  const start = rng.int(1, 12);
  const seq = [0, 1, 2, 3].map((i) => start + i * diff);
  const constant = start - diff;
  const f = linear([
    { coef: diff, v: "n" },
    { coef: constant, v: "" },
  ]);
  return {
    prompt: `Skriv en formel för tal nummer ${$("n")} i följden ${$(listTex(seq))}`,
    answer: { kind: "expression", expr: f.text, variables: ["n"], display: f.tex },
    hint: `Talen ökar med ${diff}, så formeln börjar med ${diff}n. Vad måste du lägga till eller dra bort för att tal nummer 1 ska bli ${start}?`,
    solutionSteps: [
      { text: `Ökningen ${diff} står framför $n$.`, tex: `${diff}n` },
      {
        text:
          constant === 0
            ? `För $n = 1$ ger ${diff}n talet ${diff} – det stämmer redan.`
            : `För $n = 1$ ger ${diff}n talet ${diff}, men det ska vara ${start}. ${constant > 0 ? `Lägg till ${constant}` : `Dra bort ${-constant}`}.`,
        tex: f.tex,
      },
      { text: "Kontroll, tal nummer 2:", tex: `${diff} \\cdot 2 ${constant >= 0 ? "+" : "-"} ${Math.abs(constant)} = ${seq[1]}` },
    ],
  };
}

function whichPlace(rng: Rng): GeneratedTask {
  const diff = rng.int(3, 8);
  const start = rng.int(1, 10);
  const seq = [0, 1, 2, 3].map((i) => start + i * diff);
  const place = rng.int(8, 25);
  const target = start + (place - 1) * diff;
  return {
    prompt: `I följden ${$(listTex(seq))} – vilket nummer i ordningen har talet ${$(num(target))}?`,
    answer: { kind: "number", value: place, display: num(place) },
    hint: `Hur många steg på ${diff} behövs för att komma från ${start} till ${target}?`,
    solutionSteps: [
      { text: "Antal steg från första talet:", tex: `(${target} - ${start}) / ${diff} = ${place - 1}` },
      { text: "Första talet är nummer 1, så lägg till 1.", tex: `${place - 1} + 1 = ${place}` },
    ],
  };
}

function matchsticks(rng: Rng): GeneratedTask {
  // Squares in a row: 4, 7, 10, … (3n + 1); triangles: 3, 5, 7, … (2n + 1)
  const shape = rng.pick([
    { name: "kvadrater", per: 3, first: 4 },
    { name: "trianglar", per: 2, first: 3 },
  ]);
  const n = rng.pick([10, 15, 20, 25]);
  const value = shape.first + (n - 1) * shape.per;
  const seq = [1, 2, 3].map((i) => shape.first + (i - 1) * shape.per);
  return {
    prompt: `Med tändstickor bygger man ${shape.name} på rad. Figur 1 har ${seq[0]} stickor, figur 2 har ${seq[1]} och figur 3 har ${seq[2]}. Hur många stickor behövs till **figur ${n}**?`,
    answer: { kind: "number", value, display: `${value}\\text{ stickor}`, unit: "stickor" },
    hint: `Varje ny figur behöver ${shape.per} stickor till. Hur många nya figurer är det från figur 1 till figur ${n}?`,
    solutionSteps: [
      { text: `Varje figur har ${shape.per} stickor mer än den förra.` },
      { text: `Figur ${n}:`, tex: `${shape.first} + ${n - 1} \\cdot ${shape.per} = ${value}` },
    ],
  };
}

export const generator: Generator = {
  key: "algebra/number-patterns",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return nextNumber(rng);
      case 2:
        return rng.pick([() => tenthNumber(rng), () => doubling(rng)])();
      case 3:
        return rng.pick([() => formula(rng), () => whichPlace(rng), () => matchsticks(rng)])();
    }
  },
};
