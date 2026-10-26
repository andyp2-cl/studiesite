"use client";

import { Coins, Package, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { MonsterArt } from "@/components/monsters/monster";
import { openPack, type PackResult } from "@/lib/monsters/actions";
import { MONSTERS, PACK_PRICE, RARITIES, type Rarity } from "@/lib/monsters/catalog";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.collection;

export const RARITY_STYLE: Record<Rarity, string> = {
  common: "border-border",
  uncommon: "border-sky-400/60",
  rare: "border-fuchsia-400/70",
  legendary: "border-amber-400 shadow-[0_0_24px_-4px] shadow-amber-400/60",
};
const RARITY_TEXT: Record<Rarity, string> = {
  common: "text-muted-foreground",
  uncommon: "text-sky-300",
  rare: "text-fuchsia-300",
  legendary: "text-amber-300",
};

type Opened = Extract<PackResult, { ok: true }>;

/** Coins, the pack button with its reveal, and the grid of all monsters (missing ones as silhouettes). */
export function Collection({ owned: initialOwned, coins: initialCoins, canOpen }: { owned: Record<number, number>; coins: number; canOpen: boolean }) {
  const [owned, setOwned] = useState(initialOwned);
  const [coins, setCoins] = useState(initialCoins);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const have = Object.keys(owned).length;

  function open() {
    setError(null);
    setOpened(null);
    startTransition(async () => {
      // A short pause so the shaking pack is part of the fun.
      const [result] = await Promise.all([openPack(), new Promise((r) => setTimeout(r, 900))]);
      if (!result.ok) return setError(result.error);
      setCoins(result.coins);
      setOwned((o) => ({ ...o, [result.monster.id]: result.count }));
      setOpened(result);
    });
  }

  const missing = Math.max(0, PACK_PRICE - coins);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-px hairline-grid sm:grid-cols-2">
        <div className="flex items-center gap-3 p-4">
          <Coins className="size-6 text-amber-400" />
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{t.coins}</p>
            <p className="text-3xl font-semibold tabular-nums">{coins}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4">
          <Sparkles className="size-6 text-primary" />
          <div className="flex-1">
            <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{t.title}</p>
            <p className="text-lg font-semibold">{t.progress(have, MONSTERS.length)}</p>
            <div className="mt-1 h-1.5 bg-foreground/10">
              <div className="h-full bg-primary" style={{ width: `${(have / MONSTERS.length) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 border border-border p-6">
        {opened ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className={cn("animate-pop-in border-2 bg-card p-3", RARITY_STYLE[opened.monster.rarity])}>
              <MonsterArt id={opened.monster.id} className="size-36" />
            </div>
            <p className={cn("font-mono text-[11px] tracking-[0.2em] uppercase", RARITY_TEXT[opened.monster.rarity])}>
              {t.rarity[opened.monster.rarity]}
            </p>
            <p className="text-2xl font-semibold">{opened.monster.name}</p>
            <p className={cn("text-sm", opened.isNew ? "font-semibold text-primary" : "text-muted-foreground")}>
              {opened.isNew ? t.gotNew : t.gotDuplicate(opened.count, opened.refund)}
            </p>
          </div>
        ) : (
          <Package className={cn("size-24 text-primary", pending && "animate-pack-shake")} strokeWidth={1.25} />
        )}
        <button
          type="button"
          onClick={open}
          disabled={!canOpen || pending || missing > 0}
          className="h-12 bg-primary px-6 font-mono text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? t.opening : opened ? t.again : t.open(PACK_PRICE)}
        </button>
        {missing > 0 && <p className="font-mono text-[11px] text-muted-foreground">{t.missing(missing)}</p>}
        {!canOpen && <p className="font-mono text-[11px] text-muted-foreground">{t.onlyStudents}</p>}
        {error && <p className="font-mono text-xs text-destructive">{error}</p>}
        <p className="font-mono text-[10px] text-muted-foreground">{t.odds}</p>
      </div>

      {RARITIES.map((rarity) => (
        <section key={rarity}>
          <p className={cn("mb-3 font-mono text-[11px] tracking-[0.2em] uppercase", RARITY_TEXT[rarity])}>{t.rarity[rarity]}</p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {MONSTERS.filter((m) => m.rarity === rarity).map((m) => {
              const count = owned[m.id];
              return (
                <li key={m.id} className={cn("relative flex flex-col items-center gap-1 border bg-card/40 p-2", count ? RARITY_STYLE[rarity] : "border-border opacity-60")}>
                  <MonsterArt id={m.id} silhouette={!count} className="size-20" />
                  <span className="truncate text-center text-xs font-semibold">{count ? m.name : t.unknown}</span>
                  {count > 1 && <span className="absolute top-1 right-1.5 font-mono text-[10px] text-muted-foreground">{t.times(count)}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
