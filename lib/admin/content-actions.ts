"use server";

import { refresh } from "next/cache";
import { iconNames } from "@/components/icon";
import { requireAdmin } from "@/lib/auth/session";
import { uniqueSlug } from "@/lib/slug";
import { strings } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";

// Admin mutations for the content tree. Every action re-checks the admin role
// and writes as the signed-in admin, so the RLS admin policies apply as well.

export type NodeKind = "subject" | "area" | "moment";
export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const TABLE = { subject: "subjects", area: "areas", moment: "moments" } as const;
const e = strings.admin.errors;

const fail = (error: string): ActionResult => ({ ok: false, error });

function cleanName(value: unknown): string | null {
  const name = String(value ?? "").trim();
  return name.length >= 1 && name.length <= 80 ? name : null;
}

function cleanDescription(value: unknown): string | null {
  const text = String(value ?? "").trim().slice(0, 300);
  return text || null;
}

const HEX = /^#[0-9a-f]{6}$/i;

async function siblingSlugs(kind: NodeKind, parentId: string | null, excludeId?: string) {
  const supabase = await createClient();
  const query =
    kind === "subject"
      ? supabase.from("subjects").select("id, slug")
      : kind === "area"
        ? supabase.from("areas").select("id, slug").eq("subject_id", parentId!)
        : supabase.from("moments").select("id, slug").eq("area_id", parentId!);
  const { data } = await query;
  return (data ?? []).filter((r) => r.id !== excludeId).map((r) => r.slug);
}

async function nextSortOrder(kind: NodeKind, parentId: string | null) {
  const supabase = await createClient();
  const query =
    kind === "subject"
      ? supabase.from("subjects").select("sort_order")
      : kind === "area"
        ? supabase.from("areas").select("sort_order").eq("subject_id", parentId!)
        : supabase.from("moments").select("sort_order").eq("area_id", parentId!);
  const { data } = await query.order("sort_order", { ascending: false }).limit(1);
  return (data?.[0]?.sort_order ?? -1) + 1;
}

/** Creates a subject (parentId null), an area (parent = subject) or a moment (parent = area). */
export async function createNode(kind: NodeKind, parentId: string | null, rawName: string): Promise<ActionResult> {
  await requireAdmin();
  const name = cleanName(rawName);
  if (!name) return fail(e.name);
  if (kind !== "subject" && !parentId) return fail(e.generic);

  const supabase = await createClient();
  const slug = uniqueSlug(name, await siblingSlugs(kind, parentId));
  const sort_order = await nextSortOrder(kind, parentId);

  const { data, error } =
    kind === "subject"
      ? await supabase.from("subjects").insert({ name, slug, sort_order }).select("id").single()
      : kind === "area"
        ? await supabase.from("areas").insert({ name, slug, sort_order, subject_id: parentId! }).select("id").single()
        : await supabase
            .from("moments")
            .insert({ name, slug, sort_order, area_id: parentId!, source: "tasks" })
            .select("id")
            .single();
  if (error) return fail(e.generic);
  refresh();
  return { ok: true, id: data.id };
}

export type NodeUpdate = {
  name: string;
  description: string;
  color?: string;
  icon?: string;
  isHidden: boolean;
};

export async function updateNode(kind: NodeKind, id: string, input: NodeUpdate): Promise<ActionResult> {
  await requireAdmin();
  const name = cleanName(input.name);
  if (!name) return fail(e.name);
  if (input.color !== undefined && !HEX.test(input.color)) return fail(e.color);
  if (input.icon !== undefined && !iconNames.includes(input.icon)) return fail(e.icon);

  const supabase = await createClient();
  const common = { name, description: cleanDescription(input.description), is_hidden: Boolean(input.isHidden) };
  const styled = { ...common, ...(input.color && { color: input.color }), ...(input.icon && { icon: input.icon }) };

  const { error } =
    kind === "subject"
      ? await supabase.from("subjects").update(styled).eq("id", id)
      : kind === "area"
        ? await supabase.from("areas").update(styled).eq("id", id)
        : await supabase.from("moments").update(common).eq("id", id);
  if (error) return fail(e.generic);
  refresh();
  return { ok: true };
}

export async function setHidden(kind: NodeKind, id: string, hidden: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from(TABLE[kind]).update({ is_hidden: hidden }).eq("id", id);
  if (error) return fail(e.generic);
  refresh();
  return { ok: true };
}

/** Saves a new order after drag and drop. `ids` must all be siblings. */
export async function reorder(kind: NodeKind, ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  if (!Array.isArray(ids) || ids.length > 500) return fail(e.generic);
  const supabase = await createClient();
  const results = await Promise.all(
    ids.map((id, index) => supabase.from(TABLE[kind]).update({ sort_order: index }).eq("id", id)),
  );
  if (results.some((r) => r.error)) return fail(e.generic);
  refresh();
  return { ok: true };
}

/**
 * Deletes a node and everything under it, but only when no student has
 * practised it yet; otherwise hiding is the safe option (keeps history).
 */
export async function deleteNode(kind: NodeKind, id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  let momentIds: string[] = [];
  if (kind === "moment") momentIds = [id];
  if (kind === "area") {
    const { data } = await supabase.from("moments").select("id").eq("area_id", id);
    momentIds = (data ?? []).map((m) => m.id);
  }
  if (kind === "subject") {
    const { data } = await supabase.from("moments").select("id, areas!inner(subject_id)").eq("areas.subject_id", id);
    momentIds = (data ?? []).map((m) => m.id);
  }
  if (momentIds.length > 0) {
    const { count } = await supabase
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .in("moment_id", momentIds);
    if ((count ?? 0) > 0) return fail(e.hasAttempts);
  }

  const { error } = await supabase.from(TABLE[kind]).delete().eq("id", id);
  if (error) return fail(e.generic);
  refresh();
  return { ok: true };
}
