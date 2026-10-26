import { describe, expect, it } from "vitest";
import { checkTaskAnswer } from "@/lib/tasks/answers";
import { parseAngles, parseMomentDraft, sourcesForPrompt } from "./schema";

describe("sourcesForPrompt", () => {
  it("shares the space between sources and skips empty ones", () => {
    const out = sourcesForPrompt(
      [
        { title: "Lång", url: null, content: "a".repeat(1000) },
        { title: "Tom", url: null, content: "  " },
        { title: "Kort", url: null, content: "kort text" },
      ],
      200,
    );
    expect(out).toContain('title="Lång"');
    expect(out).not.toContain('title="Tom"');
    expect(out).toContain("kort text");
    expect(out.match(/a+/)?.[0].length).toBe(100);
  });

  it("returns nothing without readable sources", () => {
    expect(sourcesForPrompt([{ title: "x", url: null, content: "" }])).toBe("");
  });
});

describe("parseAngles", () => {
  it("keeps named angles, skipping duplicates and existing moments", () => {
    const angles = parseAngles(
      {
        moments: [
          { name: "Stora nordiska kriget", description: "Krigen 1700–1721" },
          { name: "stora nordiska kriget", description: "dubblett" },
          { name: "Uppväxt", description: "Barndom" },
          { name: "", description: "utan namn" },
        ],
      },
      ["Uppväxt"],
    );
    expect(angles).toEqual([{ name: "Stora nordiska kriget", description: "Krigen 1700–1721" }]);
  });

  it("handles garbage", () => {
    expect(parseAngles(null)).toEqual([]);
    expect(parseAngles({ moments: "nej" })).toEqual([]);
  });
});

const question = (overrides: Record<string, unknown>) => ({
  type: "short",
  prompt: "Fråga?",
  accepted: [],
  keywords: [],
  choices: [],
  correct_index: 0,
  correct_boolean: false,
  section: "",
  explanation: "",
  ...overrides,
});

describe("parseMomentDraft", () => {
  const draft = {
    intro: "Karl XII blev kung som 15-åring.",
    sections: [
      { title: "Krigen", body: "Text om krigen." },
      { title: "", body: "saknar rubrik" },
    ],
    questions: [
      question({
        prompt: "Vid vilken stad förlorade Karl XII 1709?",
        accepted: ["Poltava", "slaget vid Poltava"],
        section: "krigen",
        explanation: "Poltava 1709.",
      }),
      question({ type: "choice", prompt: "Vilket land?", choices: ["Ryssland", "Norge"], correct_index: 1 }),
      question({ type: "true_false", prompt: "Han dog i Norge.", correct_boolean: true }),
      question({ type: "choice", prompt: "Trasig", choices: ["bara ett"], correct_index: 0 }),
      question({ prompt: "Utan svar" }),
      question({ type: "essay", prompt: "Okänd typ" }),
    ],
  };

  it("turns the AI reply into reading sections and questions", () => {
    const parsed = parseMomentDraft(draft)!;
    expect(parsed.intro).toBe("Karl XII blev kung som 15-åring.");
    expect(parsed.sections).toEqual([{ title: "Krigen", body: "Text om krigen." }]);
    expect(parsed.questions.map((q) => q.type)).toEqual(["free_text", "multiple_choice", "true_false"]);
    expect(parsed.questions[0].solution).toBe("Poltava 1709.");
    expect(parsed.questions[0].section).toBe("Krigen");
    expect(parsed.questions[1].section).toBe("");
    expect(parsed.questions[1]).toMatchObject({ answer: { kind: "choice", index: 1 }, choices: ["Ryssland", "Norge"] });
  });

  it("gives short-answer questions an answer key the checker accepts", () => {
    const answer = parseMomentDraft(draft)!.questions[0].answer;
    expect(checkTaskAnswer(answer, "poltava").status).toBe("correct");
    expect(checkTaskAnswer(answer, "Slaget vid Poltava!").status).toBe("correct");
    expect(checkTaskAnswer(answer, "Narva").status).toBe("wrong");
  });

  it("rejects a draft without reading text or questions", () => {
    expect(parseMomentDraft({ ...draft, sections: [] })).toBeNull();
    expect(parseMomentDraft({ ...draft, questions: [] })).toBeNull();
    expect(parseMomentDraft("inte json")).toBeNull();
  });
});
