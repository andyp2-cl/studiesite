"use server";

import { randomInt } from "node:crypto";
import { requireProfile } from "@/lib/auth/session";
import { getGenerator } from "@/lib/generators";
import { isLevel, type Figure, type Level, type SolutionStep } from "@/lib/generators/types";
import { checkAnswer, type CheckResult } from "@/lib/math/check-answer";
import { isLevelUnlocked, levelProgress, WINDOW } from "@/lib/progress";
import { createRng } from "@/lib/random";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkTaskAnswer, correctAnswerDisplay, type TaskAnswer, type TaskType } from "@/lib/tasks/answers";

// The answer key never leaves the server. Generated tasks: the client gets the
// prompt and a seed, and the server regenerates the task to check the answer.
// Admin-written tasks: the client gets the prompt (and shuffled choices) and
// the task id; the key is read from the tasks table, which students cannot read.

export type TaskRef = { kind: "generator"; seed: number } | { kind: "task"; taskId: string };

export type PublicTask = {
  ref: TaskRef;
  level: Level;
  prompt: string;
  figure?: Figure;
  /** math: text field + symbol row; text: plain text field; choice / boolean: buttons. */
  input: "math" | "text" | "choice" | "boolean";
  choices?: { index: number; text: string }[];
};

export type SubmitResult =
  | { status: "retry"; reason: "unreadable" | "not-simplified" }
  | {
      status: "correct" | "wrong";
      attemptId: string | null;
      correctAnswer: { tex?: string; text?: string };
      solutionSteps: SolutionStep[];
      level: { correct: number; attempts: number };
      /** Set when this answer cleared the level (a new star). */
      clearedLevel: Level | null;
      stars: number;
    }
  | { status: "error" };

const MAX_SEED = 2 ** 31 - 1;
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

  // RLS: only visible moments are returned.
  const { data: moment } = await supabase
    .from("moments")
    .select("id, source, generators(generator_key)")
    .eq("id", momentId)
    .maybeSingle();
  if (!moment) return null;
  const generator = moment.source === "generator" ? getGenerator(moment.generators?.generator_key) : null;
  if (moment.source === "generator" && !generator) return null;

  const { data: progress } = await supabase
    .from("moment_progress")
    .select("stars")
    .eq("user_id", profile.id)
    .eq("moment_id", moment.id)
    .maybeSingle();
  const stars = progress?.stars ?? 0;
  if (!isLevelUnlocked(level, stars)) return null;

  return { profile, moment, generator, level, stars };
}

type Practice = NonNullable<Awaited<ReturnType<typeof loadPractice>>>;

/** Picks a published task, avoiding the ones this student saw most recently. */
async function pickBankTask(practice: Practice): Promise<PublicTask | null> {
  const admin = createAdminClient();
  const { data: tasks } = await admin
    .from("tasks")
    .select("id, type, prompt_md, choices")
    .eq("moment_id", practice.moment.id)
    .eq("level", practice.level)
    .eq("status", "published");
  if (!tasks?.length) return null;

  let candidates = tasks;
  if (tasks.length > 1) {
    const { data: recent } = await admin
      .from("attempts")
      .select("task_id")
      .eq("user_id", practice.profile.id)
      .eq("moment_id", practice.moment.id)
      .eq("level", practice.level)
      .not("task_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(Math.min(5, tasks.length - 1));
    const avoid = new Set((recent ?? []).map((r) => r.task_id));
    candidates = tasks.filter((t) => !avoid.has(t.id));
  }
  const task = candidates[randomInt(0, candidates.length)];

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
  };
}

export async function nextTask(momentId: string, level: Level): Promise<PublicTask | null> {
  const practice = await loadPractice(momentId, level);
  if (!practice) return null;
  if (!practice.generator) return pickBankTask(practice);

  const seed = randomInt(0, MAX_SEED);
  const { prompt, figure } = practice.generator.generate(practice.level, seed);
  return { ref: { kind: "generator", seed }, level: practice.level, prompt, figure, input: "math" };
}

type Checked = {
  result: CheckResult;
  correctAnswer: { tex?: string; text?: string };
  solutionSteps: SolutionStep[];
  record: { generator_key: string | null; generator_seed: number | null; task_id: string | null };
};

