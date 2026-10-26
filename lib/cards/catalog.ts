// The collectible cards: one series per theme (football players in football.ts,
// music artists in music.ts), real names with simple drawn pictures
// (components/cards/card-art.tsx), so there are no image files. Over 500 cards
// per theme, so a series is never finished. Cards are earned for big milestones only, never
// bought: an area cleared at Lätt gives bronze, Medel silver, Svår gold, and a
// finished fact area silver. A milestone always gives a card the student lacks.

import { FOOTBALL } from "./football";
import { MUSIC } from "./music";

export type Theme = "football" | "music";
export type Tier = "bronze" | "silver" | "gold";

export const THEMES: readonly Theme[] = ["football", "music"];
export const TIERS: readonly Tier[] = ["bronze", "silver", "gold"];

/** role: position for players, genre for artists. */
export type Card = { id: number; theme: Theme; tier: Tier; name: string; role: string; country: string };

const POSITIONS: Record<string, string> = { M: "Målvakt", F: "Försvarare", MF: "Mittfältare", A: "Anfallare" };

/**
 * Card numbers start at these per tier (room for 1000 each), so adding a card
 * at the end of any tier list never renumbers the cards students already have.
 */
export const TIER_START: Record<Tier, number> = { bronze: 1, silver: 1001, gold: 2001 };
const TIER_SIZE = 1000;

/** Lines "name|role|country" per tier into numbered cards. */
export function parseSeries(theme: Theme, rows: Record<Tier, string>): Card[] {
  return TIERS.flatMap((tier) =>
    rows[tier]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, TIER_SIZE)
      .map((line, i) => {
        const [name, role, country] = line.split("|").map((part) => part.trim());
        const label = theme === "football" ? (POSITIONS[role] ?? role) : role;
        return { id: TIER_START[tier] + i, theme, tier, name, role: label, country };
      }),
  );
}

export const CARDS: Record<Theme, readonly Card[]> = {
  football: parseSeries("football", FOOTBALL),
  music: parseSeries("music", MUSIC),
};

const BY_ID: Record<Theme, Map<number, Card>> = {
  football: new Map(CARDS.football.map((c) => [c.id, c])),
  music: new Map(CARDS.music.map((c) => [c.id, c])),
};

export const cardById = (theme: Theme, id: number): Card | undefined => BY_ID[theme].get(id);

export const isTheme = (value: unknown): value is Theme => THEMES.includes(value as Theme);

/**
 * A card the student lacks for a milestone of the given tier, chosen by `roll`
 * in [0, 1). Falls back to a lower tier, then any tier, when the tier is full.
 * Null when the whole series is collected.
 */
export function pickCard(theme: Theme, tier: Tier, owned: ReadonlySet<number>, roll: number): Card | null {
  const missing = CARDS[theme].filter((c) => !owned.has(c.id));
  const order = [tier, ...TIERS.slice(0, TIERS.indexOf(tier)).reverse(), ...TIERS.slice(TIERS.indexOf(tier) + 1)];
  for (const t of order) {
    const pool = missing.filter((c) => c.tier === t);
    if (pool.length) return pool[Math.min(Math.floor(roll * pool.length), pool.length - 1)];
  }
  return null;
}
