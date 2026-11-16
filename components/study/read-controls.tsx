"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { markRead } from "@/lib/read/actions";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.read;
const p = strings.practice;

export function MarkReadButton({ momentId, done }: { momentId: string; done: boolean }) {
  const [pending, startTransition] = useTransition();
  if (done) {
    return (
      <p className="flex items-center gap-2 font-mono text-sm text-success">
        <Check className="size-4" /> {t.readDone}
      </p>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await markRead(momentId)))}
      className="flex h-12 w-full items-center justify-center gap-2 bg-primary font-mono text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-fit sm:px-6"
    >
      <Check className="size-4" /> {pending ? t.marking : t.markRead}
    </button>
  );
}

/** Round size and start for the questions of a "Läs och svara" moment (no levels). */
export function QuizStart({ momentId, sizes }: { momentId: string; sizes: number[] }) {
  const [count, setCount] = useState(sizes.includes(10) ? 10 : (sizes.at(-1) ?? 10));
  if (sizes.length === 0) {
    return <p className="text-sm text-muted-foreground">{p.noMore}</p>;
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{p.roundSize}</span>
      <div className="flex border border-border font-mono text-sm" role="radiogroup" aria-label={p.roundSize}>
        {sizes.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={count === n}
            onClick={() => setCount(n)}
            className={cn(
              "min-w-12 border-r border-border px-3 py-2 last:border-r-0",
              count === n ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <Link
        href={`/ova/${momentId}?antal=${count}`}
        className="flex h-10 items-center gap-2 bg-primary px-4 font-mono text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        {t.quizStart} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
