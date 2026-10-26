import type { Level } from "@/lib/generators/types";

// SPEC 7: XP, levels, coins, daily goal and streak. Pure functions so the
// rules can be tested; lib/xp.ts applies them to the database.

export const XP_FOR_LEVEL: Record<Level, number> = { 1: 10, 2: 20, 3: 30 };
export const EXPLANATION_XP = 5;
/** Shorter explanations are saved but give no XP. */
export const EXPLANATION_MIN_CHARS = 20;
export const XP_PER_COIN = 10;

/** Total XP needed to reach `level`: 0, 50, 150, 300, 500 … Each level takes 50 XP more than the last. */
export function xpForLevel(level: number): number {
  return 25 * (level - 1) * level;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

/** Index into strings.levelNames. */
export function levelNameIndex(level: number): number {
  if (level >= 35) return 4;
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  if (level >= 5) return 1;
  return 0;
}

export function coinsEarned(xpBefore: number, amount: number): number {
  return Math.floor((xpBefore + amount) / XP_PER_COIN) - Math.floor(xpBefore / XP_PER_COIN);
}

/** Dates are "YYYY-MM-DD" in Swedish time. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Monday of the week containing `date`. */
export function mondayOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export type StreakState = {
  streak: number;
  /** Last day the daily goal was reached. */
  lastActiveDate: string | null;
  freezes: number;
  freezeRefilledWeek: string | null;
};

/** One freeze per week: refilled (not stacked) the first time we look in a new week. */
export function refillFreeze(state: StreakState, today: string): StreakState {
  const week = mondayOf(today);
  return state.freezeRefilledWeek === week ? state : { ...state, freezes: 1, freezeRefilledWeek: week };
}

/** Called when the daily goal is reached today. One missed day is saved by a freeze. */
export function reachDailyGoal(state: StreakState, today: string): StreakState {
  const s = refillFreeze(state, today);
  if (s.lastActiveDate === today) return s;
  const gap = s.lastActiveDate ? daysBetween(s.lastActiveDate, today) : Infinity;
  if (gap === 1) return { ...s, streak: s.streak + 1, lastActiveDate: today };
  if (gap === 2 && s.freezes > 0) return { ...s, streak: s.streak + 1, freezes: s.freezes - 1, lastActiveDate: today };
  return { ...s, streak: 1, lastActiveDate: today };
}

/** The streak to show: still alive if it can be continued today. */
export function currentStreak(state: StreakState, today: string): number {
  if (!state.lastActiveDate) return 0;
  const gap = daysBetween(state.lastActiveDate, today);
  if (gap <= 1) return state.streak;
  if (gap === 2 && refillFreeze(state, today).freezes > 0) return state.streak;
  return 0;
}

/** currentStreak for a profiles row. */
export function profileStreak(
  row: { streak: number; last_active_date: string | null; streak_freezes: number; freeze_refilled_week: string | null },
  today: string,
): number {
  return currentStreak(
    { streak: row.streak, lastActiveDate: row.last_active_date, freezes: row.streak_freezes, freezeRefilledWeek: row.freeze_refilled_week },
    today,
  );
}

export type Profile = StreakState & { xp: number; coins: number; level: number };

export type XpOutcome = {
  profile: Profile;
  coins: number;
  levelUp: boolean;
  goalReached: boolean;
};

/** Adds XP; `todayXpBefore` decides whether this award reaches the daily goal. */
export function applyXp(profile: Profile, amount: number, todayXpBefore: number, dailyGoal: number, today: string): XpOutcome {
  const coins = coinsEarned(profile.xp, amount);
  const xp = profile.xp + amount;
  const level = Math.max(profile.level, levelForXp(xp));
  const goalReached = todayXpBefore < dailyGoal && todayXpBefore + amount >= dailyGoal;
  const streak = goalReached ? reachDailyGoal(profile, today) : profile;
  return {
    profile: { ...streak, xp, coins: profile.coins + coins, level },
    coins,
    levelUp: level > profile.level,
    goalReached,
  };
}
