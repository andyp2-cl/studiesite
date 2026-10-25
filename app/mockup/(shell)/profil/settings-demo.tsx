"use client";

import { useState } from "react";
import { SectionLabel } from "@/components/study/visuals";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.profile;

/** Terminal-style on/off switch: [ PÅ ] / [ AV ]. */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex border border-border font-mono text-[11px]"
    >
      <span className={cn("px-2.5 py-1", checked ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
        {t.on}
      </span>
      <span className={cn("px-2.5 py-1", !checked ? "bg-foreground text-background" : "text-muted-foreground")}>
        {t.off}
      </span>
    </button>
  );
}

/** Mockup settings: the theme switch really toggles light/dark so it can be previewed. */
export function SettingsDemo() {
  const [dark, setDark] = useState(true);
  const [sound, setSound] = useState(false);

  function setTheme(v: boolean) {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
  }

  return (
    <section>
      <SectionLabel>{t.settings}</SectionLabel>
      <div className="border border-border">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-medium">{t.darkTheme}</span>
          <Toggle checked={dark} onChange={setTheme} label={t.darkTheme} />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-medium">{t.sound}</span>
          <Toggle checked={sound} onChange={setSound} label={t.sound} />
        </div>
      </div>
      <button
        type="button"
        className="mt-4 w-full border border-border py-3 font-mono text-sm text-muted-foreground hover:border-foreground hover:text-foreground"
      >
        {t.logout}
      </button>
    </section>
  );
}
