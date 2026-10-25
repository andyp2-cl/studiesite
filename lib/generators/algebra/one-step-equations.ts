import { $, frac, num, term } from "@/lib/generators/format";
import type { GeneratedTask, Generator, Level } from "@/lib/generators/types";
import { createRng, type Rng } from "@/lib/random";

// Ekvationer i ett steg.
// Lätt: x + a = b och x - a = b med positiva heltal.
// Medel: ax = b och x / a = b.
// Svår: negativa tal och a - x = b.

type Shape = "add" | "sub" | "mul" | "div" | "subFrom";

function build(shape: Shape, x: number, a: number): GeneratedTask {
  const answer = { kind: "equation" as const, variable: "x", value: x, display: `x = ${num(x)}` };
  const check = (lhs: string, rhs: number) => ({
    text: "Pröva genom att sätta in svaret:",
    tex: `${lhs} = ${num(rhs)} \\;\\checkmark`,
  });

  switch (shape) {
    case "add": {
      const b = x + a;
      return {
        prompt: `Lös ekvationen. ${$(`x + ${term(a)} = ${num(b)}`)}`,
        answer,
        hint: `Vilket tal plus ${num(a)} blir ${num(b)}? Du kan också ta bort ${num(a)} från båda sidor så att $x$ står ensamt.`,
        solutionSteps: [
          { text: `Ta bort ${num(a)} från båda sidor.`, tex: `x = ${num(b)} - ${term(a)}` },
          { text: "Räkna ut.", tex: `x = ${num(x)}` },
          check(`${term(x)} + ${term(a)}`, b),
        ],
      };
    }
    case "sub": {
      const b = x - a;
      return {
        prompt: `Lös ekvationen. ${$(`x - ${term(a)} = ${num(b)}`)}`,
        answer,
        hint: `Motsatsen till att subtrahera är att addera. Lägg till ${num(a)} på båda sidor så att $x$ står ensamt.`,
        solutionSteps: [
          { text: `Lägg till ${num(a)} på båda sidor.`, tex: `x = ${num(b)} + ${term(a)}` },
          { text: "Räkna ut.", tex: `x = ${num(x)}` },
          check(`${term(x)} - ${term(a)}`, b),
        ],
      };
    }
    case "mul": {
      const b = a * x;
      return {
        prompt: `Lös ekvationen. ${$(`${num(a)}x = ${num(b)}`)}`,
        answer,
        hint: `$${num(a)}x$ betyder ${num(a)} gånger $x$. Vilket tal gånger ${num(a)} blir ${num(b)}? Dela båda sidor med ${num(a)}.`,
        solutionSteps: [
          { text: `Dividera båda sidor med ${num(a)}.`, tex: `x = ${frac(num(b), num(a))}` },
          { text: "Räkna ut.", tex: `x = ${num(x)}` },
          check(`${num(a)} \\cdot ${term(x)}`, b),
        ],
      };
    }
    case "div": {
      const b = x / a;
      return {
        prompt: `Lös ekvationen. ${$(`${frac("x", num(a))} = ${num(b)}`)}`,
        answer,
        hint: `$x$ delat med ${num(a)} blir ${num(b)}. Motsatsen till att dela är att multiplicera – gör det på båda sidor.`,
        solutionSteps: [
          { text: `Multiplicera båda sidor med ${num(a)}.`, tex: `x = ${num(b)} \\cdot ${term(a)}` },
          { text: "Räkna ut.", tex: `x = ${num(x)}` },
          check(frac(num(x), num(a)), b),
        ],
      };
    }
    case "subFrom": {
      const b = a - x;
      return {
        prompt: `Lös ekvationen. ${$(`${num(a)} - x = ${num(b)}`)}`,
        answer,
        hint: `Vilket tal ska du ta bort från ${num(a)} för att få ${num(b)}?`,
        solutionSteps: [
          { text: `Lägg till $x$ på båda sidor, så blir $x$ positivt.`, tex: `${num(a)} = ${num(b)} + x` },
          { text: `Ta bort ${num(b)} från båda sidor.`, tex: `x = ${num(a)} - ${term(b)} = ${num(x)}` },
          check(`${num(a)} - ${term(x)}`, b),
        ],
      };
    }
  }
}

function nonZero(rng: Rng, min: number, max: number): number {
  for (;;) {
    const n = rng.int(min, max);
    if (n !== 0) return n;
  }
}

export const generator: Generator = {
  key: "algebra/one-step-equations",
  generate(level: Level, seed: number): GeneratedTask {
    const rng = createRng(seed);
    switch (level) {
      case 1: {
        const shape = rng.pick<Shape>(["add", "sub"]);
        const x = rng.int(shape === "sub" ? 6 : 1, 20);
        const a = rng.int(1, shape === "sub" ? x - 1 : 15);
        return build(shape, x, a);
      }
      case 2: {
        const shape = rng.pick<Shape>(["mul", "div"]);
        return build(shape, rng.int(2, 12), rng.int(2, 9));
      }
      case 3: {
        const shape = rng.pick<Shape>(["add", "sub", "mul", "div", "subFrom"]);
        if (shape === "mul" || shape === "div") {
          const a = rng.pick([-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]);
          // x / a = b must have a whole b, so build x from b.
          return shape === "div" ? build(shape, a * nonZero(rng, -12, 12), a) : build(shape, nonZero(rng, -12, 12), a);
        }
        return build(shape, nonZero(rng, -15, 15), nonZero(rng, -12, 20));
      }
    }
  },
};
