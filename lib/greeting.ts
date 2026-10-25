import { strings } from "@/lib/strings";

/** Time-of-day greeting for the home page (Swedish). */
export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return strings.home.greeting.morning;
  if (hour >= 10 && hour < 18) return strings.home.greeting.day;
  if (hour >= 18 && hour < 23) return strings.home.greeting.evening;
  return strings.home.greeting.night;
}
