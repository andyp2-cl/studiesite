import { ArrowLeft, ArrowRight, Check, ChevronDown, Lock } from "lucide-react";
import Link from "next/link";
import { BASE, expandSimplify, fractions } from "@/app/mockup/_mock";
import { MathMarkdown } from "@/components/math/markdown";
import { BlockBar, SectionLabel, Stars, readable } from "@/components/study/visuals";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.moment;

// Mock state: Lätt cleared, Medel in progress (6 of last 10 correct), Svår locked.
const levelState = [
  { level: 1 as const, status: "done" as const, correct: 8 },
  { level: 2 as const, status: "active" as const, correct: 6 },
  { level: 3 as const, status: "locked" as const, correct: 0 },
];

export default function MockMoment() {
  const area = fractions;
  const moment = expandSimplify;
  const deepenings = [
    ...moment.deepenings.map((d) => ({ ...d, unlocked: true })),
    { title: "Bråk i musik", unlockLevel: 3 as const, body: "", unlocked: false },
  ];

  return (
    <main>
      <header className="bg-dots border-b border-border">
        <div className="mx-auto max-w-3xl px-4 pt-6 pb-8 sm:px-8">
          <Link
            href={`${BASE}/omrade`}
            className="mb-8 inline-flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> {area.name.toLowerCase()}
          </Link>
          <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: readable(area.color) }}>
            {area.name} / {t.kind}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{moment.name}</h1>
          <Stars count={1} className="mt-3 block text-lg" />
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-10 sm:px-8">
        {/* Levels */}
        <section>
          <SectionLabel>{t.levels}</SectionLabel>
          <div className="hairline-grid grid grid-cols-3 gap-px">
            {levelState.map((s) => (
              <div
                key={s.level}
                className={cn(
                  "flex flex-col gap-3 p-3 sm:p-4",
                  s.status === "active" && "bg-primary/[0.07] outline outline-1 -outline-offset-1 outline-primary",
                  s.status === "locked" && "text-muted-foreground",
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">0{s.level}</span>
                  {s.status === "done" && <Check className="size-4 text-success" />}
                  {s.status === "locked" && <Lock className="size-3.5" />}
                </span>
                <span className="font-semibold">{strings.levels[s.level]}</span>
                <BlockBar
                  value={s.correct}
                  max={8}
                  cells={8}
                  color={s.status === "done" ? "var(--success)" : undefined}
                  className={cn(s.status === "locked" && "opacity-40")}
                />
                <span className="font-mono text-[11px] leading-tight text-muted-foreground">
                  {s.status === "done" && t.levelDone}
                  {s.status === "active" && `${s.correct}/8 rätt`}
                  {s.status === "locked" && t.levelLocked}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">{t.levelRule}</p>
          <Link
            href={`${BASE}/uppgift`}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-primary py-3.5 font-mono text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-fit sm:px-8"
          >
            {t.start(strings.levels[2])} <ArrowRight className="size-4" />
          </Link>
        </section>

        {/* Intro */}
        <section>
          <SectionLabel>{t.intro}</SectionLabel>
          <div className="border border-border p-5 sm:p-7">
            <MathMarkdown>{moment.intro}</MathMarkdown>
          </div>
        </section>

        {/* Deepenings */}
        <section>
          <SectionLabel>{t.deepenings}</SectionLabel>
          <div className="border border-border">
            {deepenings.map((d) =>
              d.unlocked ? (
                <details key={d.title} className="group border-b border-border last:border-b-0" open>
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
                    <span className="font-mono text-xs text-primary">{">"}</span>
                    <span className="flex-1 font-semibold">{d.title}</span>
                    <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <MathMarkdown className="px-5 pb-6 text-[15px]">{d.body}</MathMarkdown>
                </details>
              ) : (
                <div
                  key={d.title}
                  className="flex items-center gap-3 border-b border-border px-5 py-4 text-muted-foreground last:border-b-0"
                >
                  <Lock className="size-3.5" />
                  <span className="flex-1 font-semibold">{d.title}</span>
                  <span className="font-mono text-[11px]">{t.unlocksAt(strings.levels[d.unlockLevel])}</span>
                </div>
              ),
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
