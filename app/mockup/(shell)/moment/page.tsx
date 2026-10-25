import { Check, ChevronDown, ChevronLeft, Lightbulb, Lock, Play } from "lucide-react";
import Link from "next/link";
import { MathMarkdown } from "@/components/math/markdown";
import { Stars, headerWash } from "@/components/study/visuals";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { BASE, expandSimplify, fractions } from "@/app/mockup/_mock";

const t = strings.moment;

// Mock state: Lätt cleared, Medel in progress (6 of last 10 correct), Svår locked.
const levelState = [
  { level: 1 as const, status: "done" as const },
  { level: 2 as const, status: "active" as const, correct: 6 },
  { level: 3 as const, status: "locked" as const },
];

export default function MockMoment() {
  const area = fractions;
  const moment = expandSimplify;
  const deepenings = [
    ...moment.deepenings.map((d) => ({ ...d, unlocked: true })),
    { title: "Bråk i musik", unlockLevel: 3 as const, body: "", unlocked: false },
  ];

  return (
    <main className="relative">
      <div className="absolute inset-x-0 top-0 h-80 md:rounded-t-xl" style={{ background: headerWash(area.color) }} />

      <div className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-4 pb-8 sm:px-6">
        <Link href={`${BASE}/omrade`} className="inline-grid size-9 place-items-center rounded-full bg-black/40">
          <ChevronLeft className="size-5" />
        </Link>

        <header>
          <p className="text-sm font-semibold">
            {area.name} · {t.kind}
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{moment.name}</h1>
          <Stars count={1} className="mt-3 [&_svg]:size-5" />
        </header>

        {/* Levels */}
        <section>
          <h2 className="mb-3 text-lg font-bold">{t.levels}</h2>
          <div className="grid grid-cols-3 gap-2">
            {levelState.map((s) => {
              const name = strings.levels[s.level];
              return (
                <div
                  key={s.level}
                  className={cn(
                    "flex flex-col gap-2 rounded-xl border p-3 sm:p-4",
                    s.status === "active" && "border-primary bg-primary/10",
                    s.status === "done" && "border-transparent bg-card",
                    s.status === "locked" && "border-dashed border-border bg-transparent text-muted-foreground",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-bold">{name}</span>
                    {s.status === "done" && (
                      <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-4" />
                      </span>
                    )}
                    {s.status === "locked" && <Lock className="size-4" />}
                  </span>
                  {s.status === "active" && (
                    <>
                      <span className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${(s.correct / 8) * 100}%` }} />
                      </span>
                      <span className="text-xs text-muted-foreground">{t.levelProgress(s.correct)}</span>
                    </>
                  )}
                  {s.status === "done" && <span className="text-xs text-muted-foreground">{t.levelDone}</span>}
                  {s.status === "locked" && <span className="text-xs">{t.levelLocked}</span>}
                </div>
              );
            })}
          </div>
          <Link
            href={`${BASE}/uppgift`}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-bold text-primary-foreground transition-transform hover:scale-[1.01] sm:w-auto sm:px-10"
          >
            <Play className="size-4 fill-current" />
            {t.start(strings.levels[2])}
          </Link>
        </section>

        {/* Intro */}
        <section className="rounded-xl bg-card p-5 sm:p-6">
          <h2 className="mb-3 text-lg font-bold">{t.intro}</h2>
          <MathMarkdown>{moment.intro}</MathMarkdown>
        </section>

        {/* Deepenings */}
        <section>
          <h2 className="mb-3 text-lg font-bold">{t.deepenings}</h2>
          <div className="flex flex-col gap-2">
            {deepenings.map((d) =>
              d.unlocked ? (
                <details key={d.title} className="group rounded-xl bg-card" open>
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                    <span className="grid size-9 place-items-center rounded-lg bg-amber-400/15 text-amber-400">
                      <Lightbulb className="size-5" />
                    </span>
                    <span className="flex-1 font-bold">{d.title}</span>
                    <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <MathMarkdown className="px-4 pb-5">{d.body}</MathMarkdown>
                </details>
              ) : (
                <div
                  key={d.title}
                  className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-muted-foreground"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-foreground/5">
                    <Lock className="size-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-bold text-foreground/70">{d.title}</span>
                    <span className="text-xs">{t.unlocksAt(strings.levels[d.unlockLevel])}</span>
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
