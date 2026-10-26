import "server-only";
import { monthlyBudgetUsd, monthSpendUsd } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth/session";
import { profileStreak } from "@/lib/gamification";
import { getGenerator } from "@/lib/generators";
import type { Level } from "@/lib/generators/types";
import { dailyActivity, momentAccuracy, totals } from "@/lib/stats";
import { createAdminClient } from "@/lib/supabase/admin";
import { stockholmDate } from "@/lib/time";

// Read-side for /admin/statistik. One student at a time, over the last 30
// days, so the queries stay small on the free Supabase tier.

const WINDOW_DAYS = 30;
const MAX_ATTEMPTS = 5000;
const LIST_LENGTH = 8;

export async function getStudents() {
  await requireAdmin();
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, display_name")
    .eq("role", "student")
    .order("display_name");
  return data ?? [];
}

export async function getStudentStats(studentId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const now = new Date();
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000).toISOString();

  const [{ data: profile }, { data: attemptRows }, budget, spent] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, xp, level, coins, streak, last_active_date, streak_freezes, freeze_refilled_week")
      .eq("id", studentId)
      .eq("role", "student")
      .maybeSingle(),
    supabase
      .from("attempts")
      .select("created_at, correct, gave_up, duration_ms, moment_id, level, answer, task_id, generator_key, generator_seed, explanation_text")
      .eq("user_id", studentId)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_ATTEMPTS),
    monthlyBudgetUsd(),
    monthSpendUsd(now),
  ]);
  if (!profile) return null;
  const attempts = attemptRows ?? [];

  const mistakes = attempts.filter((a) => !a.correct).slice(0, LIST_LENGTH);
  const explanations = attempts.filter((a) => a.explanation_text?.trim()).slice(0, LIST_LENGTH);
  const momentIds = [...new Set(attempts.map((a) => a.moment_id))];
  const taskIds = [...new Set([...mistakes, ...explanations].map((a) => a.task_id).filter((id): id is string => !!id))];

  const [{ data: moments }, { data: tasks }] = await Promise.all([
    momentIds.length
      ? supabase.from("moments").select("id, name, areas(name, subjects(name))").in("id", momentIds)
      : Promise.resolve({ data: [] }),
    taskIds.length ? supabase.from("tasks").select("id, prompt_md").in("id", taskIds) : Promise.resolve({ data: [] }),
  ]);
  const momentName = new Map(
    (moments ?? []).map((m) => [m.id, { name: m.name, place: [m.areas?.subjects?.name, m.areas?.name].filter(Boolean).join(" · ") }]),
  );
  const taskPrompt = new Map((tasks ?? []).map((t) => [t.id, t.prompt_md]));

  // Generated tasks are not stored; the seed recreates the exact question.
  const promptOf = (a: (typeof attempts)[number]): string => {
    if (a.task_id) return taskPrompt.get(a.task_id) ?? "";
    const generator = getGenerator(a.generator_key);
    if (!generator || a.generator_seed === null) return "";
    try {
      return generator.generate(a.level as Level, a.generator_seed).prompt;
    } catch {
      return "";
    }
  };
  const listItem = (a: (typeof attempts)[number]) => ({
    at: a.created_at,
    moment: momentName.get(a.moment_id)?.name ?? "",
    prompt: promptOf(a),
    answer: a.answer,
    gaveUp: a.gave_up,
    explanation: a.explanation_text ?? "",
  });

  const today = stockholmDate(now);
  return {
    profile: {
      name: profile.display_name,
      xp: profile.xp,
      level: profile.level,
      coins: profile.coins,
      streak: profileStreak(profile, today),
      lastActive: profile.last_active_date,
    },
    week: totals(dailyActivity(attempts, 7, now)),
    days: dailyActivity(attempts, 14, now),
    moments: momentAccuracy(attempts).map((m) => ({ ...m, ...(momentName.get(m.momentId) ?? { name: "", place: "" }) })),
    mistakes: mistakes.map(listItem),
    explanations: explanations.map(listItem),
    ai: { spent, budget },
  };
}

export type StudentStats = NonNullable<Awaited<ReturnType<typeof getStudentStats>>>;
