"use client";

import { Moon, Volume2 } from "lucide-react";
import { useState } from "react";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.profile;

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 rounded-full transition-colors", checked ? "bg-primary" : "bg-foreground/20")}
    >
      <span
        className={cn(
          "absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
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
      <h2 className="mb-3 text-lg font-bold">{t.settings}</h2>
      <div className="divide-y divide-border rounded-xl bg-card">
        <div className="flex items-center gap-3 p-4">
          <Moon className="size-5 text-muted-foreground" />
          <span className="flex-1 font-semibold">{t.darkTheme}</span>
          <Toggle checked={dark} onChange={setTheme} label={t.darkTheme} />
        </div>
        <div className="flex items-center gap-3 p-4">
          <Volume2 className="size-5 text-muted-foreground" />
          <span className="flex-1 font-semibold">{t.sound}</span>
          <Toggle checked={sound} onChange={setSound} label={t.sound} />
        </div>
      </div>
      <button type="button" className="mt-4 w-full rounded-full border border-border py-3 font-bold hover:border-foreground">
        {t.logout}
      </button>
    </section>
  );
}
