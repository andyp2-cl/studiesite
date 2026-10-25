"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BlockBar } from "@/components/study/visuals";
import { LEVELS, type Level } from "@/lib/generators/types";
import { ROUND_SIZES } from "@/lib/practice/ref";
import { REQUIRED_CORRECT } from "@/lib/progress";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.moment;
const p = strings.practice;

export type LevelInfo = { done: boolean; correct: number; hasTasks: boolean };

/** Pick any level and a round of 5 or 10 questions, then start. */
export function StartPanel({
  momentId,
  levels,
  suggested,
}: {
  momentId: string;
  levels: Record<Level, LevelInfo>;
  suggested: Level;
}) {
  const firstAvailable = LEVELS.find((l) => levels[l].hasTasks);
  const [level, setLevel] = useState<Level>(levels[suggested].hasTasks ? suggested : (firstAvailable ?? suggested));
  const [count, setCount] = useState<(typeof ROUND_SIZES)[number]>(10);

  if (!firstAvailable) {
    return <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">{p.noTasks}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="hairline-grid grid grid-cols-3 gap-px" role="radiogroup" aria-label={p.chooseLevel}>
        {LEVELS.map((l) => {
          const info = levels[l];
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={level === l}
              disabled={!info.hasTasks}
              onClick={() => setLevel(l)}
              className={cn(
                "flex flex-col gap-3 p-3 text-left transition-colors hover:bg-card disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent sm:p-4",
                level === l && "bg-primary/[0.07] outline outline-1 -outline-offset-1 outline-primary",
              )}
            >
              <span className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-muted-foreground">0{l}</span>
                {info.done && <Check className="size-4 text-success" />}
              </span>
              <span className="font-semibold">{strings.levels[l]}</span>
              <BlockBar
                value={info.done ? REQUIRED_CORRECT : info.correct}
                max={REQUIRED_CORRECT}
                cells={REQUIRED_CORRECT}
                color={info.done ? "var(--success)" : undefined}
                className={cn(!info.hasTasks && "opacity-40")}
              />
              <span className="font-mono text-[11px] leading-tight text-muted-foreground">
                {!info.hasTasks ? t.noTasksAtLevel : info.done ? t.levelDone : `${info.correct}/${REQUIRED_CORRECT} rätt`}
              </span>
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[11px] text-muted-foreground">{t.levelRule}</p>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">{p.roundSize}</span>
        <div className="flex border border-border font-mono text-sm" role="radiogroup" aria-label={p.roundSize}>
          {ROUND_SIZES.map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={count === n}
              onClick={() => setCount(n)}
              className={cn(
                "w-12 border-r border-border py-2 last:border-r-0",
                count === n ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <Link
        href={`/ova/${momentId}?niva=${level}&antal=${count}`}
        className="flex w-full items-center justify-center gap-2 bg-primary py-3.5 font-mono text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-fit sm:px-8"
      >
        {t.start(strings.levels[level])} · {count} <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
