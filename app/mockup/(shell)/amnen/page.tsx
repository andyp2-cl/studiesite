import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { BASE, areas, stars } from "@/app/mockup/_mock";
import { AreaMark, BlockBar } from "@/components/study/visuals";
import { strings } from "@/lib/strings";

export default function MockSubjects() {
  return (
    <main>
      <header className="bg-dots border-b border-border">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-8 sm:px-8 sm:pt-14">
          <p className="mb-3 font-mono text-xs tracking-[0.2em] text-primary uppercase">{strings.nav.subjects}</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{strings.home.areas}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <div className="hairline-grid grid gap-px sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, i) => {
            const got = area.moments.reduce((sum, m) => sum + (stars[m.slug] ?? 0), 0);
            const max = area.moments.length * 3;
            return (
              <Link
                key={area.slug}
                href={`${BASE}/omrade`}
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
                  <span className="mt-1 block text-sm text-muted-foreground">{area.description}</span>
                </span>
                <span className="mt-auto">
                  <span className="mb-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
                    <span>{strings.home.moments(area.moments.length)}</span>
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
      </div>
    </main>
  );
}
