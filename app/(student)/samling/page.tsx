import { CardArt } from "@/components/cards/card-art";
import { PageHeader } from "@/components/study/page-header";
import { requireViewProfile } from "@/lib/auth/session";
import { CARDS, TIERS, isTheme, type Tier } from "@/lib/cards/catalog";
import { strings } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const t = strings.collection;

const TIER_TEXT: Record<Tier, string> = {
  bronze: "text-orange-300",
  silver: "text-slate-300",
  gold: "text-amber-300",
};

export default async function CollectionPage() {
  const profile = await requireViewProfile();
  const theme = isTheme(profile.collection_theme) ? profile.collection_theme : "football";
  const supabase = await createClient();
  const { data } = await supabase.from("user_cards").select("card_id").eq("user_id", profile.id).eq("theme", theme);
  const owned = new Set((data ?? []).map((r) => r.card_id));
  const cards = CARDS[theme];

  return (
    <main>
      <PageHeader kicker={t.kicker[theme]} title={t.title} width="max-w-3xl">
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          {t.intro[theme]} {t.howTo}
        </p>
        <p className="mt-4 font-mono text-sm font-semibold">{t.progress(owned.size, cards.length)}</p>
        <div className="mt-2 h-1.5 max-w-xs bg-foreground/10">
          <div className="h-full bg-primary" style={{ width: `${(owned.size / cards.length) * 100}%` }} />
        </div>
      </PageHeader>
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 sm:px-8">
        {[...TIERS].reverse().map((tier) => (
          <section key={tier}>
            <p className={cn("mb-3 font-mono text-[11px] tracking-[0.2em] uppercase", TIER_TEXT[tier])}>{t.tier[tier]}</p>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {cards
                .filter((c) => c.tier === tier)
                .map((c) => {
                  const have = owned.has(c.id);
                  return (
                    <li key={c.id} className={cn("flex flex-col gap-1.5", !have && "opacity-50")}>
                      <CardArt card={c} hidden={!have} className="w-full" />
                      <span className="truncate text-center text-xs font-semibold">{have ? c.name : t.unknown}</span>
                      {have && (
                        <span className="truncate text-center font-mono text-[10px] text-muted-foreground">
                          {c.role} · {c.country}
                        </span>
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
