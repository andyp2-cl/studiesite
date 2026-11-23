import { describe, expect, it } from "vitest";
import { checkTaskAnswer } from "@/lib/tasks/answers";
import { MAX_WRITING_CHARS, MIN_WRITING_CHARS, parseAngles, parseMomentDraft, parseMoreQuestions, parsePhotoDraft, parseWriting, sourcesForPrompt } from "./schema";

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

  it("keeps new questions that belong to a known section and drops the rest", () => {
    const questions = parseMoreQuestions(
      {
        questions: [
          question({ prompt: "Ny fråga?", accepted: ["ja"], section: "Krigen", explanation: "Därför." }),
          question({ prompt: "Ny fråga?", accepted: ["ja"], section: "Krigen" }),
          question({ prompt: "Okänt avsnitt", accepted: ["nej"], section: "Finns inte" }),
          question({ prompt: "Utan svar" }),
        ],
      },
      ["Krigen"],
    );
    expect(questions.map((q) => q.prompt)).toEqual(["Ny fråga?"]);
    expect(questions[0].section).toBe("Krigen");
  });

  it("rejects a draft without reading text or questions", () => {
    expect(parseMomentDraft({ ...draft, sections: [] })).toBeNull();
    expect(parseMomentDraft({ ...draft, questions: [] })).toBeNull();
    expect(parseMomentDraft("inte json")).toBeNull();
  });
});

describe("parsePhotoDraft", () => {
  const draft = {
    intro: "Om Vasa.",
    sections: [{ title: "Kungen", body: "Gustav Vasa blev kung 1523." }],
    questions: [
      {
        type: "short",
        prompt: "Vilket år blev Gustav Vasa kung?",
        accepted: ["1523"],
        keywords: [],
        choices: [],
        correct_index: 0,
        correct_boolean: false,
        section: "Kungen",
        explanation: "Han valdes 1523.",
      },
    ],
  };

  it("keeps the draft and the questions the AI could not use", () => {
    const parsed = parsePhotoDraft({ ...draft, skipped: ["Fråga 4 (oläslig)", ""] });
    expect(parsed?.questions).toHaveLength(1);
    expect(parsed?.questions[0].section).toBe("Kungen");
    expect(parsed?.skipped).toEqual(["Fråga 4 (oläslig)"]);
  });

  it("treats a missing skipped list as empty", () => {
    expect(parsePhotoDraft(draft)?.skipped).toEqual([]);
  });

  it("returns null when the photo had no questions", () => {
    expect(parsePhotoDraft({ intro: "", sections: [], questions: [], skipped: [] })).toBeNull();
  });
});

describe("parseWriting", () => {
  it("keeps tasks with a prompt and a rubric", () => {
    expect(
      parseWriting({
        writing: [
          { prompt: " Förklara varför vi har årstider. ", rubric: "- Jordaxelns lutning", min_chars: 300 },
          { prompt: "Utan bedömningsstöd", rubric: "", min_chars: 300 },
        ],
      }),
    ).toEqual([{ prompt: "Förklara varför vi har årstider.", rubric: "- Jordaxelns lutning", minChars: 300 }]);
  });

  it("keeps the length within sensible limits", () => {
    const [short, long, odd] = parseWriting({
      writing: [
        { prompt: "a", rubric: "b", min_chars: 10 },
        { prompt: "c", rubric: "d", min_chars: 99_999 },
      ],
    }).concat(parseWriting({ writing: [{ prompt: "e", rubric: "f", min_chars: "x" }] }));
    expect(short.minChars).toBe(MIN_WRITING_CHARS);
    expect(long.minChars).toBe(MAX_WRITING_CHARS);
    expect(odd.minChars).toBe(300);
  });

  it("returns nothing for a reply without tasks", () => {
    expect(parseWriting(null)).toEqual([]);
    expect(parseWriting({ writing: "nej" })).toEqual([]);
  });
});
