import { describe, expect, it } from "vitest";
import { CARDS, THEMES, TIERS, cardById, isTheme, pickCard } from "./catalog";

describe("catalog", () => {
  it("has 42 cards per theme with unique names: 20 bronze, 14 silver, 8 gold", () => {
    for (const theme of THEMES) {
      const cards = CARDS[theme];
      expect(cards).toHaveLength(42);
      expect(new Set(cards.map((c) => c.name)).size).toBe(42);
      expect(TIERS.map((t) => cards.filter((c) => c.tier === t).length)).toEqual([20, 14, 8]);
      expect(cards.every((c, i) => c.id === i + 1 && c.theme === theme)).toBe(true);
    }
    expect(cardById("football", 42)?.name).toBe("Pelé");
    expect(cardById("music", 43)).toBeUndefined();
  });

  it("knows its themes", () => {
    expect(isTheme("music")).toBe(true);
    expect(isTheme("monsters")).toBe(false);
  });
});

describe("pickCard", () => {
  const ids = (tier: string) => CARDS.football.filter((c) => c.tier === tier).map((c) => c.id);

  it("picks a missing card of the milestone's tier", () => {
    const owned = new Set(ids("gold").slice(0, 7));
    expect(pickCard("football", "gold", owned, 0.99)?.name).toBe("Pelé");
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
