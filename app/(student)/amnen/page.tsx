import { AreaGrid } from "@/components/study/area-grid";
import { PageHeader } from "@/components/study/page-header";
import { SectionLabel } from "@/components/study/visuals";
import { requireProfile } from "@/lib/auth/session";
import { getProgressMap, getSubjectsWithAreas } from "@/lib/data/content";
import { strings } from "@/lib/strings";

export default async function SubjectsPage() {
  const profile = await requireProfile();
  const [subjects, progress] = await Promise.all([getSubjectsWithAreas(), getProgressMap(profile.id)]);

  return (
    <main>
      <PageHeader kicker={strings.nav.subjects} title={subjects.length === 1 ? subjects[0].name : strings.nav.subjects} />
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-10 sm:px-8">
        {subjects.map((subject) => (
          <section key={subject.id}>
            {subjects.length > 1 && <SectionLabel>{subject.name}</SectionLabel>}
            <AreaGrid subjectSlug={subject.slug} areas={subject.areas} progress={progress} />
          </section>
        ))}
      </div>
    </main>
  );
}
