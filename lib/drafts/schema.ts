import { buildAnswer, type AnswerDraft, type TaskAnswer, type TaskType } from "@/lib/tasks/answers";

// What the AI returns when it drafts from an area's sources, as JSON schemas
// (for structured outputs) and validators that turn the reply into rows. The
// AI's JSON is untrusted: everything is checked, trimmed and capped here, and
// invalid items are dropped rather than failing the whole draft.

export const MAX_SOURCE_CHARS_TOTAL = 80_000;

type Source = { title: string; url: string | null; content: string };

/** Sources as one text for the prompt, shared fairly so one long page cannot crowd out the rest. */
export function sourcesForPrompt(sources: Source[], maxChars = MAX_SOURCE_CHARS_TOTAL): string {
  const usable = sources.filter((s) => s.content.trim());
  if (usable.length === 0) return "";
  const share = Math.floor(maxChars / usable.length);
  return usable
    .map((s, i) => `<source index="${i + 1}" title="${s.title.replace(/"/g, "'")}">\n${s.content.trim().slice(0, share)}\n</source>`)
    .join("\n\n");
}

const text = (value: unknown, max: number): string => (typeof value === "string" ? value.trim().slice(0, max) : "");
const list = (value: unknown, max: number, itemMax: number): string[] =>
  Array.isArray(value) ? value.map((v) => text(v, itemMax)).filter(Boolean).slice(0, max) : [];

// ---------------------------------------------------------------------------
// Angles: the moments an area is split into.
// ---------------------------------------------------------------------------

export const anglesSchema = {
  type: "object",
  properties: {
    moments: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, description: { type: "string" } },
        required: ["name", "description"],
        additionalProperties: false,
      },
    },
  },
  required: ["moments"],
  additionalProperties: false,
};

export type Angle = { name: string; description: string };

export function parseAngles(json: unknown, existing: string[] = []): Angle[] {
  const taken = new Set(existing.map((n) => n.toLowerCase()));
  const moments = (json as { moments?: unknown })?.moments;
  if (!Array.isArray(moments)) return [];
  const out: Angle[] = [];
  for (const m of moments) {
    const name = text(m?.name, 80);
    if (!name || taken.has(name.toLowerCase())) continue;
    taken.add(name.toLowerCase());
    out.push({ name, description: text(m?.description, 300) });
  }
  return out.slice(0, 6);
}

// ---------------------------------------------------------------------------
// A moment: reading text, questions with short answers, writing tasks.
// ---------------------------------------------------------------------------

export const momentDraftSchema = {
  type: "object",
  properties: {
    intro: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, body: { type: "string" } },
        required: ["title", "body"],
        additionalProperties: false,
      },
    },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["short", "choice", "true_false"] },
          prompt: { type: "string" },
          accepted: { type: "array", items: { type: "string" } },
          keywords: { type: "array", items: { type: "string" } },
          choices: { type: "array", items: { type: "string" } },
          correct_index: { type: "integer" },
          correct_boolean: { type: "boolean" },
          explanation: { type: "string" },
        },
        required: ["type", "prompt", "accepted", "keywords", "choices", "correct_index", "correct_boolean", "explanation"],
        additionalProperties: false,
      },
    },
    writing: {
      type: "array",
      items: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          min_chars: { type: "integer" },
          rubric: { type: "string" },
        },
        required: ["prompt", "min_chars", "rubric"],
        additionalProperties: false,
      },
    },
  },
  required: ["intro", "sections", "questions", "writing"],
  additionalProperties: false,
};

export type DraftQuestion = {
  type: TaskType;
  prompt: string;
  answer: TaskAnswer;
  choices: string[] | null;
  solution: string;
};
export type DraftWriting = { prompt: string; minChars: number; rubric: string };
export type MomentDraft = {
  intro: string;
  sections: { title: string; body: string }[];
  questions: DraftQuestion[];
  writing: DraftWriting[];
};

const QUESTION_TYPE: Record<string, TaskType> = { short: "free_text", choice: "multiple_choice", true_false: "true_false" };

function parseQuestion(q: Record<string, unknown>): DraftQuestion | null {
  const type = QUESTION_TYPE[String(q?.type)];
  const prompt = text(q?.prompt, 1000);
  if (!type || !prompt) return null;
  const draft: AnswerDraft = {
    accepted: list(q.accepted, 10, 100),
    keywords: list(q.keywords, 6, 50),
    choices: list(q.choices, 6, 200),
    correctIndex: Number(q.correct_index),
    correctBoolean: q.correct_boolean === true,
  };
  const built = buildAnswer(type, draft);
  if (!built) return null;
  return { type, prompt, answer: built.answer, choices: built.choices, solution: text(q.explanation, 1000) };
}

export function parseMomentDraft(json: unknown): MomentDraft | null {
  const d = json as Record<string, unknown> | null;
  if (!d || typeof d !== "object") return null;

  const sections = (Array.isArray(d.sections) ? d.sections : [])
    .map((s) => ({ title: text(s?.title, 120), body: text(s?.body, 20000) }))
    .filter((s) => s.title && s.body)
    .slice(0, 6);
  const questions = (Array.isArray(d.questions) ? d.questions : [])
    .map((q) => parseQuestion(q as Record<string, unknown>))
    .filter((q): q is DraftQuestion => q !== null)
    .slice(0, 30);
  const writing = (Array.isArray(d.writing) ? d.writing : [])
    .map((w) => ({
      prompt: text(w?.prompt, 5000),
      minChars: Math.min(Math.max(Math.round(Number(w?.min_chars)) || 300, 50), 5000),
      rubric: text(w?.rubric, 5000),
    }))
    .filter((w) => w.prompt)
    .slice(0, 5);

  if (sections.length === 0 || questions.length === 0) return null;
  return { intro: text(d.intro, 2000), sections, questions, writing };
}
