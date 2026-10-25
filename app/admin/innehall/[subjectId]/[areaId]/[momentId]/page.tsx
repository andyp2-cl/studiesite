import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { DeepeningsEditor, IntroEditor, SourcePanel } from "@/components/admin/moment-editors";
import { NodeForm } from "@/components/admin/node-form";
import { MathMarkdown } from "@/components/math/markdown";
import { SectionLabel } from "@/components/study/visuals";
import { getAdminMoment } from "@/lib/admin/data";
import { generatorKeys } from "@/lib/generators";
import { LEVELS } from "@/lib/generators/types";
import { mathSubject } from "@/lib/seed/math";
import { strings } from "@/lib/strings";
import type { TaskType } from "@/lib/tasks/answers";
import { cn } from "@/lib/utils";

const t = strings.admin;

/** Human label for a generator: the seeded moment that uses it. */
function generatorLabel(key: string): string {
  for (const area of mathSubject.areas) {
    const moment = area.moments.find((m) => m.generatorKey === key);
    if (moment) return `${area.name} – ${moment.name}`;
  }
  return key;
}

export default async function AdminMomentPage({ params }: PageProps<"/admin/innehall/[subjectId]/[areaId]/[momentId]">) {
  const { subjectId, areaId, momentId } = await params;
  const moment = await getAdminMoment(momentId);
  if (!moment || moment.area.id !== areaId || moment.subject.id !== subjectId) notFound();

  const base = `/admin/innehall/${subjectId}/${areaId}/${momentId}`;
  const usesGenerator = moment.source === "generator";

  return (
    <main>
      <AdminHeader
        crumbs={[
          { href: "/admin/innehall", label: t.nav.content },
          { href: `/admin/innehall/${subjectId}`, label: moment.subject.name },
          { href: `/admin/innehall/${subjectId}/${areaId}`, label: moment.area.name },
        ]}
        kicker={t.kinds.moment}
        title={moment.name}
      />
      <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10 sm:px-8">
        <section>
          <SectionLabel>{t.moment.source}</SectionLabel>
          <SourcePanel
            momentId={moment.id}
            source={moment.source}
            generatorKey={moment.generatorKey}
            options={generatorKeys.map((key) => ({ key, label: generatorLabel(key) }))}
          />
        </section>

        <section>
          <SectionLabel>{t.moment.tasks}</SectionLabel>
          {usesGenerator && moment.tasks.length > 0 && (
            <p className="mb-3 border border-amber-400/40 bg-amber-400/[0.05] p-3 text-sm text-amber-200">{t.task.notUsed}</p>
          )}
          <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted-foreground">
            {LEVELS.map((level) => {
              const atLevel = moment.tasks.filter((x) => x.level === level);
              return (
                <span key={level}>
                  {t.task.countByLevel(strings.levels[level], atLevel.filter((x) => x.status === "published").length, atLevel.length)}
                </span>
              );
            })}
          </p>
          {moment.tasks.length === 0 ? (
            <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">{t.task.empty}</p>
          ) : (
            <ul className="border border-border">
              {moment.tasks.map((task) => (
                <li key={task.id} className="border-b border-border last:border-b-0">
                  <Link href={`${base}/uppgift/${task.id}`} className="group flex items-center gap-4 px-4 py-3 hover:bg-card">
                    <span className="w-12 shrink-0 font-mono text-[11px] text-muted-foreground">{strings.levels[task.level as 1 | 2 | 3]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block max-h-12 overflow-hidden text-sm [&_p]:inline">
                        <MathMarkdown>{task.prompt_md}</MathMarkdown>
                      </span>
                      <span className="font-mono text-[11px] text-muted-foreground">{t.task.types[task.type as TaskType]}</span>
                    </span>
                    <span
                      className={cn(
                        "border px-1.5 py-0.5 font-mono text-[10px] uppercase",
                        task.status === "published" ? "border-success/50 text-success" : "border-border text-muted-foreground",
                      )}
                    >
                      {task.status === "published" ? t.task.publishedShort : t.task.draft}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`${base}/uppgift/ny`}
            className="mt-3 inline-flex h-10 items-center gap-2 bg-primary px-4 font-mono text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="size-4" /> {t.task.newTask}
          </Link>
        </section>

        <section>
          <SectionLabel>{t.moment.intro}</SectionLabel>
          <IntroEditor momentId={moment.id} initial={moment.intro} />
        </section>

        <section>
          <SectionLabel>{t.moment.deepenings}</SectionLabel>
          <DeepeningsEditor momentId={moment.id} initial={moment.deepenings} />
        </section>

        <section>
          <SectionLabel>{t.form.settings}</SectionLabel>
          <NodeForm kind="moment" id={moment.id} values={moment} afterDeleteHref={`/admin/innehall/${subjectId}/${areaId}`} />
        </section>
      </div>
    </main>
  );
}
