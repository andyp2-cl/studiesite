"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Tex } from "@/components/math/tex";
import { deleteTask, saveTask } from "@/lib/admin/task-actions";
import { LEVELS } from "@/lib/generators/types";
import { inputToTex } from "@/lib/math/input-to-tex";
import { strings } from "@/lib/strings";
import { TASK_TYPES, type AnswerDraft, type TaskType } from "@/lib/tasks/answers";
import { cn } from "@/lib/utils";
import { MarkdownEditor } from "./markdown-editor";
import { Button, Field, inputClass, labelClass, Message, textareaClass } from "./ui";

const t = strings.admin.task;
const f = strings.admin.form;

export type TaskEditorValues = {
  id?: string;
  level: number;
  type: TaskType;
  promptMd: string;
  solutionMd: string;
  published: boolean;
  draft: AnswerDraft;
};

export function TaskEditor({
  momentId,
  momentHref,
  initial,
}: {
  momentId: string;
  /** Admin page of the moment (back link, after delete). */
  momentHref: string;
  initial: TaskEditorValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const draft = values.draft;
  const set = (patch: Partial<TaskEditorValues>) => setValues((v) => ({ ...v, ...patch }));
  const setDraft = (patch: Partial<AnswerDraft>) => setValues((v) => ({ ...v, draft: { ...v.draft, ...patch } }));

  function save(andNew: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await saveTask({ ...values, momentId });
      if (!result.ok) return setMessage({ kind: "error", text: result.error });
      if (andNew) {
        setValues({ ...initial, id: undefined, level: values.level, type: values.type, published: values.published, promptMd: "", solutionMd: "", draft: {} });
        setMessage({ kind: "success", text: t.savedNew });
        router.replace(`${momentHref}/uppgift/ny`);
      } else {
        setMessage({ kind: "success", text: f.saved });
        if (!values.id && result.id) {
          set({ id: result.id });
          router.replace(`${momentHref}/uppgift/${result.id}`);
        }
      }
    });
  }

  function remove() {
    if (!values.id || !window.confirm(t.confirmDelete)) return;
    startTransition(async () => {
      const result = await deleteTask(values.id!);
      if (result.ok) router.push(momentHref);
      else setMessage({ kind: "error", text: result.error });
    });
  }

  const choices = draft.choices?.length ? draft.choices : ["", ""];

  return (
    <div className="flex flex-col gap-8">
      {/* Type */}
      <Field label={t.type}>
        <div className="hairline-grid grid grid-cols-2 gap-px sm:grid-cols-5">
          {TASK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set({ type })}
              className={cn(
                "px-3 py-3 text-left text-sm font-semibold",
                values.type === type ? "bg-primary/[0.08] text-primary outline outline-1 -outline-offset-1 outline-primary" : "hover:bg-card",
              )}
            >
              {t.types[type]}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.level} htmlFor="task-level">
          <select id="task-level" value={values.level} onChange={(e) => set({ level: Number(e.target.value) })} className={inputClass}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {strings.levels[l]}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-3 self-end pb-2.5 text-sm">
          <input
            type="checkbox"
            checked={values.published}
            onChange={(e) => set({ published: e.target.checked })}
            className="size-4 accent-primary"
          />
          {t.published}
        </label>
      </div>

      <Field label={t.prompt}>
        <MarkdownEditor id="task-prompt" value={values.promptMd} onChange={(promptMd) => set({ promptMd })} rows={6} placeholder={t.promptPlaceholder} />
      </Field>

      {/* Answer key per type */}
      <section className="flex flex-col gap-4 border border-border p-5">
        <p className={labelClass}>{t.answer}</p>

        {(values.type === "numeric" || values.type === "expression") && (
          <>
            <input
              value={draft.value ?? ""}
              onChange={(e) => setDraft({ value: e.target.value })}
              placeholder={values.type === "numeric" ? t.numericPlaceholder : t.expressionPlaceholder}
              aria-label={t.answer}
              className={cn(inputClass, "font-mono")}
            />
            {draft.value && (
              <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                {strings.task.preview} <Tex className="text-lg text-foreground">{inputToTex(draft.value)}</Tex>
              </p>
            )}
            {values.type === "numeric" ? (
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(draft.requireSimplified)}
                  onChange={(e) => setDraft({ requireSimplified: e.target.checked })}
                  className="size-4 accent-primary"
                />
                {t.requireSimplified}
              </label>
            ) : (
              <p className="font-mono text-[11px] text-muted-foreground">{t.expressionHelp}</p>
            )}
            <p className="font-mono text-[11px] text-muted-foreground">{t.numericHelp}</p>
          </>
        )}

        {values.type === "multiple_choice" && (
          <div className="flex flex-col gap-2">
            {choices.map((choice, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={draft.correctIndex === i}
                  onChange={() => setDraft({ correctIndex: i })}
                  aria-label={t.markCorrect}
                  className="size-4 shrink-0 accent-primary"
                />
                <input
                  value={choice}
                  onChange={(e) => setDraft({ choices: choices.map((c, j) => (j === i ? e.target.value : c)) })}
                  placeholder={t.choicePlaceholder(i + 1)}
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={choices.length <= 2}
                  onClick={() =>
                    setDraft({
                      choices: choices.filter((_, j) => j !== i),
                      correctIndex:
                        draft.correctIndex === i ? undefined : draft.correctIndex !== undefined && draft.correctIndex > i ? draft.correctIndex - 1 : draft.correctIndex,
                    })
                  }
                  aria-label={f.delete}
                  className="grid size-10 shrink-0 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {choices.length < 6 && (
              <Button size="sm" className="w-fit" onClick={() => setDraft({ choices: [...choices, ""] })}>
                <Plus className="size-3.5" /> {t.addChoice}
              </Button>
            )}
            <p className="font-mono text-[11px] text-muted-foreground">{t.choiceHelp}</p>
          </div>
        )}

        {values.type === "true_false" && (
          <div className="flex gap-2">
            {[true, false].map((v) => (
              <label
                key={String(v)}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 border p-3 font-semibold",
                  draft.correctBoolean === v ? "border-primary text-primary" : "border-border",
                )}
              >
                <input type="radio" name="tf" checked={draft.correctBoolean === v} onChange={() => setDraft({ correctBoolean: v })} className="accent-primary" />
                {v ? t.true : t.false}
              </label>
            ))}
          </div>
        )}

        {values.type === "free_text" && (
          <div className="flex flex-col gap-4">
            <Field label={t.accepted} htmlFor="accepted" hint={t.acceptedHelp}>
              <textarea
                id="accepted"
                rows={3}
                value={(draft.accepted ?? []).join("\n")}
                onChange={(e) => setDraft({ accepted: e.target.value.split("\n") })}
                className={textareaClass}
              />
            </Field>
            <Field label={t.keywords} htmlFor="keywords" hint={t.keywordsHelp}>
              <input
                id="keywords"
                value={(draft.keywords ?? []).join(", ")}
                onChange={(e) => setDraft({ keywords: e.target.value.split(",") })}
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </section>

      <Field label={t.solution} hint={t.solutionHelp}>
        <MarkdownEditor id="task-solution" value={values.solutionMd} onChange={(solutionMd) => set({ solutionMd })} rows={6} />
      </Field>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-border bg-background/95 py-4 backdrop-blur">
        <Button variant="primary" disabled={pending} onClick={() => save(false)}>
          {pending ? f.saving : f.save}
        </Button>
        <Button disabled={pending} onClick={() => save(true)}>
          {t.saveAndNew}
        </Button>
        {values.id && (
          <Button variant="danger" disabled={pending} onClick={remove}>
            <Trash2 className="size-3.5" /> {f.delete}
          </Button>
        )}
        {message && <Message kind={message.kind}>{message.text}</Message>}
      </div>
    </div>
  );
}
