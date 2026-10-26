"use server";

import { refresh } from "next/cache";
import { getStudentStages } from "@/lib/admin/settings-data";
import { askClaude } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth/session";
import type { Json } from "@/lib/database.types";
import { uniqueSlug } from "@/lib/slug";
import { strings } from "@/lib/strings";
import { curriculumFor, curriculumForPrompt } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";
import { anglesPrompt, momentPrompt } from "./prompts";
import { anglesSchema, momentDraftSchema, parseAngles, parseMomentDraft, sourcesForPrompt } from "./schema";

// AI drafts from an area's sources (SPEC 12): everything lands as drafts in
// hidden moments, and the admin reviews and publishes. Writes go through the
// admin's own client, so the RLS admin policies apply.

export type DraftResult = { ok: true; summary: string } | { ok: false; error: string };

const t = strings.admin.drafts;
const fail = (error: string): DraftResult => ({ ok: false, error });

async function readySources(areaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sources")
    .select("title, url, content")
    .eq("area_id", areaId)
    .eq("status", "ready")
    .order("sort_order");
  return sourcesForPrompt(data ?? []);
}

/** Lgr22 central content for the subject at the students' stages ("" if unavailable). */
async function curriculum(subject: string) {
  return curriculumForPrompt(await curriculumFor(subject, await getStudentStages()));
}

/** Proposes 3–4 angles for an area and creates them as hidden "Läs och svara" moments. */
export async function draftAngles(areaId: string): Promise<DraftResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: area } = await supabase
    .from("areas")
    .select("id, name, subjects(name), moments(name, slug, sort_order)")
    .eq("id", areaId)
    .maybeSingle();
  if (!area?.subjects) return fail(strings.admin.errors.generic);
  const sources = await readySources(areaId);
  if (!sources) return fail(t.noSources);

  const existing = area.moments.map((m) => m.name);
  const { system, prompt } = anglesPrompt({
    subject: area.subjects.name,
    area: area.name,
    existing,
    sources,
    curriculum: await curriculum(area.subjects.name),
  });
  const result = await askClaude({
    purpose: "draft_angles",
    userId: admin.id,
    tier: "cheap",
    system,
    prompt,
    maxTokens: 2000,
    jsonSchema: anglesSchema,
    effort: "low",
    timeoutMs: 120_000,
  });
  if (!result.ok) return fail(strings.ai[result.reason]);

  const angles = parseAngles(result.json, existing);
  if (angles.length === 0) return fail(t.nothingUsable);

  const slugs = area.moments.map((m) => m.slug);
  let order = Math.max(-1, ...area.moments.map((m) => m.sort_order)) + 1;
  const rows = angles.map((a) => {
    const slug = uniqueSlug(a.name, slugs);
    slugs.push(slug);
    return {
      area_id: areaId,
      name: a.name,
      slug,
      description: a.description || null,
      sort_order: order++,
      mode: "read" as const,
      source: "tasks" as const,
      is_hidden: true,
    };
  });
  const { error } = await supabase.from("moments").insert(rows);
  if (error) return fail(strings.admin.errors.generic);
  refresh();
  return { ok: true, summary: t.anglesDone(rows.length) };
}

/**
 * Drafts reading sections and questions for a moment. The moment is hidden
 * while the admin reviews, since reading sections have no draft state of their own.
 */
export async function draftMoment(momentId: string): Promise<DraftResult> {
  const admin = await requireAdmin();
  return fillMoment(admin.id, momentId, false);
}

/**
 * Fills every empty "Läs och svara" moment in an area (no reading text and no
 * questions) and publishes it right away: reading text and questions go live,
 * the moment becomes visible.
 */
export async function fillArea(areaId: string): Promise<DraftResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: moments } = await supabase
    .from("moments")
    .select("id, tasks(count), content_blocks(count)")
    .eq("area_id", areaId)
    .eq("mode", "read");
  const empty = (moments ?? []).filter((m) => !m.tasks[0]?.count && !m.content_blocks[0]?.count);
  if (empty.length === 0) return fail(t.nothingToFill);

  // In parallel, so the whole area fits in one request (maxDuration on the page).
  const results = await Promise.all(empty.map((m) => fillMoment(admin.id, m.id, true)));
  const done = results.filter((r) => r.ok).length;
  if (done === 0) return results[0];
  return { ok: true, summary: t.areaFilled(done, empty.length) };
}

async function fillMoment(adminId: string, momentId: string, publish: boolean): Promise<DraftResult> {
  const supabase = await createClient();
  const { data: moment } = await supabase
    .from("moments")
    .select("id, name, description, area_id, areas(name, subjects(name), moments(id, name))")
    .eq("id", momentId)
    .maybeSingle();
  if (!moment?.areas?.subjects) return fail(strings.admin.errors.generic);
  const sources = await readySources(moment.area_id);
  if (!sources) return fail(t.noSources);

  const { system, prompt } = momentPrompt({
    subject: moment.areas.subjects.name,
    area: moment.areas.name,
    moment: moment.name,
    description: moment.description ?? "",
    siblings: moment.areas.moments.filter((m) => m.id !== moment.id).map((m) => m.name),
    sources,
    curriculum: await curriculum(moment.areas.subjects.name),
  });
  const result = await askClaude({
    purpose: "draft_moment",
    userId: adminId,
    tier: "cheap",
    system,
    prompt,
    maxTokens: 16_000,
    jsonSchema: momentDraftSchema,
    effort: "medium",
    timeoutMs: 280_000,
  });
  if (!result.ok) return fail(strings.ai[result.reason]);

  const draft = parseMomentDraft(result.json);
  if (!draft) return fail(t.nothingUsable);

  const { error: hideError } = await supabase
    .from("moments")
    .update({ is_hidden: !publish, mode: "read", source: "tasks" })
    .eq("id", momentId);
  if (hideError) return fail(strings.admin.errors.generic);

  // New sections go after whatever the moment already has; an existing intro is kept.
  const { data: blocks } = await supabase.from("content_blocks").select("type, sort_order").eq("moment_id", momentId);
  const hasIntro = (blocks ?? []).some((b) => b.type === "intro");
  let blockOrder = Math.max(0, ...(blocks ?? []).map((b) => b.sort_order)) + 1;
  const blockRows = [
    ...(draft.intro && !hasIntro ? [{ moment_id: momentId, type: "intro" as const, title: null, body_md: draft.intro, sort_order: 0 }] : []),
    ...draft.sections.map((s) => ({
      moment_id: momentId,
      type: "reading" as const,
      title: s.title,
      body_md: s.body,
      sort_order: blockOrder++,
    })),
  ];

  const [blocksResult, tasksResult] = await Promise.all([
    supabase.from("content_blocks").insert(blockRows),
    supabase.from("tasks").insert(
      draft.questions.map((q) => ({
        moment_id: momentId,
        level: 1, // "Läs och svara" questions have no level
        type: q.type,
        prompt_md: q.prompt,
        answer: q.answer as unknown as Json,
        choices: q.choices,
        solution_md: q.solution || null,
        hint_md: q.section ? t.sectionHint(q.section) : null,
        status: publish ? ("published" as const) : ("draft" as const),
        source: "ai" as const,
      })),
    ),
  ]);
  if (blocksResult.error || tasksResult.error) {
    console.error("drafts: could not save", blocksResult.error ?? tasksResult.error);
    refresh();
    return fail(t.partlySaved);
  }
  refresh();
  return {
    ok: true,
    summary: publish
      ? t.momentPublished(draft.sections.length, draft.questions.length)
      : t.momentDone(draft.sections.length, draft.questions.length),
  };
}
