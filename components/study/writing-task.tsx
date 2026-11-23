"use client";

import { LoaderCircle, PenLine, Send, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { MathMarkdown } from "@/components/math/markdown";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { submitWriting } from "@/lib/writing/actions";
import { charCount, MAX_SUBMISSION_CHARS, type Verdict } from "@/lib/writing/feedback";

const t = strings.read.write;

export type WritingTaskProps = {
  id: string;
  prompt_md: string;
  min_chars: number;
  latest: { body: string; verdict: Verdict | null; feedback: string } | null;
};

const verdictStyle: Record<Verdict, string> = {
  approved: "border-success/50 text-success",
  almost: "border-amber-400/50 text-amber-500",
  not_yet: "border-border text-muted-foreground",
};

/** One writing task: write, send for AI feedback, read it and improve. */
export function WritingTask({ task, left: initialLeft }: { task: WritingTaskProps; left: number }) {
  const [text, setText] = useState(task.latest?.body ?? "");
  const [latest, setLatest] = useState(task.latest);
  const [left, setLeft] = useState(initialLeft);
  const [error, setError] = useState<string | null>(null);
  const [newStar, setNewStar] = useState(false);
  const [pending, startTransition] = useTransition();

  const count = charCount(text);
  const enough = count >= task.min_chars;

  function send() {
    setError(null);
    startTransition(async () => {
      const r = await submitWriting(task.id, text);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setLatest({ body: text, verdict: r.verdict, feedback: r.feedback });
      setLeft(r.left);
      setNewStar(r.newStar);
    });
  }

  return (
    <li className="flex flex-col gap-4 border-b border-border p-5 last:border-b-0">
      <div className="flex items-start gap-3">
        <PenLine className="mt-1 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <MathMarkdown>{task.prompt_md}</MathMarkdown>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          maxLength={MAX_SUBMISSION_CHARS}
          placeholder={t.placeholder}
          disabled={pending}
          className="w-full border border-input bg-card p-3 text-[15px] leading-relaxed outline-none focus:border-primary disabled:opacity-60"
        />
        <span className={cn("font-mono text-[11px]", enough ? "text-success" : "text-muted-foreground")}>
          {t.counter(count, task.min_chars)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={send}
          disabled={pending || !enough || left <= 0}
          className="flex h-11 items-center gap-2 bg-primary px-5 font-mono text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          {pending ? t.sending : t.send}
        </button>
        <span className="font-mono text-[11px] text-muted-foreground">{left > 0 ? t.left(left) : t.limitReached}</span>
      </div>

      {error && (
        <p role="alert" className="font-mono text-xs text-destructive">
          {error}
        </p>
      )}

      {latest?.verdict && (
        <div className="flex flex-col gap-2 border border-border bg-card/40 p-4" role="status">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{t.latest}</span>
            <span className={cn("border px-1.5 py-0.5 font-mono text-[10px] uppercase", verdictStyle[latest.verdict])}>
              {t.verdicts[latest.verdict]}
            </span>
          </div>
          <p className="text-[15px] leading-relaxed">{latest.feedback}</p>
          {newStar && (
            <p className="flex items-center gap-2 font-mono text-sm text-success">
              <Star className="size-4 fill-current" /> {t.newStar}
            </p>
          )}
          {latest.verdict !== "approved" && <p className="text-sm text-muted-foreground">{t.improve}</p>}
        </div>
      )}
    </li>
  );
}
