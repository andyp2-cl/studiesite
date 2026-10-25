import { Crown, Flame } from "lucide-react";
import { Avatar, headerWash } from "@/components/study/visuals";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { leaderboardAll, leaderboardWeek } from "@/app/mockup/_mock";

const t = strings.leaderboard;

export default async function MockLeaderboard({ searchParams }: PageProps<"/mockup/topplista">) {
  const { period } = await searchParams;
  const all = period === "all";
  const rows = all ? leaderboardAll : leaderboardWeek;
  const leader = rows[0];

  return (
    <main className="relative">
      <div className="absolute inset-x-0 top-0 h-80 md:rounded-t-xl" style={{ background: headerWash("#f59e0b") }} />

      <div className="relative mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-6 pb-8 sm:px-6 md:pt-8">
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>

        <div className="flex gap-2">
          {[
            { href: "?period=week", label: t.week, active: !all },
            { href: "?period=all", label: t.allTime, active: all },
          ].map((tab) => (
            <a
              key={tab.label}
              href={tab.href}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                tab.active ? "bg-foreground text-background" : "bg-foreground/10 hover:bg-foreground/20",
              )}
            >
              {tab.label}
            </a>
          ))}
        </div>

        {/* Leader spotlight */}
        <section className="flex flex-col items-center gap-3 rounded-2xl bg-card/80 p-6 text-center backdrop-blur">
          <Crown className="size-8 fill-amber-400 text-amber-400" />
          <Avatar name={leader.name} color={leader.color} size={88} className="ring-4 ring-amber-400" />
          <div>
            <p className="text-2xl font-extrabold">{leader.name}</p>
            <p className="text-muted-foreground">{leader.xp} XP</p>
          </div>
          {!all && <p className="text-xs text-muted-foreground">{t.resetsIn(2)}</p>}
        </section>

        <ol className="flex flex-col gap-1">
          {rows.map((p, i) => (
            <li
              key={p.name}
              className={cn("flex items-center gap-4 rounded-xl px-4 py-3", p.isMe ? "bg-primary/15" : "bg-card")}
            >
              <span className="w-5 text-lg font-extrabold tabular-nums">{i + 1}</span>
              <Avatar name={p.name} color={p.color} size={44} />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">
                  {p.name} {p.isMe && <span className="font-normal text-muted-foreground">({t.you})</span>}
                </span>
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {strings.profile.level} {p.level}
                  <span className="flex items-center gap-0.5">
                    <Flame className="size-3.5 fill-orange-500 text-orange-500" /> {p.streak}
                  </span>
                </span>
              </span>
              <span className="text-lg font-extrabold tabular-nums">{p.xp}</span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
