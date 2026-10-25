"use client";

import { Check, Flame, MessageSquareText, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Tex } from "@/components/math/tex";
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
    const next = value.slice(0, start) + symbol + value.slice(end);
    setValue(next);
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
      {/* Top bar: close, progress, streak-in-a-row */}
      <div className="flex items-center gap-3 px-4 pt-4 sm:px-6">
        <Link href={closeHref} className="grid size-9 place-items-center rounded-full hover:bg-foreground/10" aria-label={t.close}>
          <X className="size-5" />
        </Link>
        <div className="flex flex-1 gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className={cn("h-2 flex-1 rounded-full bg-foreground/10 transition-colors", i < done && "bg-primary")}
            />
          ))}
        </div>
        <span className="flex items-center gap-1 text-sm font-bold">
          <Flame className="size-4 fill-orange-500 text-orange-500" /> 3
        </span>
      </div>

      {/* Task card */}
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pt-8 pb-4 sm:px-6">
        <p className="text-sm font-semibold text-muted-foreground">
          {t.question(4, 10)} · {strings.levels[2]}
        </p>

        <div
          key={round}
          className={cn(
            "relative rounded-2xl bg-card p-6 text-center sm:p-8",
            status === "correct" && "animate-correct ring-2 ring-primary",
            status === "wrong" && "animate-shake ring-2 ring-destructive",
          )}
        >
          <p className="mb-4 text-lg font-semibold">{task.prompt}</p>
          <Tex display className="text-3xl sm:text-4xl">
            {task.tex}
          </Tex>
          {status === "correct" && (
            <span className="animate-xp-float pointer-events-none absolute top-4 right-4 rounded-full bg-primary px-3 py-1 text-sm font-extrabold text-primary-foreground">
              {t.xp(task.xp)}
            </span>
          )}
        </div>

        {/* Answer input */}
        <div className="flex flex-col gap-2">
          <label htmlFor="answer" className="text-sm font-semibold">
            {t.answerLabel}
          </label>
          <input
            id="answer"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && status === "answering" && check()}
            disabled={status !== "answering"}
            inputMode="text"
            autoComplete="off"
            placeholder={t.answerPlaceholder}
            className="h-14 rounded-xl border border-input bg-secondary px-4 text-xl font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-70"
          />
          <div className="flex min-h-10 items-center gap-2 text-sm text-muted-foreground">
            {value && (
              <>
                <span>{t.preview}</span>
                <Tex className="text-lg text-foreground">{toTex(value)}</Tex>
              </>
            )}
          </div>

          {/* Symbol row – the important bit on mobile */}
          {status === "answering" && (
            <div className="grid grid-cols-9 gap-1">
              {SYMBOLS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  aria-label={s.aria}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insert(s.insert)}
                  className="h-11 rounded-lg bg-secondary text-lg font-semibold transition-colors hover:bg-foreground/15 active:scale-95"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {status === "answering" && <p className="text-xs text-muted-foreground">{strings.mockup.taskHint}</p>}
        </div>

        {/* Result – in the page flow so nothing is covered */}
        {status === "correct" && (
          <p className="flex items-center gap-2 rounded-xl bg-primary/15 p-4 text-lg font-extrabold text-primary">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-5" />
            </span>
            {t.correctMessages[round % t.correctMessages.length]}
            <Sparkles className="size-5" />
            <span className="ml-auto text-sm">{t.xp(task.xp)}</span>
          </p>
        )}
        {status === "wrong" && (
          <div className="flex flex-col gap-3 rounded-xl bg-destructive/10 p-4">
            <p className="flex items-center gap-2 text-lg font-extrabold text-destructive">
              <span className="grid size-8 place-items-center rounded-full bg-destructive text-white">
                <X className="size-5" />
              </span>
              {t.wrong}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t.rightAnswer}</span>
              <Tex className="text-xl">{task.answerTex}</Tex>
            </p>
            <div className="rounded-lg bg-background/60 p-3">
              <p className="text-sm font-bold">{t.solution}</p>
              <ol className="mt-2 flex flex-col gap-3">
                {task.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground/10 text-xs font-bold">
                      {i + 1}
                    </span>
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

        {/* Explanation – shown after answering */}
        {status !== "answering" && (
          <div className="flex flex-col gap-2 rounded-xl bg-card p-4">
            <label htmlFor="explain" className="flex items-baseline justify-between text-sm font-semibold">
              {t.explainLabel}
              <span className="text-xs font-normal text-muted-foreground">{t.explainHint}</span>
            </label>
            <textarea
              id="explain"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              placeholder={t.explainPlaceholder}
              className="resize-none rounded-lg border border-input bg-secondary p-3 outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled={!explanation.trim()}
              className="flex items-center gap-2 self-start rounded-full border border-border px-4 py-2 text-sm font-bold transition-colors hover:border-foreground disabled:opacity-40"
            >
              <MessageSquareText className="size-4" />
              {t.feedback}
              <span className="font-normal text-muted-foreground">· {t.feedbackLeft(5)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Sticky action bar: just the main button, always reachable by thumb */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
          {status === "answering" ? (
            <button
              type="button"
              onClick={check}
              disabled={!value.trim()}
              className="h-12 w-full rounded-full bg-primary font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:bg-secondary disabled:text-muted-foreground"
            >
              {t.check}
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className={cn(
                "h-12 w-full rounded-full font-bold transition-transform hover:scale-[1.01]",
                status === "correct" ? "bg-primary text-primary-foreground" : "bg-foreground text-background",
              )}
            >
              {status === "correct" ? t.next : t.similar}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}