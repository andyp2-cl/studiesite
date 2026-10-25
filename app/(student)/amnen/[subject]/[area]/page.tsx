import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { starsFor } from "@/components/study/area-grid";
import { PageHeader } from "@/components/study/page-header";
import { AreaMark, BlockBar, SectionLabel, Stars, readable } from "@/components/study/visuals";
import { requireProfile } from "@/lib/auth/session";
import { getArea, getProgressMap } from "@/lib/data/content";
import { strings } from "@/lib/strings";

export default async function AreaPage({ params }: PageProps<"/amnen/[subject]/[area]">) {
  const { subject: subjectSlug, area: areaSlug } = await params;
  const profile = await requireProfile();
  const [found, progress] = await Promise.all([getArea(subjectSlug, areaSlug), getProgressMap(profile.id)]);
  if (!found) notFound();
  const { subject, area } = found;
  const { got, max } = starsFor(
    area.moments.map((m) => m.id),
    progress,
  );

  return (
    <main>
      <PageHeader
        back={{ href: `/amnen/${subject.slug}`, label: subject.name.toLowerCase() }}
        kicker={strings.area.kind}
        kickerColor={readable(area.color)}
        title={area.name}
        aside={<AreaMark icon={area.icon} color={area.color} size={72} />}
      >
        {area.description && <p className="mt-4 max-w-xl text-muted-foreground">{area.description}</p>}
        <div className="mt-6 max-w-md">
          <div className="mb-2 flex justify-between font-mono text-xs text-muted-foreground">
            <span>{strings.home.moments(area.moments.length)}</span>
            <span>{strings.area.starsTotal(got, max)}</span>
          </div>
          <BlockBar value={got} max={max} cells={Math.max(max, 1)} color={area.color} />
        </div>
      </PageHeader>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <SectionLabel>{strings.moment.kind}</SectionLabel>
        <ol className="border border-border">
          {area.moments.map((m, i) => (
            <li key={m.id} className="border-b border-border last:border-b-0">
              <Link
                href={`/amnen/${subject.slug}/${area.slug}/${m.slug}`}
                className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-card"
              >
                <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block font-semibold">{m.name}</span>
                  {m.description && <span className="block truncate text-sm text-muted-foreground">{m.description}</span>}
                </span>
                <span className="flex items-center gap-3">
                  <Stars count={progress.get(m.id)?.stars ?? 0} />
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
