"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createNode, type NodeKind } from "@/lib/admin/content-actions";
import { strings } from "@/lib/strings";
import { Button, inputClass, Message } from "./ui";

const t = strings.admin.content;

/** One-line "add" form under a list. */
export function CreateForm({ kind, parentId, label }: { kind: NodeKind; parentId: string | null; label: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createNode(kind, parentId, name);
      if (result.ok) {
        setName("");
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${label} – ${t.namePlaceholder.toLowerCase()}`}
          aria-label={label}
          maxLength={80}
          className={inputClass}
        />
        <Button type="submit" variant="primary" disabled={pending || !name.trim()}>
          <Plus className="size-4" /> {t.add}
        </Button>
      </div>
      {error && <Message kind="error">{error}</Message>}
    </form>
  );
}
