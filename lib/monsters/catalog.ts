// The collectible monsters: a fixed series of 60, each drawn from its number
// (see components/monsters/monster.tsx), so there are no image files and no
// cost. Students get them from surprise packs bought with coins.

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export const RARITIES: readonly Rarity[] = ["common", "uncommon", "rare", "legendary"];

const NAMES = [
  // Common (1–30)
  "Plimpa", "Glumbo", "Fnissa", "Bubbel", "Snorkel", "Pipsa", "Mullis", "Vimsa", "Gnutte", "Pompe",
  "Klonk", "Fjutt", "Snurre", "Flimra", "Nuppe", "Tjoff", "Bolle", "Mysa", "Kludd", "Pösa",
  "Dunte", "Snyft", "Gurra", "Lirpa", "Mummel", "Pixa", "Tuss", "Grynt", "Fluff", "Nibbla",
  // Uncommon (31–48)
  "Zorbix", "Kvasta", "Blixa", "Moxie", "Trulle", "Skvätt", "Glimra", "Sorko", "Pyttis", "Vrål",
  "Knasa", "Flinga", "Brumbas", "Tjirp", "Skuggis", "Pirra", "Dimma", "Knorr",
  // Rare (49–57)
  "Stjärnfnatt", "Vulkanos", "Isbjörka", "Åskelina", "Kristalla", "Nebulo", "Djuphav", "Solfjäder", "Månskugga",
  // Legendary (58–60)
  "Kometkungen", "Drakomira", "Evigheten",
];

export type Monster = { id: number; name: string; rarity: Rarity };

const rarityOf = (id: number): Rarity => (id <= 30 ? "common" : id <= 48 ? "uncommon" : id <= 57 ? "rare" : "legendary");

export const MONSTERS: readonly Monster[] = NAMES.map((name, i) => ({ id: i + 1, name, rarity: rarityOf(i + 1) }));

export const monsterById = (id: number): Monster | undefined => MONSTERS[id - 1];

export const PACK_PRICE = 20;

/** Chance per pack, in percent. A legendary is about one pack in fifty. */
export const RARITY_WEIGHTS: Record<Rarity, number> = { common: 62, uncommon: 26, rare: 10, legendary: 2 };

/** Coins back for a monster you already have, so duplicates still count for something. */
export const DUPLICATE_REFUND: Record<Rarity, number> = { common: 4, uncommon: 8, rare: 15, legendary: 40 };

/**
 * Picks a monster from two random numbers in [0, 1): the first chooses the
 * rarity by weight, the second a monster within it.
 */
export function pickMonster(rarityRoll: number, monsterRoll: number): Monster {
  let threshold = 0;
  let rarity: Rarity = "common";
  for (const r of RARITIES) {
    threshold += RARITY_WEIGHTS[r] / 100;
    if (rarityRoll < threshold) {
      rarity = r;
      break;
    }
    rarity = r;
  }
  const pool = MONSTERS.filter((m) => m.rarity === rarity);
  return pool[Math.min(Math.floor(monsterRoll * pool.length), pool.length - 1)];
}
