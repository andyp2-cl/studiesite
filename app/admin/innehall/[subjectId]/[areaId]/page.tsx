import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CreateForm } from "@/components/admin/create-form";
import { NodeForm } from "@/components/admin/node-form";
import { SortableList } from "@/components/admin/sortable-list";
import { SectionLabel } from "@/components/study/visuals";
import { getAdminArea } from "@/lib/admin/data";
import { strings } from "@/lib/strings";

const t = strings.admin;

export default async function AdminAreaPage({ params }: PageProps<"/admin/innehall/[subjectId]/[areaId]">) {
  const { subjectId, areaId } = await params;
  const area = await getAdminArea(areaId);
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
        </section>

        <section>
          <SectionLabel>{t.form.settings}</SectionLabel>
          <NodeForm kind="area" id={area.id} values={area} afterDeleteHref={`/admin/innehall/${subjectId}`} />
        </section>
      </div>
    </main>
  );
}
