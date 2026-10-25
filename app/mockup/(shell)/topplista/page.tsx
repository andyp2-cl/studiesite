import { Crown, Flame } from "lucide-react";
import Link from "next/link";
import { leaderboardAll, leaderboardWeek } from "@/app/mockup/_mock";
import { Avatar, SectionLabel } from "@/components/study/visuals";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.leaderboard;

export default async function MockLeaderboard({ searchParams }: PageProps<"/mockup/topplista">) {
  const { period } = await searchParams;
  const all = period === "all";
  const rows = all ? leaderboardAll : leaderboardWeek;
  const leader = rows[0];

  return (
    <main>
      <header className="bg-dots border-b border-border">
        <div className="mx-auto max-w-3xl px-4 pt-10 pb-8 sm:px-8 sm:pt-14">
          <p className="mb-3 font-mono text-xs tracking-[0.2em] text-primary uppercase">
            {all ? t.allTime : t.week}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{t.title}</h1>
          <div className="mt-6 flex border border-border font-mono text-xs sm:w-fit">
            {[
              { href: "?period=week", label: t.week, active: !all },
              { href: "?period=all", label: t.allTime, active: all },
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
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10 sm:px-8">
        <section className="flex items-center gap-5 border border-primary/50 bg-primary/[0.05] p-5">
          <Avatar name={leader.name} color={leader.color} size={64} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-primary uppercase">
              <Crown className="size-3.5" /> {t.leader}
            </p>
            <p className="text-2xl font-semibold">{leader.name}</p>
            <p className="font-mono text-sm text-muted-foreground">{leader.xp} XP</p>
          </div>
          {!all && <span className="hidden font-mono text-xs text-muted-foreground sm:block">{t.resetsIn(2)}</span>}
        </section>

        <section>
          <SectionLabel>{t.ranking}</SectionLabel>
          <div className="border border-border">
            <div className="grid grid-cols-[2.5rem_1fr_auto] gap-4 border-b border-border px-4 py-2 font-mono text-[11px] tracking-[0.15em] text-muted-foreground uppercase">
              <span>#</span>
              <span>{t.name}</span>
              <span>XP</span>
            </div>
            <ol>
              {rows.map((p, i) => (
                <li
                  key={p.name}
                  className={cn(
                    "grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0",
                    p.isMe && "bg-primary/[0.06]",
                  )}
                >
                  <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar name={p.name} color={p.color} size={36} />
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {p.name}
                        {p.isMe && <span className="ml-2 font-mono text-xs text-primary">{t.you}</span>}
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
              ))}
            </ol>
          </div>
        </section>
      </div>
    </main>
  );
}
