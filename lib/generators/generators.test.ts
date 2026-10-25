import katex from "katex";
import { describe, expect, it } from "vitest";
import { generatorKeys, getGenerator } from "@/lib/generators";
import { answerValue, LEVELS } from "@/lib/generators/types";
import { checkAnswer } from "@/lib/math/check-answer";
import { mathSubject } from "@/lib/seed/math";

// Contract tests that every generator must pass. Per-generator tests live next
// to each generator.

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 13);

/** The displayed answer, typed the way a student would: 2\frac{1}{3} → "2 1/3", 3{,}5\text{ cm} → "3,5 cm". */
function typedFromDisplay(display: string): string {
  return display
    .replace(/(\d+)\\frac\{(\d+)\}\{(\d+)\}/g, "$1 $2/$3")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\{,\}/g, ",")
    .replace(/\\,/g, "")
    .replace(/\^\\circ\\text\{C\}/g, " °C")
    .replace(/\^\\circ/g, "°")
    .replace(/\\text\{\s*([^}]*)\}\^2/g, " $1²")
    .replace(/\\text\{\s*([^}]*)\}\^3/g, " $1³")
    .replace(/\\text\{\s*([^}]*)\}/g, " $1")
    .replace(/\\%/g, "%")
    .replace(/\\cdot/g, "*")
    .replace(/\\/g, "")
    .trim();
}

/** Every formula must render with KaTeX in strict mode (no warnings, no errors). */
function expectValidTex(tex: string, where: string) {
  expect(() => katex.renderToString(tex, { throwOnError: true, strict: "error" }), `${where}: ${tex}`).not.toThrow();
}

/** Markdown with inline $…$ and display $$…$$: balanced and every formula valid. */
function expectValidMarkdownMath(md: string, where: string) {
  const dollars = (md.match(/(?<!\\)\$/g) ?? []).length;
  expect(dollars % 2, `${where}: unbalanced $ in "${md}"`).toBe(0);
  for (const m of md.matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g)) expectValidTex(m[1] ?? m[2], where);
  // No TeX commands outside math – they would show up as raw code.
  const outside = md.replace(/\$\$[\s\S]+?\$\$|\$[^$]+?\$/g, "");
  expect(outside, `${where}: TeX outside $…$ in "${md}"`).not.toMatch(/\\[a-zA-Z{]/);
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
      // The answer as shown to the student must be accepted when typed back.
      const typed = task.answer.kind === "expression" ? task.answer.expr : typedFromDisplay(task.answer.display);
      expect(checkAnswer(typed, task.answer).status, `${where}: typed "${typed}" for ${task.prompt}`).toBe("correct");
      // A plain decimal is always readable (right value), even if a form is required.
      if (value !== null) {
        const decimal = checkAnswer(String(value), task.answer).status;
        expect(["correct", "retry"], `${where}: decimal ${value}`).toContain(decimal);
      }
    }
  });

  it("produces varied tasks", () => {
    // Geometry tasks share wording – the numbers are in the figure.
    const prompts = new Set(
      SEEDS.slice(0, 50).map((s) => {
        const task = generator.generate(1, s);
        return `${task.prompt}|${task.figure?.svg ?? ""}`;
      }),
    );
    expect(prompts.size).toBeGreaterThan(15);
  });
});

describe("math package coverage", () => {
  it("every seeded moment has a generator", () => {
    const missing = mathSubject.areas
      .flatMap((a) => a.moments)
      .filter((m) => !getGenerator(m.generatorKey))
      .map((m) => m.generatorKey);
    expect(missing).toEqual([]);
  });
});
