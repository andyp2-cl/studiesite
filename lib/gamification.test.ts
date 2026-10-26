import { describe, expect, it } from "vitest";
import {
  applyXp,
  coinsEarned,
  currentStreak,
  levelForXp,
  levelNameIndex,
  mondayOf,
  reachDailyGoal,
  xpForLevel,
  type Profile,
  type StreakState,
} from "./gamification";

const fresh: StreakState = { streak: 0, lastActiveDate: null, freezes: 1, freezeRefilledWeek: null };

describe("levels", () => {
  it("gets slower per level", () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 50, 150, 300, 500]);
  });

  it("maps XP to level", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(49)).toBe(1);
    expect(levelForXp(50)).toBe(2);
    expect(levelForXp(499)).toBe(4);
    expect(levelForXp(500)).toBe(5);
  });

  it("names levels in five steps", () => {
    expect([1, 4, 5, 10, 20, 35, 99].map(levelNameIndex)).toEqual([0, 0, 1, 2, 3, 4, 4]);
  });
});

describe("coinsEarned", () => {
  it("gives one coin per 10 XP, carrying remainders", () => {
    expect(coinsEarned(0, 10)).toBe(1);
    expect(coinsEarned(5, 5)).toBe(1);
    expect(coinsEarned(0, 5)).toBe(0);
    expect(coinsEarned(18, 30)).toBe(3);
  });
});

describe("mondayOf", () => {
  it("finds the Monday of the week", () => {
    expect(mondayOf("2026-10-26")).toBe("2026-10-26"); // Monday
    expect(mondayOf("2026-11-01")).toBe("2026-10-26"); // Sunday
    expect(mondayOf("2026-10-28")).toBe("2026-10-26");
  });
});

describe("reachDailyGoal", () => {
  it("starts a streak", () => {
    expect(reachDailyGoal(fresh, "2026-10-26")).toMatchObject({ streak: 1, lastActiveDate: "2026-10-26" });
  });

  it("extends the streak on the next day and only once a day", () => {
    const day1 = reachDailyGoal(fresh, "2026-10-26");
    const day2 = reachDailyGoal(day1, "2026-10-27");
    expect(day2.streak).toBe(2);
    expect(reachDailyGoal(day2, "2026-10-27").streak).toBe(2);
  });

  it("uses the weekly freeze for one missed day", () => {
    const s = { ...fresh, streak: 5, lastActiveDate: "2026-10-27", freezeRefilledWeek: "2026-10-26" };
    const saved = reachDailyGoal(s, "2026-10-29");
    expect(saved).toMatchObject({ streak: 6, freezes: 0 });
    // No freeze left this week: the next missed day resets.
    expect(reachDailyGoal(saved, "2026-10-31").streak).toBe(1);
  });

  it("refills the freeze in a new week without stacking", () => {
    const s = { ...fresh, streak: 5, lastActiveDate: "2026-10-31", freezes: 0, freezeRefilledWeek: "2026-10-26" };
    expect(reachDailyGoal(s, "2026-11-02")).toMatchObject({ streak: 6, freezes: 0, freezeRefilledWeek: "2026-11-02" });
    const unused = { ...s, freezes: 1 };
    expect(reachDailyGoal(unused, "2026-11-01").freezes).toBe(1);
  });

  it("resets after two missed days", () => {
    const s = { ...fresh, streak: 5, lastActiveDate: "2026-10-26" };
    expect(reachDailyGoal(s, "2026-10-29").streak).toBe(1);
  });
});

describe("currentStreak", () => {
  const s = { ...fresh, streak: 4, lastActiveDate: "2026-10-26", freezeRefilledWeek: "2026-10-26" };

  it("shows the streak today and tomorrow", () => {
    expect(currentStreak(s, "2026-10-26")).toBe(4);
    expect(currentStreak(s, "2026-10-27")).toBe(4);
  });

  it("keeps it alive one more day while a freeze is left", () => {
    expect(currentStreak(s, "2026-10-28")).toBe(4);
    expect(currentStreak({ ...s, freezes: 0 }, "2026-10-28")).toBe(0);
  });

  it("drops to zero after that", () => {
    expect(currentStreak(s, "2026-10-29")).toBe(0);
    expect(currentStreak(fresh, "2026-10-29")).toBe(0);
  });
});

describe("applyXp", () => {
  const profile: Profile = { ...fresh, xp: 45, coins: 4, level: 1 };

  it("adds XP, coins and levels up", () => {
    const out = applyXp(profile, 10, 0, 50, "2026-10-26");
    expect(out.profile).toMatchObject({ xp: 55, coins: 5, level: 2 });
    expect(out).toMatchObject({ coins: 1, levelUp: true, goalReached: false });
  });

  it("reaches the daily goal once, which extends the streak", () => {
    const out = applyXp(profile, 20, 40, 50, "2026-10-26");
    expect(out.goalReached).toBe(true);
    expect(out.profile.streak).toBe(1);
    expect(applyXp(out.profile, 20, 60, 50, "2026-10-26").goalReached).toBe(false);
  });

  it("never lowers the level", () => {
    expect(applyXp({ ...profile, level: 3 }, 10, 0, 50, "2026-10-26").profile.level).toBe(3);
  });
});
