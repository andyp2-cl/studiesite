import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Diagonal gradient from an area/subject colour down to near-black. */
export function areaGradient(color: string, strength = 45) {
  return `linear-gradient(145deg, ${color} 0%, color-mix(in oklab, ${color} ${strength}%, #000) 100%)`;
}

/** Soft header wash, like a Spotify playlist page. */
export function headerWash(color: string) {
  return `linear-gradient(180deg, color-mix(in oklab, ${color} 70%, transparent) 0%, transparent 100%)`;
}

export function Stars({ count, max = 3, className }: { count: number; max?: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`${count} av ${max} stjärnor`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          className={cn("size-3.5", i < count ? "fill-amber-400 text-amber-400" : "text-foreground/20")}
          aria-hidden
        />
      ))}
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
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-bold text-white", className)}
      style={{ width: size, height: size, background: areaGradient(color, 55), fontSize: size * 0.42 }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
