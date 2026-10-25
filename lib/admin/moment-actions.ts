"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getGenerator } from "@/lib/generators";
import { isLevel } from "@/lib/generators/types";
import { strings } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./content-actions";

const e = strings.admin.errors;
const fail = (error: string): ActionResult => ({ ok: false, error });

/** Where a moment's tasks come from: a code generator or the admin's own task bank. */
export async function setMomentSource(
  momentId: string,
  source: "generator" | "tasks",
  generatorKey: string | null,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();

  if (source === "generator") {
    if (!getGenerator(generatorKey)) return fail(e.generator);
    const { error } = await supabase
      .from("generators")
      .upsert({ moment_id: momentId, generator_key: generatorKey! }, { onConflict: "moment_id" });
    if (error) return fail(e.generic);
  }

  const { error } = await supabase.from("moments").update({ source }).eq("id", momentId);
  if (error) return fail(e.generic);
  refresh();
  return { ok: true };
}

export type BlockInput = {
  id?: string;
  momentId: string;
  type: "intro" | "deepening";
  title?: string;
  body: string;
  unlockLevel?: number;
};

/** Creates or updates an intro or a deepening. There is at most one intro per moment. */
export async function saveBlock(input: BlockInput): Promise<ActionResult> {
  await requireAdmin();
  const body = String(input.body ?? "").slice(0, 20000);
  const title = String(input.title ?? "").trim().slice(0, 120) || null;
  if (input.type === "deepening" && (!title || !isLevel(input.unlockLevel))) return fail(e.deepening);

  const supabase = await createClient();
  const fields = {
    body_md: body,
    title: input.type === "deepening" ? title : null,
    unlock_level: input.type === "deepening" ? (input.unlockLevel as number) : null,
  };

  if (input.id) {
    const { error } = await supabase.from("content_blocks").update(fields).eq("id", input.id);
    if (error) return fail(e.generic);
    refresh();
    return { ok: true, id: input.id };
  }

  if (input.type === "intro") {
    const { data: existing } = await supabase
      .from("content_blocks")
      .select("id")
      .eq("moment_id", input.momentId)
      .eq("type", "intro")
      .maybeSingle();
    if (existing) return saveBlock({ ...input, id: existing.id });
  }

  const { data: last } = await supabase
    .from("content_blocks")
    .select("sort_order")
    .eq("moment_id", input.momentId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const { data, error } = await supabase
    .from("content_blocks")
    .insert({ ...fields, moment_id: input.momentId, type: input.type, sort_order: (last?.[0]?.sort_order ?? 0) + 1 })
    .select("id")
    .single();
  if (error) return fail(e.generic);
  refresh();
  return { ok: true, id: data.id };
}

export async function deleteBlock(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("content_blocks").delete().eq("id", id).eq("type", "deepening");
  if (error) return fail(e.generic);
  refresh();
  return { ok: true };
}
