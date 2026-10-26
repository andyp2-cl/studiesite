import { ArrowRight, Coins, Flame } from "lucide-react";
import Link from "next/link";
import { AreaMark, BlockBar, Chip, SectionLabel, Stars, readable } from "@/components/study/visuals";
import { requireViewProfile } from "@/lib/auth/session";
import { getContinueItems, getDailyGoal, getProgressMap, getSubjectsWithAreas, getTodayXp } from "@/lib/data/content";
import { profileStreak } from "@/lib/gamification";
import { greetingFor } from "@/lib/greeting";
import { strings } from "@/lib/strings";
import { stockholmDate } from "@/lib/time";

const t = strings.home;

export default async function Home() {
  const profile = await requireViewProfile();
  const [continueItems, subjects, progress, todayXp, dailyGoal] = await Promise.all([
    getContinueItems(profile.id),
    getSubjectsWithAreas(),
    getProgressMap(profile.id),
    getTodayXp(profile.id),
    getDailyGoal(profile),
  ]);

  return (
    <main>
      <header className="bg-dots border-b border-border">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-8 sm:px-8 sm:pt-14">
          <div className="mb-6 flex flex-wrap gap-2">
            <Chip>
              <Flame className="size-3.5 text-orange-500" /> {t.dayStreak(profileStreak(profile, stockholmDate()))}
            </Chip>
            <Chip>
              <Coins className="size-3.5 text-amber-400" /> {profile.coins} {strings.profile.stats.coins.toLowerCase()}
            </Chip>
            <Chip>
              {strings.profile.level} {profile.level}
            </Chip>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            {greetingFor(new Date())},{" "}
            <span className="text-primary">{profile.display_name}</span>.
          </h1>
          <div className="mt-8 max-w-md">
            <div className="mb-2 flex items-baseline justify-between font-mono text-xs">
              <span className="tracking-[0.2em] text-muted-foreground uppercase">{t.dailyGoal}</span>
              <span>
                {todayXp}/{dailyGoal} XP
              </span>
            </div>
            <BlockBar value={todayXp} max={dailyGoal} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 sm:px-8">
        <section>
          <SectionLabel>{t.continue}</SectionLabel>
          {continueItems.length === 0 ? (
            <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">{t.emptyContinue}</p>
          ) : (
            <div className="hairline-grid grid gap-px sm:grid-cols-2 lg:grid-cols-4">
              {continueItems.map((item) => (
                <Link key={item.id} href={item.href} className="group flex flex-col gap-3 p-4 transition-colors hover:bg-card">
                  <span className="font-mono text-[11px] tracking-[0.15em] uppercase" style={{ color: readable(item.area.color) }}>
                    {item.area.name}
                  </span>
                  <span className="leading-snug font-semibold">{item.name}</span>
                  <span className="mt-auto flex items-center justify-between">
                    <Stars count={item.stars} />
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {subjects.map((subject) => (
          <section key={subject.id}>
            <SectionLabel action={{ href: `/amnen/${subject.slug}`, label: t.showAll }}>{subject.name}</SectionLabel>
            {subject.areas.length === 0 ? (
              <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">{t.noAreas}</p>
            ) : (
              <div className="snap-x overflow-x-auto border border-border [scrollbar-width:none]">
                <div className="flex w-max gap-px bg-border">
                  {subject.areas.map((area, i) => (
                    <Link
                      key={area.id}
                      href={`/amnen/${subject.slug}/${area.slug}`}
                      className="group flex w-40 shrink-0 snap-start flex-col gap-4 bg-background p-4 transition-colors hover:bg-card sm:w-44"
                    >
                      <span className="flex items-start justify-between">
                        <AreaMark icon={area.icon} color={area.color} size={44} />
                        <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                      </span>
                      <span>
                        <span className="block font-semibold">{area.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {t.moments(area.momentIds.length)} ·{" "}
                          {area.momentIds.reduce((s, id) => s + (progress.get(id)?.stars ?? 0), 0)} ★
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
