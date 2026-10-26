"use server";

import { randomInt } from "node:crypto";
import { requireProfile } from "@/lib/auth/session";
import { awardAreaCards } from "@/lib/cards/award";
import type { Card } from "@/lib/cards/catalog";
import { getGenerator } from "@/lib/generators";
import { isLevel, type Figure, type Level, type SolutionStep } from "@/lib/generators/types";
import { checkAnswer, type CheckResult, type RetryReason } from "@/lib/math/check-answer";
import { EXPLANATION_MIN_CHARS, EXPLANATION_XP, XP_FOR_LEVEL } from "@/lib/gamification";
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
/** How many recent tasks to avoid repeating (covers the previous round of up to 10). */
const AVOID_RECENT = 10;
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

async function recentAttempts(practice: Practice, column: "generator_seed" | "task_id") {
  const { data } = await createAdminClient()
    .from("attempts")
    .select("generator_seed, task_id")
    .eq("user_id", practice.profile.id)
    .eq("moment_id", practice.moment.id)
    .eq("level", practice.level)
    .not(column, "is", null)
    .order("created_at", { ascending: false })
    .limit(AVOID_RECENT);
  return data ?? [];
}

/** A generated task whose prompt was not shown this round or in the latest attempts. */
async function pickGeneratedTask(practice: Practice, seen: Set<string>): Promise<PublicTask> {
  const generator = practice.generator!;
  const recentSeeds = (await recentAttempts(practice, "generator_seed")).map((a) => a.generator_seed!);
  const seenSeeds = [...seen].filter((k) => k.startsWith("g")).map((k) => Number(k.slice(1)));
  const avoidPrompts = new Set(
    [...recentSeeds, ...seenSeeds].filter(Number.isInteger).map((s) => generator.generate(practice.level, s).prompt),
  );

  let seed = randomInt(0, MAX_SEED);
  let task = generator.generate(practice.level, seed);
  for (let tries = 0; tries < 30 && avoidPrompts.has(task.prompt); tries++) {
    seed = randomInt(0, MAX_SEED);
    task = generator.generate(practice.level, seed);
  }
  return { ref: { kind: "generator", seed }, level: practice.level, prompt: task.prompt, figure: task.figure, input: "math" };
}

/** A published task, avoiding this round and the student's latest attempts when possible. */
async function pickBankTask(practice: Practice, seen: Set<string>): Promise<PublicTask | null> {
  const { data: tasks } = await createAdminClient()
    .from("tasks")
    .select("id, type, prompt_md, choices, hint_md")
    .eq("moment_id", practice.moment.id)
    .eq("level", practice.level)
    .eq("status", "published");
  if (!tasks?.length) return null;

  const recent = new Set((await recentAttempts(practice, "task_id")).map((a) => a.task_id));
  const notThisRound = tasks.filter((t) => !seen.has(`t${t.id}`));
  const fresh = notThisRound.filter((t) => !recent.has(t.id));
  const pool = fresh.length ? fresh : notThisRound.length ? notThisRound : tasks;
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

  // A new star can complete the area: Lätt, Medel or Svår for all its moments, or all quizzes.
  const cards = clearedLevel || quizPassed ? await awardAreaCards(profile, [moment.area_id]) : [];

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
