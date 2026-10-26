import { stockholmDate } from "@/lib/time";

// Pure aggregations for the admin statistics page (SPEC 9). Input is the
// student's attempts for a recent window; nothing here touches the database.

export type StatsAttempt = {
  created_at: string;
  correct: boolean;
  duration_ms: number | null;
  moment_id: string;
};

/** One answer longer than this counts as this much: a task left open while doing something else is not study time. */
export const MAX_COUNTED_MS = 3 * 60_000;
/** A moment is weak when the student has tried it this often and gets less than WEAK_RATE right. */
export const WEAK_MIN_ATTEMPTS = 5;
export const WEAK_RATE = 0.6;

export type DayActivity = { date: string; tasks: number; correct: number; minutes: number };

const countedMs = (ms: number | null) => Math.min(Math.max(ms ?? 0, 0), MAX_COUNTED_MS);

/** Tasks, correct answers and minutes per Stockholm day, oldest first, for the `days` days ending today. */
export function dailyActivity(attempts: StatsAttempt[], days: number, now: Date = new Date()): DayActivity[] {
  const out: DayActivity[] = [];
  const index = new Map<string, DayActivity>();
  for (let i = days - 1; i >= 0; i--) {
    const date = stockholmDate(new Date(now.getTime() - i * 86_400_000));
    if (index.has(date)) continue; // DST edge: two instants on the same day
    const day = { date, tasks: 0, correct: 0, minutes: 0 };
    index.set(date, day);
    out.push(day);
  }
  const ms = new Map<string, number>();
  for (const a of attempts) {
    const date = stockholmDate(new Date(a.created_at));
    const day = index.get(date);
    if (!day) continue;
    day.tasks++;
    if (a.correct) day.correct++;
    ms.set(date, (ms.get(date) ?? 0) + countedMs(a.duration_ms));
  }
  for (const day of out) day.minutes = Math.round((ms.get(day.date) ?? 0) / 60_000);
  return out;
}

export type Totals = { tasks: number; correct: number; minutes: number; activeDays: number };

export function totals(days: DayActivity[]): Totals {
  return days.reduce(
    (t, d) => ({
      tasks: t.tasks + d.tasks,
      correct: t.correct + d.correct,
      minutes: t.minutes + d.minutes,
      activeDays: t.activeDays + (d.tasks > 0 ? 1 : 0),
    }),
    { tasks: 0, correct: 0, minutes: 0, activeDays: 0 },
  );
}

export type MomentAccuracy = { momentId: string; attempts: number; correct: number; rate: number; weak: boolean };

/** Hit rate per moment, weakest first among the weak ones, then the most practised. */
export function momentAccuracy(attempts: StatsAttempt[]): MomentAccuracy[] {
  const byMoment = new Map<string, { attempts: number; correct: number }>();
  for (const a of attempts) {
    const m = byMoment.get(a.moment_id) ?? { attempts: 0, correct: 0 };
    m.attempts++;
    if (a.correct) m.correct++;
    byMoment.set(a.moment_id, m);
  }
  return [...byMoment.entries()]
    .map(([momentId, m]) => {
      const rate = m.correct / m.attempts;
      return { momentId, ...m, rate, weak: m.attempts >= WEAK_MIN_ATTEMPTS && rate < WEAK_RATE };
    })
    .sort((a, b) => Number(b.weak) - Number(a.weak) || (a.weak ? a.rate - b.rate : b.attempts - a.attempts));
}

/** Share as a whole percent, or null when there is nothing to divide. */
export const percent = (part: number, whole: number): number | null => (whole > 0 ? Math.round((100 * part) / whole) : null);
