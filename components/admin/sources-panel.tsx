"use client";

import { ChevronDown, ExternalLink, Link2, RefreshCw, Trash2, Type } from "lucide-react";
import { useState, useTransition } from "react";
import { addSourceLink, addSourceText, deleteSource, refetchSource } from "@/lib/admin/source-actions";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { Button, Field, inputClass, Message, textareaClass } from "./ui";

const t = strings.admin.sources;

export type SourceSummary = {
  id: string;
  url: string | null;
  title: string;
  status: "pending" | "ready" | "failed";
  error: string | null;
  chars: number;
  preview: string;
};

function SourceRow({ source }: { source: SourceSummary }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = (action: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? null : (result.error ?? null));
    });

  return (
    <li className="border-b border-border last:border-b-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
          {source.url ? <Link2 className="size-4 shrink-0 text-muted-foreground" /> : <Type className="size-4 shrink-0 text-muted-foreground" />}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{source.title}</span>
            <span className="block truncate font-mono text-[11px] text-muted-foreground">
              {source.url ?? t.pasted} · {source.status === "ready" ? t.chars(source.chars) : t.failed}
            </span>
          </span>
          <span
            className={cn(
              "border px-1.5 py-0.5 font-mono text-[10px] uppercase",
              source.status === "ready" ? "border-success/50 text-success" : "border-destructive/50 text-destructive",
            )}
          >
            {source.status === "ready" ? t.ready : t.failedShort}
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-3 px-4 pb-4">
          {source.status === "failed" && source.error && <Message kind="error">{source.error}</Message>}
          {source.preview && (
            <p className="max-h-40 overflow-auto border border-dashed border-border p-3 text-sm whitespace-pre-line text-muted-foreground">
              {source.preview}
              {source.chars > source.preview.length ? " …" : ""}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {source.url && (
              <>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-2 border border-border px-3 font-mono text-[11px] font-semibold hover:border-foreground"
                >
                  <ExternalLink className="size-3.5" /> {t.open}
                </a>
                <Button size="sm" disabled={pending} onClick={() => run(() => refetchSource(source.id))}>
                  <RefreshCw className={cn("size-3.5", pending && "animate-spin")} /> {t.refetch}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() => window.confirm(t.confirmDelete(source.title)) && run(() => deleteSource(source.id))}
            >
              <Trash2 className="size-3.5" /> {strings.admin.form.delete}
            </Button>
          </div>
          {message && <Message kind="error">{message}</Message>}
        </div>
      </details>
    </li>
  );
}

/** Links (fetched now) and pasted texts that AI uses to draft moments in this area. */
export function SourcesPanel({ areaId, sources }: { areaId: string; sources: SourceSummary[] }) {
  const [url, setUrl] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function addLink(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setMessage(null);
    startTransition(async () => {
      const result = await addSourceLink(areaId, url);
      if (result.ok) {
        setUrl("");
        setMessage({ kind: "success", text: t.added });
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  function addText() {
    setMessage(null);
    startTransition(async () => {
      const result = await addSourceText(areaId, title, text);
      if (result.ok) {
        setTitle("");
        setText("");
        setPasteOpen(false);
        setMessage({ kind: "success", text: t.added });
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {sources.length === 0 ? (
        <p className="border border-dashed border-border p-5 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="border border-border">
          {sources.map((s) => (
            <SourceRow key={s.id} source={s} />
          ))}
        </ul>
      )}

      <form onSubmit={addLink} className="flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          inputMode="url"
          placeholder={t.urlPlaceholder}
          aria-label={t.addLink}
          className={inputClass}
        />
        <Button type="submit" variant="primary" disabled={pending || !url.trim()}>
          {pending ? t.fetching : t.addLink}
        </Button>
      </form>

      {pasteOpen ? (
        <div className="flex flex-col gap-3 border border-border p-4">
          <Field label={t.pasteTitle} htmlFor="paste-title">
            <input id="paste-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} className={inputClass} />
          </Field>
          <Field label={t.pasteText} htmlFor="paste-text" hint={t.pasteHelp}>
            <textarea id="paste-text" value={text} onChange={(e) => setText(e.target.value)} rows={8} className={textareaClass} />
          </Field>
          <div className="flex gap-2">
            <Button variant="primary" disabled={pending || !title.trim() || !text.trim()} onClick={addText}>
              {t.addText}
            </Button>
            <Button variant="ghost" onClick={() => setPasteOpen(false)}>
              {t.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" className="w-fit px-0" onClick={() => setPasteOpen(true)}>
          <Type className="size-4" /> {t.pasteInstead}
        </Button>
      )}
      {message && <Message kind={message.kind}>{message.text}</Message>}
    </div>
  );
}
