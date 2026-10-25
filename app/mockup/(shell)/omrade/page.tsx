import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BASE, fractions, stars } from "@/app/mockup/_mock";
import { AreaMark, BlockBar, SectionLabel, Stars, readable } from "@/components/study/visuals";
import { strings } from "@/lib/strings";

export default function MockArea() {
  const area = fractions;
  const got = area.moments.reduce((sum, m) => sum + (stars[m.slug] ?? 0), 0);
  const max = area.moments.length * 3;

  return (
    <main>
      <header className="bg-dots border-b border-border">
        <div className="mx-auto max-w-5xl px-4 pt-6 pb-8 sm:px-8">
          <Link
            href={`${BASE}/amnen`}
            className="mb-8 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> {strings.home.areas.toLowerCase()}
          </Link>
          <div className="flex items-end gap-5">
            <AreaMark icon={area.icon} color={area.color} size={72} />
            <div className="min-w-0">
              <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: readable(area.color) }}>
                {strings.area.kind}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{area.name}</h1>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-muted-foreground">{area.description}</p>
          <div className="mt-6 max-w-md">
            <div className="mb-2 flex justify-between font-mono text-xs text-muted-foreground">
              <span>{strings.home.moments(area.moments.length)}</span>
              <span>{strings.area.starsTotal(got, max)}</span>
            </div>
            <BlockBar value={got} max={max} cells={max} color={area.color} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
        <SectionLabel>Moment</SectionLabel>
        <ol className="border border-border">
          {area.moments.map((m, i) => {
            const s = stars[m.slug] ?? 0;
            return (
              <li key={m.slug} className="border-b border-border last:border-b-0">
                <Link
                  href={`${BASE}/moment`}
                  className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-card"
                >
                  <span className="font-mono text-sm text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{m.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">{m.description}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Stars count={s} />
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
