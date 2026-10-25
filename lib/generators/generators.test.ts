import katex from "katex";
import { describe, expect, it } from "vitest";
import { generatorKeys, getGenerator } from "@/lib/generators";
import { answerValue, LEVELS } from "@/lib/generators/types";
import { checkAnswer } from "@/lib/math/check-answer";
import { mathSubject } from "@/lib/seed/math";

// Contract tests that every generator must pass. Per-generator tests live next
// to each generator.

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 13);

/** Every formula must render with KaTeX in strict mode (no warnings, no errors). */
function expectValidTex(tex: string, where: string) {
  expect(() => katex.renderToString(tex, { throwOnError: true, strict: "error" }), `${where}: ${tex}`).not.toThrow();
}

/** Markdown with inline $…$ and display $$…$$: balanced and every formula valid. */
function expectValidMarkdownMath(md: string, where: string) {
  const dollars = (md.match(/(?<!\\)\$/g) ?? []).length;
  expect(dollars % 2, `${where}: unbalanced $ in "${md}"`).toBe(0);
  for (const m of md.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g)) expectValidTex(m[1] ?? m[2], where);
}

describe.each(generatorKeys)("generator %s", (key) => {
  const generator = getGenerator(key)!;

  it("is used by a seeded moment", () => {
    const keys = mathSubject.areas.flatMap((a) => a.moments.map((m) => m.generatorKey));
    expect(keys).toContain(key);
  });

  it.each(LEVELS)("level %i is deterministic for a seed", (level) => {
    expect(generator.generate(level, 42)).toEqual(generator.generate(level, 42));
  });

  it.each(LEVELS)("level %i: its own answer is accepted and well-formed", (level) => {
    for (const seed of SEEDS) {
      const task = generator.generate(level, seed);
      expect(task.prompt.length).toBeGreaterThan(0);
      expect(task.solutionSteps.length).toBeGreaterThan(0);
      expect(task.hint.length).toBeGreaterThan(10);
      const where = `${key} L${level} seed ${seed}`;
      expectValidMarkdownMath(task.prompt, `${where} prompt`);
      expectValidMarkdownMath(task.hint, `${where} hint`);
      expectValidTex(task.answer.display, `${where} answer`);
      for (const step of task.solutionSteps) {
        expectValidMarkdownMath(step.text, `${where} step`);
        if (step.tex) expectValidTex(step.tex, `${where} step`);
      }
      expect(task.hint).not.toMatch(/undefined|NaN/);
      const value = answerValue(task.answer);
      if (task.answer.kind !== "expression") expect(Number.isFinite(value)).toBe(true);
      expect(task.prompt).not.toMatch(/undefined|NaN|Infinity/);
      // The value written as a decimal is always readable and right…
      const typed = task.answer.kind === "expression" ? task.answer.expr : String(value);
      const result = checkAnswer(typed, task.answer);
      if (task.answer.kind === "number" && task.answer.requireSimplified) {
        // …except where the simplest fraction is required.
        expect(["correct", "retry"]).toContain(result.status);
      } else {
        expect(result.status, `${key} L${level} seed ${seed}: ${task.prompt}`).toBe("correct");
      }
    }
  });

  it("produces varied tasks", () => {
    const prompts = new Set(SEEDS.slice(0, 50).map((s) => generator.generate(1, s).prompt));
    expect(prompts.size).toBeGreaterThan(15);
  });
});
