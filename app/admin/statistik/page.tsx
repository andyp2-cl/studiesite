import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { MathMarkdown } from "@/components/math/markdown";
import { SectionLabel } from "@/components/study/visuals";
import { getStudents, getStudentStats, type StudentStats } from "@/lib/admin/stats-data";
import { levelNameIndex } from "@/lib/gamification";
import { percent } from "@/lib/stats";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/utils";

const t = strings.admin.stats;

const shortDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
const dateTime = (iso: string) =>
  new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 p-4">
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      {sub && <span className="font-mono text-[11px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

/** Tasks per day as plain bars; each bar's title holds the day's numbers. */
function DayBars({ days }: { days: StudentStats["days"] }) {
  const max = Math.max(1, ...days.map((d) => d.tasks));
  return (
    <div>
      <div className="flex h-32 items-end gap-0.5 border-b border-border">
        {days.map((d) => (
          <div
            key={d.date}
            title={t.dayTitle(shortDate(d.date), d.tasks, d.correct, d.minutes)}
            className="group flex h-full flex-1 flex-col justify-end"
          >
            <span className="mb-1 text-center font-mono text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">
              {d.tasks}
            </span>
            <div
              className="rounded-t-[4px] bg-primary/80 group-hover:bg-primary"
              style={{ height: `${(d.tasks / max) * 100}%`, minHeight: d.tasks ? 2 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{shortDate(days[0].date)}</span>
        <span>{shortDate(days[days.length - 1].date)}</span>
      </div>
    </div>
  );
}

function AnswerList({ items, kind }: { items: StudentStats["mistakes"]; kind: "mistake" | "explanation" }) {
  if (items.length === 0) return <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">{t.none}</p>;
  return (
    <ul className="border border-border">
      {items.map((m) => (
        <li key={m.at} className="flex flex-col gap-2 border-b border-border p-4 last:border-b-0">
          <span className="font-mono text-[11px] text-muted-foreground">
            {dateTime(m.at)} · {m.moment}
          </span>
          {m.prompt && <MathMarkdown className="text-sm">{m.prompt}</MathMarkdown>}
          {kind === "mistake" ? (
            <span className="font-mono text-xs">
              {m.gaveUp ? t.gaveUp : `${t.answered}: ${m.answer || "–"}`}
            </span>
          ) : (
            <p className="border-l-2 border-primary/60 pl-3 text-sm whitespace-pre-line">{m.explanation}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function AdminStatsPage({ searchParams }: PageProps<"/admin/statistik">) {
  const { elev } = await searchParams;
  const students = await getStudents();
  const selected = students.find((s) => s.id === elev) ?? students[0];
  const stats = selected ? await getStudentStats(selected.id) : null;

  return (
    <main>
      <AdminHeader kicker={strings.admin.nav.stats} title={stats?.profile.name ?? strings.admin.nav.stats} intro={t.intro} />
      <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-10 sm:px-8">
        {students.length > 1 && (
          <div className="flex flex-wrap border border-border font-mono text-xs sm:w-fit">
            {students.map((s) => (
              <Link
                key={s.id}
                href={`/admin/statistik?elev=${s.id}`}
                className={cn(
                  "border-r border-border px-4 py-2 last:border-r-0",
                  s.id === selected?.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.display_name}
              </Link>
            ))}
          </div>
        )}

        {!stats ? (
          <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">{t.noStudents}</p>
        ) : (
          <>
            <section>
              <SectionLabel>{t.week}</SectionLabel>
              <div className="hairline-grid grid grid-cols-2 gap-px sm:grid-cols-4">
                <Tile label={t.tasks} value={String(stats.week.tasks)} />
                <Tile label={t.correct} value={`${percent(stats.week.correct, stats.week.tasks) ?? "–"} %`} />
                <Tile label={t.minutes} value={String(stats.week.minutes)} />
                <Tile label={t.activeDays} value={`${stats.week.activeDays} / 7`} />
              </div>
            </section>

            <section>
              <SectionLabel>{t.profile}</SectionLabel>
              <div className="hairline-grid grid grid-cols-2 gap-px sm:grid-cols-4">
                <Tile
                  label="XP"
                  value={String(stats.profile.xp)}
                  sub={t.level(stats.profile.level, strings.levelNames[levelNameIndex(stats.profile.level)])}
                />
                <Tile label={t.streakLabel} value={String(stats.profile.streak)} sub={t.streak(stats.profile.streak)} />
                <Tile label={t.coinsLabel} value={String(stats.profile.coins)} />
                <Tile
                  label={t.ai}
                  value={`$${stats.ai.spent.toFixed(2)}`}
                  sub={t.aiSpend(stats.ai.spent.toFixed(2), stats.ai.budget.toFixed(2))}
                />
              </div>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                {stats.profile.lastActive ? t.lastActive(shortDate(stats.profile.lastActive)) : t.neverActive}
              </p>
            </section>

            <section>
              <SectionLabel>{t.perDay}</SectionLabel>
              <DayBars days={stats.days} />
            </section>

            <section>
              <SectionLabel>{t.perMoment}</SectionLabel>
              {stats.moments.length === 0 ? (
                <p className="border border-dashed border-border p-4 text-sm text-muted-foreground">{t.noActivity}</p>
              ) : (
                <>
                  <p className="-mt-2 mb-4 text-sm text-muted-foreground">{t.perMomentHelp}</p>
                  <ul className="border border-border">
                    {stats.moments.map((m) => {
                      const rate = Math.round(m.rate * 100);
                      return (
                        <li key={m.momentId} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold">{m.name}</span>
                            <span className="block truncate font-mono text-[11px] text-muted-foreground">
                              {m.place} · {t.attemptsCount(m.attempts)}
                            </span>
                          </span>
                          {m.weak && (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-destructive">
                              <TriangleAlert className="size-3.5" /> {t.weak}
                            </span>
                          )}
                          <span className="hidden h-1.5 w-24 bg-foreground/10 sm:block">
                            <span className={cn("block h-full", m.weak ? "bg-destructive" : "bg-success")} style={{ width: `${rate}%` }} />
                          </span>
                          <span className="w-12 text-right font-mono text-sm tabular-nums">{rate} %</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>

            <section>
              <SectionLabel>{t.mistakes}</SectionLabel>
              <AnswerList items={stats.mistakes} kind="mistake" />
            </section>

            <section>
              <SectionLabel>{t.explanations}</SectionLabel>
              <p className="-mt-2 mb-4 text-sm text-muted-foreground">{t.explanationsHelp}</p>
              <AnswerList items={stats.explanations} kind="explanation" />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
