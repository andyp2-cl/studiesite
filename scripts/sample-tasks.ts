// Prints sample tasks for reviewing wording and difficulty.
// Usage: npm run sample-tasks -- [generator-key-prefix] [count]

import { generatorKeys, getGenerator } from "../lib/generators";
import { LEVELS } from "../lib/generators/types";

const [prefix = "", countArg = "3"] = process.argv.slice(2);
const count = Number(countArg) || 3;

for (const key of generatorKeys.filter((k) => k.startsWith(prefix))) {
  const generator = getGenerator(key)!;
  console.log(`\n=== ${key} ===`);
  for (const level of LEVELS) {
    for (let i = 0; i < count; i++) {
      const seed = 1000 + i * 7919 + level * 31;
      const task = generator.generate(level, seed);
      console.log(`\n[L${level}] ${task.prompt}`);
      console.log(`  svar: ${task.answer.display}${task.answer.kind === "number" && task.answer.unit ? `  (enhet ${task.answer.unit})` : ""}`);
      console.log(`  ledtråd: ${task.hint}`);
      console.log(`  lösning: ${task.solutionSteps.map((s) => `${s.text}${s.tex ? ` [${s.tex}]` : ""}`).join(" | ")}`);
      if (task.figure) console.log(`  figur: ${task.figure.alt}`);
    }
  }
}
