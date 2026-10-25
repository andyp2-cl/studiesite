import { $, frac, num, round, withUnit } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Medelvärde, median och typvärde (lägesmått).
// Lätt: medelvärde (jämnt svar) och typvärde.
// Medel: median (udda och jämnt antal), variationsbredd, vardagsdata.
// Svår: saknat värde när medelvärdet är känt, medelvärde med decimal.

const list = (xs: number[]) => xs.map(num).join(",\\; ");

/** n numbers in [min, max] whose sum is divisible by n. */
function evenMean(rng: Rng, n: number, min: number, max: number): number[] {
  for (;;) {
    const xs = Array.from({ length: n }, () => rng.int(min, max));
    if (xs.reduce((s, x) => s + x, 0) % n === 0) return xs;
  }
}

function mean(rng: Rng): GeneratedTask {
  const xs = evenMean(rng, rng.int(3, 5), 2, 20);
  const sum = xs.reduce((s, x) => s + x, 0);
  const value = sum / xs.length;
  return {
    prompt: `Beräkna **medelvärdet** av talen ${$(list(xs))}.`,
    answer: { kind: "number", value, display: num(value) },
    hint: "Lägg ihop alla tal och dela med hur många tal det är.",
    solutionSteps: [
      { text: "Summan:", tex: `${xs.join(" + ")} = ${sum}` },
      { text: `Dela med antalet (${xs.length}).`, tex: `${frac(sum, xs.length)} = ${num(value)}` },
    ],
  };
}

function mode(rng: Rng): GeneratedTask {
  const common = rng.int(1, 9);
  const others = new Set<number>();
  while (others.size < rng.int(3, 4)) {
    const x = rng.int(1, 9);
    if (x !== common) others.add(x);
  }
  const xs = rng.shuffle([common, common, common, ...others, ...(rng.chance(0.5) ? [[...others][0]] : [])]);
  return {
    prompt: `Vilket är **typvärdet** för talen ${$(list(xs))}?`,
    answer: { kind: "number", value: common, display: num(common) },
    hint: "Typvärdet är det tal som förekommer flest gånger.",
    solutionSteps: [{ text: `${common} förekommer ${xs.filter((x) => x === common).length} gånger – oftast av alla.`, tex: `\\text{Typvärde} = ${common}` }],
  };
}

function median(rng: Rng): GeneratedTask {
  const n = rng.pick([5, 7, 6, 8]);
  const xs = Array.from({ length: n }, () => rng.int(1, 30));
  const sorted = [...xs].sort((a, b) => a - b);
  const odd = n % 2 === 1;
  const mid = Math.floor(n / 2);
  const value = odd ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return {
    prompt: `Bestäm **medianen** för talen ${$(list(xs))}.`,
    answer: { kind: "number", value, display: num(value) },
    hint: odd
      ? "Sortera talen i storleksordning. Medianen är talet i mitten."
      : "Sortera talen. Det finns två tal i mitten – ta medelvärdet av dem.",
    solutionSteps: [
      { text: "Sortera i storleksordning.", tex: list(sorted) },
      odd
        ? { text: `Talet i mitten (nummer ${mid + 1} av ${n}):`, tex: `\\text{Median} = ${value}` }
        : { text: "De två mittersta talen:", tex: `${frac(`${sorted[mid - 1]} + ${sorted[mid]}`, 2)} = ${num(value)}` },
    ],
  };
}

function range(rng: Rng): GeneratedTask {
  const xs = Array.from({ length: rng.int(5, 7) }, () => rng.int(-8, 25));
  const max = Math.max(...xs);
  const min = Math.min(...xs);
  const value = max - min;
  return {
    prompt: `Temperaturen (°C) mättes en vecka: ${$(list(xs))}. Vad är **variationsbredden**?`,
    answer: { kind: "number", value, display: `${value}\\text{ grader}`, unit: "°C" },
    hint: "Variationsbredden är skillnaden mellan det största och det minsta värdet.",
    solutionSteps: [
      { text: "Största och minsta värdet:", tex: `${num(max)} \\quad\\text{och}\\quad ${num(min)}` },
      { text: "Skillnaden:", tex: `${num(max)} - ${min < 0 ? `(${num(min)})` : num(min)} = ${value}` },
    ],
  };
}

function missingValue(rng: Rng): GeneratedTask {
  const n = rng.int(4, 5);
  const target = rng.int(6, 15);
  const known = Array.from({ length: n - 1 }, () => rng.int(target - 5, target + 5));
  const missing = target * n - known.reduce((s, x) => s + x, 0);
  if (missing < 0 || missing > 40) return missingValue(rng);
  return {
    prompt: `Medelvärdet av ${n} tal är ${target}. ${n - 1} av talen är ${$(list(known))}. Vilket är det **sista** talet?`,
    answer: { kind: "number", value: missing, display: num(missing) },
    hint: `Om medelvärdet är ${target} och det finns ${n} tal, vad måste summan av alla tal vara?`,
    solutionSteps: [
      { text: "Summan av alla tal = medelvärde · antal.", tex: `${target} \\cdot ${n} = ${target * n}` },
      { text: "Summan av de kända talen:", tex: `${known.join(" + ")} = ${known.reduce((s, x) => s + x, 0)}` },
      { text: "Det sista talet:", tex: `${target * n} - ${known.reduce((s, x) => s + x, 0)} = ${missing}` },
    ],
  };
}

function decimalMean(rng: Rng): GeneratedTask {
  const n = rng.pick([4, 5]);
  let xs: number[];
  do xs = Array.from({ length: n }, () => rng.int(8, 15));
  while (xs.reduce((s, x) => s + x, 0) % n === 0);
  const sum = xs.reduce((s, x) => s + x, 0);
  const value = round(sum / n);
  return {
    prompt: `Elsa sprang 60 meter ${n} gånger. Hennes tider i sekunder var ${$(list(xs))}. Vad är **medelvärdet** av tiderna?`,
    answer: { kind: "number", value, display: withUnit(value, "s"), unit: "s" },
    hint: "Lägg ihop tiderna och dela med antalet lopp. Svaret får bli ett decimaltal.",
    solutionSteps: [
      { text: "Summan:", tex: `${xs.join(" + ")} = ${sum}` },
      { text: `Dela med ${n}.`, tex: `${frac(sum, n)} = ${num(value)}` },
    ],
  };
}

export const generator: Generator = {
  key: "statistics/mean-median-mode",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1:
        return rng.pick([() => mean(rng), () => mode(rng)])();
      case 2:
        return rng.pick([() => median(rng), () => median(rng), () => range(rng)])();
      case 3:
        return rng.pick([() => missingValue(rng), () => decimalMean(rng)])();
    }
  },
};
