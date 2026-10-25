"use client";

import { ArrowRight, Check, Flame, MessageSquareText, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Tex } from "@/components/math/tex";
import { BlockBar } from "@/components/study/visuals";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.task;

// Mock task (step 5 generators will produce these).
const task = {
  prompt: "Förkorta bråket så långt det går.",
  tex: String.raw`\frac{12}{18}`,
  answer: "2/3",
  answerTex: String.raw`\frac{2}{3}`,
  steps: [
    { text: "Hitta det största talet som delar både 12 och 18.", tex: String.raw`\text{SGD}(12, 18) = 6` },
    { text: "Dividera täljare och nämnare med 6.", tex: String.raw`\frac{12}{18} = \frac{12 / 6}{18 / 6} = \frac{2}{3}` },
  ],
  xp: 20,
};

const SYMBOLS: { label: string; insert: string; aria: string }[] = [
  { label: "a/b", insert: "/", aria: "bråkstreck" },
  { label: "×", insert: "·", aria: "gånger" },
  { label: "÷", insert: "÷", aria: "delat med" },
  { label: "xⁿ", insert: "^", aria: "upphöjt till" },
  { label: "√", insert: "√(", aria: "roten ur" },
  { label: "π", insert: "π", aria: "pi" },
  { label: "(", insert: "(", aria: "vänster parentes" },
  { label: ")", insert: ")", aria: "höger parentes" },
  { label: "−", insert: "-", aria: "minus" },
];

/** Very small input → TeX preview for the mockup. Step 5 replaces this with mathjs. */
function toTex(input: string): string {
  return input
    .replace(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/g, "\\frac{$1}{$2}")
    .replace(/√\(([^)]*)\)?/g, "\\sqrt{$1}")
    .replace(/[·*×]/g, "\\cdot ")
    .replace(/÷/g, "\\div ")
    .replace(/π/g, "\\pi ")
    .replace(/,/g, "{,}");
}

type Status = "answering" | "correct" | "wrong";

export function TaskDemo({ closeHref }: { closeHref: string }) {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<Status>("answering");
  const [explanation, setExplanation] = useState("");
  const [round, setRound] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = 3 + (status === "answering" ? 0 : 1);

  function insert(symbol: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    setValue(value.slice(0, start) + symbol + value.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  }

  function check() {
    if (!value.trim()) return;
    setStatus(value.replace(/\s/g, "") === task.answer ? "correct" : "wrong");
  }

  function next() {
    setValue("");
    setExplanation("");
    setStatus("answering");
    setRound((r) => r + 1);
  }

  return (
    <div className="flex min-h-dvh w-full flex-col">
      {/* Top bar */}
      <div className="flex h-14 items-center gap-4 border-b border-border px-4 sm:px-6">
        <Link
          href={closeHref}
          className="grid size-8 place-items-center border border-border text-muted-foreground hover:text-foreground"
          aria-label={t.close}
        >
          <X className="size-4" />
        </Link>
        <BlockBar value={done} max={10} className="flex-1" />
        <span className="flex items-center gap-1 font-mono text-xs">
          <Flame className="size-3.5 text-orange-500" /> 3
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pt-8 pb-6 sm:px-6">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
          {t.question(4, 10)} · {strings.levels[2]}
        </p>

        {/* Task */}
        <div
          key={round}
          className={cn(
            "bg-dots relative border border-border px-6 py-10 text-center",
            status === "correct" && "animate-correct border-success",
            status === "wrong" && "animate-shake border-destructive",
          )}
        >
          <p className="mb-5 text-lg font-medium">{task.prompt}</p>
          <Tex display className="text-4xl">
            {task.tex}
          </Tex>
          {status === "correct" && (
            <span className="animate-xp-float pointer-events-none absolute top-3 right-3 bg-success px-2 py-0.5 font-mono text-sm font-bold text-background">
              {t.xp(task.xp)}
            </span>
          )}
        </div>

        {/* Answer */}
        <div className="flex flex-col gap-2">
          <label htmlFor="answer" className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            {t.answerLabel}
          </label>
          <div
            className={cn(
              "flex h-14 items-center gap-3 border border-input bg-card px-4 focus-within:border-primary",
              status !== "answering" && "opacity-70",
            )}
          >
            <span className="font-mono text-primary">{">"}</span>
            <input
              id="answer"
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && status === "answering" && check()}
              disabled={status !== "answering"}
              autoComplete="off"
              placeholder={t.answerPlaceholder}
              className="min-w-0 flex-1 bg-transparent font-mono text-xl outline-none placeholder:text-base placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex min-h-9 items-center gap-2 font-mono text-xs text-muted-foreground">
            {value && (
              <>
                <span>{t.preview}</span>
                <Tex className="text-lg text-foreground">{toTex(value)}</Tex>
              </>
            )}
          </div>

          {status === "answering" && (
            <>
              <div className="hairline-grid grid grid-cols-9 gap-px">
                {SYMBOLS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    aria-label={s.aria}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insert(s.insert)}
                    className="h-11 font-mono text-base transition-colors hover:bg-card active:bg-primary active:text-primary-foreground"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">{strings.mockup.taskHint}</p>
            </>
          )}
        </div>

        {/* Result */}
        {status === "correct" && (
          <div className="flex items-center gap-3 border border-success/60 bg-success/[0.07] px-4 py-3">
            <Check className="size-5 text-success" />
            <span className="flex-1 font-semibold text-success">
              {t.correctMessages[round % t.correctMessages.length]}
            </span>
            <span className="font-mono text-sm text-success">{t.xp(task.xp)}</span>
          </div>
        )}
        {status === "wrong" && (
          <div className="border border-destructive/60">
            <div className="flex items-center gap-3 border-b border-destructive/40 bg-destructive/[0.07] px-4 py-3">
              <X className="size-5 text-destructive" />
              <span className="flex-1 font-semibold text-destructive">{t.wrong}</span>
              <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                {t.rightAnswer} <Tex className="text-lg text-foreground">{task.answerTex}</Tex>
              </span>
            </div>
            <div className="p-4">
              <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                {t.solution}
              </p>
              <ol className="flex flex-col gap-4">
                {task.steps.map((s, i) => (
                  <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-2 text-sm">
                    <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      {s.text}
                      <Tex display className="mt-1 overflow-x-auto text-base">
                        {s.tex}
                      </Tex>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Explanation */}
        {status !== "answering" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="explain" className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                {t.explainLabel}
              </span>
              <span className="font-mono text-[11px] text-primary">{t.explainHint}</span>
            </label>
            <textarea
              id="explain"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              placeholder={t.explainPlaceholder}
              className="resize-none border border-input bg-card p-3 outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={!explanation.trim()}
              className="flex w-fit items-center gap-2 border border-border px-3 py-2 font-mono text-xs transition-colors hover:border-foreground disabled:opacity-40"
            >
              <MessageSquareText className="size-3.5" />
              {t.feedback}
              <span className="text-muted-foreground">· {t.feedbackLeft(5)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={status === "answering" ? check : next}
            disabled={status === "answering" && !value.trim()}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 font-mono text-sm font-semibold transition-opacity hover:opacity-90",
              status === "answering" &&
                "bg-primary text-primary-foreground disabled:bg-card disabled:text-muted-foreground",
              status === "correct" && "bg-success text-background",
              status === "wrong" && "bg-foreground text-background",
            )}
          >
            {status === "answering" ? t.check : status === "correct" ? t.next : t.similar}
            {status !== "answering" && <ArrowRight className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
