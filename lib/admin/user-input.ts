import { normalizeUsername } from "@/lib/auth/username";
import { isTheme, type Theme } from "@/lib/cards/catalog";

// Validation for the admin user and settings forms. Pure, so it is tested
// without a database; the server actions call these before writing.

export const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const MIN_PASSWORD = 8;

/** What we suggest for a school year: younger students get a lower daily goal and pass bar. */
export function suggestedForGrade(grade: number): { dailyGoalXp: number; passCorrect: number } {
  if (grade <= 5) return { dailyGoalXp: 150, passCorrect: 7 };
  if (grade === 6) return { dailyGoalXp: 150, passCorrect: 8 };
  return { dailyGoalXp: 180, passCorrect: 8 };
}

type Parsed<T> = { ok: true; value: T } | { ok: false; field: string };

const optionalInt = (raw: unknown, min: number, max: number): number | null | undefined => {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
};

export type StudentSettings = {
  displayName: string;
  grade: number | null;
  dailyGoalXp: number | null;
  passCorrect: number | null;
  collectionTheme: Theme;
};

export function parseStudentSettings(input: Record<string, unknown>): Parsed<StudentSettings> {
  const displayName = String(input.displayName ?? "").trim();
  if (displayName.length < 1 || displayName.length > 40) return { ok: false, field: "displayName" };
  const grade = optionalInt(input.grade, 1, 9);
  if (grade === undefined) return { ok: false, field: "grade" };
  const dailyGoalXp = optionalInt(input.dailyGoalXp, 10, 500);
  if (dailyGoalXp === undefined) return { ok: false, field: "dailyGoalXp" };
  const passCorrect = optionalInt(input.passCorrect, 5, 10);
  if (passCorrect === undefined) return { ok: false, field: "passCorrect" };
  const collectionTheme = input.collectionTheme ?? "football";
  if (!isTheme(collectionTheme)) return { ok: false, field: "collectionTheme" };
  return { ok: true, value: { displayName, grade, dailyGoalXp, passCorrect, collectionTheme } };
}

export type NewStudent = { username: string; displayName: string; password: string; grade: number | null };

export function parseNewStudent(input: Record<string, unknown>): Parsed<NewStudent> {
  const username = normalizeUsername(String(input.username ?? ""));
  if (!username) return { ok: false, field: "username" };
  const displayName = String(input.displayName ?? "").trim();
  if (displayName.length < 1 || displayName.length > 40) return { ok: false, field: "displayName" };
  const password = String(input.password ?? "");
  if (password.length < MIN_PASSWORD || password.length > 72) return { ok: false, field: "password" };
  const grade = optionalInt(input.grade, 1, 9);
  if (grade === undefined) return { ok: false, field: "grade" };
  return { ok: true, value: { username, displayName, password, grade } };
}

export type SiteSettings = { dailyGoalXp: number; aiMonthlyBudgetUsd: number; aiFeedbackDailyLimit: number };

export function parseSiteSettings(input: Record<string, unknown>): Parsed<SiteSettings> {
  const dailyGoalXp = optionalInt(input.dailyGoalXp, 10, 500);
  if (dailyGoalXp == null) return { ok: false, field: "dailyGoalXp" };
  const budget = Number(String(input.aiMonthlyBudgetUsd ?? "").trim().replace(",", "."));
  if (!Number.isFinite(budget) || budget < 0 || budget > 100) return { ok: false, field: "aiMonthlyBudgetUsd" };
  const aiFeedbackDailyLimit = optionalInt(input.aiFeedbackDailyLimit, 0, 50);
  if (aiFeedbackDailyLimit == null) return { ok: false, field: "aiFeedbackDailyLimit" };
  return { ok: true, value: { dailyGoalXp, aiMonthlyBudgetUsd: Math.round(budget * 100) / 100, aiFeedbackDailyLimit } };
}
