"use client";

import { ArrowRight, Check, RotateCcw, Star, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { MathMarkdown } from "@/components/math/markdown";
import { Tex } from "@/components/math/tex";
import { BlockBar, Stars, readable } from "@/components/study/visuals";
import type { Level } from "@/lib/generators/types";
import { inputToTex } from "@/lib/math/input-to-tex";
import { nextTask, saveExplanation, submitAnswer, type PublicTask, type SubmitResult } from "@/lib/practice/actions";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.task;
const p = strings.practice;
const ROUND = 10;

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

type Answered = Extract<SubmitResult, { status: "correct" | "wrong" }>;

export function PracticeSession({
  momentId,
  momentName,
  areaName,
  areaColor,
  momentHref,
  firstTask,
}: {
  momentId: string;
  momentName: string;
  areaName: string;
  areaColor: string;
  momentHref: string;
  firstTask: PublicTask;
}) {
  const [task, setTask] = useState(firstTask);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Answered | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [explanationSaved, setExplanationSaved] = useState(false);
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [inARow, setInARow] = useState(0);
  const [clearedLevel, setClearedLevel] = useState<Level | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [pending, startTransition] = useTransition();
  const shownAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const level = task.level;

  function insert(symbol: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    setValue(value.slice(0, start) + symbol + value.slice(end));
    setNotice(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + symbol.length, start + symbol.length);
    });
  }

  function check() {
    if (!value.trim() || pending) return;
    if (!shownAt.current) shownAt.current = performance.now();
    startTransition(async () => {
      const res = await submitAnswer({
        momentId,
        level,
        seed: task.seed,
        answer: value,
        durationMs: Math.round(performance.now() - shownAt.current),
      });
      if (res.status === "error") return setNotice(p.error);
      if (res.status === "retry") return setNotice(res.reason === "not-simplified" ? p.notSimplified : p.unreadable);
      setResult(res);
      setAnswered((n) => n + 1);
      setStars(res.stars);
      if (res.status === "correct") {
        setCorrectCount((n) => n + 1);
        setInARow((n) => n + 1);
      } else {
        setInARow(0);
      }
      if (res.clearedLevel) setClearedLevel(res.clearedLevel);
    });
  }

  function next() {
    if (answered >= ROUND) return setFinished(true);
    startTransition(async () => {
      const upcoming = await nextTask(momentId, level);
      if (!upcoming) return setNotice(p.error);
      setTask(upcoming);
      setValue("");
      setResult(null);
      setNotice(null);
      setExplanation("");
      setExplanationSaved(false);
      shownAt.current = performance.now();
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }

  function save() {
    if (!result?.attemptId || !explanation.trim()) return;
    const attemptId = result.attemptId;
    startTransition(async () => {
      if (await saveExplanation(attemptId, explanation)) setExplanationSaved(true);
      else setNotice(p.error);
    });
  }

  if (finished) {
    const nextLevel = clearedLevel && clearedLevel < 3 ? ((clearedLevel + 1) as Level) : null;
    return (
      <div className="bg-dots flex min-h-dvh items-center justify-center px-4 py-10">
        <div className="w-full max-w-md border border-border bg-background p-6 sm:p-8">
          <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: readable(areaColor) }}>
            {momentName} · {strings.levels[level]}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{p.roundDone}</h1>
          <p className="mt-6 font-mono text-5xl tabular-nums">
            {correctCount}
            <span className="text-muted-foreground">/{ROUND}</span>
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{p.roundScore(correctCount, ROUND)}</p>
          {result && (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              {p.levelStatus(result.level.correct, result.level.attempts)}
            </p>
          )}
          {stars !== null && <Stars count={stars} className="mt-4 block text-2xl" />}

          <div className="mt-8 flex flex-col gap-2">
            {nextLevel && (
              <a
                href={`/ova/${momentId}?niva=${nextLevel}`}
                className="flex h-12 items-center justify-center gap-2 bg-primary font-mono text-sm font-semibold text-primary-foreground"
              >
                {p.nextLevel(strings.levels[nextLevel])} <ArrowRight className="size-4" />
              </a>
            )}
            <a
              href={`/ova/${momentId}?niva=${level}`}
              className={cn(
                "flex h-12 items-center justify-center gap-2 font-mono text-sm font-semibold",
                nextLevel ? "border border-border" : "bg-primary text-primary-foreground",
              )}
            >
              <RotateCcw className="size-4" /> {p.again}
            </a>
            <Link
              href={momentHref}
              className="flex h-12 items-center justify-center border border-border font-mono text-sm text-muted-foreground hover:text-foreground"
            >
              {p.backToMoment}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = result?.status ?? "answering";

  return (
    <div className="flex min-h-dvh w-full flex-col">
      <div className="flex h-14 items-center gap-4 border-b border-border px-4 sm:px-6">
        <Link
          href={momentHref}
          className="grid size-8 place-items-center border border-border text-muted-foreground hover:text-foreground"
          aria-label={t.close}
        >
          <X className="size-4" />
        </Link>
        <BlockBar value={answered} max={ROUND} className="flex-1" />
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {inARow > 1 ? p.inARow(inARow) : `${answered}/${ROUND}`}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pt-8 pb-6 sm:px-6">
        <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: readable(areaColor) }}>
          {areaName} · {strings.levels[level]} · {t.question(Math.min(answered + (result ? 0 : 1), ROUND), ROUND)}
        </p>

        {clearedLevel && result?.clearedLevel && (
          <div className="flex items-start gap-3 border border-amber-400/60 bg-amber-400/[0.08] p-4">
            <Star className="mt-0.5 size-5 shrink-0 fill-amber-400 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">{p.levelCleared(strings.levels[clearedLevel])}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.levelClearedBody}</p>
            </div>
          </div>
        )}

        <div
          key={task.seed}
          className={cn(
            "task-prompt bg-dots relative border border-border px-6 py-10 text-center text-lg",
            status === "correct" && "animate-correct border-success",
            status === "wrong" && "animate-shake border-destructive",
          )}
        >
          <MathMarkdown>{task.prompt}</MathMarkdown>
          {task.figure && (
            <div
              role="img"
              aria-label={task.figure.alt}
              className="mx-auto mt-6 max-w-xs"
              dangerouslySetInnerHTML={{ __html: task.figure.svg }}
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="answer" className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
            {t.answerLabel}
          </label>
          <div
            className={cn(
              "flex h-14 items-center gap-3 border border-input bg-card px-4 focus-within:border-primary",
              result && "opacity-70",
            )}
          >
            <span className="font-mono text-primary">{">"}</span>
            <input
              id="answer"
              ref={inputRef}
              value={value}
              onChange={(e) => {
                if (!shownAt.current) shownAt.current = performance.now();
                setValue(e.target.value);
                setNotice(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && !result && check()}
              disabled={Boolean(result)}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoFocus
              placeholder={t.answerPlaceholder}
              className="min-w-0 flex-1 bg-transparent font-mono text-xl outline-none placeholder:text-base placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex min-h-9 items-center gap-2 font-mono text-xs text-muted-foreground">
            {value && (
              <>
                <span>{t.preview}</span>
                <Tex className="text-lg text-foreground">{inputToTex(value)}</Tex>
              </>
            )}
          </div>
          {notice && (
            <p role="status" className="border border-amber-400/50 bg-amber-400/[0.06] px-4 py-2.5 text-sm text-amber-200">
              {notice}
            </p>
          )}
          {!result && (
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
          )}
        </div>

        {result?.status === "correct" && (
          <div className="flex items-center gap-3 border border-success/60 bg-success/[0.07] px-4 py-3">
            <Check className="size-5 text-success" />
            <span className="flex-1 font-semibold text-success">
              {t.correctMessages[answered % t.correctMessages.length]}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {p.levelStatus(result.level.correct, result.level.attempts)}
            </span>
          </div>
        )}
        {result?.status === "wrong" && (
          <div className="border border-destructive/60">
            <div className="flex flex-wrap items-center gap-3 border-b border-destructive/40 bg-destructive/[0.07] px-4 py-3">
              <X className="size-5 text-destructive" />
              <span className="flex-1 font-semibold text-destructive">{t.wrong}</span>
              <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                {t.rightAnswer} <Tex className="text-lg text-foreground">{result.correctAnswer}</Tex>
              </span>
            </div>
            <div className="p-4">
              <p className="mb-3 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{t.solution}</p>
              <ol className="flex flex-col gap-4">
                {result.solutionSteps.map((s, i) => (
                  <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-2 text-sm">
                    <span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <MathMarkdown>{s.text}</MathMarkdown>
                      {s.tex && (
                        <Tex display className="mt-1 overflow-x-auto text-base">
                          {s.tex}
                        </Tex>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {result && result.attemptId && (
          <div className="flex flex-col gap-2">
            <label htmlFor="explain" className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                {t.explainLabel}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">{t.explainOptional}</span>
            </label>
            <textarea
              id="explain"
              value={explanation}
              onChange={(e) => {
                setExplanation(e.target.value);
                setExplanationSaved(false);
              }}
              rows={3}
              maxLength={2000}
              placeholder={t.explainPlaceholder}
              className="resize-none border border-input bg-card p-3 outline-none focus:border-primary"
            />
            {explanationSaved ? (
              <p className="font-mono text-xs text-success">{p.explanationSaved}</p>
            ) : (
              <button
                type="button"
                onClick={save}
                disabled={!explanation.trim() || pending}
                className="w-fit border border-border px-3 py-2 font-mono text-xs transition-colors hover:border-foreground disabled:opacity-40"
              >
                {p.saveExplanation}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={result ? next : check}
            disabled={pending || (!result && !value.trim())}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 font-mono text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60",
              !result && "bg-primary text-primary-foreground disabled:bg-card disabled:text-muted-foreground",
              status === "correct" && "bg-success text-background",
              status === "wrong" && "bg-foreground text-background",
            )}
          >
            {!result ? t.check : answered >= ROUND ? p.roundDone : status === "correct" ? t.next : t.similar}
            {result && <ArrowRight className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
