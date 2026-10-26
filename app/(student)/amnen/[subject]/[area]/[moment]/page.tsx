import { ChevronDown, Lock } from "lucide-react";
import { notFound } from "next/navigation";
import { MathMarkdown } from "@/components/math/markdown";
import { PageHeader } from "@/components/study/page-header";
import { StartPanel } from "@/components/practice/start-panel";
import { ReadMoment } from "@/components/study/read-moment";
import { SectionLabel, Stars, readable } from "@/components/study/visuals";
import { requireViewProfile } from "@/lib/auth/session";
import { getMoment, getReadMomentExtras } from "@/lib/data/content";
import { getGenerator } from "@/lib/generators";
import type { Level } from "@/lib/generators/types";
import { passCorrectFor, suggestedLevel } from "@/lib/progress";
import { strings } from "@/lib/strings";

const t = strings.moment;

export default async function MomentPage({ params }: PageProps<"/amnen/[subject]/[area]/[moment]">) {
  const { subject: s, area: a, moment: m } = await params;
  const profile = await requireViewProfile();
  const data = await getMoment(s, a, m, profile.id, passCorrectFor(profile));
  if (!data) notFound();

  const { subject, area, moment, intro, deepenings, stars, levelStats } = data;
  const read = moment.mode === "read" ? await getReadMomentExtras(moment.id, area.id, profile.id) : null;
  // Generator moments can always be practised; task-bank moments need published tasks at the level.
  const hasTasks = (level: Level) =>
    data.source === "generator" ? Boolean(getGenerator(data.generatorKey)) : data.taskCounts[level] > 0;

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
        {read ? (
          <ReadMoment
            momentId={moment.id}
            intro={intro}
            readings={data.readings}
            questionCount={data.taskCounts[1]}
            passCorrect={data.passCorrect}
            writingTasks={read.writingTasks}
            sources={read.sources}
            milestones={read.milestones}
          />
        ) : (
          <>
            <section>
              <SectionLabel>{t.levels}</SectionLabel>
              <StartPanel
                momentId={moment.id}
                suggested={suggestedLevel(stars)}
                passCorrect={data.passCorrect}
                levels={{
                  1: { done: stars >= 1, correct: levelStats[1].correct, hasTasks: hasTasks(1) },
                  2: { done: stars >= 2, correct: levelStats[2].correct, hasTasks: hasTasks(2) },
                  3: { done: stars >= 3, correct: levelStats[3].correct, hasTasks: hasTasks(3) },
                }}
              />
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
          </>
        )}
      </div>
    </main>
  );
}