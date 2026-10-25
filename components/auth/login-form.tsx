"use client";

import { ArrowRight } from "lucide-react";
import { useActionState } from "react";
import { signIn, type LoginState } from "@/lib/auth/actions";
import { strings } from "@/lib/strings";

const t = strings.login;

const inputClass =
  "h-12 w-full border border-input bg-card px-4 font-mono text-base outline-none focus:border-primary";
const labelClass = "font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, { error: null, username: "" });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next} />
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className={labelClass}>
          {t.username}
        </label>
        <input
          id="username"
          name="username"
          defaultValue={state.username}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          {t.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="border border-destructive/60 bg-destructive/[0.07] px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center gap-2 bg-primary font-mono text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? t.submitting : t.submit}
        {!pending && <ArrowRight className="size-4" />}
      </button>
      <p className="font-mono text-[11px] text-muted-foreground">{t.forgot}</p>
    </form>
  );
}
