import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { CreateForm } from "@/components/admin/create-form";
import { NodeForm } from "@/components/admin/node-form";
import { SortableList } from "@/components/admin/sortable-list";
import { SectionLabel } from "@/components/study/visuals";
import { getAdminSubject } from "@/lib/admin/data";
import { strings } from "@/lib/strings";

const t = strings.admin;

export default async function AdminSubjectPage({ params }: PageProps<"/admin/innehall/[subjectId]">) {
  const { subjectId } = await params;
  const subject = await getAdminSubject(subjectId);
  if (!subject) notFound();

  return (
    <main>
      <AdminHeader
        crumbs={[{ href: "/admin/innehall", label: t.nav.content }]}
        kicker={t.kinds.subject}
        title={subject.name}
      />
      <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10 sm:px-8">
        <section>
          <SectionLabel>{t.kindsPlural.area}</SectionLabel>
          <SortableList
            kind="area"
            items={subject.areas.map((a) => ({
              id: a.id,
              title: a.name,
              subtitle: t.content.count(a.momentCount, t.kindsPlural.moment.toLowerCase()),
              href: `/admin/innehall/${subject.id}/${a.id}`,
              hidden: a.is_hidden,
              icon: a.icon,
              color: a.color,
            }))}
          />
          <CreateForm kind="area" parentId={subject.id} label={t.content.newArea} />
        </section>

        <section>
          <SectionLabel>{t.form.settings}</SectionLabel>
          <NodeForm kind="subject" id={subject.id} values={subject} afterDeleteHref="/admin/innehall" />
        </section>
      </div>
    </main>
  );
}
