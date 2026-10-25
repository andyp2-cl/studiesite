// Everything date-related (today, streaks, weeks) follows Swedish time, while
// the server (Vercel) runs in UTC.

export const TIME_ZONE = "Europe/Stockholm";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function stockholmParts(date: Date) {
  const get = (type: string) => Number(partsFormatter.formatToParts(date).find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** "2026-10-25" in Swedish time. */
export function stockholmDate(date: Date = new Date()): string {
  const { year, month, day } = stockholmParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Minutes Stockholm is ahead of UTC at the given instant (60 or 120). */
function offsetMinutes(date: Date): number {
  const p = stockholmParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** The instant Swedish midnight started for the day containing `date`. */
export function startOfStockholmDay(date: Date = new Date()): Date {
  const guess = new Date(`${stockholmDate(date)}T00:00:00Z`);
  return new Date(guess.getTime() - offsetMinutes(guess) * 60000);
}

export function stockholmHour(date: Date = new Date()): number {
  return stockholmParts(date).hour;
}
