// Reward shop (SPEC 6): students spend coins on real rewards the admin sets up,
// and the admin approves or denies each purchase. Pure helpers, tested.

export const REWARD_ICONS = ["gift", "gamepad", "tv", "phone", "ice-cream", "pizza", "popcorn", "cookie", "ticket", "bike", "clock", "chef-hat"] as const;

export type RewardInput = { name: string; description: string | null; price: number; icon: string; isActive: boolean };

type Parsed<T> = { ok: true; value: T } | { ok: false; field: "name" | "price" | "icon" };

export function parseReward(input: Record<string, unknown>): Parsed<RewardInput> {
  const name = String(input.name ?? "").trim();
  if (name.length < 1 || name.length > 60) return { ok: false, field: "name" };
  const price = Number(String(input.price ?? "").trim());
  if (!Number.isInteger(price) || price < 1 || price > 10_000) return { ok: false, field: "price" };
  const icon = String(input.icon ?? "gift");
  if (!(REWARD_ICONS as readonly string[]).includes(icon)) return { ok: false, field: "icon" };
  const description = String(input.description ?? "").trim().slice(0, 200) || null;
  return { ok: true, value: { name, description, price, icon, isActive: input.isActive !== false } };
}

/** Coins left after buying, or null when the student cannot afford it. */
export function coinsAfterPurchase(coins: number, price: number): number | null {
  return price > 0 && coins >= price ? coins - price : null;
}

/** How many more coins are needed (0 when affordable). */
export const coinsMissing = (coins: number, price: number) => Math.max(0, price - coins);
