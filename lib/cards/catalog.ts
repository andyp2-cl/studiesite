// The collectible cards: one series per theme (football players or music
// artists), real names with drawn pictures (components/cards/card-art.tsx), so
// there are no image files. Cards are earned for big milestones only, never
// bought: an area cleared at Lätt gives bronze, Medel silver, Svår gold, and a
// finished fact area silver. A milestone always gives a card the student lacks.

export type Theme = "football" | "music";
export type Tier = "bronze" | "silver" | "gold";

export const THEMES: readonly Theme[] = ["football", "music"];
export const TIERS: readonly Tier[] = ["bronze", "silver", "gold"];

/** role: position for players, genre for artists. */
export type Card = { id: number; theme: Theme; tier: Tier; name: string; role: string; country: string };

type Row = [name: string, role: string, country: string];

const FOOTBALL: Record<Tier, Row[]> = {
  bronze: [
    ["Emil Forsberg", "Mittfältare", "Sverige"],
    ["Victor Lindelöf", "Försvarare", "Sverige"],
    ["Robin Olsen", "Målvakt", "Sverige"],
    ["Magdalena Eriksson", "Försvarare", "Sverige"],
    ["Filippa Angeldal", "Mittfältare", "Sverige"],
    ["Johanna Rytting Kaneryd", "Anfallare", "Sverige"],
    ["Zećira Mušović", "Målvakt", "Sverige"],
    ["Nathalie Björn", "Försvarare", "Sverige"],
    ["Martin Ødegaard", "Mittfältare", "Norge"],
    ["Bukayo Saka", "Anfallare", "England"],
    ["Phil Foden", "Mittfältare", "England"],
    ["Pedri", "Mittfältare", "Spanien"],
    ["Rodri", "Mittfältare", "Spanien"],
    ["Antoine Griezmann", "Anfallare", "Frankrike"],
    ["Alisson Becker", "Målvakt", "Brasilien"],
    ["Achraf Hakimi", "Försvarare", "Marocko"],
    ["Son Heung-min", "Anfallare", "Sydkorea"],
    ["Alessia Russo", "Anfallare", "England"],
    ["Caroline Graham Hansen", "Anfallare", "Norge"],
    ["Lena Oberdorf", "Mittfältare", "Tyskland"],
  ],
  silver: [
    ["Alexander Isak", "Anfallare", "Sverige"],
    ["Viktor Gyökeres", "Anfallare", "Sverige"],
    ["Dejan Kulusevski", "Mittfältare", "Sverige"],
    ["Stina Blackstenius", "Anfallare", "Sverige"],
    ["Kosovare Asllani", "Mittfältare", "Sverige"],
    ["Hedvig Lindahl", "Målvakt", "Sverige"],
    ["Henrik Larsson", "Anfallare", "Sverige"],
    ["Kevin De Bruyne", "Mittfältare", "Belgien"],
    ["Mohamed Salah", "Anfallare", "Egypten"],
    ["Jude Bellingham", "Mittfältare", "England"],
    ["Harry Kane", "Anfallare", "England"],
    ["Virgil van Dijk", "Försvarare", "Nederländerna"],
    ["Luka Modrić", "Mittfältare", "Kroatien"],
    ["Ada Hegerberg", "Anfallare", "Norge"],
  ],
  gold: [
    ["Zlatan Ibrahimović", "Anfallare", "Sverige"],
    ["Lionel Messi", "Anfallare", "Argentina"],
    ["Cristiano Ronaldo", "Anfallare", "Portugal"],
    ["Kylian Mbappé", "Anfallare", "Frankrike"],
    ["Erling Haaland", "Anfallare", "Norge"],
    ["Aitana Bonmatí", "Mittfältare", "Spanien"],
    ["Alexia Putellas", "Mittfältare", "Spanien"],
    ["Pelé", "Anfallare", "Brasilien"],
  ],
};

const MUSIC: Record<Tier, Row[]> = {
  bronze: [
    ["Molly Sandén", "Pop", "Sverige"],
    ["Benjamin Ingrosso", "Pop", "Sverige"],
    ["Veronica Maggio", "Pop", "Sverige"],
    ["Miriam Bryant", "Pop", "Sverige"],
    ["Tove Lo", "Pop", "Sverige"],
    ["First Aid Kit", "Folk", "Sverige"],
    ["Laleh", "Pop", "Sverige"],
    ["Darin", "Pop", "Sverige"],
    ["Hov1", "Pop", "Sverige"],
    ["Smith & Thell", "Pop", "Sverige"],
    ["Felix Sandman", "Pop", "Sverige"],
    ["Imagine Dragons", "Rock", "USA"],
    ["Shakira", "Pop", "Colombia"],
    ["Lady Gaga", "Pop", "USA"],
    ["Justin Bieber", "Pop", "Kanada"],
    ["The Weeknd", "R&B", "Kanada"],
    ["Rihanna", "Pop", "Barbados"],
    ["Alan Walker", "Elektroniskt", "Norge"],
    ["Sigrid", "Pop", "Norge"],
    ["Måneskin", "Rock", "Italien"],
  ],
  silver: [
    ["Billie Eilish", "Pop", "USA"],
    ["Dua Lipa", "Pop", "Storbritannien"],
    ["Bruno Mars", "Pop", "USA"],
    ["Adele", "Pop", "Storbritannien"],
    ["Harry Styles", "Pop", "Storbritannien"],
    ["Olivia Rodrigo", "Pop", "USA"],
    ["Sabrina Carpenter", "Pop", "USA"],
    ["Ariana Grande", "Pop", "USA"],
    ["Loreen", "Pop", "Sverige"],
    ["Måns Zelmerlöw", "Pop", "Sverige"],
    ["Swedish House Mafia", "Elektroniskt", "Sverige"],
    ["Robyn", "Pop", "Sverige"],
    ["Coldplay", "Rock", "Storbritannien"],
    ["Queen", "Rock", "Storbritannien"],
  ],
  gold: [
    ["Taylor Swift", "Pop", "USA"],
    ["ABBA", "Pop", "Sverige"],
    ["Avicii", "Elektroniskt", "Sverige"],
    ["Zara Larsson", "Pop", "Sverige"],
    ["Michael Jackson", "Pop", "USA"],
    ["The Beatles", "Rock", "Storbritannien"],
    ["Beyoncé", "R&B", "USA"],
    ["Ed Sheeran", "Pop", "Storbritannien"],
  ],
};

function series(theme: Theme, rows: Record<Tier, Row[]>): Card[] {
  return TIERS.flatMap((tier) => rows[tier].map((row) => ({ tier, row }))).map(({ tier, row: [name, role, country] }, i) => ({
    id: i + 1,
    theme,
    tier,
    name,
    role,
    country,
  }));
}

export const CARDS: Record<Theme, readonly Card[]> = {
  football: series("football", FOOTBALL),
  music: series("music", MUSIC),
};

export const cardById = (theme: Theme, id: number): Card | undefined => CARDS[theme][id - 1];

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
