import "server-only";
import type { Level } from "@/lib/generators/types";
import { createAdminClient } from "@/lib/supabase/admin";

/** Published tasks at this level that this student has not already answered. */
export async function unseenBank(userId: string, momentId: string, level: Level): Promise<number> {
  const admin = createAdminClient();
  const [{ data: tasks }, { data: attempts }] = await Promise.all([
    admin.from("tasks").select("id").eq("moment_id", momentId).eq("level", level).eq("status", "published"),
    admin
      .from("attempts")
      .select("task_id")
      .eq("user_id", userId)
      .eq("moment_id", momentId)
      .eq("level", level)
      .not("task_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  const done = new Set((attempts ?? []).map((a) => a.task_id));
  return (tasks ?? []).filter((t) => !done.has(t.id)).length;
}
