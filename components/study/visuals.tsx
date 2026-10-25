import Link from "next/link";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

/** Lightens a content colour (area/subject) so small text stays readable on the dark background. */
export function readable(color: string) {
  return `color-mix(in oklab, ${color} 65%, white)`;
}

/** Monospace, upper-case, letter-spaced section label in the accent colour. */
export function SectionLabel({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-baseline justify-between gap-4", className)}>
      <h2 className="font-mono text-xs font-semibold tracking-[0.2em] text-primary uppercase">{children}</h2>
      {action && (
        <Link href={action.href} className="font-mono text-xs text-muted-foreground hover:text-foreground">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

/** Segmented progress bar, like a terminal progress indicator. */
export function BlockBar({
  value,
  max,
  cells = 10,
  color,
  className,
}: {
  value: number;
  max: number;
  cells?: number;
  color?: string;
  className?: string;
}) {
  const filled = max > 0 ? Math.round(Math.min(value / max, 1) * cells) : 0;
  return (
    <span className={cn("flex gap-[3px]", className)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      {Array.from({ length: cells }, (_, i) => (
        <span
          key={i}
          className={cn("h-2.5 flex-1", i < filled ? (color ? "" : "bg-primary") : "bg-foreground/10")}
          style={i < filled && color ? { backgroundColor: color } : undefined}
        />
      ))}
    </span>
  );
}

export function Stars({ count, max = 3, className }: { count: number; max?: number; className?: string }) {
  return (
    <span className={cn("font-mono text-sm tracking-widest", className)} aria-label={`${count} av ${max} stjärnor`}>
      <span className="text-amber-400">{"★".repeat(count)}</span>
      <span className="text-foreground/20">{"★".repeat(max - count)}</span>
    </span>
  );
}

/** Square tile with an area's icon in the area's colour. */
export function AreaMark({
  icon,
  color,
  size = 40,
  className,
}: {
  icon: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center border", className)}
      style={{
        width: size,
        height: size,
        color: readable(color),
        borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      <Icon name={icon} className="size-[50%]" />
    </span>
  );
}

export function Avatar({
  name,
  color,
  size = 40,
  className,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center border font-mono font-bold", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        color: readable(color),
        borderColor: `color-mix(in oklab, ${color} 50%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
      }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Small monospace "chip", like inline code. */
export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
