import { ArrowRight, Coins, Flame, Shuffle } from "lucide-react";
import Link from "next/link";
import { BASE, areas, continueItems, leaderboardWeek, me, stars } from "@/app/mockup/_mock";
import { AreaMark, Avatar, BlockBar, Chip, SectionLabel, Stars, readable } from "@/components/study/visuals";
import { greetingFor } from "@/lib/greeting";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.home;

export default function MockHome() {
  return (
    <main>
      {/* Hero */}
      <header className="bg-dots border-b border-border">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-8 sm:px-8 sm:pt-14">
          <div className="mb-6 flex flex-wrap gap-2">
            <Chip>
              <Flame className="size-3.5 text-orange-500" /> {t.dayStreak(me.streak)}
            </Chip>
            <Chip>
              <Coins className="size-3.5 text-amber-400" /> {me.coins} {strings.profile.stats.coins.toLowerCase()}
            </Chip>
            <Chip>
              {strings.profile.level} {me.level} · {me.levelName}
            </Chip>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            {greetingFor(new Date())}, <span className="font-serif font-normal text-primary italic">{me.name}</span>.
          </h1>

          <div className="mt-8 max-w-md">
            <div className="mb-2 flex items-baseline justify-between font-mono text-xs">
              <span className="tracking-[0.2em] text-muted-foreground uppercase">{t.dailyGoal}</span>
              <span>
                {me.todayXp}/{me.dailyGoal} XP
              </span>
            </div>
            <BlockBar value={me.todayXp} max={me.dailyGoal} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 sm:px-8">
        {/* Continue */}
        <section>
          <SectionLabel>{t.continue}</SectionLabel>
          <div className="hairline-grid grid gap-px sm:grid-cols-2 lg:grid-cols-4">
            {continueItems.map(({ area, moment }) => (
              <Link
                key={moment.slug}
                href={`${BASE}/moment`}
                className="group flex flex-col gap-3 p-4 transition-colors hover:bg-card"
              >
                <span className="font-mono text-[11px] tracking-[0.15em] uppercase" style={{ color: readable(area.color) }}>
                  {area.name}
                </span>
                <span className="font-semibold leading-snug">{moment.name}</span>
                <span className="mt-auto flex items-center justify-between">
                  <Stars count={stars[moment.slug] ?? 0} />
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Daily mix */}
        <section className="relative border border-border">
          <div className="bg-dots absolute inset-y-0 right-0 hidden w-1/3 border-l border-border sm:block" />
          <div className="relative flex flex-col gap-4 p-6 sm:max-w-[66%] sm:p-8">
            <span className="flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              <Shuffle className="size-4" /> {t.dailyMix}
            </span>
            <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.mixTitle}</h3>
            <p className="text-muted-foreground">{t.dailyMixDescription}</p>
            <Link
              href={`${BASE}/uppgift`}
              className="inline-flex w-fit items-center gap-2 bg-primary px-5 py-3 font-mono text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t.startMix} <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Areas */}
        <section>
          <SectionLabel action={{ href: `${BASE}/amnen`, label: t.showAll }}>{t.areas}</SectionLabel>
          <div className="snap-x overflow-x-auto border border-border [scrollbar-width:none]">
            <div className="flex w-max gap-px bg-border">
              {areas.map((area, i) => (
                <Link
                  key={area.slug}
                  href={`${BASE}/omrade`}
                  className="group flex w-40 shrink-0 snap-start flex-col gap-4 bg-background p-4 transition-colors hover:bg-card sm:w-44"
                >
                  <span className="flex items-start justify-between">
                    <AreaMark icon={area.icon} color={area.color} size={44} />
                    <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  </span>
                  <span>
                    <span className="block font-semibold">{area.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{t.moments(area.moments.length)}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Mini leaderboard */}
        <section>
          <SectionLabel action={{ href: `${BASE}/topplista`, label: t.showAll }}>{t.weekTop}</SectionLabel>
          <ol className="border border-border">
            {leaderboardWeek.map((p, i) => (
              <li
                key={p.name}
                className={cn(
                  "flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0",
                  p.isMe && "bg-primary/[0.06]",
                )}
              >
                <span className="w-6 font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <Avatar name={p.name} color={p.color} size={32} />
                <span className="flex-1 font-semibold">
                  {p.name}
                  {p.isMe && <span className="ml-2 font-mono text-xs text-primary">{strings.leaderboard.you}</span>}
                </span>
                <span className="font-mono text-sm tabular-nums">{p.xp} XP</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
