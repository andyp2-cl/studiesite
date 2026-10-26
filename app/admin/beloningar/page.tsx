import { ChevronDown } from "lucide-react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PriceTag, RedemptionActions, RewardForm } from "@/components/admin/reward-forms";
import { Icon } from "@/components/icon";
import { SectionLabel } from "@/components/study/visuals";
import { getAdminRewards } from "@/lib/data/shop";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.admin.rewards;

const when = (iso: string) =>
  new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function AdminRewardsPage() {
  const { rewards, pending, decided } = await getAdminRewards();

  return (
    <main>
      <AdminHeader kicker={strings.admin.nav.rewards} title={strings.admin.nav.rewards} intro={t.intro} />
      <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10 sm:px-8">
        <section>
          <SectionLabel>{t.pending}</SectionLabel>
          {pending.length === 0 ? (
            <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">{t.pendingNone}</p>
          ) : (
            <ul className="border border-amber-400/40">
              {pending.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <Icon name={r.icon} className="size-5 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{r.reward}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      {r.student} · {when(r.createdAt)}
                    </span>
                  </span>
                  <PriceTag price={r.price} />
                  <RedemptionActions id={r.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <SectionLabel>{t.list}</SectionLabel>
          {rewards.length === 0 && <p className="text-sm text-muted-foreground">{t.none}</p>}
          {rewards.map((r) => (
            <details key={r.id} className="group border border-border">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
                <Icon name={r.icon} className={cn("size-5", r.is_active ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("flex-1 font-semibold", !r.is_active && "text-muted-foreground")}>{r.name}</span>
                {!r.is_active && <span className="font-mono text-[11px] text-muted-foreground">{t.hidden}</span>}
                <PriceTag price={r.price} />
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <RewardForm reward={r} />
            </details>
          ))}
          <RewardForm reward={null} />
          <p className="font-mono text-[11px] text-muted-foreground">{t.suggestions}</p>
        </section>

        {decided.length > 0 && (
          <section>
            <SectionLabel>{t.history}</SectionLabel>
            <ul className="border border-border">
              {decided.map((r) => (
                <li key={r.id} className="flex items-center gap-3 border-b border-border px-4 py-2.5 text-sm last:border-b-0">
                  <span className="min-w-0 flex-1 truncate">
                    {r.student} · {r.reward}
                  </span>
                  <PriceTag price={r.price} />
                  <span
                    className={cn("w-20 text-right font-mono text-[11px]", r.status === "approved" ? "text-success" : "text-muted-foreground")}
                  >
                    {r.status === "approved" ? t.approved : t.denied}
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
