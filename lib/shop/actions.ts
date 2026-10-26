"use server";

import { refresh } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { changeCoins } from "@/lib/coins";
import { coinsAfterPurchase } from "@/lib/rewards";
import { strings } from "@/lib/strings";
import { createAdminClient } from "@/lib/supabase/admin";

// Buying a reward: coins are taken now and the purchase waits for the admin.
// A denied purchase gives the coins back (lib/admin/reward-actions.ts).

export type BuyResult = { ok: true; coins: number } | { ok: false; error: string };

const t = strings.shop;

export async function buyReward(rewardId: string): Promise<BuyResult> {
  const profile = await requireProfile();
  if (profile.role !== "student") return { ok: false, error: t.onlyStudents };
  const admin = createAdminClient();
  const { data: reward } = await admin.from("rewards").select("id, price, is_active").eq("id", rewardId).maybeSingle();
  if (!reward?.is_active) return { ok: false, error: t.gone };
  if (coinsAfterPurchase(profile.coins, reward.price) === null) return { ok: false, error: t.notEnough };

  const coins = await changeCoins(profile.id, -reward.price);
  if (coins === null) return { ok: false, error: t.notEnough };
  const { error } = await admin.from("reward_redemptions").insert({ user_id: profile.id, reward_id: reward.id, price: reward.price });
  if (error) {
    await changeCoins(profile.id, reward.price); // undo the payment
    return { ok: false, error: strings.admin.errors.generic };
  }
  refresh();
  return { ok: true, coins };
}
