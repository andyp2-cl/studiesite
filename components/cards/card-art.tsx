import type { Card, Tier } from "@/lib/cards/catalog";
import { cn } from "@/lib/utils";

// Draws a card from its number: a figure in a shirt (with a shirt number for
// players, a microphone for artists), the initials, and a frame in the card's
// tier. No photos, so no image rights to worry about.

const FRAME: Record<Tier, [string, string]> = {
  bronze: ["hsl(28 60% 58%)", "hsl(22 55% 36%)"],
  silver: ["hsl(210 12% 86%)", "hsl(215 10% 52%)"],
  gold: ["hsl(48 100% 66%)", "hsl(36 90% 42%)"],
};

const initials = (name: string) =>
  name
    .replace(/&/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/** A card, or a face-down card when not collected yet. */
export function CardArt({ card, hidden = false, className }: { card: Card; hidden?: boolean; className?: string }) {
  const [light, dark] = FRAME[card.tier];
  const hue = (card.id * 47 + (card.theme === "music" ? 180 : 0)) % 360;
  const gradient = `card-${card.theme}-${card.id}`;

  if (hidden) {
    return (
      <svg viewBox="0 0 100 130" className={cn("block", className)} role="img" aria-label="?">
        <rect x="2" y="2" width="96" height="126" rx="8" fill="var(--muted)" stroke={dark} strokeWidth="3" strokeOpacity="0.5" />
        <text x="50" y="76" textAnchor="middle" fontSize="34" fontWeight="700" fill="var(--muted-foreground)">
          ?
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 100 130" className={cn("block", className)} role="img" aria-label={card.name}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 55% 42%)`} />
          <stop offset="1" stopColor={`hsl(${hue} 60% 18%)`} />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="126" rx="8" fill={`url(#${gradient})`} stroke={light} strokeWidth="4" />
      <rect x="7" y="7" width="86" height="116" rx="5" fill="none" stroke={dark} strokeWidth="1" />
      <text x="50" y="40" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff" fillOpacity="0.16" letterSpacing="1">
        {initials(card.name)}
      </text>
      {/* Figure: head and shoulders in the shirt colour. */}
      <circle cx="50" cy="56" r="13" fill="hsl(30 25% 88%)" />
      <path d="M22 112 C22 86 34 76 50 76 C66 76 78 86 78 112 Z" fill={light} />
      <path d="M42 76 L50 86 L58 76" fill="none" stroke={dark} strokeWidth="2" />
      {card.theme === "football" ? (
        <text x="50" y="106" textAnchor="middle" fontSize="16" fontWeight="800" fill={dark}>
          {((card.id * 7) % 23) + 1}
        </text>
      ) : (
        <g>
          <line x1="67" y1="96" x2="60" y2="70" stroke="#222" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="59" cy="66" rx="5" ry="6" fill="#333" stroke="#999" strokeWidth="1" />
        </g>
      )}
      {card.tier === "gold" && (
        <path d="M80 14 L82 20 L88 20 L83 24 L85 30 L80 26 L75 30 L77 24 L72 20 L78 20 Z" fill={light} />
      )}
    </svg>
  );
}
