import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfStockholmDay } from "@/lib/time";

const DEFAULT_DAILY_LIMIT = 5;

/** AI feedback a student can still get today (settings.ai_feedback_daily_limit, Swedish days). */
export async function writingsLeftToday(userId: string, now: Date = new Date()): Promise<number> {
  const admin = createAdminClient();
  const [{ data: setting }, { count }] = await Promise.all([
    admin.from("settings").select("value").eq("key", "ai_feedback_daily_limit").maybeSingle(),
    admin
      .from("writing_submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfStockholmDay(now).toISOString()),
  ]);
  const limit = Number(setting?.value);
  return Math.max(0, (Number.isFinite(limit) ? limit : DEFAULT_DAILY_LIMIT) - (count ?? 0));
}
