"use client";

import { KeyRound, Plus, Save } from "lucide-react";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createStudent, resetPassword, updateSiteSettings, updateStudent } from "@/lib/admin/user-actions";
import { GRADES, suggestedForGrade } from "@/lib/admin/user-input";
import { THEMES, type Theme } from "@/lib/cards/catalog";
import { strings } from "@/lib/strings";
import { Button, Field, inputClass, Message } from "./ui";

const t = strings.admin.users;

/** Runs an action and keeps its error or success message. */
function useAction(successText: string) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const run = (action: () => Promise<ActionResult>, onOk?: () => void) =>
    startTransition(async () => {
      const result = await action();
      setMessage(result.ok ? { kind: "success", text: successText } : { kind: "error", text: result.error });
      if (result.ok) onOk?.();
    });
  return { pending, message, run };
}

function GradeSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      <option value="">{t.noGrade}</option>
      {GRADES.map((g) => (
        <option key={g} value={g}>
          {g}
        </option>
      ))}
    </select>
  );
}

export type StudentRow = {
  id: string;
  username: string;
  displayName: string;
  grade: number | null;
  dailyGoalXp: number | null;
  passCorrect: number | null;
  collectionTheme: Theme;
};

export function StudentForm({ student, siteGoal }: { student: StudentRow; siteGoal: number }) {
  const [displayName, setDisplayName] = useState(student.displayName);
  const [grade, setGrade] = useState(student.grade ? String(student.grade) : "");
  const [dailyGoalXp, setDailyGoalXp] = useState(student.dailyGoalXp ? String(student.dailyGoalXp) : "");
  const [passCorrect, setPassCorrect] = useState(student.passCorrect ? String(student.passCorrect) : "");
  const [collectionTheme, setCollectionTheme] = useState<Theme>(student.collectionTheme);
  const [password, setPassword] = useState("");
  const save = useAction(t.saved);
  const reset = useAction(t.passwordChanged);
  const suggestion = grade ? suggestedForGrade(Number(grade)) : null;
  const id = (name: string) => `${student.id}-${name}`;

  return (
    <div className="flex flex-col gap-5 border border-border p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-semibold">{student.displayName}</h2>
        <span className="font-mono text-xs text-muted-foreground">@{student.username}</span>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.run(() => updateStudent(student.id, { displayName, grade, dailyGoalXp, passCorrect, collectionTheme }));
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.displayName} htmlFor={id("name")}>
            <input id={id("name")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} className={inputClass} />
          </Field>
          <Field label={t.grade} htmlFor={id("grade")}>
            <GradeSelect id={id("grade")} value={grade} onChange={setGrade} />
          </Field>
          <Field label={t.dailyGoal} htmlFor={id("goal")} hint={t.dailyGoalHint(siteGoal)}>
            <input
              id={id("goal")}
              type="number"
              min={10}
              max={500}
              step={5}
              value={dailyGoalXp}
              onChange={(e) => setDailyGoalXp(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t.passCorrect} htmlFor={id("pass")} hint={t.passCorrectHint}>
            <input
              id={id("pass")}
              type="number"
              min={5}
              max={10}
              value={passCorrect}
              onChange={(e) => setPassCorrect(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={t.collectionTheme} htmlFor={id("theme")} hint={t.collectionThemeHint}>
            <select
              id={id("theme")}
              value={collectionTheme}
              onChange={(e) => setCollectionTheme(e.target.value as Theme)}
              className={inputClass}
            >
              {THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {t.themes[theme]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {suggestion && (
          <p className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
            {t.suggest(suggestion.dailyGoalXp, suggestion.passCorrect)}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setDailyGoalXp(String(suggestion.dailyGoalXp));
                setPassCorrect(String(suggestion.passCorrect));
              }}
            >
              {t.useSuggestion}
            </Button>
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={save.pending}>
            <Save className="size-4" /> {t.save}
          </Button>
          {save.message && <Message kind={save.message.kind}>{save.message.text}</Message>}
        </div>
      </form>

      <form
        className="flex flex-col gap-2 border-t border-border pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          reset.run(() => resetPassword(student.id, password), () => setPassword(""));
        }}
      >
        <Field label={t.password} htmlFor={id("password")} hint={t.passwordHint}>
          <div className="flex gap-2">
            <input
              id={id("password")}
              type="text"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <Button type="submit" disabled={reset.pending || password.length < 8}>
              <KeyRound className="size-4" /> {t.resetPassword}
            </Button>
          </div>
        </Field>
        {reset.message && <Message kind={reset.message.kind}>{reset.message.text}</Message>}
      </form>
    </div>
  );
}

export function NewStudentForm() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState("");
  const create = useAction(t.created);

  return (
    <form
      className="flex flex-col gap-4 border border-dashed border-border p-5"
      onSubmit={(e) => {
        e.preventDefault();
        create.run(
          () => createStudent({ username, displayName, password, grade }),
          () => {
            setUsername("");
            setDisplayName("");
            setPassword("");
            setGrade("");
          },
        );
      }}
    >
      <h2 className="text-xl font-semibold">{t.newStudent}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.displayName} htmlFor="new-name">
          <input id="new-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} className={inputClass} />
        </Field>
        <Field label={t.username} htmlFor="new-username" hint={t.usernameHint}>
          <input
            id="new-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            maxLength={32}
            className={inputClass}
          />
        </Field>
        <Field label={t.password} htmlFor="new-password" hint={t.passwordHint}>
          <input
            id="new-password"
            type="text"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t.grade} htmlFor="new-grade">
          <GradeSelect id="new-grade" value={grade} onChange={setGrade} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={create.pending || !username || !displayName || password.length < 8}>
          <Plus className="size-4" /> {t.create}
        </Button>
        {create.message && <Message kind={create.message.kind}>{create.message.text}</Message>}
      </div>
    </form>
  );
}

const s = strings.admin.settings;

export function SiteSettingsForm({ initial }: { initial: { dailyGoalXp: number; aiMonthlyBudgetUsd: number; aiFeedbackDailyLimit: number } }) {
  const [dailyGoalXp, setDailyGoalXp] = useState(String(initial.dailyGoalXp));
  const [budget, setBudget] = useState(String(initial.aiMonthlyBudgetUsd));
  const [limit, setLimit] = useState(String(initial.aiFeedbackDailyLimit));
  const save = useAction(s.saved);

  return (
    <form
      className="flex flex-col gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        save.run(() => updateSiteSettings({ dailyGoalXp, aiMonthlyBudgetUsd: budget, aiFeedbackDailyLimit: limit }));
      }}
    >
      <Field label={s.dailyGoal} htmlFor="site-goal" hint={s.dailyGoalHint} className="max-w-xs">
        <input
          id="site-goal"
          type="number"
          min={10}
          max={500}
          step={5}
          value={dailyGoalXp}
          onChange={(e) => setDailyGoalXp(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label={s.budget} htmlFor="site-budget" hint={s.budgetHint} className="max-w-xs">
        <input id="site-budget" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} className={inputClass} />
      </Field>
      <Field label={s.feedbackLimit} htmlFor="site-limit" hint={s.feedbackLimitHint} className="max-w-xs">
        <input id="site-limit" type="number" min={0} max={50} value={limit} onChange={(e) => setLimit(e.target.value)} className={inputClass} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={save.pending}>
          <Save className="size-4" /> {s.save}
        </Button>
        {save.message && <Message kind={save.message.kind}>{save.message.text}</Message>}
      </div>
    </form>
  );
}
