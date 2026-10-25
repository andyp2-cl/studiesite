"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon, iconNames } from "@/components/icon";
import { deleteNode, updateNode, type NodeKind } from "@/lib/admin/content-actions";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { Button, Field, inputClass, Message } from "./ui";

const t = strings.admin.form;

const PALETTE = ["#1ed760", "#2d46b9", "#e8115b", "#e1118c", "#8400e7", "#148a08", "#e8590c", "#0d73ec", "#f59e0b", "#0891b2"];

export type NodeValues = {
  name: string;
  description: string | null;
  color?: string;
  icon?: string;
  is_hidden: boolean;
};

/** Edit form for a subject, area or moment. Colour and icon only for subjects/areas. */
export function NodeForm({
  kind,
  id,
  values,
  afterDeleteHref,
}: {
  kind: NodeKind;
  id: string;
  values: NodeValues;
  afterDeleteHref: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(values.name);
  const [description, setDescription] = useState(values.description ?? "");
  const [color, setColor] = useState(values.color);
  const [icon, setIcon] = useState(values.icon);
  const [hidden, setHidden] = useState(values.is_hidden);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const styled = kind !== "moment";

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateNode(kind, id, {
        name,
        description,
        isHidden: hidden,
        ...(styled && { color, icon }),
      });
      setMessage(result.ok ? { kind: "success", text: t.saved } : { kind: "error", text: result.error });
    });
  }

  function remove() {
    if (!window.confirm(t.confirmDelete(values.name))) return;
    startTransition(async () => {
      const result = await deleteNode(kind, id);
      if (result.ok) router.push(afterDeleteHref);
      else setMessage({ kind: "error", text: result.error });
    });
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5 border border-border p-5">
      <Field label={t.name} htmlFor="node-name">
        <input id="node-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className={inputClass} />
      </Field>
      <Field label={t.description} htmlFor="node-description">
        <input
          id="node-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          className={inputClass}
        />
      </Field>

      {styled && (
        <>
          <Field label={t.color}>
            <div className="flex flex-wrap items-center gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={cn("size-8 border-2", color === c ? "border-foreground" : "border-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label={t.color}
                className="h-8 w-10 cursor-pointer border border-border bg-transparent"
              />
            </div>
          </Field>
          <Field label={t.icon}>
            <div className="grid grid-cols-8 gap-1 sm:grid-cols-12">
              {iconNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  aria-label={name}
                  title={name}
                  className={cn(
                    "grid aspect-square place-items-center border transition-colors",
                    icon === name ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                  style={icon === name && color ? { color, borderColor: color } : undefined}
                >
                  <Icon name={name} className="size-4" />
                </button>
              ))}
            </div>
          </Field>
        </>
      )}

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} className="size-4 accent-primary" />
        {t.hiddenLabel}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? t.saving : t.save}
        </Button>
        <Button variant="danger" onClick={remove} disabled={pending}>
          <Trash2 className="size-3.5" /> {t.delete}
        </Button>
        {message && <Message kind={message.kind}>{message.text}</Message>}
      </div>
    </form>
  );
}
