// Made-up data for the design mockup. Content names/colours come from the real
// seed so the mockup shows the actual math package.

import { mathSubject } from "@/lib/seed/math";

export const BASE = "/mockup";

export const me = {
  name: "Elsa",
  avatarColor: "#e8115b",
  xp: 1340,
  level: 3,
  levelName: "Problemlösare",
  nextLevelName: "Mattemästare",
  levelProgress: 0.62,
  xpToNext: 460,
  coins: 134,
  streak: 12,
  streakFreezes: 1,
  todayXp: 30,
  dailyGoal: 50,
  tasksDone: 287,
};

export const areas = mathSubject.areas;
export const fractions = areas.find((a) => a.slug === "brak")!;
export const expandSimplify = fractions.moments[0];

/** Stars per moment slug (0–3). */
export const stars: Record<string, number> = {
  "positionssystemet-och-avrundning": 3,
  "negativa-tal": 2,
  "de-fyra-raknesatten": 3,
  prioriteringsregler: 1,
  "forlanga-och-forkorta": 1,
  "jamfora-och-storleksordna": 2,
  "blandad-form": 0,
  "addition-och-subtraktion": 0,
  "multiplikation-och-division": 0,
  potensform: 1,
  "ekvationer-i-ett-steg": 2,
};

export const continueItems = [
  { area: "brak", moment: "forlanga-och-forkorta" },
  { area: "algebra", moment: "ekvationer-i-ett-steg" },
  { area: "taluppfattning", moment: "prioriteringsregler" },
  { area: "potenser", moment: "potensform" },
].map(({ area, moment }) => {
  const a = areas.find((x) => x.slug === area)!;
  return { area: a, moment: a.moments.find((m) => m.slug === moment)! };
});

export const leaderboardWeek = [
  { name: "Noah", color: "#2d46b9", xp: 410, level: 3, streak: 5 },
  { name: "Elsa", color: "#e8115b", xp: 380, level: 3, streak: 12, isMe: true },
];

export const leaderboardAll = [
  { name: "Elsa", color: "#e8115b", xp: 1340, level: 3, streak: 12, isMe: true },
  { name: "Noah", color: "#2d46b9", xp: 1215, level: 3, streak: 5 },
];

export const badges = [
  { name: "Första rätt", icon: "sparkles", earned: true },
  { name: "10 i rad", icon: "flame", earned: true },
  { name: "En hel vecka", icon: "calendar-check", earned: true },
  { name: "Nattuggla", icon: "moon", earned: true },
  { name: "Hundra uppgifter", icon: "target", earned: true },
  { name: "30 dagar", icon: "calendar-heart", earned: false },
  { name: "Bråkmästare", icon: "chart-pie", earned: false },
  { name: "Morgonpigg", icon: "sunrise", earned: false },
  { name: "Förklaringsproffs", icon: "message-square-text", earned: false },
];
