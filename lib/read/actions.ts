"use server";

import { refresh } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { reachMilestone } from "./progress";

/** "Jag har läst" – the first star of a "Läs och svara" moment. */
export async function markRead(momentId: string): Promise<boolean> {
  const profile = await requireProfile();
  if (typeof momentId !== "string") return false;
  // RLS: students only get visible moments.
  const supabase = await createClient();
  const { data: moment } = await supabase.from("moments").select("id, mode").eq("id", momentId).maybeSingle();
  if (moment?.mode !== "read") return false;
  await reachMilestone(profile.id, momentId, "read_at");
  refresh();
  return true;
}
