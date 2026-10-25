import { generator as oneStepEquations } from "./algebra/one-step-equations";
import { generator as percentConvert } from "./decimals-percent/convert";
import { generator as decimalArithmetic } from "./decimals-percent/decimal-arithmetic";
import { generator as percentOf } from "./decimals-percent/percent-of";
import { generator as whatPercent } from "./decimals-percent/what-percent";
import { generator as fractionsAddSubtract } from "./fractions/add-subtract";
import { generator as fractionsCompareOrder } from "./fractions/compare-order";
import { generator as expandSimplify } from "./fractions/expand-simplify";
import { generator as mixedNumbers } from "./fractions/mixed-numbers";
import { generator as fractionsMultiplyDivide } from "./fractions/multiply-divide";
import { generator as fourOperations } from "./number-sense/four-operations";
import { generator as negativeNumbers } from "./number-sense/negative-numbers";
import { generator as orderOfOperations } from "./number-sense/order-of-operations";
import { generator as placeValueRounding } from "./number-sense/place-value-rounding";
import { generator as powerNotation } from "./powers/power-notation";
import { generator as squaresRoots } from "./powers/squares-roots";
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
    fractionsCompareOrder,
    mixedNumbers,
    fractionsAddSubtract,
    fractionsMultiplyDivide,
    // Decimaltal och procent
    decimalArithmetic,
    percentConvert,
    percentOf,
    whatPercent,
    // Potenser
    powerNotation,
    squaresRoots,
    // Algebra
    oneStepEquations,
  ].map((g) => [g.key, g]),
);

export function getGenerator(key: string | null | undefined): Generator | null {
  return (key && GENERATORS[key]) || null;
}

export const generatorKeys = Object.keys(GENERATORS);
