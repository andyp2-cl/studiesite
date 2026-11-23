"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { draftWritingTask, type DraftResult } from "@/lib/drafts/actions";
import { strings } from "@/lib/strings";
import { Button, Message } from "./ui";

const t = strings.admin.drafts.writing;

/** "Skapa skrivuppgift med AI" in a moment's writing section. */
export function WritingDraftButton({ momentId, unavailable }: { momentId: string; unavailable: string | null }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<DraftResult | null>(null);
  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => startTransition(async () => setResult(await draftWritingTask(momentId)))}
          disabled={pending || unavailable !== null}
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {t.button}
        </Button>
        <span className="font-mono text-[11px] text-muted-foreground">{pending ? t.working : (unavailable ?? t.cost)}</span>
      </div>
      <p className="text-sm text-muted-foreground">{t.help}</p>
      {result && (result.ok ? <Message kind="success">{result.summary}</Message> : <Message kind="error">{result.error}</Message>)}
    </div>
  );
}
