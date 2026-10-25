// Default achievements. Rules are evaluated in code (step 6); admins can add
// more rows later using the same rule types.

export type AchievementRule =
  | { type: "correct_total"; count: number }
  | { type: "correct_in_row"; count: number }
  | { type: "attempts_total"; count: number }
  | { type: "day_streak"; days: number }
  | { type: "area_stars"; area: string; stars: number }
  | { type: "correct_between"; from: string; to: string }
  | { type: "explanations_total"; count: number };

export type SeedAchievement = {
  key: string;
  name: string;
  description: string;
  icon: string;
  rule: AchievementRule;
};

export const seedAchievements: SeedAchievement[] = [
  {
    key: "first_correct",
    name: "Första rätt",
    description: "Svara rätt på din första uppgift.",
    icon: "sparkles",
    rule: { type: "correct_total", count: 1 },
  },
  {
    key: "ten_in_row",
    name: "10 i rad",
    description: "Svara rätt på 10 uppgifter i rad.",
    icon: "flame",
    rule: { type: "correct_in_row", count: 10 },
  },
  {
    key: "streak_7",
    name: "En hel vecka",
    description: "Håll streaken vid liv i 7 dagar.",
    icon: "calendar-check",
    rule: { type: "day_streak", days: 7 },
  },
  {
    key: "streak_30",
    name: "30 dagar",
    description: "Håll streaken vid liv i 30 dagar.",
    icon: "calendar-heart",
    rule: { type: "day_streak", days: 30 },
  },
  {
    key: "fraction_master",
    name: "Bråkmästare",
    description: "Få 3 stjärnor på alla bråkmoment.",
    icon: "pie-chart",
    rule: { type: "area_stars", area: "brak", stars: 3 },
  },
  {
    key: "night_owl",
    name: "Nattuggla",
    description: "Svara rätt på en uppgift efter klockan 22.",
    icon: "moon",
    rule: { type: "correct_between", from: "22:00", to: "04:00" },
  },
  {
    key: "early_bird",
    name: "Morgonpigg",
    description: "Svara rätt på en uppgift före klockan 7.",
    icon: "sunrise",
    rule: { type: "correct_between", from: "04:00", to: "07:00" },
  },
  {
    key: "hundred_tasks",
    name: "Hundra uppgifter",
    description: "Gör 100 uppgifter.",
    icon: "target",
    rule: { type: "attempts_total", count: 100 },
  },
  {
    key: "explainer",
    name: "Förklaringsproffs",
    description: "Beskriv hur du tänkte på 20 uppgifter.",
    icon: "message-square-text",
    rule: { type: "explanations_total", count: 20 },
  },
];
