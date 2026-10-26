import "server-only";
import { applyXp, type Profile } from "@/lib/gamification";
import { createAdminClient } from "@/lib/supabase/admin";
import { startOfStockholmDay, stockholmDate } from "@/lib/time";

// Applies the rules in lib/gamification.ts: logs an xp_event and updates the
// profile (XP, coins, level, streak). The profile update only succeeds if XP
// is unchanged since it was read, so two awards at once cannot overwrite
// each other.

export type XpAward = { xp: number; coins: number; levelUp: boolean; level: number; goalReached: boolean; streak: number };

const DEFAULT_DAILY_GOAL = 50;
const MAX_TRIES = 3;

async function dailyGoal(admin: ReturnType<typeof createAdminClient>): Promise<number> {
  const { data } = await admin.from("settings").select("value").eq("key", "daily_goal_xp").maybeSingle();
  return typeof data?.value === "number" && data.value > 0 ? data.value : DEFAULT_DAILY_GOAL;
}

export async function awardXp(
  userId: string,
  amount: number,
  reason: string,
  attemptId: string | null = null,
): Promise<XpAward | null> {
  if (!Number.isInteger(amount) || amount <= 0) return null;
  const admin = createAdminClient();
  const now = new Date();
  const goal = await dailyGoal(admin);

  for (let tries = 0; tries < MAX_TRIES; tries++) {
    const [{ data: row }, { data: today }] = await Promise.all([
      admin
        .from("profiles")
        .select("xp, coins, level, streak, streak_freezes, freeze_refilled_week, last_active_date")
        .eq("id", userId)
        .single(),
      admin.from("xp_events").select("amount").eq("user_id", userId).gte("created_at", startOfStockholmDay(now).toISOString()),
    ]);
    if (!row) return null;

    const profile: Profile = {
      xp: row.xp,
      coins: row.coins,
      level: row.level,
      streak: row.streak,
      freezes: row.streak_freezes,
      freezeRefilledWeek: row.freeze_refilled_week,
      lastActiveDate: row.last_active_date,
    };
    const todayXp = (today ?? []).reduce((sum, e) => sum + e.amount, 0);
    const out = applyXp(profile, amount, todayXp, goal, stockholmDate(now));

    const { count } = await admin
      .from("profiles")
      .update(
        {
          xp: out.profile.xp,
          coins: out.profile.coins,
          level: out.profile.level,
          streak: out.profile.streak,
          streak_freezes: out.profile.freezes,
          freeze_refilled_week: out.profile.freezeRefilledWeek,
          last_active_date: out.profile.lastActiveDate,
        },
        { count: "exact" },
      )
      .eq("id", userId)
      .eq("xp", row.xp);
    if (count !== 1) continue;

    const { error } = await admin
      .from("xp_events")
      .insert({ user_id: userId, amount, coins: out.coins, reason, attempt_id: attemptId });
    if (error) console.error("xp: could not log event", error);

    return {
      xp: amount,
      coins: out.coins,
      levelUp: out.levelUp,
      level: out.profile.level,
      goalReached: out.goalReached,
      streak: out.profile.streak,
    };
  }
  console.error(`xp: gave up awarding ${amount} XP to ${userId}`);
  return null;
}
