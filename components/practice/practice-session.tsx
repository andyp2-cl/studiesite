"use client";

import { ArrowRight, BookOpen, Check, ChevronDown, ExternalLink, Eye, LifeBuoy, Lightbulb, RotateCcw, Sparkles, Star, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { MathMarkdown } from "@/components/math/markdown";
import { Tex } from "@/components/math/tex";
import { BlockBar, Stars, readable } from "@/components/study/visuals";
import { levelNameIndex } from "@/lib/gamification";
import { LEVELS, type Level } from "@/lib/generators/types";
import { inputToTex } from "@/lib/math/input-to-tex";
import type { DailyMixStep } from "@/lib/data/content";
import { getHint, nextTask, saveExplanation, submitAnswer, type PublicTask, type SubmitResult } from "@/lib/practice/actions";
import { refKey, ROUND_SIZES } from "@/lib/practice/ref";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import type { XpAward } from "@/lib/xp";

const t = strings.task;
const p = strings.practice;

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

type Answered = Extract<SubmitResult, { attemptId: string | null }>;
type Outcome = { status: Answered["status"]; usedHint: boolean };

function outcomeLabel(o: Outcome): string {
  if (o.status === "revealed") return p.outcome.revealed;
  if (o.status === "correct") return o.usedHint ? p.outcome.correctWithHint : p.outcome.correct;
  return o.usedHint ? p.outcome.wrongWithHint : p.outcome.wrong;
}

export function PracticeSession({
  firstTask,
  roundSize,
  readings,
  mix,
  ...firstMoment
}: {
  momentId: string;
  momentName: string;
  areaName: string;
  areaColor: string;
  momentHref: string;
  firstTask: PublicTask;
  roundSize: number;
  /** "Läs och svara": the reading text, openable while answering. Null for level moments. */
  readings: { title: string; body: string }[] | null;
  /** Free study sites searched for this moment, offered after two misses in a row. */
  helpLinks: { label: string; url: string }[];
  /** "Dagens mix": one step per task, each with its own moment and level. */
  mix?: DailyMixStep[];
}) {
  const [step, setStep] = useState(0);
  const { momentId, momentName, areaName, areaColor, momentHref, helpLinks } = mix?.[step] ?? firstMoment;
  const [task, setTask] = useState(firstTask);
  const [seen, setSeen] = useState<string[]>([refKey(firstTask.ref)]);
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Answered | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [explanation, setExplanation] = useState("");
  const [explanationSaved, setExplanationSaved] = useState(false);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [inARow, setInARow] = useState(0);
  const [missesInARow, setMissesInARow] = useState(0);
  const [clearedLevel, setClearedLevel] = useState<Level | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const [roundXp, setRoundXp] = useState(0);
  const [news, setNews] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [pending, startTransition] = useTransition();
  const shownAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const level = task.level;
  const answered = outcomes.length;
  const usedHint = hint !== null;

  function startClock() {
    if (!shownAt.current) shownAt.current = performance.now();
  }

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

  function submit(giveUp: boolean) {
    if (pending || result || (!giveUp && !value.trim())) return;
    startClock();
    startTransition(async () => {
      const res = await submitAnswer({
        momentId,
        level,
        ref: task.ref,
        answer: giveUp ? "" : value,
        usedHint,
        giveUp,
        durationMs: Math.round(performance.now() - shownAt.current),
      });
      if (res.status === "error") return setNotice(p.error);
      if (res.status === "retry") return setNotice(p.retry[res.reason]);
      setResult(res);
      setNotice(null);
      setOutcomes((all) => [...all, { status: res.status, usedHint }]);
      setStars(res.stars);
      setInARow((n) => (res.status === "correct" ? n + 1 : 0));
      setMissesInARow((n) => (res.status === "correct" ? 0 : n + 1));
      if (res.clearedLevel) setClearedLevel(res.clearedLevel);
      gainXp(res.xp);
      if (res.quizPassed) setNews((items) => [p.quizPassed, ...items]);
      const cards = res.cards.map((c) => p.newCard(c.name, strings.collection.tier[c.tier].toLowerCase()));
      if (cards.length) setNews((items) => [...cards, ...items]);
    });
  }

  function gainXp(xp: XpAward | null) {
    if (!xp) return;
    setRoundXp((total) => total + xp.xp);
    const items = [
      xp.levelUp && p.levelUp(xp.level, strings.levelNames[levelNameIndex(xp.level)]),
      xp.goalReached && p.goalReached(xp.streak),
    ].filter((n): n is string => Boolean(n));
    if (items.length) setNews(items);
  }

  function showHint() {
    if (hint || pending) return;
    startClock();
    startTransition(async () => {
      const text = await getHint(momentId, level, task.ref);
      if (text) setHint(text);
      else setNotice(p.error);
    });
  }

  function next() {
    if (answered >= roundSize) return setFinished(true);
    const target = mix?.[answered] ?? { momentId, level };
    startTransition(async () => {
      const upcoming = await nextTask(target.momentId, target.level, seen);
      if (!upcoming) return setNotice(p.error);
      if (mix) setStep(answered);
      setTask(upcoming);
      setSeen((keys) => [...keys, refKey(upcoming.ref)]);
      setValue("");
      setResult(null);
      setNotice(null);
      setHint(null);
      setExplanation("");
      setExplanationSaved(false);
      setNews([]);
      shownAt.current = performance.now();
      requestAnimationFrame(() => inputRef.current?.focus());
    });
  }

  function save() {
    if (!result?.attemptId || !explanation.trim()) return;
    const attemptId = result.attemptId;
    startTransition(async () => {
      const res = await saveExplanation(attemptId, explanation);
      if (!res.saved) return setNotice(p.error);
      setExplanationSaved(true);
      gainXp(res.xp);
    });
  }

  if (finished) {
    const count = (fn: (o: Outcome) => boolean) => outcomes.filter(fn).length;
    const correct = count((o) => o.status === "correct");
    const parts = [
      `${correct} ${p.summaryParts.correct}`,
      count((o) => o.status === "correct" && o.usedHint) > 0 &&
        `${count((o) => o.status === "correct" && o.usedHint)} ${p.summaryParts.withHint}`,
      count((o) => o.status === "wrong") > 0 && `${count((o) => o.status === "wrong")} ${p.summaryParts.wrong}`,
      count((o) => o.status === "revealed") > 0 && `${count((o) => o.status === "revealed")} ${p.summaryParts.revealed}`,
    ].filter(Boolean);
    const nextLevel = clearedLevel && clearedLevel < 3 ? ((clearedLevel + 1) as Level) : null;

    return (
      <div className="bg-dots flex min-h-dvh items-center justify-center px-4 py-10">
        <div className="w-full max-w-md border border-border bg-background p-6 sm:p-8">
          <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: readable(areaColor) }}>
            {mix ? strings.home.dailyMix : readings ? momentName : `${momentName} · ${strings.levels[level]}`}
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{p.roundDone}</h1>
          <p className="mt-6 font-mono text-5xl tabular-nums">
            {correct}
            <span className="text-muted-foreground">/{roundSize}</span>
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{parts.join(" · ")}</p>
          {roundXp > 0 && <p className="mt-3 font-mono text-sm font-semibold text-primary">{p.roundXp(roundXp)}</p>}

          <ol className="mt-6 border border-border">
            {outcomes.map((o, i) => (
              <li key={i} className="flex items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0">
                <span className="w-6 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                {o.status === "correct" ? (
                  <Check className="size-4 text-success" />
                ) : o.status === "revealed" ? (
                  <Eye className="size-4 text-amber-300" />
                ) : (
                  <X className="size-4 text-destructive" />
                )}
                <span className="flex-1">{outcomeLabel(o)}</span>
                {o.usedHint && <Lightbulb className="size-3.5 text-amber-300" aria-label={p.usedHintTag} />}
              </li>
            ))}
          </ol>

          {stars !== null && !mix && <Stars count={stars} className="mt-4 block text-2xl" />}

          <div className="mt-8 flex flex-col gap-2">
            {mix ? (
              <Link
                href="/"
                className="flex h-12 items-center justify-center gap-2 bg-primary font-mono text-sm font-semibold text-primary-foreground"
              >
                {p.backHome} <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <MoreRounds
                  momentId={momentId}
                  current={level}
                  suggested={nextLevel ?? level}
                  roundSize={roundSize}
                  withLevels={!readings}
                />
                <Link
                  href={momentHref}
                  className="flex h-12 items-center justify-center border border-border font-mono text-sm text-muted-foreground hover:text-foreground"
                >
                  {p.backToMoment}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const status = result?.status ?? "answering";
  const choiceOptions =
    task.input === "boolean"
      ? [
          { key: "true", label: strings.admin.task.true },
          { key: "false", label: strings.admin.task.false },
        ]
      : (task.choices ?? []).map((c) => ({ key: String(c.index), label: c.text }));

  return (
    <div className="flex min-h-dvh w-full flex-col">
      <div className="flex h-14 items-center gap-4 border-b border-border px-4 sm:px-6">
        <Link
          href={mix ? "/" : momentHref}
          className="grid size-8 place-items-center border border-border text-muted-foreground hover:text-foreground"
          aria-label={t.close}
        >
          <X className="size-4" />
        </Link>
        <BlockBar value={answered} max={roundSize} cells={roundSize} className="flex-1" />
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {inARow > 1 ? p.inARow(inARow) : `${answered}/${roundSize}`}
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pt-8 pb-6 sm:px-6">
        <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: readable(areaColor) }}>
          {areaName} · {mix && `${momentName} · `}
          {!readings && `${strings.levels[level]} · `}
          {t.question(Math.min(answered + (result ? 0 : 1), roundSize), roundSize)}
        </p>

        {news.map((item) => (
          <div key={item} className="flex items-start gap-3 border border-primary/60 bg-primary/[0.08] p-4">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="font-semibold">{item}</p>
          </div>
        ))}

        {clearedLevel && result?.clearedLevel && (
          <div className="flex items-start gap-3 border border-amber-400/60 bg-amber-400/[0.08] p-4">
            <Star className="mt-0.5 size-5 shrink-0 fill-amber-400 text-amber-400" />
            <div>
              <p className="font-semibold text-amber-300">{p.levelCleared(strings.levels[clearedLevel])}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.levelClearedBody}</p>
            </div>
          </div>
        )}

        {readings && <ReadingReference reference={task.reference} readings={readings} key={`ref-${refKey(task.ref)}`} />}

        <div
          key={refKey(task.ref)}
          className={cn(
            "task-prompt bg-dots relative border border-border px-6 py-10 text-center text-lg",
            status === "correct" && "animate-correct border-success",
            status === "wrong" && "animate-shake border-destructive",
            status === "revealed" && "border-amber-400/60",
          )}
        >
          {result?.status === "correct" && result.xp && (
            <span
              aria-live="polite"
              className="pointer-events-none absolute top-3 right-4 animate-xp-float font-mono text-sm font-semibold text-primary"
            >
              {p.xpGained(result.xp.xp)}
            </span>
          )}
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

        {hint && (
          <div className="flex items-start gap-3 border border-amber-400/50 bg-amber-400/[0.05] p-4">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <div className="min-w-0 text-sm">
              <p className="mb-1 font-mono text-[11px] tracking-[0.2em] text-amber-300 uppercase">{p.hintTitle}</p>
              <MathMarkdown>{hint}</MathMarkdown>
            </div>
          </div>
        )}

        {task.input === "choice" || task.input === "boolean" ? (
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{t.chooseAnswer}</p>
            <div className={cn("hairline-grid grid gap-px", task.input === "boolean" && "grid-cols-2")}>
              {choiceOptions.map((option, i) => (
                <button
                  key={option.key}
                  type="button"
                  disabled={Boolean(result)}
                  onClick={() => {
                    startClock();
                    setValue(option.key);
                    setNotice(null);
                  }}
                  aria-pressed={value === option.key}
                  className={cn(
                    "flex min-h-12 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-card disabled:hover:bg-transparent",
                    value === option.key && "bg-primary/[0.08] outline outline-1 -outline-offset-1 outline-primary",
                  )}
                >
                  {task.input === "choice" && (
                    <span className="font-mono text-xs text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                  )}
                  <span className="min-w-0 flex-1">
                    <MathMarkdown>{option.label}</MathMarkdown>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
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
                  startClock();
                  setValue(e.target.value);
                  setNotice(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && submit(false)}
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
            {task.input === "math" && (
              <div className="flex min-h-9 items-center gap-2 font-mono text-xs text-muted-foreground">
                {value && (
                  <>
                    <span>{t.preview}</span>
                    <Tex className="text-lg text-foreground">{inputToTex(value)}</Tex>
                  </>
                )}
              </div>
            )}
            {!result && task.input === "math" && (
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
        )}

        {notice && (
          <p role="status" className="border border-amber-400/50 bg-amber-400/[0.06] px-4 py-2.5 text-sm text-amber-200">
            {notice}
          </p>
        )}

        {/* Help: hint first, then the answer. Read moments show their reference up front instead of a hint. */}
        {!result && (
          <div className="flex flex-wrap gap-2">
            {!readings && (
              <button
                type="button"
                onClick={showHint}
                disabled={pending || usedHint}
                className="flex items-center gap-2 border border-border px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-amber-400/60 hover:text-amber-300 disabled:opacity-40"
              >
                <Lightbulb className="size-3.5" /> {p.hint}
              </button>
            )}
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={pending}
              className="flex items-center gap-2 border border-border px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40"
            >
              <Eye className="size-3.5" /> {p.giveUp}
            </button>
          </div>
        )}

        {result?.status === "correct" && (
          <div className="flex flex-wrap items-center gap-3 border border-success/60 bg-success/[0.07] px-4 py-3">
            <Check className="size-5 text-success" />
            <span className="flex-1 font-semibold text-success">{t.correctMessages[answered % t.correctMessages.length]}</span>
            {usedHint && <span className="font-mono text-[11px] text-amber-300">{p.usedHintTag}</span>}
            <span className="font-mono text-xs text-muted-foreground">
              {p.levelStatus(result.level.correct, result.level.attempts)}
            </span>
          </div>
        )}
        {(result?.status === "wrong" || result?.status === "revealed") && (
          <div className={cn("border", result.status === "wrong" ? "border-destructive/60" : "border-amber-400/60")}>
            <div
              className={cn(
                "flex flex-wrap items-center gap-3 border-b px-4 py-3",
                result.status === "wrong"
                  ? "border-destructive/40 bg-destructive/[0.07]"
                  : "border-amber-400/40 bg-amber-400/[0.06]",
              )}
            >
              {result.status === "wrong" ? <X className="size-5 text-destructive" /> : <Eye className="size-5 text-amber-300" />}
              <span className={cn("flex-1 font-semibold", result.status === "wrong" ? "text-destructive" : "text-amber-300")}>
                {result.status === "wrong" ? t.wrong : p.revealed}
              </span>
              <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                {t.rightAnswer}{" "}
                {result.correctAnswer.tex ? (
                  <Tex className="text-lg text-foreground">{result.correctAnswer.tex}</Tex>
                ) : (
                  <span className="font-sans text-sm text-foreground">{result.correctAnswer.text}</span>
                )}
              </span>
            </div>
            {result.status === "revealed" && <p className="px-4 pt-3 text-sm text-muted-foreground">{p.revealedBody}</p>}
            {result.solutionSteps.length > 0 && (
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
            )}
          </div>
        )}

        {result && result.status !== "correct" && missesInARow >= 2 && (
          <StuckTip read={Boolean(readings)} momentHref={momentHref} momentId={momentId} level={level} links={helpLinks} />
        )}

        {result && result.attemptId && result.status !== "revealed" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="explain" className="flex items-baseline justify-between">
              <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{t.explainLabel}</span>
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
            onClick={result ? next : () => submit(false)}
            disabled={pending || (!result && !value.trim())}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-2 font-mono text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60",
              !result && "bg-primary text-primary-foreground disabled:bg-card disabled:text-muted-foreground",
              status === "correct" && "bg-success text-background",
              (status === "wrong" || status === "revealed") && "bg-foreground text-background",
            )}
          >
            {!result
              ? t.check
              : answered >= roundSize
                ? p.roundDone
                : status === "correct" || (mix && mix[answered].momentId !== momentId)
                  ? t.next
                  : t.similar}
            {result && <ArrowRight className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Svaret finns i avsnittet …" plus the reading text, with that section opened. */
/** After a round: pick any level (easier, same or straight to hard) and a new round of 5 or 10. */
function MoreRounds({
  momentId,
  current,
  suggested,
  roundSize,
  withLevels,
}: {
  momentId: string;
  current: Level;
  suggested: Level;
  roundSize: number;
  withLevels: boolean;
}) {
  const [chosen, setChosen] = useState<Level>(suggested);
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{p.moreTitle}</p>
      {withLevels && (
        <div className="grid grid-cols-3 border border-border font-mono text-xs" role="radiogroup" aria-label={p.chooseLevel}>
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={chosen === l}
              onClick={() => setChosen(l)}
              className={cn(
                "flex h-11 flex-col items-center justify-center border-r border-border last:border-r-0",
                chosen === l ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="font-semibold">{strings.levels[l]}</span>
              {l === current && <span className="text-[10px] opacity-70">{p.sameLevel}</span>}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {ROUND_SIZES.map((n) => (
          <a
            key={n}
            href={`/ova/${momentId}?niva=${chosen}&antal=${n}`}
            className={cn(
              "flex h-12 items-center justify-center gap-2 font-mono text-sm font-semibold",
              n === roundSize ? "bg-primary text-primary-foreground" : "border border-border",
            )}
          >
            {chosen === current ? <RotateCcw className="size-4" /> : <ArrowRight className="size-4" />} {p.newRound(n)}
          </a>
        ))}
      </div>
    </div>
  );
}

/** After two misses in a row: point back to the text, a lower level, or a free explanation elsewhere. */
function StuckTip({
  read,
  momentHref,
  momentId,
  level,
  links,
}: {
  read: boolean;
  momentHref: string;
  momentId: string;
  level: Level;
  links: { label: string; url: string }[];
}) {
  const s = p.stuck;
  return (
    <div className="flex flex-col gap-2 border border-primary/40 bg-primary/[0.05] p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <LifeBuoy className="size-4 text-primary" /> {s.title}
      </p>
      <p className="text-muted-foreground">{read ? s.readAgain : s.math}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
        {read ? (
          <Link href={`${momentHref}#las`} className="text-primary hover:underline">
            {s.toText}
          </Link>
        ) : (
          level > 1 && (
            <Link href={`/ova/${momentId}?niva=${level - 1}`} className="text-primary hover:underline">
              {s.easier(level - 1)}
            </Link>
          )
        )}
        {links.map((l) => (
          <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-primary">
            {s.lookAt(l.label)} <ExternalLink className="size-3" />
          </a>
        ))}
      </div>
    </div>
  );
}

function ReadingReference({ reference, readings }: { reference?: string; readings: { title: string; body: string }[] }) {
  return (
    <div className="flex flex-col gap-2">
      {reference && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" />
          <MathMarkdown className="[&_p]:m-0">{reference}</MathMarkdown>
        </div>
      )}
      <details className="group border border-border">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 font-mono text-xs text-muted-foreground hover:text-foreground">
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" /> {strings.read.showText}
        </summary>
        <div className="max-h-[50vh] overflow-auto border-t border-border">
          {readings.map((r) => (
            <details key={r.title} open={Boolean(reference?.includes(r.title))} className="border-b border-border last:border-b-0">
              <summary className="cursor-pointer list-none px-4 py-3 font-semibold">{r.title}</summary>
              <MathMarkdown className="px-4 pb-5 text-[15px] leading-relaxed">{r.body}</MathMarkdown>
            </details>
          ))}
        </div>
      </details>
    </div>
  );
}
