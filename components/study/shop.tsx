"use client";

import { Coins } from "lucide-react";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { coinsMissing } from "@/lib/rewards";
import { buyReward } from "@/lib/shop/actions";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.shop;

export type ShopReward = { id: string; name: string; description: string | null; icon: string; price: number };

/** Reward cards with a buy button; the balance updates right after a purchase. */
export function ShopGrid({ rewards, coins: initialCoins, canBuy }: { rewards: ShopReward[]; coins: number; canBuy: boolean }) {
  const [coins, setCoins] = useState(initialCoins);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [, startTransition] = useTransition();

  function buy(r: ShopReward) {
    if (!window.confirm(t.confirm(r.name, r.price))) return;
    setBuying(r.id);
    setMessage(null);
    startTransition(async () => {
      const result = await buyReward(r.id);
      setBuying(null);
      if (result.ok) {
        setCoins(result.coins);
        setMessage({ kind: "success", text: t.bought });
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 border border-amber-400/40 bg-amber-400/[0.06] p-4">
        <Coins className="size-6 text-amber-400" />
        <div className="flex-1">
          <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{t.balance}</p>
          <p className="text-3xl font-semibold tabular-nums">{coins}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t.howToEarn}</p>
      {message && (
        <p role="status" className={cn("font-mono text-xs", message.kind === "error" ? "text-destructive" : "text-success")}>
          {message.text}
        </p>
      )}

      {rewards.length === 0 ? (
        <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rewards.map((r) => {
            const missing = coinsMissing(coins, r.price);
            return (
              <li key={r.id} className="flex flex-col gap-3 border border-border p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center border border-primary/40 bg-primary/10 text-primary">
                    <Icon name={r.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{r.name}</p>
                    {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 font-mono text-sm font-semibold">
                    <Coins className="size-4 text-amber-400" /> {r.price}
                  </span>
                  {missing > 0 ? (
                    <span className="font-mono text-[11px] text-muted-foreground">{t.missing(missing)}</span>
                  ) : (
                    <button
                      type="button"
                      disabled={!canBuy || buying !== null}
                      onClick={() => buy(r)}
                      className="h-9 bg-primary px-4 font-mono text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {buying === r.id ? t.buying : t.buy}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
