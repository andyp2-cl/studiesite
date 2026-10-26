import { Check, ChevronDown, ExternalLink, PenLine } from "lucide-react";
import { MathMarkdown } from "@/components/math/markdown";
import { MarkReadButton, QuizStart } from "@/components/study/read-controls";
import { SectionLabel } from "@/components/study/visuals";
import type { ReadMilestones } from "@/lib/progress";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.read;

export type ReadMomentProps = {
  momentId: string;
  intro: string;
  readings: { id: string; title: string; body: string }[];
  questionCount: number;
  passCorrect: number;
  writingTasks: { id: string; prompt_md: string; min_chars: number }[];
  sources: { id: string; title: string; url: string | null; content: string | null }[];
  milestones: ReadMilestones;
};

/** Anchor of a reading section, so questions can point to it. */
export const sectionAnchor = (index: number) => `avsnitt-${index + 1}`;

function Steps({ milestones }: { milestones: ReadMilestones }) {
  const steps = [
    { key: "read", label: t.steps.read, done: milestones.read, href: "#las" },
    { key: "quiz", label: t.steps.quiz, done: milestones.quiz, href: "#fragor" },
    { key: "writing", label: t.steps.writing, done: milestones.writing, href: "#skriv" },
  ];
  return (
    <div>
      <div className="hairline-grid grid grid-cols-3 gap-px">
        {steps.map((s, i) => (
          <a key={s.key} href={s.href} className="flex flex-col gap-2 p-3 transition-colors hover:bg-card sm:p-4">
            <span className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
              {s.done && <Check className="size-4 text-success" />}
            </span>
            <span className={cn("font-semibold", s.done && "text-success")}>{s.label}</span>
          </a>
        ))}
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">{t.stepsHelp}</p>
    </div>
  );
}

export function ReadMoment({ momentId, intro, readings, questionCount, passCorrect, writingTasks, sources, milestones }: ReadMomentProps) {
  return (
    <>
      <Steps milestones={milestones} />

      <section id="las" className="scroll-mt-6">
        <SectionLabel>{t.text}</SectionLabel>
        <div className="border border-border">
          {intro && (
            <div className="border-b border-border bg-card/40 p-5 sm:p-7">
              <MathMarkdown>{intro}</MathMarkdown>
            </div>
          )}
          {readings.map((r, i) => (
            <article key={r.id} id={sectionAnchor(i)} className="scroll-mt-6 border-b border-border p-5 last:border-b-0 sm:p-7">
              <h2 className="mb-3 text-xl font-semibold tracking-tight">{r.title}</h2>
              <MathMarkdown className="text-[15px] leading-relaxed">{r.body}</MathMarkdown>
            </article>
          ))}
        </div>
        <div className="mt-4">
          <MarkReadButton momentId={momentId} done={milestones.read} />
        </div>
      </section>

      <section id="fragor" className="scroll-mt-6">
        <SectionLabel>{t.quiz}</SectionLabel>
        {questionCount === 0 ? (
          <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">{t.noQuestions}</p>
        ) : (
          <div className="flex flex-col gap-4 border border-border p-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {milestones.quiz && <Check className="size-4 text-success" />}
              {t.quizHelp(questionCount, passCorrect)}
            </p>
            <QuizStart momentId={momentId} />
          </div>
        )}
      </section>

      {writingTasks.length > 0 && (
        <section id="skriv" className="scroll-mt-6">
          <SectionLabel>{t.writing}</SectionLabel>
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">{t.writingHelp}</p>
          <ul className="border border-border">
            {writingTasks.map((w) => (
              <li key={w.id} className="flex items-start gap-3 border-b border-border p-5 last:border-b-0">
                <PenLine className="mt-1 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <MathMarkdown>{w.prompt_md}</MathMarkdown>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    {t.minChars(w.min_chars)} · {t.writingSoon}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sources.length > 0 && (
        <section>
          <SectionLabel>{t.readMore}</SectionLabel>
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">{t.readMoreHelp}</p>
          <ul className="border border-border">
            {sources.map((s) =>
              s.url ? (
                <li key={s.id} className="border-b border-border last:border-b-0">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-card"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{s.title}</span>
                      <span className="block truncate font-mono text-[11px] text-muted-foreground">{new URL(s.url).hostname}</span>
                    </span>
                    <ExternalLink className="size-4 text-muted-foreground" />
                  </a>
                </li>
              ) : (
                <li key={s.id} className="border-b border-border last:border-b-0">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
                      <span className="flex-1 font-semibold">{s.title}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">{t.showText}</span>
                      <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-5 pb-6 text-[15px] leading-relaxed whitespace-pre-line text-muted-foreground">{s.content}</p>
                  </details>
                </li>
              ),
            )}
          </ul>
        </section>
      )}
    </>
  );
}
