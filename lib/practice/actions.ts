"use server";

import { randomInt } from "node:crypto";
import { getViewProfile, requireProfile } from "@/lib/auth/session";
import { awardCards } from "@/lib/cards/award";
import type { Card } from "@/lib/cards/catalog";
import { askClaude, aiStatus } from "@/lib/ai";
import type { Json } from "@/lib/database.types";
import { moreQuestionsPrompt } from "@/lib/drafts/prompts";
import { moreQuestionsSchema, parseMoreQuestions } from "@/lib/drafts/schema";
import { getGenerator } from "@/lib/generators";
import { isLevel, LEVELS, type Figure, type Generator, type Level, type SolutionStep } from "@/lib/generators/types";
import { checkAnswer, type CheckResult, type RetryReason } from "@/lib/math/check-answer";
import { EXPLANATION_MIN_CHARS, EXPLANATION_XP, XP_FOR_LEVEL } from "@/lib/gamification";
import { offeredRounds, quizClosedKey, readingCanSupportMore, wordCount } from "@/lib/practice/rounds";
import { levelProgress, passCorrectFor, WINDOW } from "@/lib/progress";
import { createRng } from "@/lib/random";
import { reachMilestone } from "@/lib/read/progress";
import { strings } from "@/lib/strings";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkTaskAnswer, correctAnswerDisplay, type TaskAnswer, type TaskType } from "@/lib/tasks/answers";
import { awardXp, type XpAward } from "@/lib/xp";

// The answer key never leaves the server before the student has answered (or
// asked for the answer). Generated tasks: the client gets the prompt and a
// seed, and the server regenerates the task to check the answer. Admin-written
// tasks: the client gets the prompt (and shuffled choices) and the task id; the
// key is read from the tasks table, which students cannot read.

import type { TaskRef } from "./ref";

export type { TaskRef };

export type PublicTask = {
  ref: TaskRef;
  level: Level;
  prompt: string;
  figure?: Figure;
  /** math: text field + symbol row; text: plain text field; choice / boolean: buttons. */
  input: "math" | "text" | "choice" | "boolean";
  choices?: { index: number; text: string }[];
  /** "Läs och svara": where in the reading text the answer is, shown before answering. */
  reference?: string;
};

export type SubmitResult =
  | { status: "retry"; reason: RetryReason }
  | {
      /** revealed = the student chose "ge mig svaret". */
      status: "correct" | "wrong" | "revealed";
      attemptId: string | null;
      correctAnswer: { tex?: string; text?: string };
      solutionSteps: SolutionStep[];
      level: { correct: number; attempts: number };
      /** Set when this answer cleared the level (a new star). */
      clearedLevel: Level | null;
      /** "Läs och svara": set when this answer passed the quiz (a new star). */
      quizPassed: boolean;
      stars: number;
      /** XP for a correct answer; null when nothing was awarded (wrong, or answered before). */
      xp: XpAward | null;
      /** Cards won because this answer finished an area milestone. */
      cards: Card[];
    }
  | { status: "error" };

const MAX_SEED = 2 ** 31 - 1;
/** Generated prompts to avoid, so a new round is not the one just finished. */
const PROMPT_HISTORY = 200;
/** Random seeds tried before giving up on a question the student has not seen. */
const SAMPLE_TRIES = 40;
const INPUT_FOR: Record<TaskType, PublicTask["input"]> = {
  numeric: "math",
  expression: "math",
  multiple_choice: "choice",
  true_false: "boolean",
  free_text: "text",
};

async function loadPractice(momentId: unknown, level: unknown) {
  if (typeof momentId !== "string" || !isLevel(level)) return null;
  const profile = await requireProfile();
  // An admin viewing as a student would save answers on the admin account.
  if ((await getViewProfile())?.id !== profile.id) return null;
  const supabase = await createClient();

  // RLS: only visible moments are returned. All levels are open to choose.
  const { data: moment } = await supabase
    .from("moments")
    .select("id, area_id, source, mode, generators(generator_key)")
    .eq("id", momentId)
    .maybeSingle();
  if (!moment) return null;
  // "Läs och svara" questions have no level; they are stored as level 1.
  const read = moment.mode === "read";
  if (read && level !== 1) return null;
  const generator = !read && moment.source === "generator" ? getGenerator(moment.generators?.generator_key) : null;
  if (!read && moment.source === "generator" && !generator) return null;

  const { data: progress } = await supabase
    .from("moment_progress")
    .select("stars")
    .eq("user_id", profile.id)
    .eq("moment_id", moment.id)
    .maybeSingle();

  return { profile, moment, generator, level, read, stars: progress?.stars ?? 0 };
}

