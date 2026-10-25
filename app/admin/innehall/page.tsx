import { AdminHeader } from "@/components/admin/admin-header";
import { CreateForm } from "@/components/admin/create-form";
import { SortableList } from "@/components/admin/sortable-list";
import { SectionLabel } from "@/components/study/visuals";
import { getAdminSubjects } from "@/lib/admin/data";
import { strings } from "@/lib/strings";

const t = strings.admin;

export default async function AdminContentPage() {
  const subjects = await getAdminSubjects();

  return (
    <main>
      <AdminHeader kicker={t.nav.content} title={t.kindsPlural.subject} intro={t.content.intro} />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
        <SectionLabel>{t.kindsPlural.subject}</SectionLabel>
        <SortableList
          kind="subject"
          items={subjects.map((s) => ({
            id: s.id,
            title: s.name,
            subtitle: t.content.count(s.areaCount, t.kindsPlural.area.toLowerCase()),
            href: `/admin/innehall/${s.id}`,
            hidden: s.is_hidden,
            icon: s.icon,
            color: s.color,
          }))}
        />
        <CreateForm kind="subject" parentId={null} label={t.content.newSubject} />
      </div>
    </main>
  );
}
