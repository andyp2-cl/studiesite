"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import type { Json } from "@/lib/database.types";
import { isLevel } from "@/lib/generators/types";
import { strings } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";
import { buildAnswer, TASK_TYPES, type AnswerDraft, type TaskType } from "@/lib/tasks/answers";
import type { ActionResult } from "./content-actions";

const e = strings.admin.errors;
const fail = (error: string): ActionResult => ({ ok: false, error });

export type TaskInput = {
  id?: string;
  momentId: string;
  level: number;
  type: TaskType;
  promptMd: string;
  solutionMd: string;
  hintMd: string;
  published: boolean;
  draft: AnswerDraft;
};

export async function saveTask(input: TaskInput): Promise<ActionResult> {
  await requireAdmin();
  if (!TASK_TYPES.includes(input.type) || !isLevel(input.level)) return fail(e.generic);
  const prompt = String(input.promptMd ?? "").trim().slice(0, 5000);
  if (!prompt) return fail(e.prompt);
  const built = buildAnswer(input.type, input.draft);
  if (!built) return fail(e.answer[input.type]);

  const row = {
    moment_id: input.momentId,
    level: input.level,
    type: input.type,
    prompt_md: prompt,
    solution_md: String(input.solutionMd ?? "").trim().slice(0, 5000) || null,
    hint_md: String(input.hintMd ?? "").trim().slice(0, 2000) || null,
    answer: built.answer as unknown as Json,
    choices: built.choices,
    status: input.published ? ("published" as const) : ("draft" as const),
  };

  const supabase = await createClient();
  const { data, error } = input.id
    ? await supabase.from("tasks").update(row).eq("id", input.id).select("id").single()
    : await supabase.from("tasks").insert({ ...row, source: "admin" }).select("id").single();
  if (error) return fail(e.generic);
  refresh();
  return { ok: true, id: data.id };
}

/** Attempts keep their history (task_id is set to null). */
export async function deleteTask(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return fail(e.generic);
  refresh();
  return { ok: true };
}

export async function setTaskPublished(id: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: published ? "published" : "draft" })
    .eq("id", id);
  if (error) return fail(e.generic);
  refresh();
  return { ok: true };
}
