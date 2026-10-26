import { Coins } from "lucide-react";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/study/page-header";
import { ShopGrid } from "@/components/study/shop";
import { SectionLabel } from "@/components/study/visuals";
import { getCurrentProfile, requireViewProfile } from "@/lib/auth/session";
import { getShop } from "@/lib/data/shop";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.shop;

export default async function ShopPage() {
  const profile = await requireViewProfile();
  const me = await getCurrentProfile();
  const { rewards, purchases } = await getShop(profile.id);

  return (
    <main>
      <PageHeader kicker={t.kicker} title={t.title} width="max-w-3xl" />
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-10 sm:px-8">
        <ShopGrid key={profile.id} rewards={rewards} coins={profile.coins} canBuy={me?.role === "student"} />

        {purchases.length > 0 && (
          <section>
            <SectionLabel>{t.mine}</SectionLabel>
            <ul className="border border-border">
              {purchases.map((p) => (
                <li key={p.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <Icon name={p.icon} className="size-4 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <Coins className="size-3.5 text-amber-400" /> {p.price}
                  </span>
                  <span
                    className={cn(
                      "w-28 text-right font-mono text-[11px] sm:w-44",
                      p.status === "approved" && "text-success",
                      p.status === "denied" && "text-muted-foreground",
                      p.status === "pending" && "text-amber-300",
                    )}
                  >
                    {t.status[p.status]}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
