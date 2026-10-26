import { describe, expect, it } from "vitest";
import { MONSTERS, RARITIES, RARITY_WEIGHTS, monsterById, pickMonster } from "./catalog";

describe("catalog", () => {
  it("has 60 monsters with unique names and the planned rarity split", () => {
    expect(MONSTERS).toHaveLength(60);
    expect(new Set(MONSTERS.map((m) => m.name)).size).toBe(60);
    const count = (r: string) => MONSTERS.filter((m) => m.rarity === r).length;
    expect(RARITIES.map(count)).toEqual([30, 18, 9, 3]);
    expect(monsterById(1)?.name).toBe("Plimpa");
    expect(monsterById(61)).toBeUndefined();
  });

  it("weights add up to 100 %", () => {
    expect(Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(100);
  });
});

describe("pickMonster", () => {
  it("chooses the rarity by weight and a monster within it", () => {
    expect(pickMonster(0, 0)).toMatchObject({ id: 1, rarity: "common" });
    expect(pickMonster(0.61, 0.999).id).toBe(30);
    expect(pickMonster(0.62, 0).rarity).toBe("uncommon");
    expect(pickMonster(0.9, 0).rarity).toBe("rare");
    expect(pickMonster(0.98, 0.5)).toMatchObject({ id: 59, rarity: "legendary" });
    expect(pickMonster(0.999999, 0.999999).id).toBe(60);
  });

  it("matches the weights over many packs", () => {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const counts: Record<string, number> = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    for (let i = 0; i < 20000; i++) counts[pickMonster(rand(), rand()).rarity]++;
    expect(counts.common / 20000).toBeCloseTo(0.62, 1);
    expect(counts.legendary / 20000).toBeCloseTo(0.02, 1);
  });
});
