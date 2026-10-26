import { describe, expect, it } from "vitest";
import { coinsAfterPurchase, coinsMissing, parseReward } from "./rewards";

describe("parseReward", () => {
  it("accepts a reward and trims it", () => {
    expect(parseReward({ name: " 30 min skärmtid ", description: "", price: "50", icon: "tv" })).toEqual({
      ok: true,
      value: { name: "30 min skärmtid", description: null, price: 50, icon: "tv", isActive: true },
    });
  });

  it("rejects bad names, prices and icons", () => {
    expect(parseReward({ name: "", price: "5" })).toEqual({ ok: false, field: "name" });
    expect(parseReward({ name: "Glass", price: "0" })).toEqual({ ok: false, field: "price" });
    expect(parseReward({ name: "Glass", price: "2.5" })).toEqual({ ok: false, field: "price" });
    expect(parseReward({ name: "Glass", price: "5", icon: "skull" })).toEqual({ ok: false, field: "icon" });
  });
});

describe("coins", () => {
  it("only lets the student buy what they can afford", () => {
    expect(coinsAfterPurchase(50, 50)).toBe(0);
    expect(coinsAfterPurchase(49, 50)).toBeNull();
    expect(coinsMissing(20, 50)).toBe(30);
    expect(coinsMissing(60, 50)).toBe(0);
  });
});
