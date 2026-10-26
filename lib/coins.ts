import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_TRIES = 3;

/**
 * Adds `delta` coins (negative to spend). Optimistic: the update only applies
 * if the balance is unchanged since it was read, so two purchases at once can
 * never overspend. Returns the new balance, or null if the student cannot
 * afford it or the row kept changing.
 */
export async function changeCoins(userId: string, delta: number): Promise<number | null> {
  const admin = createAdminClient();
  for (let tries = 0; tries < MAX_TRIES; tries++) {
    const { data: row } = await admin.from("profiles").select("coins").eq("id", userId).single();
    if (!row) return null;
    const next = row.coins + delta;
    if (next < 0) return null;
    const { data } = await admin.from("profiles").update({ coins: next }).eq("id", userId).eq("coins", row.coins).select("coins");
    if (data?.length) return next;
  }
  return null;
}
