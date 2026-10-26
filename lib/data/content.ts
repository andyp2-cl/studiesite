import "server-only";
import { cache } from "react";
import type { Level } from "@/lib/generators/types";
import { levelProgress, REQUIRED_CORRECT } from "@/lib/progress";
import { startOfStockholmDay } from "@/lib/time";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Read-side data access for student pages. Queries run as the signed-in user
// (RLS applies) unless noted otherwise.

export type MomentProgress = { stars: number; currentLevel: number };

export const getProgressMap = cache(async (userId: string): Promise<Map<string, MomentProgress>> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("moment_progress")
    .select("moment_id, stars, current_level")
    .eq("user_id", userId);
  return new Map((data ?? []).map((p) => [p.moment_id, { stars: p.stars, currentLevel: p.current_level }]));
});

export const getSubjectsWithAreas = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subjects")
    .select(
      "id, slug, name, description, color, icon, is_hidden, areas(id, slug, name, description, color, icon, sort_order, is_hidden, moments(id, is_hidden))",
    )
    .order("sort_order")
    .order("sort_order", { referencedTable: "areas" });
  // Admins can read hidden rows, so filter here: the student pages show what a student sees.
  return (data ?? []).filter((s) => !s.is_hidden).map((s) => ({
    ...s,
    areas: s.areas
      .filter((a) => !a.is_hidden)
      .map((a) => ({ ...a, momentIds: a.moments.filter((m) => !m.is_hidden).map((m) => m.id) })),
  }));
});

export type SubjectWithAreas = Awaited<ReturnType<typeof getSubjectsWithAreas>>[number];
export type AreaSummary = SubjectWithAreas["areas"][number];

export async function getArea(subjectSlug: string, areaSlug: string) {
  const supabase = await createClient();
  const { data: subject } = await supabase
    .from("subjects")
    .select("id, slug, name")
    .eq("slug", subjectSlug)
    .maybeSingle();
  if (!subject) return null;

  const { data: area } = await supabase
    .from("areas")
    .select(
      "id, slug, name, description, color, icon, moments(id, slug, name, description, sort_order, is_hidden, source, mode, generators(generator_key))",
    )
    .eq("subject_id", subject.id)
    .eq("slug", areaSlug)
    .order("sort_order", { referencedTable: "moments" })
    .maybeSingle();
  if (!area) return null;

  return { subject, area: { ...area, moments: area.moments.filter((m) => !m.is_hidden) } };
}

export type LevelStats = Record<Level, { correct: number; attempts: number }>;

export async function getMoment(
  subjectSlug: string,
  areaSlug: string,
  momentSlug: string,
  userId: string,
  passCorrect: number = REQUIRED_CORRECT,
) {
  const found = await getArea(subjectSlug, areaSlug);
  const summary = found?.area.moments.find((m) => m.slug === momentSlug);
  if (!found || !summary) return null;

  const supabase = await createClient();
  const [{ data: blocks }, { data: attempts }, progressMap] = await Promise.all([
    // RLS returns intros and reading sections plus only the deepenings this student has unlocked.
    supabase
      .from("content_blocks")
      .select("id, type, title, body_md, unlock_level, sort_order")
      .eq("moment_id", summary.id)
      .order("sort_order"),
    supabase
      .from("attempts")
      .select("level, correct")
      .eq("user_id", userId)
      .eq("moment_id", summary.id)
      .order("created_at", { ascending: false })
      .limit(100),
    getProgressMap(userId),
  ]);

  // Titles of locked deepenings are shown as teasers, so read just the
  // titles with the service role (bodies stay locked).
  const admin = createAdminClient();
  const [{ data: allDeepenings }, { data: bankTasks }] = await Promise.all([
    admin
      .from("content_blocks")
      .select("id, title, unlock_level, sort_order")
      .eq("moment_id", summary.id)
      .eq("type", "deepening")
      .order("sort_order"),
    // Students cannot read tasks (answer keys); count published ones per level.
    admin.from("tasks").select("level").eq("moment_id", summary.id).eq("status", "published"),
  ]);
  const taskCounts: Record<Level, number> = { 1: 0, 2: 0, 3: 0 };
  for (const t of bankTasks ?? []) taskCounts[t.level as Level]++;

  const unlocked = new Map((blocks ?? []).filter((b) => b.type === "deepening").map((b) => [b.id, b]));
  const deepenings = (allDeepenings ?? []).map((d) => ({
    id: d.id,
    title: d.title ?? "",
    unlockLevel: (d.unlock_level ?? 1) as Level,
    body: unlocked.get(d.id)?.body_md ?? null,
  }));

  const byLevel = (level: Level) =>
    levelProgress(
      (attempts ?? []).filter((a) => a.level === level).map((a) => a.correct),
      passCorrect,
    );
  const levelStats: LevelStats = { 1: byLevel(1), 2: byLevel(2), 3: byLevel(3) };

  return {
    subject: found.subject,
    area: found.area,
    moment: summary,
    source: summary.source,
    generatorKey: summary.generators?.generator_key ?? null,
    taskCounts,
    intro: (blocks ?? []).find((b) => b.type === "intro")?.body_md ?? "",
    readings: (blocks ?? [])
      .filter((b) => b.type === "reading")
      .map((b) => ({ id: b.id, title: b.title ?? "", body: b.body_md })),
    deepenings,
    stars: progressMap.get(summary.id)?.stars ?? 0,
    levelStats,
    passCorrect,
  };
}

