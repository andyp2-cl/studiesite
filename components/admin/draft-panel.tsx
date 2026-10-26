"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { draftAngles, draftMoment, type DraftResult } from "@/lib/drafts/actions";
import { strings } from "@/lib/strings";
import { Button, Message } from "./ui";

const t = strings.admin.drafts;

/**
 * "Föreslå vinklar" on an area or "Skapa utkast från källor" on a moment.
 * `unavailable` is the reason AI cannot be used right now (no key, budget used up).
 */
export function DraftPanel({
  kind,
  id,
  unavailable,
  hasContent = false,
}: {
  kind: "area" | "moment";
  id: string;
  unavailable: string | null;
  hasContent?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<DraftResult | null>(null);

  function run() {
    setResult(null);
    startTransition(async () => {
      setResult(await (kind === "area" ? draftAngles(id) : draftMoment(id)));
    });
  }

  return (
    <div className="flex flex-col gap-3 border border-dashed border-border p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Sparkles className="size-4 text-primary" /> {kind === "area" ? t.anglesTitle : t.momentTitle}
      </p>
      <p className="text-sm text-muted-foreground">{kind === "area" ? t.anglesHelp : t.momentHelp}</p>
      {kind === "moment" && hasContent && <p className="text-sm text-muted-foreground">{t.momentAgain}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={run} disabled={pending || unavailable !== null}>
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {pending ? t.working : kind === "area" ? t.anglesButton : t.momentButton}
        </Button>
        {!pending && <span className="font-mono text-[11px] text-muted-foreground">{unavailable ?? t.cost}</span>}
      </div>
      {result && (result.ok ? <Message kind="success">{result.summary}</Message> : <Message kind="error">{result.error}</Message>)}
    </div>
  );
}
