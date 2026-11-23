"use server";

import { refresh } from "next/cache";
import { getViewProfile, requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { canExtend, extendMoment, type ExtendResult } from "./extend";
import { reachMilestone } from "./progress";
import { strings } from "@/lib/strings";

/** "Jag har läst" – the first star of a "Läs och svara" moment. */
export async function markRead(momentId: string): Promise<boolean> {
  const profile = await requireProfile();
  if (typeof momentId !== "string") return false;
  // An admin viewing as a student would mark it read on the admin account.
  if ((await getViewProfile())?.id !== profile.id) return false;
  // RLS: students only get visible moments.
  const supabase = await createClient();
  const { data: moment } = await supabase.from("moments").select("id, mode").eq("id", momentId).maybeSingle();
  if (moment?.mode !== "read") return false;
  await reachMilestone(profile.id, momentId, "read_at");
  refresh();
  return true;
}

/** "Mer om det här": a new reading section and questions for a student who has finished the moment. */
export async function moreOnTopic(momentId: string): Promise<ExtendResult> {
  const profile = await requireProfile();
  if (typeof momentId !== "string") return { ok: false, error: strings.read.more.failed };
  if ((await getViewProfile())?.id !== profile.id) return { ok: false, error: strings.read.write.viewAs };
  // RLS: students only get visible moments.
  const supabase = await createClient();
  const { data: moment } = await supabase.from("moments").select("id, mode").eq("id", momentId).maybeSingle();
  if (moment?.mode !== "read") return { ok: false, error: strings.read.more.failed };
  if (!(await canExtend(profile.id, momentId))) return { ok: false, error: strings.read.more.notNow };
  const result = await extendMoment(profile.id, momentId);
  if (result.ok) refresh();
  return result;
}