/** Moments the student practised most recently, newest first. */
export async function getContinueItems(userId: string, limit = 4) {
  const supabase = await createClient();
  const { data: recent } = await supabase
    .from("attempts")
    .select("moment_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  const ids = [...new Set((recent ?? []).map((r) => r.moment_id))].slice(0, limit);
  if (ids.length === 0) return [];

  const { data: moments } = await supabase
    .from("moments")
    .select("id, slug, name, areas(slug, name, color, icon, subjects(slug))")
    .in("id", ids);
  const progressMap = await getProgressMap(userId);

  return ids
    .map((id) => moments?.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m?.areas?.subjects))
    .map((m) => ({
      id: m.id,
      name: m.name,
      stars: progressMap.get(m.id)?.stars ?? 0,
      area: m.areas!,
      href: `/amnen/${m.areas!.subjects!.slug}/${m.areas!.slug}/${m.slug}`,
    }));
}

/** XP earned today (Swedish time). Awarded from step 6 on. */
export async function getTodayXp(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("xp_events")
    .select("amount")
    .eq("user_id", userId)
    .gte("created_at", startOfStockholmDay().toISOString());
  return (data ?? []).reduce((sum, e) => sum + e.amount, 0);
}

/** The student's own daily goal, else the site default from settings. */
export async function getDailyGoal(profile: { daily_goal_xp: number | null }): Promise<number> {
  if (profile.daily_goal_xp) return profile.daily_goal_xp;
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", "daily_goal_xp").maybeSingle();
  return typeof data?.value === "number" ? data.value : 50;
}

/** What a "Läs och svara" moment page needs beyond getMoment: milestones, writing tasks and sources. */
export async function getReadMomentExtras(momentId: string, areaId: string, userId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const [{ data: progress }, { data: writing }, { data: links }, { data: pasted }] = await Promise.all([
    supabase
      .from("moment_progress")
      .select("read_at, quiz_passed_at, writing_approved_at")
      .eq("user_id", userId)
      .eq("moment_id", momentId)
      .maybeSingle(),
    // Writing tasks are admin-only (the rubric is secret); students get the prompt.
    admin
      .from("writing_tasks")
      .select("id, prompt_md, min_chars")
      .eq("moment_id", momentId)
      .eq("status", "published")
      .order("sort_order"),
    supabase.from("sources").select("id, title, url").eq("area_id", areaId).eq("status", "ready").not("url", "is", null).order("sort_order"),
    // Pasted texts have no link to send the student to, so their text is shown.
    supabase.from("sources").select("id, title, content").eq("area_id", areaId).eq("status", "ready").is("url", null).order("sort_order"),
  ]);
  return {
    milestones: {
      read: Boolean(progress?.read_at),
      quiz: Boolean(progress?.quiz_passed_at),
      writing: Boolean(progress?.writing_approved_at),
    },
    writingTasks: writing ?? [],
    sources: [
      ...(links ?? []).map((s) => ({ id: s.id, title: s.title, url: s.url, content: null })),
      ...(pasted ?? []).map((s) => ({ id: s.id, title: s.title, url: null, content: s.content })),
    ],
  };
}
