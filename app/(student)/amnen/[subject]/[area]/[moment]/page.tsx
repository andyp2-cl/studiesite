import { ArrowRight, Check, ChevronDown, Lock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MathMarkdown } from "@/components/math/markdown";
import { PageHeader } from "@/components/study/page-header";
import { BlockBar, SectionLabel, Stars, readable } from "@/components/study/visuals";
import { requireProfile } from "@/lib/auth/session";
import { getMoment } from "@/lib/data/content";
import { getGenerator } from "@/lib/generators";
import { LEVELS, type Level } from "@/lib/generators/types";
import { isLevelUnlocked, REQUIRED_CORRECT, suggestedLevel } from "@/lib/progress";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.moment;

export default async function MomentPage({ params }: PageProps<"/amnen/[subject]/[area]/[moment]">) {
  const { subject: s, area: a, moment: m } = await params;
  const profile = await requireProfile();
  const data = await getMoment(s, a, m, profile.id);
  if (!data) notFound();

  const { subject, area, moment, intro, deepenings, stars, levelStats } = data;
  const startLevel = suggestedLevel(stars);
  // Generator moments can always be practised; task-bank moments need published tasks at the level.
  const hasTasks = (level: Level) =>
    data.source === "generator" ? Boolean(getGenerator(data.generatorKey)) : data.taskCounts[level] > 0;
  const canPractise = hasTasks(startLevel);
  const practiseHref = (level: number) => `/ova/${moment.id}?niva=${level}`;

  return (
    <main>
      <PageHeader
        back={{ href: `/amnen/${subject.slug}/${area.slug}`, label: area.name.toLowerCase() }}
        kicker={`${area.name} / ${t.kind}`}
        kickerColor={readable(area.color)}
        title={moment.name}
        width="max-w-3xl"
      >
        <Stars count={stars} className="mt-3 block text-lg" />
      </PageHeader>

      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-10 sm:px-8">
        <section>
          <SectionLabel>{t.levels}</SectionLabel>
          <div className="hairline-grid grid grid-cols-3 gap-px">
            {LEVELS.map((level) => {
              const done = stars >= level;
              const unlocked = isLevelUnlocked(level, stars);
              const stats = levelStats[level];
              const card = (
                <>
                  <span className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">0{level}</span>
                    {done && <Check className="size-4 text-success" />}
                    {!unlocked && <Lock className="size-3.5" />}
                  </span>
                  <span className="font-semibold">{strings.levels[level]}</span>
                  <BlockBar
                    value={done ? REQUIRED_CORRECT : stats.correct}
                    max={REQUIRED_CORRECT}
                    cells={REQUIRED_CORRECT}
                    color={done ? "var(--success)" : undefined}
                    className={cn(!unlocked && "opacity-40")}
                  />
                  <span className="font-mono text-[11px] leading-tight text-muted-foreground">
                    {done
                      ? t.levelDone
                      : !unlocked
                        ? t.levelLocked
                        : hasTasks(level)
                          ? `${stats.correct}/${REQUIRED_CORRECT} rätt`
                          : t.noTasksAtLevel}
                  </span>
                </>
              );
              const className = cn(
                "flex flex-col gap-3 p-3 sm:p-4",
                level === startLevel && !done && "bg-primary/[0.07] outline outline-1 -outline-offset-1 outline-primary",
                !unlocked && "text-muted-foreground",
              );
              return unlocked && hasTasks(level) ? (
                <Link key={level} href={practiseHref(level)} className={cn(className, "transition-colors hover:bg-card")}>
                  {card}
                </Link>
              ) : (
                <div key={level} className={className}>
                  {card}
                </div>
              );
            })}
          </div>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">{t.levelRule}</p>
          {canPractise ? (
            <Link
              href={practiseHref(startLevel)}
              className="mt-6 flex w-full items-center justify-center gap-2 bg-primary py-3.5 font-mono text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-fit sm:px-8"
            >
              {t.start(strings.levels[startLevel])} <ArrowRight className="size-4" />
            </Link>
          ) : (
            <p className="mt-6 border border-dashed border-border p-4 text-sm text-muted-foreground">
              {strings.practice.noTasks}
            </p>
          )}
        </section>

        {intro && (
          <section>
            <SectionLabel>{t.intro}</SectionLabel>
            <div className="border border-border p-5 sm:p-7">
              <MathMarkdown>{intro}</MathMarkdown>
            </div>
          </section>
        )}

        {deepenings.length > 0 && (
          <section>
            <SectionLabel>{t.deepenings}</SectionLabel>
            <div className="border border-border">
              {deepenings.map((d) =>
                d.body !== null ? (
                  <details key={d.id} className="group border-b border-border last:border-b-0">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
                      <span className="font-mono text-xs text-primary">{">"}</span>
                      <span className="flex-1 font-semibold">{d.title}</span>
                      <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <MathMarkdown className="px-5 pb-6 text-[15px]">{d.body}</MathMarkdown>
                  </details>
                ) : (
                  <div
                    key={d.id}
                    className="flex flex-col gap-1 border-b border-border px-5 py-4 text-muted-foreground last:border-b-0 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <span className="flex flex-1 items-center gap-3">
                      <Lock className="size-3.5 shrink-0" />
                      <span className="font-semibold">{d.title}</span>
                    </span>
                    <span className="pl-6 font-mono text-[11px] sm:pl-0">{t.unlocksAt(strings.levels[d.unlockLevel])}</span>
                  </div>
                ),
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
