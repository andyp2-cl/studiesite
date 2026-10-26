import { BookMarked, ChevronDown } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CreateForm } from "@/components/admin/create-form";
import { DraftPanel } from "@/components/admin/draft-panel";
import { NodeForm } from "@/components/admin/node-form";
import { SortableList } from "@/components/admin/sortable-list";
import { SourceFinder } from "@/components/admin/source-finder";
import { SourcesPanel } from "@/components/admin/sources-panel";
import { SectionLabel } from "@/components/study/visuals";
import { getAdminArea, getAreaSources } from "@/lib/admin/data";
import { getStudentStages } from "@/lib/admin/settings-data";
import { aiStatus } from "@/lib/ai";
import { curriculumFor } from "@/lib/curriculum";
import { strings } from "@/lib/strings";

const t = strings.admin;

// AI drafting (server actions on this page) can take a couple of minutes.
export const maxDuration = 300;

export default async function AdminAreaPage({ params }: PageProps<"/admin/innehall/[subjectId]/[areaId]">) {
  const { subjectId, areaId } = await params;
  const [area, sources, ai] = await Promise.all([getAdminArea(areaId), getAreaSources(areaId), aiStatus("cheap")]);
  if (!area || area.subject.id !== subjectId) notFound();
  const stages = await getStudentStages();
  const curriculum = await curriculumFor(area.subject.name, stages);

  const describe = (m: (typeof area.moments)[number]) =>
    m.source === "generator" && m.generators
      ? t.moment.sourceGenerator
      : t.content.count(m.taskCount, t.moment.tasksWord);

  return (
    <main>
      <AdminHeader
        crumbs={[
          { href: "/admin/innehall", label: t.nav.content },
          { href: `/admin/innehall/${subjectId}`, label: area.subject.name },
        ]}
        kicker={t.kinds.area}
        title={area.name}
      />
      <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10 sm:px-8">
        <details className="group border border-border">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
            <BookMarked className="size-4 text-primary" />
            <span className="flex-1 font-semibold">{t.sources.curriculum}</span>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-4 px-4 pb-5">
            <p className="text-sm text-muted-foreground">
              {t.sources.curriculumHelp(stages.map((s) => t.sources.curriculumStage(s).toLowerCase()).join(" och "))}
            </p>
            {curriculum ? (
              curriculum.map((c) => (
                <div key={c.stage}>
                  <p className="mb-2 font-mono text-[11px] tracking-[0.2em] text-primary uppercase">{t.sources.curriculumStage(c.stage)}</p>
                  <p className="text-sm leading-relaxed whitespace-pre-line">{c.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t.sources.curriculumMissing}</p>
            )}
          </div>
        </details>

        {/* Sources first: they are what moments are created from. */}
        <section>
          <SectionLabel>{t.sources.title}</SectionLabel>
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">{t.sources.help}</p>
          <div className="flex flex-col gap-4">
            <SourcesPanel areaId={area.id} sources={sources} />
            <SourceFinder areaId={area.id} initialQuery={area.name} math={/matem/i.test(area.subject.name)} />
          </div>
        </section>

        <section>
          <SectionLabel>{t.kindsPlural.moment}</SectionLabel>
          <SortableList
            kind="moment"
            items={area.moments.map((m) => ({
              id: m.id,
              title: m.name,
              subtitle: describe(m),
              href: `/admin/innehall/${subjectId}/${areaId}/${m.id}`,
              hidden: m.is_hidden,
            }))}
          />
          <CreateForm kind="moment" parentId={area.id} label={t.content.newMoment} />
          {sources.length > 0 && (
            <div className="mt-6">
              <DraftPanel
                kind="area"
                id={area.id}
                unavailable={ai.available ? null : strings.ai[ai.reason]}
                emptyMoments={area.moments.filter((m) => m.mode === "read" && !m.taskCount && !m.blockCount).length}
              />
            </div>
          )}
        </section>

        <section>
          <SectionLabel>{t.form.settings}</SectionLabel>
          <NodeForm kind="area" id={area.id} values={area} afterDeleteHref={`/admin/innehall/${subjectId}`} />
        </section>
      </div>
    </main>
  );
}
