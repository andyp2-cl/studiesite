import { describe, expect, it } from "vitest";
import { parseNewStudent, parseSiteSettings, parseStudentSettings, suggestedForGrade } from "./user-input";

describe("suggestedForGrade", () => {
  it("asks less of younger students", () => {
    expect(suggestedForGrade(5)).toEqual({ dailyGoalXp: 150, passCorrect: 7 });
    expect(suggestedForGrade(7)).toEqual({ dailyGoalXp: 180, passCorrect: 8 });
  });
});

describe("parseStudentSettings", () => {
  it("accepts empty optional fields as site defaults", () => {
    expect(parseStudentSettings({ displayName: " Märta ", grade: "7", dailyGoalXp: "", passCorrect: "" })).toEqual({
      ok: true,
      value: { displayName: "Märta", grade: 7, dailyGoalXp: null, passCorrect: null, collectionTheme: "football" },
    });
  });

  it("takes the card series the student collects", () => {
    const parsed = parseStudentSettings({ displayName: "Märta", collectionTheme: "music" });
    expect(parsed.ok && parsed.value.collectionTheme).toBe("music");
    expect(parseStudentSettings({ displayName: "H", collectionTheme: "monsters" })).toEqual({ ok: false, field: "collectionTheme" });
  });

  it("rejects out-of-range values with the field name", () => {
    expect(parseStudentSettings({ displayName: "H", passCorrect: "11" })).toEqual({ ok: false, field: "passCorrect" });
    expect(parseStudentSettings({ displayName: "H", dailyGoalXp: "5" })).toEqual({ ok: false, field: "dailyGoalXp" });
    expect(parseStudentSettings({ displayName: "H", grade: "2.5" })).toEqual({ ok: false, field: "grade" });
    expect(parseStudentSettings({ displayName: "" })).toEqual({ ok: false, field: "displayName" });
  });
});

describe("parseNewStudent", () => {
  it("normalises the username and checks the password", () => {
    expect(parseNewStudent({ username: " Elsa ", displayName: "Elsa", password: "hemligt1", grade: "" })).toEqual({
      ok: true,
      value: { username: "elsa", displayName: "Elsa", password: "hemligt1", grade: null },
    });
    expect(parseNewStudent({ username: "elsa", displayName: "Elsa", password: "kort" })).toEqual({ ok: false, field: "password" });
    expect(parseNewStudent({ username: "e lsa", displayName: "Elsa", password: "hemligt1" })).toEqual({ ok: false, field: "username" });
  });
});

describe("parseSiteSettings", () => {
  it("reads a budget with a decimal comma", () => {
    expect(parseSiteSettings({ dailyGoalXp: "50", aiMonthlyBudgetUsd: "2,5", aiFeedbackDailyLimit: "5" })).toEqual({
      ok: true,
      value: { dailyGoalXp: 50, aiMonthlyBudgetUsd: 2.5, aiFeedbackDailyLimit: 5 },
    });
  });

  it("requires every field", () => {
    expect(parseSiteSettings({ dailyGoalXp: "", aiMonthlyBudgetUsd: "1", aiFeedbackDailyLimit: "1" })).toEqual({
      ok: false,
      field: "dailyGoalXp",
    });
    expect(parseSiteSettings({ dailyGoalXp: "50", aiMonthlyBudgetUsd: "-1", aiFeedbackDailyLimit: "1" })).toEqual({
      ok: false,
      field: "aiMonthlyBudgetUsd",
    });
  });
});
