"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { usernameToEmail } from "@/lib/auth/username";
import { strings } from "@/lib/strings";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "./content-actions";
import { MIN_PASSWORD, parseNewStudent, parseSiteSettings, parseStudentSettings } from "./user-input";

// Admin mutations for accounts and site settings. The expectation columns on
// profiles and auth users are only writable with the service role, so these
// re-check the admin role and then use the admin client.

const t = strings.admin.users;
const fail = (error: string): ActionResult => ({ ok: false, error });

export async function updateStudent(id: string, input: Record<string, unknown>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseStudentSettings(input);
  if (!parsed.ok) return fail(t.invalid[parsed.field as keyof typeof t.invalid] ?? strings.admin.errors.generic);
  const { displayName, grade, dailyGoalXp, passCorrect, collectionTheme } = parsed.value;
  const { error } = await createAdminClient()
    .from("profiles")
    .update({ display_name: displayName, grade, daily_goal_xp: dailyGoalXp, pass_correct: passCorrect, collection_theme: collectionTheme })
    .eq("id", id)
    .eq("role", "student");
  if (error) return fail(strings.admin.errors.generic);
  refresh();
  return { ok: true };
}

export async function createStudent(input: Record<string, unknown>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseNewStudent(input);
  if (!parsed.ok) return fail(t.invalid[parsed.field as keyof typeof t.invalid] ?? strings.admin.errors.generic);
  const { username, displayName, password, grade } = parsed.value;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username, display_name: displayName },
    app_metadata: { role: "student" },
  });
  if (error || !data.user) return fail(error?.code === "email_exists" ? t.usernameTaken : strings.admin.errors.generic);
  if (grade) await admin.from("profiles").update({ grade }).eq("id", data.user.id);
  refresh();
  return { ok: true, id: data.user.id };
}

export async function resetPassword(id: string, password: string): Promise<ActionResult> {
  await requireAdmin();
  if (password.length < MIN_PASSWORD || password.length > 72) return fail(t.invalid.password);
  const admin = createAdminClient();
  const { data: student } = await admin.from("profiles").select("id").eq("id", id).eq("role", "student").maybeSingle();
  if (!student) return fail(strings.admin.errors.generic);
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  return error ? fail(strings.admin.errors.generic) : { ok: true };
}

export async function updateSiteSettings(input: Record<string, unknown>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseSiteSettings(input);
  if (!parsed.ok) return fail(t.invalid[parsed.field as keyof typeof t.invalid] ?? strings.admin.errors.generic);
  const { dailyGoalXp, aiMonthlyBudgetUsd, aiFeedbackDailyLimit } = parsed.value;
  const { error } = await createAdminClient()
    .from("settings")
    .upsert([
      { key: "daily_goal_xp", value: dailyGoalXp },
      { key: "ai_monthly_budget_usd", value: aiMonthlyBudgetUsd },
      { key: "ai_feedback_daily_limit", value: aiFeedbackDailyLimit },
    ]);
  if (error) return fail(strings.admin.errors.generic);
  refresh();
  return { ok: true };
}
