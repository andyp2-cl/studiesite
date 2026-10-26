import "server-only";
import { monthSpendUsd } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth/session";
import { stagesFor, type Stage } from "@/lib/curriculum";
import { createAdminClient } from "@/lib/supabase/admin";

// Read-side for /admin/anvandare and /admin/installningar.

const DEFAULTS = { daily_goal_xp: 50, ai_monthly_budget_usd: 5, ai_feedback_daily_limit: 5 };

export async function getSiteSettings() {
  await requireAdmin();
  const { data } = await createAdminClient().from("settings").select("key, value").in("key", Object.keys(DEFAULTS));
  const value = (key: keyof typeof DEFAULTS) => {
    const n = Number(data?.find((r) => r.key === key)?.value);
    return Number.isFinite(n) ? n : DEFAULTS[key];
  };
  return {
    dailyGoalXp: value("daily_goal_xp"),
    aiMonthlyBudgetUsd: value("ai_monthly_budget_usd"),
    aiFeedbackDailyLimit: value("ai_feedback_daily_limit"),
    spentUsd: await monthSpendUsd(),
  };
}

export async function getStudentAccounts() {
  await requireAdmin();
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, username, display_name, grade, daily_goal_xp, pass_correct")
    .eq("role", "student")
    .order("display_name");
  return (data ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    grade: p.grade,
    dailyGoalXp: p.daily_goal_xp,
    passCorrect: p.pass_correct,
  }));
}

/** School stages of the students (from their grades), for the curriculum excerpt. */
export async function getStudentStages(): Promise<Stage[]> {
  await requireAdmin();
  const { data } = await createAdminClient().from("profiles").select("grade").eq("role", "student");
  return stagesFor((data ?? []).map((p) => p.grade));
}