async function check(practice: Practice, ref: TaskRef, answer: string): Promise<Checked | null> {
  if (ref?.kind === "generator" && practice.generator) {
    if (!Number.isInteger(ref.seed) || ref.seed < 0 || ref.seed > MAX_SEED) return null;
    const task = practice.generator.generate(practice.level, ref.seed);
    return {
      result: checkAnswer(answer, task.answer),
      correctAnswer: { tex: task.answer.display },
      solutionSteps: task.solutionSteps,
      record: { generator_key: practice.generator.key, generator_seed: ref.seed, task_id: null },
    };
  }
  if (ref?.kind === "task" && !practice.generator && typeof ref.taskId === "string") {
    const { data: task } = await createAdminClient()
      .from("tasks")
      .select("id, answer, choices, solution_md")
      .eq("id", ref.taskId)
      .eq("moment_id", practice.moment.id)
      .eq("level", practice.level)
      .eq("status", "published")
      .maybeSingle();
    if (!task) return null;
    const key = task.answer as unknown as TaskAnswer;
    return {
      result: checkTaskAnswer(key, answer),
      correctAnswer: correctAnswerDisplay(key, task.choices as string[] | null),
      solutionSteps: task.solution_md ? [{ text: task.solution_md }] : [],
      record: { generator_key: null, generator_seed: null, task_id: task.id },
    };
  }
  return null;
}

export async function submitAnswer(input: {
  momentId: string;
  level: Level;
  ref: TaskRef;
  answer: string;
  durationMs?: number;
}): Promise<SubmitResult> {
  const practice = await loadPractice(input.momentId, input.level);
  if (!practice) return { status: "error" };
  const { profile, moment, level } = practice;
  const answer = String(input.answer ?? "").slice(0, 500);

  const checked = await check(practice, input.ref, answer);
  if (!checked) return { status: "error" };
  if (checked.result.status === "retry") return checked.result;
  const correct = checked.result.status === "correct";

  const admin = createAdminClient();

  // Answering the same generated task twice (double click, back button) is recorded once.
  let attemptId: string | null = null;
  if (checked.record.generator_seed !== null) {
    const { data: existing } = await admin
      .from("attempts")
      .select("id")
      .eq("user_id", profile.id)
      .eq("moment_id", moment.id)
      .eq("level", level)
      .eq("generator_seed", checked.record.generator_seed)
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
        ...checked.record,
        answer,
        correct,
        duration_ms: durationMs,
      })
      .select("id")
      .single();
    if (error) return { status: "error" };
    attemptId = inserted.id;
  }

  // Level progress: 8 of the latest 10 at this level clears it.
  const { data: recent } = await admin
    .from("attempts")
    .select("correct")
    .eq("user_id", profile.id)
    .eq("moment_id", moment.id)
    .eq("level", level)
    .order("created_at", { ascending: false })
    .limit(WINDOW);
  const progress = levelProgress((recent ?? []).map((r) => r.correct));

  let stars = practice.stars;
  let clearedLevel: Level | null = null;
  if (progress.cleared && level > stars) {
    stars = level;
    clearedLevel = level;
    await admin
      .from("moment_progress")
      .upsert(
        { user_id: profile.id, moment_id: moment.id, stars, current_level: Math.min(level + 1, 3) },
        { onConflict: "user_id,moment_id" },
      );
  }

  return {
    status: checked.result.status,
    attemptId,
    correctAnswer: checked.correctAnswer,
    solutionSteps: checked.solutionSteps,
    level: { correct: progress.correct, attempts: progress.attempts },
    clearedLevel,
    stars,
  };
}

/** "Hur tänkte du?" – stored on the attempt and shown to the admin. */
export async function saveExplanation(attemptId: string, text: string): Promise<boolean> {
  const profile = await requireProfile();
  const explanation = String(text ?? "").trim().slice(0, 2000);
  if (typeof attemptId !== "string" || !explanation) return false;

  const { error, count } = await createAdminClient()
    .from("attempts")
    .update({ explanation_text: explanation }, { count: "exact" })
    .eq("id", attemptId)
    .eq("user_id", profile.id);
  return !error && count === 1;
}
