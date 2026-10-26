"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { draftAngles, draftMoment, fillArea, type DraftResult } from "@/lib/drafts/actions";
import { strings } from "@/lib/strings";
import { Button, Message } from "./ui";

const t = strings.admin.drafts;

/**
 * "Skapa moment med frågor" on an area (split into moments, then fill and
 * publish them all) or "Skapa utkast från källor" on a moment. `emptyMoments`:
 * moments in the area with no content yet, which can be filled on their own.
 * `unavailable` is the reason AI cannot be used right now (no key, budget used up).
 */
export function DraftPanel({
  kind,
  id,
  unavailable,
  hasContent = false,
  emptyMoments = 0,
}: {
  kind: "area" | "moment";
  id: string;
  unavailable: string | null;
  hasContent?: boolean;
  emptyMoments?: number;
}) {
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<DraftResult[]>([]);

  function run(task: () => Promise<DraftResult[]>) {
    setResults([]);
    startTransition(async () => setResults(await task()));
  }

  // Two requests, so each stays well within the server's time limit.
  const createAndFill = async () => {
    const angles = await draftAngles(id);
    return angles.ok ? [angles, await fillArea(id)] : [angles];
  };

  const disabled = pending || unavailable !== null;
  const area = kind === "area";

  return (
    <div className="flex flex-col gap-3 border border-dashed border-border p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Sparkles className="size-4 text-primary" /> {area ? t.anglesTitle : t.momentTitle}
      </p>
      <p className="text-sm text-muted-foreground">{area ? t.anglesHelp : t.momentHelp}</p>
      {!area && hasContent && <p className="text-sm text-muted-foreground">{t.momentAgain}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => run(area ? createAndFill : async () => [await draftMoment(id)])} disabled={disabled}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {area ? t.anglesButton : t.momentButton}
        </Button>
        {area && emptyMoments > 0 && (
          <Button onClick={() => run(async () => [await fillArea(id)])} disabled={disabled}>
            {t.fillEmpty(emptyMoments)}
          </Button>
        )}
        {!pending && <span className="font-mono text-[11px] text-muted-foreground">{unavailable ?? (area ? t.areaCost : t.cost)}</span>}
      </div>
      {area && emptyMoments > 0 && <p className="text-sm text-muted-foreground">{t.fillEmptyHelp}</p>}
      {pending && <p className="font-mono text-xs text-muted-foreground">{area ? t.workingArea : t.working}</p>}
      {results.map((r, i) =>
        r.ok ? (
          <Message key={i} kind="success">
            {r.summary}
          </Message>
        ) : (
          <Message key={i} kind="error">
            {r.error}
          </Message>
        ),
      )}
    </div>
  );
}
