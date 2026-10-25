// Writes an HTML page with sample geometry figures, for visual review.
// Usage: npm run figures-preview > figures.html

import { getGenerator } from "../lib/generators";
import type { Level } from "../lib/generators/types";

const SAMPLES: [string, Level, number[]][] = [
  ["geometry/perimeter-area", 1, [1, 2]],
  ["geometry/perimeter-area", 2, [3, 5, 8]],
  ["geometry/perimeter-area", 3, [2, 7, 11]],
  ["geometry/angles", 1, [1, 4]],
  ["geometry/angles", 2, [2, 9]],
  ["geometry/angles", 3, [3, 5, 13]],
];

const cards: string[] = [];
for (const [key, level, seeds] of SAMPLES) {
  for (const seed of seeds) {
    const task = getGenerator(key)!.generate(level, seed);
    if (task.figure) cards.push(`<div class="c"><p>${key} L${level}: ${task.prompt.replace(/\$/g, "")}</p>${task.figure.svg}</div>`);
  }
}

console.log(
  `<html><body style="background:#0e0e0e;color:#f5f5f5;font-family:sans-serif;--primary:#f5654a;display:flex;flex-wrap:wrap;gap:12px;padding:12px">` +
    `<style>.c{width:300px;border:1px solid #333;padding:8px}p{font-size:11px}</style>${cards.join("")}</body></html>`,
);
