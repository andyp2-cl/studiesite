"use client";

import { Languages } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { importVocab } from "@/lib/admin/vocab-actions";
import { strings } from "@/lib/strings";
import { parseVocab, VOCAB_QUESTION_KINDS, vocabQuestions, type VocabQuestionKind } from "@/lib/vocab/vocab";
import { Button, Field, labelClass, Message, textareaClass } from "./ui";

const t = strings.admin.vocab;

/** Paste a word list ("perdón – ursäkta, förlåt") and get a reading text plus quiz questions. */
export function VocabImport({ momentId, language }: { momentId: string; language: string }) {
  const [text, setText] = useState("");
  const [kinds, setKinds] = useState<VocabQuestionKind[]>([...VOCAB_QUESTION_KINDS]);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(() => parseVocab(text), [text]);
  const questionCount = useMemo(() => vocabQuestions(parsed.pairs, language, kinds).length, [parsed, language, kinds]);

  function toggle(kind: VocabQuestionKind) {
    setKinds((current) => (current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind]));
  }

  function submit() {
    startTransition(async () => {
      const result = await importVocab(momentId, text, kinds);
      if (result.ok) {
        setMessage({ kind: "success", text: result.summary });
        setText("");
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  const labels: Record<VocabQuestionKind, string> = {
    toSwedish: t.kindLabels.toSwedish,
    toForeign: t.kindLabels.toForeign(language),
    choice: t.kindLabels.choice,
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label={t.label} htmlFor="vocab-text" hint={t.tips}>
        <textarea
          id="vocab-text"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          className={textareaClass}
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-1.5`}>{t.kinds}</legend>
        {VOCAB_QUESTION_KINDS.map((kind) => (
          <label key={kind} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={kinds.includes(kind)} onChange={() => toggle(kind)} className="size-4 accent-primary" />
            {labels[kind]}
          </label>
        ))}
      </fieldset>

      {parsed.pairs.length > 0 && <p className="font-mono text-[11px] text-muted-foreground">{t.preview(parsed.pairs.length, questionCount)}</p>}
      {parsed.rejected.length > 0 && (
        <div className="border border-amber-400/40 bg-amber-400/[0.05] p-3 text-sm">
          <p>{t.rejected(parsed.rejected.length)}</p>
          <ul className="mt-1 list-disc pl-5 font-mono text-xs">
            {parsed.rejected.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Button variant="primary" disabled={pending || parsed.pairs.length === 0 || questionCount === 0} onClick={submit}>
          <Languages className="size-4" /> {pending ? t.working : t.button}
        </Button>
      </div>
      {message && <Message kind={message.kind}>{message.text}</Message>}
    </div>
  );
}
