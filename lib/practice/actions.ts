"use server";

import { randomInt } from "node:crypto";
import { requireProfile } from "@/lib/auth/session";
import { getGenerator } from "@/lib/generators";
import { isLevel, type Figure, type Level, type SolutionStep } from "@/lib/generators/types";
import { checkAnswer } from "@/lib/math/check-answer";
import { isLevelUnlocked, levelProgress, WINDOW } from "@/lib/progress";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// The answer key never leaves the server: the client gets the prompt and a
// seed, and the server regenerates the task from the seed to check answers.

export type PublicTask = { seed: number; level: Level; prompt: string; figure?: Figure };

export type SubmitResult =
  | { status: "retry"; reason: "unreadable" | "not-simplified" }
  | {
      status: "correct" | "wrong";
      attemptId: string | null;
      correctAnswer: string;
      solutionSteps: SolutionStep[];
      level: { correct: number; attempts: number };
      /** Set when this answer cleared the level (a new star). */
      clearedLevel: Level | null;
      stars: number;
    }
  | { status: "error" };

const MAX_SEED = 2 ** 31 - 1;

async function loadPractice(momentId: string, level: unknown) {
  if (typeof momentId !== "string" || !isLevel(level)) return null;
  const profile = await requireProfile();
  const supabase = await createClient();

  // RLS: only visible moments are returned.
  const { data: moment } = await supabase
    .from("moments")
    .select("id, generators(generator_key)")
    .eq("id", momentId)
    .maybeSingle();
  const generator = getGenerator(moment?.generators?.generator_key);
  if (!moment || !generator) return null;

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

export async function nextTask(momentId: string, level: Level): Promise<PublicTask | null> {
  const practice = await loadPractice(momentId, level);
  if (!practice) return null;
  const seed = randomInt(0, MAX_SEED);
  const { prompt, figure } = practice.generator.generate(practice.level, seed);
  return { seed, level: practice.level, prompt, figure };
}

export async function submitAnswer(input: {
  momentId: string;
  level: Level;
  seed: number;
  answer: string;
  durationMs?: number;
}): Promise<SubmitResult> {
  const practice = await loadPractice(input.momentId, input.level);
  if (!practice || !Number.isInteger(input.seed) || input.seed < 0 || input.seed > MAX_SEED) {
    return { status: "error" };
  }
  const { profile, moment, generator, level } = practice;
  const answer = String(input.answer ?? "").slice(0, 100);

  const task = generator.generate(level, input.seed);
  const result = checkAnswer(answer, task.answer);
  if (result.status === "retry") return result;

  const admin = createAdminClient();
  const correct = result.status === "correct";

  // Answering the same task twice (double click, back button) is recorded once.
  const { data: existing } = await admin
    .from("attempts")
    .select("id")
    .eq("user_id", profile.id)
    .eq("moment_id", moment.id)
    .eq("level", level)
    .eq("generator_seed", input.seed)
    .maybeSingle();

  let attemptId = existing?.id ?? null;
  if (!existing) {
    const durationMs =
      Number.isInteger(input.durationMs) && input.durationMs! >= 0 ? Math.min(input.durationMs!, 3_600_000) : null;
    const { data: inserted, error } = await admin
      .from("attempts")
      .insert({
        user_id: profile.id,
        moment_id: moment.id,
        level,
        generator_key: generator.key,
        generator_seed: input.seed,
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
    status: result.status,
    attemptId,
    correctAnswer: task.answer.display,
    solutionSteps: task.solutionSteps,
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
