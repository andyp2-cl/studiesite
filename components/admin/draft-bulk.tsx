"use client";

import { Send, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteMomentDrafts, publishMomentDrafts } from "@/lib/admin/task-actions";
import { strings } from "@/lib/strings";
import { Button, Message } from "./ui";

const t = strings.admin.read;

/** Publish or throw away all drafts in a "Läs och svara" moment at once (e.g. after an AI draft). */
export function DraftBulk({ momentId, questions, writing }: { momentId: string; questions: number; writing: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(confirmText: string, action: (id: string) => Promise<{ ok: boolean; error?: string }>) {
    if (!window.confirm(confirmText)) return;
    startTransition(async () => {
      const result = await action(momentId);
      setError(result.ok ? null : (result.error ?? null));
    });
  }

  return (
    <div className="flex flex-col gap-3 border border-amber-400/40 bg-amber-400/[0.05] p-4">
      <p className="text-sm">{t.draftsCount(questions, writing)}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" disabled={pending} onClick={() => run(t.confirmPublishAll, publishMomentDrafts)}>
          <Send className="size-4" /> {t.publishAll}
        </Button>
        <Button variant="danger" disabled={pending} onClick={() => run(t.confirmDeleteDrafts, deleteMomentDrafts)}>
          <Trash2 className="size-4" /> {t.deleteDrafts}
        </Button>
      </div>
      {error && <Message kind="error">{error}</Message>}
    </div>
  );
}
