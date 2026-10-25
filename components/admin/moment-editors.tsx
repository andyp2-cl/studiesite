"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { deleteBlock, saveBlock, setMomentMode, setMomentSource } from "@/lib/admin/moment-actions";
import { LEVELS } from "@/lib/generators/types";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "./markdown-editor";
import { Button, Field, inputClass, Message } from "./ui";

const t = strings.admin.moment;
const f = strings.admin.form;

type Feedback = { kind: "error" | "success"; text: string } | null;

function useSaver() {
  const [message, setMessage] = useState<Feedback>(null);
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) =>
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? { kind: "success", text: f.saved } : { kind: "error", text: result.error ?? "" });
      if (result.ok) onOk?.();
    });
  return { message, pending, run, setMessage };
}

export function ModePanel({ momentId, mode }: { momentId: string; mode: "levels" | "read" }) {
  const [value, setValue] = useState(mode);
  const { message, pending, run } = useSaver();

  return (
    <div className="flex flex-col gap-4 border border-border p-5">
      <div className="hairline-grid grid gap-px sm:grid-cols-2">
        {(["levels", "read"] as const).map((option) => (
          <label
            key={option}
            className={cn(
              "flex cursor-pointer flex-col gap-1 p-4",
              value === option && "bg-primary/[0.07] outline outline-1 -outline-offset-1 outline-primary",
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              <input type="radio" name="mode" checked={value === option} onChange={() => setValue(option)} className="accent-primary" />
              {option === "levels" ? t.modeLevels : t.modeRead}
            </span>
            <span className="text-sm text-muted-foreground">{option === "levels" ? t.modeLevelsHelp : t.modeReadHelp}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="primary" disabled={pending || value === mode} onClick={() => run(() => setMomentMode(momentId, value))}>
          {pending ? f.saving : f.save}
        </Button>
        {message && <Message kind={message.kind}>{message.text}</Message>}
      </div>
    </div>
  );
}

export function SourcePanel({
  momentId,
  source,
  generatorKey,
  options,
}: {
  momentId: string;
  source: "generator" | "tasks";
  generatorKey: string | null;
  options: { key: string; label: string }[];
}) {
  const [mode, setMode] = useState(source);
  const [key, setKey] = useState(generatorKey && options.some((o) => o.key === generatorKey) ? generatorKey : "");
  const { message, pending, run } = useSaver();
  const missing = source === "generator" && generatorKey && !options.some((o) => o.key === generatorKey);

  return (
    <div className="flex flex-col gap-4 border border-border p-5">
      <div className="hairline-grid grid gap-px sm:grid-cols-2">
        {(["tasks", "generator"] as const).map((value) => (
          <label
            key={value}
            className={cn(
              "flex cursor-pointer flex-col gap-1 p-4",
              mode === value && "bg-primary/[0.07] outline outline-1 -outline-offset-1 outline-primary",
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              <input type="radio" name="source" checked={mode === value} onChange={() => setMode(value)} className="accent-primary" />
              {value === "tasks" ? t.tasksOption : t.generatorOption}
            </span>
            <span className="text-sm text-muted-foreground">{value === "tasks" ? t.tasksHelp : t.generatorHelp}</span>
          </label>
        ))}
      </div>
      {mode === "generator" && (
        <Field label={t.chooseGenerator} htmlFor="generator" hint={missing ? t.generatorMissing(generatorKey!) : undefined}>
          <select id="generator" value={key} onChange={(e) => setKey(e.target.value)} className={inputClass}>
            <option value="">–</option>
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          disabled={pending || (mode === "generator" && !key)}
          onClick={() => run(() => setMomentSource(momentId, mode, mode === "generator" ? key : null))}
        >
          {pending ? f.saving : f.save}
        </Button>
        {message && <Message kind={message.kind}>{message.text}</Message>}
      </div>
    </div>
  );
}

export function IntroEditor({ momentId, initial }: { momentId: string; initial: string }) {
  const [body, setBody] = useState(initial);
  const { message, pending, run } = useSaver();

  return (
    <div className="flex flex-col gap-3 border border-border p-5">
      <MarkdownEditor id="intro" value={body} onChange={setBody} rows={14} placeholder={t.introPlaceholder} />
      <div className="flex items-center gap-3">
        <Button variant="primary" disabled={pending} onClick={() => run(() => saveBlock({ momentId, type: "intro", body }))}>
          {pending ? f.saving : f.save}
        </Button>
        {message && <Message kind={message.kind}>{message.text}</Message>}
      </div>
    </div>
  );
}

type Deepening = { id?: string; key: string; title: string; unlockLevel: number; body: string };

function DeepeningCard({
  momentId,
  initial,
  onRemoved,
}: {
  momentId: string;
  initial: Deepening;
  onRemoved: () => void;
}) {
  const [id, setId] = useState(initial.id);
  const [title, setTitle] = useState(initial.title);
  const [unlockLevel, setUnlockLevel] = useState(initial.unlockLevel);
  const [body, setBody] = useState(initial.body);
  const { message, pending, run } = useSaver();

  function save() {
    run(async () => {
      const result = await saveBlock({ id, momentId, type: "deepening", title, body, unlockLevel });
      if (result.ok && result.id) setId(result.id);
      return result;
    });
  }

  function remove() {
    if (!id) return onRemoved();
    if (!window.confirm(f.confirmDelete(title || t.deepening))) return;
    run(() => deleteBlock(id), onRemoved);
  }

  return (
    <div className="flex flex-col gap-4 border border-border p-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field label={t.deepeningTitle} htmlFor={`title-${initial.key}`}>
          <input
            id={`title-${initial.key}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className={inputClass}
          />
        </Field>
        <Field label={t.unlockLevel} htmlFor={`level-${initial.key}`}>
          <select
            id={`level-${initial.key}`}
            value={unlockLevel}
            onChange={(e) => setUnlockLevel(Number(e.target.value))}
            className={inputClass}
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {t.afterLevel(strings.levels[level])}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <MarkdownEditor id={`body-${initial.key}`} value={body} onChange={setBody} rows={8} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" disabled={pending || !title.trim()} onClick={save}>
          {pending ? f.saving : f.save}
        </Button>
        <Button variant="danger" disabled={pending} onClick={remove}>
          <Trash2 className="size-3.5" /> {f.delete}
        </Button>
        {message && <Message kind={message.kind}>{message.text}</Message>}
      </div>
    </div>
  );
}

export function DeepeningsEditor({
  momentId,
  initial,
}: {
  momentId: string;
  initial: { id: string; title: string; unlockLevel: number; body: string }[];
}) {
  const [items, setItems] = useState<Deepening[]>(initial.map((d) => ({ ...d, key: d.id })));

  return (
    <div className="flex flex-col gap-3">
      {items.map((d) => (
        <DeepeningCard
          key={d.key}
          momentId={momentId}
          initial={d}
          onRemoved={() => setItems((all) => all.filter((x) => x.key !== d.key))}
        />
      ))}
      <Button
        className="w-fit"
        onClick={() =>
          setItems((all) => [...all, { key: crypto.randomUUID(), title: "", unlockLevel: 1, body: "" }])
        }
      >
        <Plus className="size-4" /> {t.newDeepening}
      </Button>
    </div>
  );
}
