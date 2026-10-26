"use client";

import { Eye } from "lucide-react";
import { useTransition } from "react";
import { setViewAs } from "@/lib/auth/view-as";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.viewAs;

/** Admin-only bar above the student pages: see them as yourself or as one of the students. */
export function ViewAsBar({ students, current }: { students: { id: string; name: string }[]; current: string | null }) {
  const [pending, startTransition] = useTransition();
  const options = [{ id: null, name: t.me }, ...students];
  const viewing = students.find((s) => s.id === current);

  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:px-8">
      <span className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <Eye className="size-3.5" /> {t.label}
      </span>
      <div className={cn("flex border border-border font-mono text-xs", pending && "opacity-60")}>
        {options.map((o) => (
          <button
            key={o.id ?? "me"}
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => setViewAs(o.id))}
            className={cn(
              "border-r border-border px-3 py-1.5 last:border-r-0",
              o.id === (viewing?.id ?? null) ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.name}
          </button>
        ))}
      </div>
      {viewing && <span className="font-mono text-[11px] text-muted-foreground">{t.note}</span>}
    </div>
  );
}
