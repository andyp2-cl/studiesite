"use client";

import { Check, Coins, Plus, Save, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { decideRedemption, saveReward } from "@/lib/admin/reward-actions";
import { REWARD_ICONS } from "@/lib/rewards";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { Button, Field, inputClass, Message } from "./ui";

const t = strings.admin.rewards;

export type AdminReward = { id: string; name: string; description: string | null; icon: string; price: number; is_active: boolean };

/** Approve or deny one waiting purchase. */
export function RedemptionActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const decide = (approve: boolean) => {
    if (!approve && !window.confirm(t.confirmDeny)) return;
    startTransition(async () => {
      const result = await decideRedemption(id, approve);
      setError(result.ok ? null : result.error);
    });
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button size="sm" variant="primary" disabled={pending} onClick={() => decide(true)}>
          <Check className="size-3.5" /> {t.approve}
        </Button>
        <Button size="sm" variant="danger" disabled={pending} onClick={() => decide(false)}>
          <X className="size-3.5" /> {t.deny}
        </Button>
      </div>
      {error && <Message kind="error">{error}</Message>}
    </div>
  );
}

/** Edit an existing reward, or create one when `reward` is null. */
export function RewardForm({ reward }: { reward: AdminReward | null }) {
  const [name, setName] = useState(reward?.name ?? "");
  const [description, setDescription] = useState(reward?.description ?? "");
  const [price, setPrice] = useState(reward ? String(reward.price) : "");
  const [icon, setIcon] = useState(reward?.icon ?? "gift");
  const [isActive, setIsActive] = useState(reward?.is_active ?? true);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const id = (n: string) => `${reward?.id ?? "new"}-${n}`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await saveReward(reward?.id ?? null, { name, description, price, icon, isActive });
      if (!result.ok) return setMessage({ kind: "error", text: result.error });
      setMessage({ kind: "success", text: t.saved });
      if (!reward) {
        setName("");
        setDescription("");
        setPrice("");
        setIcon("gift");
      }
    });
  }

  return (
    <form onSubmit={submit} className={cn("flex flex-col gap-4 p-4", reward ? "" : "border border-dashed border-border")}>
      {!reward && <p className="font-semibold">{t.newReward}</p>}
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <Field label={t.name} htmlFor={id("name")}>
          <input
            id={id("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder={t.namePlaceholder}
            className={inputClass}
          />
        </Field>
        <Field label={t.price} htmlFor={id("price")}>
          <input
            id={id("price")}
            type="number"
            min={1}
            max={10000}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label={t.description} htmlFor={id("desc")}>
        <input id={id("desc")} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} className={inputClass} />
      </Field>
      <Field label={t.icon}>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.icon}>
          {REWARD_ICONS.map((name) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={icon === name}
              aria-label={name}
              onClick={() => setIcon(name)}
              className={cn(
                "grid size-9 place-items-center border",
                icon === name ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon name={name} className="size-4" />
            </button>
          ))}
        </div>
      </Field>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="size-4 accent-primary" />
          {t.active}
        </label>
        <Button type="submit" variant="primary" disabled={pending || !name.trim() || !price}>
          {reward ? <Save className="size-4" /> : <Plus className="size-4" />} {reward ? t.save : t.add}
        </Button>
        {message && <Message kind={message.kind}>{message.text}</Message>}
      </div>
    </form>
  );
}

export function PriceTag({ price }: { price: number }) {
  return (
    <span className="flex items-center gap-1 font-mono text-xs">
      <Coins className="size-3.5 text-amber-400" /> {price}
    </span>
  );
}
