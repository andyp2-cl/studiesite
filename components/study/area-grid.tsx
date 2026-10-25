import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { AreaSummary, MomentProgress } from "@/lib/data/content";
import { strings } from "@/lib/strings";
import { AreaMark, BlockBar } from "./visuals";

export function starsFor(momentIds: string[], progress: Map<string, MomentProgress>) {
  const got = momentIds.reduce((sum, id) => sum + (progress.get(id)?.stars ?? 0), 0);
  return { got, max: momentIds.length * 3 };
}

/** Hairline grid of area cards with star progress. */
export function AreaGrid({
  subjectSlug,
  areas,
  progress,
}: {
  subjectSlug: string;
  areas: AreaSummary[];
  progress: Map<string, MomentProgress>;
}) {
  return (
    <div className="hairline-grid grid gap-px sm:grid-cols-2 lg:grid-cols-3">
      {areas.map((area, i) => {
        const { got, max } = starsFor(area.momentIds, progress);
        return (
          <Link
            key={area.id}
            href={`/amnen/${subjectSlug}/${area.slug}`}
            className="group flex flex-col gap-5 p-5 transition-colors hover:bg-card"
          >
            <span className="flex items-start justify-between">
              <AreaMark icon={area.icon} color={area.color} size={44} />
              <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            </span>
            <span>
              <span className="flex items-center justify-between text-lg font-semibold">
                {area.name}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </span>
              {area.description && <span className="mt-1 block text-sm text-muted-foreground">{area.description}</span>}
            </span>
            <span className="mt-auto">
              <span className="mb-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
                <span>{strings.home.moments(area.momentIds.length)}</span>
                <span>
                  {got}/{max} ★
                </span>
              </span>
              <BlockBar value={got} max={max} cells={12} color={area.color} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
