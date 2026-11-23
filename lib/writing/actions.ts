"use server";

import { refresh } from "next/cache";
import { askClaude } from "@/lib/ai";
import { getViewProfile, requireProfile } from "@/lib/auth/session";
import { reachMilestone } from "@/lib/read/progress";
import { strings } from "@/lib/strings";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { charCount, feedbackPrompt, feedbackSchema, MAX_SUBMISSION_CHARS, parseFeedback, type Verdict } from "./feedback";
import { writingsLeftToday } from "./limits";

// A student sends a text for a writing task and gets AI feedback. The text,
// the verdict and the feedback are saved; an approved text is the third star
// of a "Läs och svara" moment.

export type SubmitResult =
  | { ok: true; verdict: Verdict; feedback: string; newStar: boolean; left: number }
  | { ok: false; error: string };

const t = strings.read.write;
const fail = (error: string): SubmitResult => ({ ok: false, error });

export async function submitWriting(taskId: string, text: string): Promise<SubmitResult> {
  const profile = await requireProfile();
  // An admin looking as a student would save the text on the admin account.
  if ((await getViewProfile())?.id !== profile.id) return fail(t.viewAs);
  if (typeof taskId !== "string" || typeof text !== "string") return fail(strings.admin.errors.generic);

  const body = text.trim();
  if (charCount(body) > MAX_SUBMISSION_CHARS) return fail(t.tooLong(MAX_SUBMISSION_CHARS));

  // Writing tasks are admin-only in RLS (the rubric is secret), so read them
  // server-side, then check that the student can see the moment.
  const admin = createAdminClient();
  const { data: task } = await admin
    .from("writing_tasks")
    .select("id, moment_id, prompt_md, rubric_md, min_chars")
    .eq("id", taskId)
    .eq("status", "published")
    .maybeSingle();
  if (!task) return fail(strings.admin.errors.generic);
  const supabase = await createClient();
  const { data: moment } = await supabase.from("moments").select("id, mode").eq("id", task.moment_id).maybeSingle();
  if (moment?.mode !== "read") return fail(strings.admin.errors.generic);

  if (charCount(body) < task.min_chars) return fail(t.tooShort(task.min_chars));
  const left = await writingsLeftToday(profile.id);
  if (left <= 0) return fail(t.limitReached);

  const { data: blocks } = await admin
    .from("content_blocks")
    .select("title, body_md")
    .eq("moment_id", task.moment_id)
    .eq("type", "reading")
    .order("sort_order");
  const reading = (blocks ?? []).map((b) => `## ${b.title ?? ""}\n${b.body_md}`).join("\n\n");

  const { system, prompt } = feedbackPrompt({ task: task.prompt_md, rubric: task.rubric_md, reading, text: body });
  const result = await askClaude({
    purpose: "writing_feedback",
    userId: profile.id,
    tier: "cheap",
    system,
    prompt,
    maxTokens: 1_000,
    jsonSchema: feedbackSchema,
    effort: "low",
    timeoutMs: 60_000,
  });
  if (!result.ok) return fail(strings.ai[result.reason]);
  const feedback = parseFeedback(result.json);
  if (!feedback) return fail(strings.ai.error);

  const { error } = await admin.from("writing_submissions").insert({
    user_id: profile.id,
    writing_task_id: task.id,
    moment_id: task.moment_id,
    body,
    char_count: charCount(body),
    verdict: feedback.verdict,
    feedback_md: feedback.feedback,
    ai_call_id: result.callId,
  });
  if (error) {
    console.error("writing: could not save submission", error);
    return fail(strings.admin.errors.generic);
  }

  const newStar = feedback.verdict === "approved" && (await reachMilestone(profile.id, task.moment_id, "writing_approved_at"));
  refresh();
  return { ok: true, ...feedback, newStar, left: left - 1 };
}
