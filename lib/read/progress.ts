import "server-only";
import { readStars } from "@/lib/progress";
import { createAdminClient } from "@/lib/supabase/admin";

// Milestones of a "Läs och svara" moment. Each is set once (the first time)
// and stars are recounted from all three.

export type Milestone = "read_at" | "quiz_passed_at" | "writing_approved_at";

/** Returns true if the milestone is new (a new star). */
export async function reachMilestone(userId: string, momentId: string, milestone: Milestone): Promise<boolean> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("moment_progress")
    .select("read_at, quiz_passed_at, writing_approved_at")
    .eq("user_id", userId)
    .eq("moment_id", momentId)
    .maybeSingle();
  if (row?.[milestone]) return false;

  const reached = { read_at: row?.read_at ?? null, quiz_passed_at: row?.quiz_passed_at ?? null, writing_approved_at: row?.writing_approved_at ?? null };
  reached[milestone] = new Date().toISOString();
  const stars = readStars({ read: Boolean(reached.read_at), quiz: Boolean(reached.quiz_passed_at), writing: Boolean(reached.writing_approved_at) });
  const { error } = await admin
    .from("moment_progress")
    .upsert({ user_id: userId, moment_id: momentId, ...reached, stars }, { onConflict: "user_id,moment_id" });
  if (error) {
    console.error("read: could not save milestone", error);
    return false;
  }
  return true;
}
