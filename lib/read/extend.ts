import "server-only";
import { aiStatus, askClaude } from "@/lib/ai";
import type { Json } from "@/lib/database.types";
import { extensionPrompt } from "@/lib/drafts/prompts";
import { extensionSchema, parseExtension } from "@/lib/drafts/schema";
import { unseenBank } from "@/lib/practice/bank";
import { strings } from "@/lib/strings";
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfStockholmDay } from "@/lib/time";
import { extensionAllowed } from "./extension-rules";

const PURPOSE = "more_on_topic";

/** Whether this student may ask for "Mer om det här" on the moment right now. */
export async function canExtend(userId: string, momentId: string): Promise<boolean> {
  const admin = createAdminClient();
  const [unseen, { count: sections }, { count: usedToday }, ai] = await Promise.all([
    unseenBank(userId, momentId, 1),
    admin.from("content_blocks").select("id", { count: "exact", head: true }).eq("moment_id", momentId).eq("type", "reading"),
    admin
      .from("ai_calls")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("purpose", PURPOSE)
      .gte("created_at", startOfStockholmDay().toISOString()),
    aiStatus("cheap"),
  ]);
  return extensionAllowed({
    unseen,
    readingSections: sections ?? 0,
    usedToday: usedToday ?? 0,
    aiAvailable: ai.available,
  });
}

export type ExtendResult = { ok: true; sectionIndex: number; questions: number } | { ok: false; error: string };

/**
 * Writes one new reading section on the moment's theme with questions about
 * it, and publishes both. The caller has checked canExtend.
 */
export async function extendMoment(userId: string, momentId: string): Promise<ExtendResult> {
  const t = strings.read.more;
  const admin = createAdminClient();
  const [{ data: moment }, { data: blocks }, { data: tasks }] = await Promise.all([
    admin.from("moments").select("name, areas(subjects(name))").eq("id", momentId).maybeSingle(),
    admin.from("content_blocks").select("title, body_md, sort_order").eq("moment_id", momentId).eq("type", "reading").order("sort_order"),
    admin.from("tasks").select("prompt_md").eq("moment_id", momentId).eq("level", 1).eq("status", "published"),
  ]);
  if (!moment || !blocks?.length) return { ok: false, error: t.failed };

  const titles = blocks.map((b) => b.title ?? "");
  const existing = (tasks ?? []).map((x) => x.prompt_md);
  const { system, prompt } = extensionPrompt({
    subject: moment.areas?.subjects?.name ?? "",
    moment: moment.name,
    sections: blocks.map((b) => ({ title: b.title ?? "", body: b.body_md })),
    existing: existing.slice(0, 60),
  });
  const result = await askClaude({
    purpose: PURPOSE,
    userId,
    tier: "cheap",
    system,
    prompt,
    maxTokens: 4_000,
    jsonSchema: extensionSchema,
    effort: "low",
    timeoutMs: 90_000,
  });
  if (!result.ok) return { ok: false, error: strings.ai[result.reason] };

  const ext = parseExtension(result.json, titles, existing);
  if (!ext) return { ok: false, error: t.failed };

  const { error: blockError } = await admin.from("content_blocks").insert({
    moment_id: momentId,
    type: "reading",
    title: ext.title,
    body_md: ext.body,
    sort_order: Math.max(0, ...blocks.map((b) => b.sort_order)) + 1,
  });
  if (blockError) {
    console.error("read: could not save extension", blockError);
    return { ok: false, error: t.failed };
  }
  const { error: taskError } = await admin.from("tasks").insert(
    ext.questions.map((q) => ({
      moment_id: momentId,
      level: 1 as const,
      type: q.type,
      prompt_md: q.prompt,
      answer: q.answer as unknown as Json,
      choices: q.choices,
      solution_md: q.solution || null,
      hint_md: strings.admin.drafts.sectionHint(ext.title),
      status: "published" as const,
      source: "ai" as const,
    })),
  );
  if (taskError) console.error("read: could not save extension questions", taskError);
  return { ok: true, sectionIndex: blocks.length, questions: taskError ? 0 : ext.questions.length };
}
