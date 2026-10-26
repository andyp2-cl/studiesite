"use server";

import { randomInt } from "node:crypto";
import { refresh } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { changeCoins } from "@/lib/coins";
import { strings } from "@/lib/strings";
import { createAdminClient } from "@/lib/supabase/admin";
import { DUPLICATE_REFUND, PACK_PRICE, pickMonster, type Monster } from "./catalog";

// Opening a surprise pack: pay PACK_PRICE coins, get a random monster. A
// duplicate gives some coins back. Only students open packs.

export type PackResult =
  | { ok: true; monster: Monster; isNew: boolean; count: number; refund: number; coins: number }
  | { ok: false; error: string };

const t = strings.collection;
const roll = () => randomInt(0, 1_000_000) / 1_000_000;

export async function openPack(): Promise<PackResult> {
  const profile = await requireProfile();
  if (profile.role !== "student") return { ok: false, error: t.onlyStudents };

  let coins = await changeCoins(profile.id, -PACK_PRICE);
  if (coins === null) return { ok: false, error: t.notEnough };

  const monster = pickMonster(roll(), roll());
  const admin = createAdminClient();
  const { data: owned } = await admin
    .from("user_monsters")
    .select("count")
    .eq("user_id", profile.id)
    .eq("monster_id", monster.id)
    .maybeSingle();
  const count = (owned?.count ?? 0) + 1;
  const { error } = owned
    ? await admin.from("user_monsters").update({ count }).eq("user_id", profile.id).eq("monster_id", monster.id)
    : await admin.from("user_monsters").insert({ user_id: profile.id, monster_id: monster.id });
  if (error) {
    await changeCoins(profile.id, PACK_PRICE); // give the coins back
    return { ok: false, error: strings.admin.errors.generic };
  }

  const refund = owned ? DUPLICATE_REFUND[monster.rarity] : 0;
  if (refund) coins = (await changeCoins(profile.id, refund)) ?? coins;
  refresh();
  return { ok: true, monster, isNew: !owned, count, refund, coins };
}
