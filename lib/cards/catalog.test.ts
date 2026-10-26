import { describe, expect, it } from "vitest";
import { CARDS, THEMES, TIERS, TIER_START, cardById, isTheme, parseSeries, pickCard } from "./catalog";

describe("catalog", () => {
  it("has at least 500 complete cards per theme with unique names, rarest tier smallest", () => {
    for (const theme of THEMES) {
      const cards = CARDS[theme];
      expect(cards.length).toBeGreaterThanOrEqual(500);
      expect(new Set(cards.map((c) => c.name)).size).toBe(cards.length);
      expect(cards.every((c) => c.theme === theme && c.name && c.role && c.country)).toBe(true);
      for (const tier of TIERS) {
        const inTier = cards.filter((c) => c.tier === tier);
        expect(inTier.every((c, i) => c.id === TIER_START[tier] + i)).toBe(true);
      }
      const [bronze, silver, gold] = TIERS.map((t) => cards.filter((c) => c.tier === t).length);
      expect(gold).toBeLessThan(silver);
      expect(silver).toBeLessThan(bronze);
    }
    expect(cardById("football", 2001)?.name).toBe("Pelé");
    expect(cardById("football", 1)?.name).toBe("Emil Forsberg");
    expect(cardById("music", 99_999)).toBeUndefined();
  });

  it("spells out football positions", () => {
    const positions = new Set(CARDS.football.map((c) => c.role));
    expect(positions).toEqual(new Set(["Anfallare", "Försvarare", "Målvakt", "Mittfältare"]));
  });

  it("numbers cards within their tier, so adding one never renumbers others", () => {
    const cards = parseSeries("music", { bronze: "\n A|Pop|Sverige \n\nB|Rock|USA\n", silver: "C|Jazz|USA", gold: "D|Folk|Norge" });
    expect(cards.map((c) => [c.id, c.name, c.tier])).toEqual([
      [1, "A", "bronze"],
      [2, "B", "bronze"],
      [1001, "C", "silver"],
      [2001, "D", "gold"],
    ]);
  });

  it("knows its themes", () => {
    expect(isTheme("music")).toBe(true);
    expect(isTheme("monsters")).toBe(false);
  });
});

describe("pickCard", () => {
  const ids = (tier: string) => CARDS.football.filter((c) => c.tier === tier).map((c) => c.id);

  it("picks a missing card of the milestone's tier", () => {
    const gold = ids("gold");
    expect(pickCard("football", "gold", new Set(gold.slice(0, -1)), 0.99)?.id).toBe(gold.at(-1));
    expect(pickCard("football", "bronze", new Set(), 0)?.tier).toBe("bronze");
  });

  it("falls back to a lower tier, then a higher one", () => {
    expect(pickCard("football", "silver", new Set(ids("silver")), 0.5)?.tier).toBe("bronze");
    expect(pickCard("football", "bronze", new Set(ids("bronze")), 0.5)?.tier).toBe("silver");
  });

  it("gives nothing when the series is complete", () => {
    expect(pickCard("music", "gold", new Set(CARDS.music.map((c) => c.id)), 0.3)).toBeNull();
  });
});
