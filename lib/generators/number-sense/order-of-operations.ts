import { $, num } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level, SolutionStep } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Prioriteringsregler. Each template builds the expression together with
// the step-by-step evaluation in the correct order.

type Built = { tex: string; value: number; steps: SolutionStep[] };

const step = (text: string, tex: string): SolutionStep => ({ text, tex });

// Lätt: a + b·c, a·b - c, a - b·c (positive result)
function easy(rng: Rng): Built {
  const a = rng.int(2, 20);
  const b = rng.int(2, 9);
  const c = rng.int(2, 9);
  switch (rng.int(0, 2)) {
    case 0:
      return {
        tex: `${a} + ${b} \\cdot ${c}`,
        value: a + b * c,
        steps: [
          step("Multiplikation före addition.", `${b} \\cdot ${c} = ${b * c}`),
          step("Addera sedan.", `${a} + ${b * c} = ${a + b * c}`),
        ],
      };
    case 1: {
      // Keep the result positive on Lätt.
      const sub = Math.min(c, a * b - 1);
      return {
        tex: `${a} \\cdot ${b} - ${sub}`,
        value: a * b - sub,
        steps: [
          step("Multiplikation före subtraktion.", `${a} \\cdot ${b} = ${a * b}`),
          step("Subtrahera sedan.", `${a * b} - ${sub} = ${a * b - sub}`),
        ],
      };
    }
    default: {
      const big = b * c + rng.int(1, 30);
      return {
        tex: `${big} - ${b} \\cdot ${c}`,
        value: big - b * c,
        steps: [
          step("Multiplikation före subtraktion.", `${b} \\cdot ${c} = ${b * c}`),
          step("Subtrahera sedan.", `${big} - ${b * c} = ${big - b * c}`),
        ],
      };
    }
  }
}

// Medel: (a + b)·c, a + b / c (exact), a·b + c·d
function medium(rng: Rng): Built {
  switch (rng.int(0, 2)) {
    case 0: {
      const [a, b, c] = [rng.int(2, 15), rng.int(2, 15), rng.int(2, 9)];
      return {
        tex: `(${a} + ${b}) \\cdot ${c}`,
        value: (a + b) * c,
        steps: [
          step("Parentesen först.", `${a} + ${b} = ${a + b}`),
          step("Multiplicera sedan.", `${a + b} \\cdot ${c} = ${(a + b) * c}`),
        ],
      };
    }
    case 1: {
      const c = rng.int(2, 9);
      const q = rng.int(2, 12);
      const a = rng.int(3, 40);
      return {
        tex: `${a} + ${q * c} / ${c}`,
        value: a + q,
        steps: [
          step("Division före addition.", `${q * c} / ${c} = ${q}`),
          step("Addera sedan.", `${a} + ${q} = ${a + q}`),
        ],
      };
    }
    default: {
      const [a, b, c, d] = [rng.int(2, 9), rng.int(2, 9), rng.int(2, 9), rng.int(2, 9)];
      return {
        tex: `${a} \\cdot ${b} + ${c} \\cdot ${d}`,
        value: a * b + c * d,
        steps: [
          step("Båda multiplikationerna först.", `${a} \\cdot ${b} = ${a * b} \\quad ${c} \\cdot ${d} = ${c * d}`),
          step("Addera sedan.", `${a * b} + ${c * d} = ${a * b + c * d}`),
        ],
      };
    }
  }
}

// Svår: a + b·(c - d)^2, (a - b)^2 / c, a - (b + c)·d with negatives
function hard(rng: Rng): Built {
  switch (rng.int(0, 2)) {
    case 0: {
      const [a, b, d] = [rng.int(1, 20), rng.int(2, 5), rng.int(1, 6)];
      const c = d + rng.int(1, 4);
      const sq = (c - d) ** 2;
      return {
        tex: `${a} + ${b} \\cdot (${c} - ${d})^2`,
        value: a + b * sq,
        steps: [
          step("Parentesen först.", `${c} - ${d} = ${c - d}`),
          step("Sedan potensen.", `${c - d}^2 = ${sq}`),
          step("Sedan multiplikationen.", `${b} \\cdot ${sq} = ${b * sq}`),
          step("Sist additionen.", `${a} + ${b * sq} = ${a + b * sq}`),
        ],
      };
    }
    case 1: {
      const diff = rng.int(2, 6);
      const b = rng.int(1, 10);
      const a = b + diff;
      const sq = diff * diff;
      const divisors = [1, 2, 3, 4, 6, 9, 12].filter((x) => x > 1 && sq % x === 0);
      const c = divisors.length ? rng.pick(divisors) : diff;
      return {
        tex: `(${a} - ${b})^2 / ${c}`,
        value: sq / c,
        steps: [
          step("Parentesen först.", `${a} - ${b} = ${diff}`),
          step("Sedan potensen.", `${diff}^2 = ${sq}`),
          step("Sist divisionen.", `${sq} / ${c} = ${num(sq / c)}`),
        ],
      };
    }
    default: {
      const [a, b, c, d] = [rng.int(2, 20), rng.int(2, 9), rng.int(2, 9), rng.int(2, 6)];
      const inner = b + c;
      return {
        tex: `${a} - (${b} + ${c}) \\cdot ${d}`,
        value: a - inner * d,
        steps: [
          step("Parentesen först.", `${b} + ${c} = ${inner}`),
          step("Sedan multiplikationen.", `${inner} \\cdot ${d} = ${inner * d}`),
          step("Sist subtraktionen. Svaret kan bli negativt.", `${a} - ${inner * d} = ${num(a - inner * d)}`),
        ],
      };
    }
  }
}

export const generator: Generator = {
  key: "number-sense/order-of-operations",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    const built = level === 1 ? easy(rng) : level === 2 ? medium(rng) : hard(rng);
    return {
      prompt: `Räkna ut. ${$(built.tex)}`,
      answer: { kind: "number", value: built.value, display: num(built.value) },
      solutionSteps: built.steps,
    };
  },
};
