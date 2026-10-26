import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CreateForm } from "@/components/admin/create-form";
import { DraftPanel } from "@/components/admin/draft-panel";
import { NodeForm } from "@/components/admin/node-form";
import { SortableList } from "@/components/admin/sortable-list";
import { SourcesPanel } from "@/components/admin/sources-panel";
import { SectionLabel } from "@/components/study/visuals";
import { getAdminArea, getAreaSources } from "@/lib/admin/data";
import { aiStatus } from "@/lib/ai";
import { strings } from "@/lib/strings";

const t = strings.admin;

// AI drafting (server actions on this page) can take a couple of minutes.
export const maxDuration = 300;

export default async function AdminAreaPage({ params }: PageProps<"/admin/innehall/[subjectId]/[areaId]">) {
  const { subjectId, areaId } = await params;
  const [area, sources, ai] = await Promise.all([getAdminArea(areaId), getAreaSources(areaId), aiStatus("smart")]);
  if (!area || area.subject.id !== subjectId) notFound();

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
        {/* Sources first: they are what moments are created from. */}
        <section>
          <SectionLabel>{t.sources.title}</SectionLabel>
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">{t.sources.help}</p>
          <SourcesPanel areaId={area.id} sources={sources} />
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
              <DraftPanel kind="area" id={area.id} unavailable={ai.available ? null : strings.ai[ai.reason]} />
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
