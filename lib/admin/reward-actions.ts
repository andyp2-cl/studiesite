"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { changeCoins } from "@/lib/coins";
import { parseReward } from "@/lib/rewards";
import { strings } from "@/lib/strings";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./content-actions";

// Admin side of the reward shop: manage rewards, approve or deny purchases.

const t = strings.admin.rewards;
const fail = (error: string): ActionResult => ({ ok: false, error });

export async function saveReward(id: string | null, input: Record<string, unknown>): Promise<ActionResult> {
  await requireAdmin();
  const parsed = parseReward(input);
  if (!parsed.ok) return fail(t.invalid[parsed.field]);
  const { name, description, price, icon, isActive } = parsed.value;
  const row = { name, description, price, icon, is_active: isActive };
  const supabase = await createClient();
  const { error } = id ? await supabase.from("rewards").update(row).eq("id", id) : await supabase.from("rewards").insert(row);
  if (error) return fail(strings.admin.errors.generic);
  refresh();
  return { ok: true };
}

/** Approve, or deny and give the coins back. Only pending purchases can be decided. */
export async function decideRedemption(id: string, approve: boolean): Promise<ActionResult> {
  const admin = await requireAdmin();
  const db = createAdminClient();
  const { data, error } = await db
    .from("reward_redemptions")
    .update({ status: approve ? "approved" : "denied", decided_at: new Date().toISOString(), decided_by: admin.id })
    .eq("id", id)
    .eq("status", "pending")
    .select("user_id, price");
  if (error) return fail(strings.admin.errors.generic);
  const decided = data?.[0];
  if (!decided) return fail(t.alreadyDecided);
  if (!approve && (await changeCoins(decided.user_id, decided.price)) === null) {
    console.error("rewards: could not refund", id);
    return fail(t.refundFailed);
  }
  refresh();
  return { ok: true };
}
