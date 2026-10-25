"use client";

import { useRef, useState } from "react";
import { MathMarkdown } from "@/components/math/markdown";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { textareaClass } from "./ui";

const t = strings.admin.editor;

// Snippets inserted at the cursor. "|" marks where the cursor ends up.
const SNIPPETS = [
  { label: "B", title: t.bold, text: "**|**" },
  { label: "$x$", title: t.formula, text: "$|$" },
  { label: "a/b", title: t.fraction, text: "$\\frac{|}{}$" },
  { label: "x²", title: t.power, text: "$x^{|}$" },
  { label: "√", title: t.root, text: "$\\sqrt{|}$" },
  { label: "·", title: t.times, text: "\\cdot " },
  { label: "$$", title: t.displayFormula, text: "\n$$\n|\n$$\n" },
  { label: "•", title: t.list, text: "\n- |" },
];

/** Markdown + KaTeX textarea with a live preview (side by side on wide screens, tabs on mobile). */
export function MarkdownEditor({
  id,
  value,
  onChange,
  rows = 10,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");

  function insert(snippet: string) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const [before, after] = snippet.split("|");
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + (after ?? "") + value.slice(end);
    onChange(next);
    const cursor = start + before.length + selected.length;
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        {SNIPPETS.map((s) => (
          <button
            key={s.title}
            type="button"
            title={s.title}
            aria-label={s.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insert(s.text)}
            className="h-8 min-w-8 border border-border px-2 font-mono text-xs hover:border-foreground"
          >
            {s.label}
          </button>
        ))}
        <span className="ml-auto flex border border-border font-mono text-[11px] lg:hidden">
          {(["write", "preview"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setTab(v)}
              className={cn("px-3 py-1.5", tab === v ? "bg-foreground text-background" : "text-muted-foreground")}
            >
              {v === "write" ? t.write : t.preview}
            </button>
          ))}
        </span>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        <textarea
          id={id}
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          spellCheck
          lang="sv"
          className={cn(textareaClass, "resize-y", tab === "preview" && "hidden lg:block")}
        />
        <div
          className={cn(
            "min-h-24 overflow-auto border border-dashed border-border p-4",
            tab === "write" && "hidden lg:block",
          )}
        >
          {value.trim() ? <MathMarkdown>{value}</MathMarkdown> : <p className="text-sm text-muted-foreground">{t.empty}</p>}
        </div>
      </div>
      <p className="font-mono text-[11px] text-muted-foreground">{t.help}</p>
    </div>
  );
}
