import { describe, expect, it } from "vitest";
import { checkTaskAnswer, type TaskAnswer } from "@/lib/tasks/answers";
import { acceptedAnswers, parseVocab, stripAccents, vocabQuestions, vocabReading } from "./vocab";

const LIST = `perdón – ursäkta, förlåt
una pregunta – en fråga
tiene – (han/hon/den) har

¿Cómo? – Hur sa? Ursäkta?
¿Cuántos años tiene? – Hur gammal är han/hon/den?
dieciséis – sexton
¡Qué interesante! – Vad intressant!`;

const text = (accepted: string[]): TaskAnswer => ({ kind: "text", accepted, keywords: [] });

describe("parseVocab", () => {
  it("reads one pair per line and skips blank lines", () => {
    const { pairs, rejected } = parseVocab(LIST);
    expect(rejected).toEqual([]);
    expect(pairs).toHaveLength(7);
    expect(pairs[0]).toEqual({ foreign: "perdón", swedish: "ursäkta, förlåt" });
    expect(pairs[3]).toEqual({ foreign: "¿Cómo?", swedish: "Hur sa? Ursäkta?" });
  });

  it("accepts other separators and list bullets", () => {
    const { pairs } = parseVocab("- hola - hej\nadiós = hejdå\ngracias\ttack\nbueno — bra");
    expect(pairs.map((p) => p.swedish)).toEqual(["hej", "hejdå", "tack", "bra"]);
  });

  it("rejects lines without a separator and drops duplicates", () => {
    const { pairs, rejected } = parseVocab("hola\nsí – ja\nSí – ja");
    expect(rejected).toEqual(["hola"]);
    expect(pairs).toHaveLength(1);
  });
});

describe("acceptedAnswers", () => {
  it("accepts each comma-separated meaning", () => {
    const a = text(acceptedAnswers("ursäkta, förlåt"));
    expect(checkTaskAnswer(a, "förlåt").status).toBe("correct");
    expect(checkTaskAnswer(a, "Ursäkta").status).toBe("correct");
    expect(checkTaskAnswer(a, "ursäkta, förlåt").status).toBe("correct");
    expect(checkTaskAnswer(a, "hej").status).toBe("wrong");
  });

  it("treats bracketed words as optional and expands slashes", () => {
    const a = text(acceptedAnswers("(han/hon/den) har"));
    for (const input of ["har", "han har", "hon har", "den har"]) expect(checkTaskAnswer(a, input).status).toBe("correct");
    const b = text(acceptedAnswers("Hur gammal är han/hon/den?"));
    expect(checkTaskAnswer(b, "hur gammal är hon").status).toBe("correct");
  });

  it("splits on question marks", () => {
    const a = text(acceptedAnswers("Hur sa? Ursäkta?"));
    expect(checkTaskAnswer(a, "ursäkta").status).toBe("correct");
    expect(checkTaskAnswer(a, "Hur sa?").status).toBe("correct");
  });
});

describe("vocabQuestions", () => {
  const { pairs } = parseVocab(LIST);
  const questions = vocabQuestions(pairs, "spanska", ["toSwedish", "toForeign", "choice"], () => 0.3);

  it("makes three questions per word", () => {
    expect(questions).toHaveLength(pairs.length * 3);
    expect(questions[1].prompt).toBe("Hur säger man **ursäkta, förlåt** på spanska?");
  });

  it("accepts the foreign word without accents or ¿ ¡", () => {
    const toForeign = questions.filter((q) => q.prompt.startsWith("Hur säger man"));
    const dieciseis = toForeign.find((q) => q.prompt.includes("sexton"))!;
    expect(checkTaskAnswer(dieciseis.answer, "dieciséis").status).toBe("correct");
    expect(checkTaskAnswer(dieciseis.answer, "dieciseis").status).toBe("correct");
    const como = toForeign.find((q) => q.prompt.includes("Hur sa"))!;
    expect(checkTaskAnswer(como.answer, "como").status).toBe("correct");
    expect(checkTaskAnswer(como.answer, "¿Cómo?").status).toBe("correct");
  });

  it("builds multiple choice with the right answer among other meanings", () => {
    for (const q of questions.filter((x) => x.type === "multiple_choice")) {
      expect(q.choices).toHaveLength(4);
      expect(new Set(q.choices).size).toBe(4);
      const pair = pairs.find((p) => q.prompt.includes(`**${p.foreign}**`))!;
      expect(q.answer).toEqual({ kind: "choice", index: q.choices!.indexOf(pair.swedish) });
    }
  });

  it("only makes the chosen kinds and skips choice for a single word", () => {
    expect(vocabQuestions(pairs, "spanska", ["toSwedish"])).toHaveLength(pairs.length);
    expect(vocabQuestions([pairs[0]], "spanska", ["choice"])).toHaveLength(0);
  });
});

describe("helpers", () => {
  it("strips accents", () => expect(stripAccents("¿Cuántos años?")).toBe("Cuantos anos?"));
  it("lists the words in the reading text", () =>
    expect(vocabReading(parseVocab("hola – hej").pairs, "spanska")).toContain("- **hola** – hej"));
});
