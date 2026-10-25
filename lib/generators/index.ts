import { generator as oneStepEquations } from "./algebra/one-step-equations";
import { generator as expandSimplify } from "./fractions/expand-simplify";
import { generator as orderOfOperations } from "./number-sense/order-of-operations";
import type { Generator } from "./types";

// generator_key in the database → implementation. Moments whose key is missing
// here show "kommer snart" until their generator is written (step 5).
const GENERATORS: Record<string, Generator> = Object.fromEntries(
  [expandSimplify, oneStepEquations, orderOfOperations].map((g) => [g.key, g]),
);

export function getGenerator(key: string | null | undefined): Generator | null {
  return (key && GENERATORS[key]) || null;
}

export const generatorKeys = Object.keys(GENERATORS);
