import { Snowflake } from "lucide-react";
import { badges, me } from "@/app/mockup/_mock";
import { Icon } from "@/components/icon";
import { Avatar, BlockBar, SectionLabel } from "@/components/study/visuals";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { SettingsDemo } from "./settings-demo";

const t = strings.profile;

export default function MockProfile() {
  const stats = [
    { label: t.stats.xp, value: me.xp },
    { label: t.stats.streak, value: me.streak },
    { label: t.stats.coins, value: me.coins },
    { label: t.stats.tasks, value: me.tasksDone },
  ];

  return (
    <main>
      <header className="bg-dots border-b border-border">
        <div className="mx-auto flex max-w-3xl items-end gap-5 px-4 pt-10 pb-8 sm:px-8 sm:pt-14">
          <Avatar name={me.name} color={me.avatarColor} size={88} />
          <div className="min-w-0">
            <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">
              {t.level} {me.level} · {me.levelName}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">{me.name}</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-10 sm:px-8">
        <section>
          <div className="mb-2 flex justify-between font-mono text-xs">
            <span>{me.levelName}</span>
            <span className="text-muted-foreground">{me.nextLevelName}</span>
          </div>
          <BlockBar value={me.levelProgress * 100} max={100} cells={20} />
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {t.toNextLevel(me.xpToNext, me.nextLevelName)}
          </p>
        </section>

        <section className="hairline-grid grid grid-cols-2 gap-px sm:grid-cols-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="p-4">
              <p className="font-mono text-3xl tabular-nums">{value}</p>
              <p className="mt-1 font-mono text-[11px] tracking-[0.15em] text-muted-foreground uppercase">{label}</p>
            </div>
          ))}
        </section>

        <section className="flex items-start gap-4 border border-sky-400/40 bg-sky-400/[0.05] p-4">
          <Snowflake className="mt-0.5 size-5 shrink-0 text-sky-300" />
          <div>
            <p className="font-mono text-sm font-semibold">
              {t.freeze} × {me.streakFreezes}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t.freezeHelp}</p>
          </div>
        </section>

        <section>
          <SectionLabel>{t.badges}</SectionLabel>
          <div className="hairline-grid grid grid-cols-3 gap-px sm:grid-cols-5">
            {badges.map((b) => (
              <div key={b.name} className="flex flex-col items-center gap-3 px-2 py-5 text-center">
                <span
                  className={cn(
                    "grid size-12 place-items-center border",
                    b.earned
                      ? "border-amber-400/60 bg-amber-400/10 text-amber-300"
                      : "border-dashed border-border text-muted-foreground/40",
                  )}
                >
                  <Icon name={b.icon} className="size-5" />
                </span>
                <span className={cn("text-xs font-medium", !b.earned && "text-muted-foreground")}>{b.name}</span>
              </div>
            ))}
          </div>
        </section>

        <SettingsDemo />
      </div>
    </main>
  );
}