type Practice = NonNullable<Awaited<ReturnType<typeof loadPractice>>>;

/** Published tasks at this level that this student has not already answered. */
async function unseenBank(userId: string, momentId: string, level: Level): Promise<number> {
  const admin = createAdminClient();
  const [{ data: tasks }, { data: attempts }] = await Promise.all([
    admin.from("tasks").select("id").eq("moment_id", momentId).eq("level", level).eq("status", "published"),
    admin
      .from("attempts")
      .select("task_id")
      .eq("user_id", userId)
      .eq("moment_id", momentId)
      .eq("level", level)
      .not("task_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  const done = new Set((attempts ?? []).map((a) => a.task_id));
  return (tasks ?? []).filter((t) => !done.has(t.id)).length;
}

/** Prompts this student has already been given, recreated from their seeds. */
async function usedPrompts(userId: string, momentId: string, level: Level, generator: Generator): Promise<Set<string>> {
  const { data } = await createAdminClient()
    .from("attempts")
    .select("generator_seed")
    .eq("user_id", userId)
    .eq("moment_id", momentId)
    .eq("level", level)
    .not("generator_seed", "is", null)
    .order("created_at", { ascending: false })
    .limit(PROMPT_HISTORY);
  const prompts = new Set<string>();
  for (const row of data ?? []) {
    if (row.generator_seed === null) continue;
    prompts.add(generator.generate(level, row.generator_seed).prompt);
  }
  return prompts;
}

/** How many new prompts a sample can find. Stops once a full round of 10 is possible. */
function sampleFresh(generator: Generator, level: Level, used: Set<string>): number {
  const seen = new Set(used);
  let fresh = 0;
  for (let i = 0; i < SAMPLE_TRIES && fresh < 10; i++) {
    const prompt = generator.generate(level, randomInt(0, MAX_SEED)).prompt;
    if (seen.has(prompt)) continue;
    seen.add(prompt);
    fresh++;
  }
  return fresh;
}

/** A generated task the student has not already been shown. Null when the generator has nothing new. */
async function pickGeneratedTask(practice: Practice, seen: Set<string>): Promise<PublicTask | null> {
  const generator = practice.generator!;
  const avoid = await usedPrompts(practice.profile.id, practice.moment.id, practice.level, generator);
  for (const key of seen) {
    if (!key.startsWith("g")) continue;
    const seed = Number(key.slice(1));
    if (Number.isInteger(seed)) avoid.add(generator.generate(practice.level, seed).prompt);
  }

  for (let tries = 0; tries < SAMPLE_TRIES; tries++) {
    const seed = randomInt(0, MAX_SEED);
    const task = generator.generate(practice.level, seed);
    if (avoid.has(task.prompt)) continue;
    return { ref: { kind: "generator", seed }, level: practice.level, prompt: task.prompt, figure: task.figure, input: "math" };
  }
  return null;
}

/** A published task the student has not answered. Never falls back to one they have already had. */
async function pickBankTask(practice: Practice, seen: Set<string>): Promise<PublicTask | null> {
  const { data: tasks } = await createAdminClient()
    .from("tasks")
    .select("id, type, prompt_md, choices, hint_md")
    .eq("moment_id", practice.moment.id)
    .eq("level", practice.level)
    .eq("status", "published");
  if (!tasks?.length) return null;

  const { data: attempts } = await createAdminClient()
    .from("attempts")
    .select("task_id")
    .eq("user_id", practice.profile.id)
    .eq("moment_id", practice.moment.id)
    .eq("level", practice.level)
    .not("task_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1000);
  const attempted = new Set((attempts ?? []).map((a) => a.task_id));
  const pool = tasks.filter((t) => !seen.has(`t${t.id}`) && !attempted.has(t.id));
  if (!pool.length) return null;
  const task = pool[randomInt(0, pool.length)];

  const rng = createRng(randomInt(0, MAX_SEED));
  const choices = Array.isArray(task.choices)
    ? rng.shuffle((task.choices as string[]).map((text, index) => ({ index, text })))
    : undefined;
  return {
    ref: { kind: "task", taskId: task.id },
    level: practice.level,
    prompt: task.prompt_md,
    input: INPUT_FOR[task.type as TaskType],
    choices,
    reference: practice.read ? task.hint_md?.trim() || undefined : undefined,
  };
}

/** `seen`: refKeys already shown this round, so a round never repeats a task. */
export async function nextTask(momentId: string, level: Level, seen: string[] = []): Promise<PublicTask | null> {
  const practice = await loadPractice(momentId, level);
  if (!practice) return null;
  const seenSet = new Set(Array.isArray(seen) ? seen.slice(0, 20).map(String) : []);
  return practice.generator ? pickGeneratedTask(practice, seenSet) : pickBankTask(practice, seenSet);
}

export type PracticeMenu = {
  /** Sizes that can be filled with questions this student has not had. Empty: offer nothing. */
  rounds: Record<Level, number[]>;
  /** Those sizes still have to be written from the reading. There is nothing left to repeat. */
  generate: boolean;
};

const NO_ROUNDS: Record<Level, number[]> = { 1: [], 2: [], 3: [] };

/** Which new rounds to offer. Uses the person the page is showing (a student, when an admin looks as them). */
export async function practiceMenu(momentId: string): Promise<PracticeMenu> {
  const profile = (await getViewProfile()) ?? (await requireProfile());
  return menuFor(profile.id, momentId);
}

async function menuFor(userId: string, momentId: string): Promise<PracticeMenu> {
  const admin = createAdminClient();
  const { data: moment } = await admin
    .from("moments")
    .select("id, mode, source, generators(generator_key)")
    .eq("id", momentId)
    .maybeSingle();
  const rounds: Record<Level, number[]> = { ...NO_ROUNDS };
  if (!moment) return { rounds, generate: false };

  if (moment.mode === "read") {
    const offer = await readOffer(userId, momentId);
    rounds[1] = offer.sizes;
    return { rounds, generate: offer.generate };
  }

  const generator = moment.source === "generator" ? getGenerator(moment.generators?.generator_key) : null;
  for (const level of LEVELS) {
    rounds[level] = generator
      ? offeredRounds(sampleFresh(generator, level, await usedPrompts(userId, momentId, level, generator)))
      : offeredRounds(await unseenBank(userId, momentId, level));
  }
  return { rounds, generate: false };
}

/** Another round from the reading, but only when the text was not already used up. */
async function readOffer(userId: string, momentId: string): Promise<{ sizes: number[]; generate: boolean }> {
  const unseen = await unseenBank(userId, momentId, 1);
  if (unseen > 0) return { sizes: offeredRounds(unseen), generate: false };

  const admin = createAdminClient();
  const [{ data: blocks }, { data: tasks }, { data: closed }] = await Promise.all([
    admin.from("content_blocks").select("body_md").eq("moment_id", momentId).eq("type", "reading"),
    admin.from("tasks").select("id").eq("moment_id", momentId).eq("level", 1).eq("status", "published"),
    admin.from("settings").select("key").eq("key", quizClosedKey(momentId)).maybeSingle(),
  ]);
  const words = wordCount((blocks ?? []).map((b) => b.body_md).join("\n"));
  if (closed || !readingCanSupportMore(words, tasks?.length ?? 0)) return { sizes: [], generate: false };
  const ai = await aiStatus("cheap");
  if (!ai.available) return { sizes: [], generate: false };
  return { sizes: offeredRounds(0, true), generate: true };
}

/**
 * Writes a new batch of quiz questions from the reading. Does nothing when the
 * text cannot support more, or when the model finds nothing left worth asking.
 */
async function writeMoreQuestions(userId: string, momentId: string, count: number): Promise<void> {
  if ((await unseenBank(userId, momentId, 1)) > 0) return;
  const admin = createAdminClient();
  const [{ data: moment }, { data: blocks }, { data: tasks }, { data: closed }] = await Promise.all([
    admin.from("moments").select("name, mode").eq("id", momentId).maybeSingle(),
    admin.from("content_blocks").select("title, body_md").eq("moment_id", momentId).eq("type", "reading").order("sort_order"),
    admin.from("tasks").select("prompt_md").eq("moment_id", momentId).eq("level", 1).eq("status", "published"),
    admin.from("settings").select("key").eq("key", quizClosedKey(momentId)).maybeSingle(),
  ]);
  if (!moment || moment.mode !== "read" || !blocks?.length || closed) return;
  const existing = (tasks ?? []).map((t) => t.prompt_md);
  if (!readingCanSupportMore(wordCount(blocks.map((b) => b.body_md).join("\n")), existing.length)) return;

  const { system, prompt } = moreQuestionsPrompt({
    moment: moment.name,
    sections: blocks.map((b) => ({ title: b.title ?? "", body: b.body_md })),
    existing: existing.slice(0, 40),
    count,
  });
  const result = await askClaude({
    purpose: "more_questions",
    userId,
    tier: "cheap",
    system,
    prompt,
    maxTokens: 4_000,
    jsonSchema: moreQuestionsSchema,
    timeoutMs: 90_000,
  });
  if (!result.ok) return;

  const taken = new Set(existing.map((p) => p.trim().toLowerCase()));
  const fresh = parseMoreQuestions(
    result.json,
    blocks.map((b) => b.title ?? ""),
  ).filter((q) => !taken.has(q.prompt.toLowerCase()));
  const close = () => admin.from("settings").upsert({ key: quizClosedKey(momentId), value: true });
  if (fresh.length === 0) {
    await close();
    return;
  }

  const { error } = await admin.from("tasks").insert(
    fresh.map((q) => ({
      moment_id: momentId,
      level: 1 as const,
      type: q.type,
      prompt_md: q.prompt,
      answer: q.answer as unknown as Json,
      choices: q.choices,
      solution_md: q.solution || null,
      hint_md: q.section ? strings.admin.drafts.sectionHint(q.section) : null,
      status: "published" as const,
      source: "ai" as const,
    })),
  );
  if (error) {
    console.error("practice: could not save new questions", error);
    return;
  }
  // Fewer than a small round means the text is used up. Don't ask the model again.
  if (fresh.length < 5) await close();
}

/**
 * The round size to start, using only new questions. When the reading can
 * support more, writes them first. Null when there is nothing new to offer.
 */
export async function prepareRound(momentId: string, level: Level, requested: number): Promise<number | null> {
  const profile = await requireProfile();
  if ((await getViewProfile())?.id !== profile.id || !isLevel(level)) return null;
  let menu = await menuFor(profile.id, momentId);
  if (menu.generate && level === 1) {
    await writeMoreQuestions(profile.id, momentId, requested === 5 ? 5 : 10);
    menu = await menuFor(profile.id, momentId);
    if (menu.generate) return null;
  }
  const sizes = menu.rounds[level];
  if (sizes.includes(requested)) return requested;
  return sizes.length ? sizes[sizes.length - 1] : null;
}

type Loaded = {
  check: (answer: string) => CheckResult;
  hint: string;
  correctAnswer: { tex?: string; text?: string };
  solutionSteps: SolutionStep[];
  record: { generator_key: string | null; generator_seed: number | null; task_id: string | null };
};

/** Loads the full task (with answer key) behind a reference. Server only. */
async function loadTask(practice: Practice, ref: TaskRef): Promise<Loaded | null> {
  if (ref?.kind === "generator" && practice.generator) {
    if (!Number.isInteger(ref.seed) || ref.seed < 0 || ref.seed > MAX_SEED) return null;
    const task = practice.generator.generate(practice.level, ref.seed);
    return {
      check: (answer) => checkAnswer(answer, task.answer),
      hint: task.hint,
      correctAnswer: { tex: task.answer.display },
      solutionSteps: task.solutionSteps,
      record: { generator_key: practice.generator.key, generator_seed: ref.seed, task_id: null },
    };
  }
  if (ref?.kind === "task" && !practice.generator && typeof ref.taskId === "string") {
    const { data: task } = await createAdminClient()
      .from("tasks")
      .select("id, type, answer, choices, solution_md, hint_md")
      .eq("id", ref.taskId)
      .eq("moment_id", practice.moment.id)
      .eq("level", practice.level)
      .eq("status", "published")
      .maybeSingle();
    if (!task) return null;
    const key = task.answer as unknown as TaskAnswer;
    return {
      check: (answer) => checkTaskAnswer(key, answer),
      hint: task.hint_md?.trim() || strings.practice.genericHints[task.type as TaskType],
      correctAnswer: correctAnswerDisplay(key, task.choices as string[] | null),
      solutionSteps: task.solution_md ? [{ text: task.solution_md }] : [],
      record: { generator_key: null, generator_seed: null, task_id: task.id },
    };
  }
  return null;
}

export async function getHint(momentId: string, level: Level, ref: TaskRef): Promise<string | null> {
  const practice = await loadPractice(momentId, level);
  if (!practice) return null;
  return (await loadTask(practice, ref))?.hint ?? null;
}

export async function submitAnswer(input: {
  momentId: string;
  level: Level;
  ref: TaskRef;
  answer: string;
  usedHint?: boolean;
  /** "Ge mig svaret": recorded as not correct, answer and solution are returned. */
  giveUp?: boolean;
  durationMs?: number;
}): Promise<SubmitResult> {
  const practice = await loadPractice(input.momentId, input.level);
  if (!practice) return { status: "error" };
  const { profile, moment, level } = practice;
  const task = await loadTask(practice, input.ref);
  if (!task) return { status: "error" };

  const giveUp = input.giveUp === true;
  const answer = giveUp ? "" : String(input.answer ?? "").slice(0, 500);
  let correct = false;
  if (!giveUp) {
    const result = task.check(answer);
    if (result.status === "retry") return result;
    correct = result.status === "correct";
  }

  const admin = createAdminClient();

  // Answering the same generated task twice (double click, back button) is recorded once.
  let attemptId: string | null = null;
  let xp: XpAward | null = null;
  let newCorrect = false;
  if (task.record.generator_seed !== null) {
    const { data: existing } = await admin
      .from("attempts")
      .select("id")
      .eq("user_id", profile.id)
      .eq("moment_id", moment.id)
      .eq("level", level)
      .eq("generator_seed", task.record.generator_seed)
      .maybeSingle();
    attemptId = existing?.id ?? null;
  }

  if (!attemptId) {
    const durationMs =
      Number.isInteger(input.durationMs) && input.durationMs! >= 0 ? Math.min(input.durationMs!, 3_600_000) : null;
    const { data: inserted, error } = await admin
      .from("attempts")
      .insert({
        user_id: profile.id,
        moment_id: moment.id,
        level,
        ...task.record,
        answer,
        correct,
        used_hint: input.usedHint === true,
        gave_up: giveUp,
        duration_ms: durationMs,
      })
      .select("id")
      .single();
    if (error) return { status: "error" };
    attemptId = inserted.id;
    if (correct) xp = await awardXp(profile.id, XP_FOR_LEVEL[level], "correct_answer", attemptId);
    newCorrect = correct;
  }

  // Level progress: 8 of the latest 10 at this level clears it (or the student's own bar).
  const { data: recent } = await admin
    .from("attempts")
    .select("correct")
    .eq("user_id", profile.id)
    .eq("moment_id", moment.id)
    .eq("level", level)
    .order("created_at", { ascending: false })
    .limit(WINDOW);
  const progress = levelProgress((recent ?? []).map((r) => r.correct), passCorrectFor(profile));

  let stars = practice.stars;
  let clearedLevel: Level | null = null;
  let quizPassed = false;
  if (practice.read) {
    // 8 of the latest 10 answers passes the quiz: the second milestone.
    if (progress.cleared && (await reachMilestone(profile.id, moment.id, "quiz_passed_at"))) {
      quizPassed = true;
      stars += 1;
    }
  } else if (progress.cleared && level > stars) {
    stars = level;
    clearedLevel = level;
    await admin
      .from("moment_progress")
      .upsert(
        { user_id: profile.id, moment_id: moment.id, stars, current_level: Math.min(level + 1, 3) },
        { onConflict: "user_id,moment_id" },
      );
  }

  // Cards: every 5th correct answer, and a new star can complete the area (Lätt,
  // Medel or Svår for all its moments, or all quizzes).
  const newStar = Boolean(clearedLevel) || quizPassed;
  const cards =
    newCorrect || newStar ? await awardCards(profile, { answers: newCorrect, areas: newStar ? [moment.area_id] : undefined }) : [];

  return {
    status: giveUp ? "revealed" : correct ? "correct" : "wrong",
    attemptId,
    correctAnswer: task.correctAnswer,
    solutionSteps: task.solutionSteps,
    level: { correct: progress.correct, attempts: progress.attempts },
    clearedLevel,
    quizPassed,
    stars,
    xp,
    cards,
  };
}

/**
 * "Hur tänkte du?" – stored on the attempt and shown to the admin. The first
 * explanation of at least EXPLANATION_MIN_CHARS on an attempt gives XP.
 */
export async function saveExplanation(attemptId: string, text: string): Promise<{ saved: boolean; xp: XpAward | null }> {
  const profile = await requireProfile();
  const explanation = String(text ?? "").trim().slice(0, 2000);
  if (typeof attemptId !== "string" || !explanation) return { saved: false, xp: null };

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from("attempts")
    .select("explanation_text")
    .eq("id", attemptId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!attempt) return { saved: false, xp: null };

  const { error, count } = await admin
    .from("attempts")
    .update({ explanation_text: explanation }, { count: "exact" })
    .eq("id", attemptId)
    .eq("user_id", profile.id);
  if (error || count !== 1) return { saved: false, xp: null };

  const first = !attempt.explanation_text?.trim();
  const xp =
    first && explanation.length >= EXPLANATION_MIN_CHARS
      ? await awardXp(profile.id, EXPLANATION_XP, "explanation", attemptId)
      : null;
  return { saved: true, xp };
}
