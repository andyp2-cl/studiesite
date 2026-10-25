import { Crown, Flame } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/study/page-header";
import { Avatar, SectionLabel } from "@/components/study/visuals";
import { requireProfile } from "@/lib/auth/session";
import { strings } from "@/lib/strings";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const t = strings.leaderboard;

// Avatars get a stable colour per user until avatars are chosen (step 7).
const AVATAR_COLORS = ["#e8115b", "#2d46b9", "#148a08", "#e8590c", "#8400e7", "#0d73ec"];
const colorFor = (id: string) => AVATAR_COLORS[parseInt(id.slice(0, 8), 16) % AVATAR_COLORS.length];

export default async function LeaderboardPage({ searchParams }: PageProps<"/topplista">) {
  const { period } = await searchParams;
  const all = period === "all";
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_leaderboard", { p_period: all ? "all" : "week" });
  const rows = data ?? [];
  const leader = rows[0] && rows[0].xp > 0 ? rows[0] : null;

  return (
    <main>
      <PageHeader kicker={all ? t.allTime : t.week} title={t.title} width="max-w-3xl">
        <div className="mt-6 flex border border-border font-mono text-xs sm:w-fit">
          {[
            { href: "/topplista", label: t.week, active: !all },
            { href: "/topplista?period=all", label: t.allTime, active: all },
          ].map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                "flex-1 border-r border-border px-4 py-2 text-center last:border-r-0",
                tab.active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </PageHeader>

      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 sm:px-8">
        {leader ? (
          <section className="flex items-center gap-5 border border-primary/50 bg-primary/[0.05] p-5">
            <Avatar name={leader.display_name} color={colorFor(leader.user_id)} size={64} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-primary uppercase">
                <Crown className="size-3.5" /> {t.leader}
              </p>
              <p className="text-2xl font-semibold">{leader.display_name}</p>
              <p className="font-mono text-sm text-muted-foreground">{leader.xp} XP</p>
            </div>
          </section>
        ) : (
          <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">{t.empty}</p>
        )}

        <section>
          <SectionLabel>{t.ranking}</SectionLabel>
          <div className="border border-border">
            <div className="grid grid-cols-[2.5rem_1fr_auto] gap-4 border-b border-border px-4 py-2 font-mono text-[11px] tracking-[0.15em] text-muted-foreground uppercase">
              <span>#</span>
              <span>{t.name}</span>
              <span>XP</span>
            </div>
            <ol>
              {rows.map((p, i) => {
                const isMe = p.user_id === profile.id;
                return (
                  <li
                    key={p.user_id}
                    className={cn(
                      "grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0",
                      isMe && "bg-primary/[0.06]",
                    )}
                  >
                    <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={p.display_name} color={colorFor(p.user_id)} size={36} />
                      <span className="min-w-0">
                        <span className="block font-semibold">
                          {p.display_name}
                          {isMe && <span className="ml-2 font-mono text-xs text-primary">{t.you}</span>}
                        </span>
                        <span className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                          {strings.profile.level.toLowerCase()} {p.level}
                          <span className="flex items-center gap-0.5">
                            <Flame className="size-3 text-orange-500" /> {p.streak}
                          </span>
                        </span>
                      </span>
                    </span>
                    <span className="font-mono text-lg tabular-nums">{p.xp}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
