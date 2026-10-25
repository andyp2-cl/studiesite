import { ChevronLeft, Play } from "lucide-react";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { ProgressRing } from "@/components/progress-ring";
import { Stars, areaGradient, headerWash } from "@/components/study/visuals";
import { strings } from "@/lib/strings";
import { BASE, fractions, stars } from "@/app/mockup/_mock";

export default function MockArea() {
  const area = fractions;
  const got = area.moments.reduce((sum, m) => sum + (stars[m.slug] ?? 0), 0);
  const max = area.moments.length * 3;

  return (
    <main className="relative">
      <div className="absolute inset-x-0 top-0 h-96 md:rounded-t-xl" style={{ background: headerWash(area.color) }} />

      <div className="relative px-4 pt-4 pb-8 sm:px-6">
        <Link href={`${BASE}/`} className="mb-4 inline-grid size-9 place-items-center rounded-full bg-black/40">
          <ChevronLeft className="size-5" />
        </Link>

        <header className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <span
            className="grid size-40 shrink-0 place-items-center self-center rounded-lg shadow-2xl sm:size-48 sm:self-auto"
            style={{ background: areaGradient(area.color) }}
          >
            <Icon name={area.icon} className="size-20 text-white" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{strings.area.kind}</p>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">{area.name}</h1>
            <p className="mt-2 text-muted-foreground">{area.description}</p>
            <p className="mt-1 text-sm font-semibold">
              {strings.home.moments(area.moments.length)} · {strings.area.starsTotal(got, max)}
            </p>
          </div>
        </header>

        <div className="my-6 flex items-center gap-4">
          <Link
            href={`${BASE}/moment`}
            className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105"
          >
            <Play className="size-6 fill-current" />
          </Link>
          <ProgressRing value={got} max={max} size={40} stroke={4} />
        </div>

        <ol className="flex flex-col">
          {area.moments.map((m, i) => {
            const s = stars[m.slug] ?? 0;
            return (
              <li key={m.slug}>
                <Link
                  href={`${BASE}/moment`}
                  className="group grid grid-cols-[1.5rem_auto_1fr_auto] items-center gap-4 rounded-md px-2 py-3 transition-colors hover:bg-foreground/10 sm:px-4"
                >
                  <span className="text-center text-muted-foreground tabular-nums group-hover:hidden">{i + 1}</span>
                  <Play className="hidden size-4 fill-current group-hover:block" />
                  <ProgressRing value={s} max={3} size={44} stroke={4} color={area.color}>
                    <span className="text-xs font-bold">{s}/3</span>
                  </ProgressRing>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{m.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">{m.description}</span>
                  </span>
                  <Stars count={s} className="hidden sm:inline-flex" />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
