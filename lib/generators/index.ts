import { generator as oneStepEquations } from "./algebra/one-step-equations";
import { generator as expandSimplify } from "./fractions/expand-simplify";
import { generator as fourOperations } from "./number-sense/four-operations";
import { generator as negativeNumbers } from "./number-sense/negative-numbers";
import { generator as orderOfOperations } from "./number-sense/order-of-operations";
import { generator as placeValueRounding } from "./number-sense/place-value-rounding";
import type { Generator } from "./types";

// generator_key in the database → implementation. Moments whose key is missing
// here show "kommer snart" until their generator is written.
const GENERATORS: Record<string, Generator> = Object.fromEntries(
  [
    // Taluppfattning
    placeValueRounding,
    negativeNumbers,
    fourOperations,
    orderOfOperations,
    // Bråk
    expandSimplify,
    // Algebra
    oneStepEquations,
  ].map((g) => [g.key, g]),
);

export function getGenerator(key: string | null | undefined): Generator | null {
  return (key && GENERATORS[key]) || null;
}

export const generatorKeys = Object.keys(GENERATORS);
