import {
  Award,
  BookOpen,
  Calculator,
  CalendarCheck,
  CalendarHeart,
  ChartColumn,
  ChartPie,
  Flame,
  Gift,
  Hash,
  MessageSquareText,
  Moon,
  Percent,
  Sparkles,
  Sunrise,
  Superscript,
  Target,
  Triangle,
  Trophy,
  Variable,
  type LucideIcon,
} from "lucide-react";

// Icons are stored by name in the database (subjects, areas, achievements,
// rewards). Add new names here when admins need more.
const ICONS: Record<string, LucideIcon> = {
  award: Award,
  book: BookOpen,
  calculator: Calculator,
  "calendar-check": CalendarCheck,
  "calendar-heart": CalendarHeart,
  "chart-column": ChartColumn,
  "chart-pie": ChartPie,
  flame: Flame,
  gift: Gift,
  hash: Hash,
  "message-square-text": MessageSquareText,
  moon: Moon,
  percent: Percent,
  sparkles: Sparkles,
  sunrise: Sunrise,
  superscript: Superscript,
  target: Target,
  triangle: Triangle,
  trophy: Trophy,
  variable: Variable,
};

export const iconNames = Object.keys(ICONS);

export function Icon({ name, className }: { name: string; className?: string }) {
  const Component = ICONS[name] ?? BookOpen;
  return <Component className={className} aria-hidden />;
}
