import { Coins, Flame, Snowflake, Target, Zap } from "lucide-react";
import { Icon } from "@/components/icon";
import { Avatar, headerWash } from "@/components/study/visuals";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";
import { badges, me } from "@/app/mockup/_mock";
import { SettingsDemo } from "./settings-demo";

const t = strings.profile;

export default function MockProfile() {
  const stats = [
    { label: t.stats.xp, value: me.xp, icon: Zap, color: "text-primary" },
    { label: t.stats.streak, value: me.streak, icon: Flame, color: "text-orange-500" },
    { label: t.stats.coins, value: me.coins, icon: Coins, color: "text-amber-400" },
    { label: t.stats.tasks, value: me.tasksDone, icon: Target, color: "text-sky-400" },
  ];

  return (
    <main className="relative">
      <div className="absolute inset-x-0 top-0 h-80 md:rounded-t-xl" style={{ background: headerWash(me.avatarColor) }} />

      <div className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-8 pb-8 sm:px-6">
        <header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
          <Avatar name={me.name} color={me.avatarColor} size={128} className="shadow-2xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {t.level} {me.level}
            </p>
            <h1 className="text-5xl font-extrabold tracking-tight">{me.name}</h1>
            <p className="mt-1 font-semibold text-primary">{me.levelName}</p>
          </div>
        </header>

        {/* Level progress */}
        <section className="rounded-xl bg-card p-4">
          <div className="mb-2 flex justify-between text-sm font-semibold">
            <span>{me.levelName}</span>
            <span className="text-muted-foreground">{me.nextLevelName}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-300"
              style={{ width: `${me.levelProgress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t.toNextLevel(me.xpToNext, me.nextLevelName)}</p>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map(({ label, value, icon: StatIcon, color }) => (
            <div key={label} className="rounded-xl bg-card p-4">
              <StatIcon className={cn("mb-2 size-5", color)} />
              <p className="text-2xl font-extrabold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        <section className="flex items-center gap-4 rounded-xl bg-sky-500/10 p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sky-500/20">
            <Snowflake className="size-6 text-sky-300" />
          </span>
          <div>
            <p className="font-bold">
              {t.freeze} × {me.streakFreezes}
            </p>
            <p className="text-sm text-muted-foreground">{t.freezeHelp}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">{t.badges}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {badges.map((b) => (
              <div key={b.name} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "grid size-16 place-items-center rounded-full",
                    b.earned
                      ? "bg-gradient-to-br from-amber-300 to-orange-500 text-black shadow-lg shadow-orange-500/20"
                      : "border-2 border-dashed border-border text-muted-foreground/50",
                  )}
                >
                  <Icon name={b.icon} className="size-7" />
                </span>
                <span className={cn("text-xs font-semibold", !b.earned && "text-muted-foreground")}>{b.name}</span>
              </div>
            ))}
          </div>
        </section>

        <SettingsDemo />
      </div>
    </main>
  );
}
