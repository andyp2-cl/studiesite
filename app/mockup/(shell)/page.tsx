import { ChevronRight, Coins, Flame, Play, Shuffle } from "lucide-react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { ProgressRing } from "@/components/progress-ring";
import { Avatar, Stars, areaGradient, headerWash } from "@/components/study/visuals";
import { greetingFor } from "@/lib/greeting";
import { strings } from "@/lib/strings";
import { BASE, areas, continueItems, leaderboardWeek, me, stars } from "@/app/mockup/_mock";

const t = strings.home;

export default function MockHome() {
  const goalDone = me.todayXp >= me.dailyGoal;

  return (
    <main className="relative">
      <div className="absolute inset-x-0 top-0 h-72 md:rounded-t-xl" style={{ background: headerWash("#1ed760") }} />

      <div className="relative flex flex-col gap-8 px-4 pt-6 pb-8 sm:px-6 md:pt-8">
        {/* Greeting + chips */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {greetingFor(new Date())}, {me.name}
          </h1>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-bold backdrop-blur">
              <Flame className="size-4 fill-orange-500 text-orange-500" /> {me.streak}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-bold backdrop-blur">
              <Coins className="size-4 text-amber-400" /> {me.coins}
            </span>
          </div>
        </header>

        {/* Daily goal */}
        <section className="flex items-center gap-4 rounded-xl bg-card/80 p-4 backdrop-blur">
          <ProgressRing value={me.todayXp} max={me.dailyGoal} size={64} stroke={7}>
            <span className="text-xs font-bold">
              {Math.round((me.todayXp / me.dailyGoal) * 100)}%
            </span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{goalDone ? t.dailyGoalDone : t.dailyGoal}</p>
            <p className="text-sm text-muted-foreground">
              {me.todayXp} / {me.dailyGoal} XP · {t.dayStreak(me.streak)}
            </p>
          </div>
        </section>

        {/* Continue where you left off – compact Spotify tiles */}
        <section>
          <h2 className="mb-3 text-xl font-bold">{t.continue}</h2>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {continueItems.map(({ area, moment }) => (
              <Link
                key={moment.slug}
                href={`${BASE}/moment`}
                className="group flex items-center gap-3 overflow-hidden rounded-md bg-foreground/10 pr-2 transition-colors hover:bg-foreground/20"
              >
                <span
                  className="grid size-14 shrink-0 place-items-center"
                  style={{ background: areaGradient(area.color) }}
                >
                  <Icon name={area.icon} className="size-6 text-white" />
                </span>
                <span className="min-w-0 py-1">
                  <span className="line-clamp-2 text-[13px] leading-tight font-bold">{moment.name}</span>
                  <Stars count={stars[moment.slug] ?? 0} className="mt-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Daily mix */}
        <section>
          <Link
            href={`${BASE}/uppgift`}
            className="group relative flex items-center gap-4 overflow-hidden rounded-xl p-5 sm:p-6"
            style={{ background: "linear-gradient(120deg, #8400e7 0%, #e8115b 55%, #e8590c 100%)" }}
          >
            <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-black/25 sm:size-20">
              <Shuffle className="size-8 text-white sm:size-10" />
            </span>
            <span className="min-w-0 flex-1 text-white">
              <span className="block text-2xl font-extrabold tracking-tight">{t.dailyMix}</span>
              <span className="mt-1 block text-sm text-white/85">{t.dailyMixDescription}</span>
            </span>
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform group-hover:scale-105">
              <Play className="size-5 fill-current" />
              <span className="sr-only">{t.dailyMixStart}</span>
            </span>
          </Link>
        </section>

        {/* Areas row – horizontal scroll */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-xl font-bold">{t.areas}</h2>
            <Link href={`${BASE}/omrade`} className="text-sm font-bold text-muted-foreground hover:underline">
              {t.showAll}
            </Link>
          </div>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6">
            {areas.map((area) => (
              <Link
                key={area.slug}
                href={`${BASE}/omrade`}
                className="group w-36 shrink-0 snap-start rounded-lg p-2 transition-colors hover:bg-foreground/10 sm:w-44"
              >
                <span
                  className="relative mb-2 grid aspect-square place-items-center overflow-hidden rounded-md shadow-lg"
                  style={{ background: areaGradient(area.color) }}
                >
                  <Icon name={area.icon} className="size-14 text-white/90" />
                  <span className="absolute right-2 bottom-2 grid size-10 translate-y-2 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-xl transition-all group-hover:translate-y-0 group-hover:opacity-100">
                    <Play className="size-4 fill-current" />
                  </span>
                </span>
                <span className="block truncate font-bold">{area.name}</span>
                <span className="block text-sm text-muted-foreground">{t.moments(area.moments.length)}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Mini leaderboard */}
        <section>
          <Link
            href={`${BASE}/topplista`}
            className="flex items-center justify-between rounded-xl bg-card p-4 transition-colors hover:bg-secondary"
          >
            <span className="font-bold">{t.weekTop}</span>
            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
          <ol className="mt-2 flex flex-col gap-1">
            {leaderboardWeek.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 rounded-lg px-4 py-2">
                <span className="w-4 text-sm font-bold text-muted-foreground">{i + 1}</span>
                <Avatar name={p.name} color={p.color} size={32} />
                <span className="flex-1 font-semibold">
                  {p.name}
                  {p.isMe && <span className="ml-1 text-muted-foreground">({strings.leaderboard.you})</span>}
                </span>
                <span className="text-sm font-bold tabular-nums">{p.xp} XP</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
