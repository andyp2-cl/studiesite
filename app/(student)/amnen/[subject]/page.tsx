import { notFound } from "next/navigation";
import { AreaGrid } from "@/components/study/area-grid";
import { PageHeader } from "@/components/study/page-header";
import { requireProfile } from "@/lib/auth/session";
import { getProgressMap, getSubjectsWithAreas } from "@/lib/data/content";
import { strings } from "@/lib/strings";

export default async function SubjectPage({ params }: PageProps<"/amnen/[subject]">) {
  const { subject: slug } = await params;
  const profile = await requireProfile();
  const [subjects, progress] = await Promise.all([getSubjectsWithAreas(), getProgressMap(profile.id)]);
  const subject = subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  return (
    <main>
      <PageHeader
        back={{ href: "/amnen", label: strings.nav.subjects.toLowerCase() }}
        kicker={strings.nav.subjects}
        title={subject.name}
      >
        {subject.description && <p className="mt-4 max-w-xl text-muted-foreground">{subject.description}</p>}
      </PageHeader>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <AreaGrid subjectSlug={subject.slug} areas={subject.areas} progress={progress} />
      </div>
    </main>
  );
}
