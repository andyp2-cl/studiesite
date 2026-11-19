"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import type { Json } from "@/lib/database.types";
import { strings } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";
import { parseVocab, VOCAB_QUESTION_KINDS, vocabQuestions, vocabReading, type VocabQuestionKind } from "@/lib/vocab/vocab";

const t = strings.admin.vocab;

export type VocabResult = { ok: true; summary: string } | { ok: false; error: string };
const fail = (error: string): VocabResult => ({ ok: false, error });

/**
 * Adds a pasted word list to a moment: one "Glosor" reading text and published
 * questions. The moment becomes "Läs och svara". Existing content stays, so a
 * second list is added after the first.
 */
export async function importVocab(momentId: string, rawText: string, rawKinds: string[]): Promise<VocabResult> {
  await requireAdmin();
  const { pairs } = parseVocab(String(rawText ?? "").slice(0, 20000));
  if (pairs.length === 0) return fail(t.noPairs);
  const kinds = VOCAB_QUESTION_KINDS.filter((k) => rawKinds.includes(k)) as VocabQuestionKind[];
  if (kinds.length === 0) return fail(t.noKinds);

  const supabase = await createClient();
  const { data: moment } = await supabase
    .from("moments")
    .select("id, areas(subjects(name))")
    .eq("id", momentId)
    .maybeSingle();
  if (!moment?.areas?.subjects) return fail(strings.admin.errors.generic);
  const language = moment.areas.subjects.name.toLowerCase();

  const { error: modeError } = await supabase.from("moments").update({ mode: "read", source: "tasks" }).eq("id", momentId);
  if (modeError) return fail(strings.admin.errors.generic);

  const { data: blocks } = await supabase.from("content_blocks").select("sort_order").eq("moment_id", momentId);
  const sortOrder = Math.max(0, ...(blocks ?? []).map((b) => b.sort_order)) + 1;
  const questions = vocabQuestions(pairs, language, kinds);

  const [blockResult, tasksResult] = await Promise.all([
    supabase.from("content_blocks").insert({
      moment_id: momentId,
      type: "reading",
      title: t.readingTitle,
      body_md: vocabReading(pairs, language),
      sort_order: sortOrder,
    }),
    supabase.from("tasks").insert(
      questions.map((q) => ({
        moment_id: momentId,
        level: 1, // "Läs och svara" questions have no level
        type: q.type,
        prompt_md: q.prompt,
        answer: q.answer as unknown as Json,
        choices: q.choices,
        solution_md: q.solution,
        status: "published" as const,
        source: "admin" as const,
      })),
    ),
  ]);
  refresh();
  if (blockResult.error || tasksResult.error) {
    console.error("vocab: could not save", blockResult.error ?? tasksResult.error);
    return fail(strings.admin.errors.generic);
  }
  return { ok: true, summary: t.done(pairs.length, questions.length) };
}
