import { AdminHeader } from "@/components/admin/admin-header";
import { NewStudentForm, StudentForm } from "@/components/admin/user-forms";
import { SectionLabel } from "@/components/study/visuals";
import { getSiteSettings, getStudentAccounts } from "@/lib/admin/settings-data";
import { strings } from "@/lib/strings";

const t = strings.admin.users;

export default async function AdminUsersPage() {
  const [students, settings] = await Promise.all([getStudentAccounts(), getSiteSettings()]);

  return (
    <main>
      <AdminHeader kicker={strings.admin.nav.users} title={t.students} intro={t.intro} />
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10 sm:px-8">
        <SectionLabel>{t.students}</SectionLabel>
        {students.length === 0 && <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">{t.none}</p>}
        {students.map((s) => (
          <StudentForm key={s.id} student={s} siteGoal={settings.dailyGoalXp} />
        ))}
        <NewStudentForm />
      </div>
    </main>
  );
}
