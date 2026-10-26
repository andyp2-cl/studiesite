import { monsterById, type Rarity } from "@/lib/monsters/catalog";
import { cn } from "@/lib/utils";

// Draws a monster from its number: the same number always gives the same
// creature. Rarer monsters get sparkles, and legendaries a crown and a glow.

function rng(seed: number) {
  let a = seed * 2654435761;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Look = {
  hue: number;
  body: 0 | 1 | 2 | 3;
  top: 0 | 1 | 2 | 3 | 4;
  eyes: 1 | 2 | 3;
  mouth: 0 | 1 | 2;
  spots: boolean;
  arms: boolean;
  cheeks: boolean;
  rarity: Rarity;
};

export function monsterLook(id: number): Look {
  const r = rng(id);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(r() * items.length)];
  return {
    hue: Math.floor(r() * 360),
    body: pick([0, 1, 2, 3] as const),
    top: pick([0, 1, 2, 3, 4] as const),
    eyes: pick([1, 2, 2, 2, 3] as const),
    mouth: pick([0, 1, 2] as const),
    spots: r() < 0.45,
    arms: r() < 0.6,
    cheeks: r() < 0.5,
    rarity: monsterById(id)?.rarity ?? "common",
  };
}

const BODIES = [
  "M50 30 C74 30 82 48 82 62 C82 80 68 88 50 88 C32 88 18 80 18 62 C18 48 26 30 50 30 Z",
  "M30 40 C30 26 70 26 70 40 L72 78 C72 88 28 88 28 78 Z",
  "M22 56 C22 30 78 30 78 56 L78 86 L68 80 L59 87 L50 80 L41 87 L32 80 L22 86 Z",
  "M50 26 C64 26 68 40 70 52 C78 60 82 70 78 80 C74 88 26 88 22 80 C18 70 22 60 30 52 C32 40 36 26 50 26 Z",
];

function Top({ kind, dark, light }: { kind: Look["top"]; dark: string; light: string }) {
  switch (kind) {
    case 1: // horns
      return (
        <g fill={light} stroke={dark} strokeWidth="2">
          <path d="M36 36 L30 18 L44 32 Z" />
          <path d="M64 36 L70 18 L56 32 Z" />
        </g>
      );
    case 2: // ears
      return (
        <g fill={dark}>
          <ellipse cx="30" cy="38" rx="8" ry="12" transform="rotate(-25 30 38)" />
          <ellipse cx="70" cy="38" rx="8" ry="12" transform="rotate(25 70 38)" />
        </g>
      );
    case 3: // antenna
      return (
        <g stroke={dark} strokeWidth="2.5" fill={light}>
          <path d="M44 32 Q40 18 34 14" fill="none" />
          <path d="M56 32 Q60 18 66 14" fill="none" />
          <circle cx="34" cy="14" r="4" />
          <circle cx="66" cy="14" r="4" />
        </g>
      );
    case 4: // tuft
      return <path d="M42 32 Q46 16 50 30 Q54 14 58 32 Z" fill={dark} />;
    default:
      return null;
  }
}

function Eyes({ count, y }: { count: Look["eyes"]; y: number }) {
  const xs = count === 1 ? [50] : count === 2 ? [40, 60] : [36, 50, 64];
  const size = count === 1 ? 10 : 7;
  return (
    <g>
      {xs.map((x) => (
        <g key={x}>
          <circle cx={x} cy={y} r={size} fill="#fff" />
          <circle cx={x + 1.5} cy={y + 1} r={size * 0.5} fill="#1a1a1a" />
          <circle cx={x + 3} cy={y - 1.5} r={size * 0.18} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

function Mouth({ kind, y, dark }: { kind: Look["mouth"]; y: number; dark: string }) {
  if (kind === 1)
    return (
      <g>
        <path d={`M40 ${y} Q50 ${y + 12} 60 ${y} Z`} fill="#3a1020" />
        <rect x="46" y={y} width="4" height="4" fill="#fff" />
      </g>
    );
  if (kind === 2) return <ellipse cx="50" cy={y + 3} rx="4" ry="5" fill="#3a1020" />;
  return <path d={`M41 ${y} Q50 ${y + 9} 59 ${y}`} fill="none" stroke={dark} strokeWidth="2.5" strokeLinecap="round" />;
}

function Sparkle({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return <path d={`M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`} fill={color} />;
}

/** A monster, or its dark silhouette when not collected yet. */
export function MonsterArt({ id, silhouette = false, className }: { id: number; silhouette?: boolean; className?: string }) {
  const look = monsterLook(id);
  const body = silhouette ? "var(--muted)" : `hsl(${look.hue} 70% 62%)`;
  const light = silhouette ? "var(--muted)" : `hsl(${look.hue} 75% 80%)`;
  const dark = silhouette ? "var(--muted)" : `hsl(${look.hue} 55% 32%)`;
  const faceY = look.body === 1 ? 52 : 56;
  const special = look.rarity === "rare" || look.rarity === "legendary";

  return (
    <svg viewBox="0 0 100 100" className={cn("block", className)} role="img" aria-label={silhouette ? "?" : monsterById(id)?.name}>
      {!silhouette && look.rarity === "legendary" && <circle cx="50" cy="56" r="46" fill="hsl(45 100% 60% / 0.18)" />}
      {look.body !== 2 && (
        <g fill={dark}>
          <ellipse cx="38" cy="88" rx="8" ry="4" />
          <ellipse cx="62" cy="88" rx="8" ry="4" />
        </g>
      )}
      {/* Legendaries wear a crown instead of horns or ears. */}
      {look.rarity !== "legendary" && <Top kind={look.top} dark={dark} light={light} />}
      {look.arms && (
        <g fill={body} stroke={silhouette ? "none" : dark} strokeWidth="1.5">
          <ellipse cx="18" cy="64" rx="6" ry="10" transform="rotate(25 18 64)" />
          <ellipse cx="82" cy="64" rx="6" ry="10" transform="rotate(-25 82 64)" />
        </g>
      )}
      <path d={BODIES[look.body]} fill={body} stroke={silhouette ? "none" : dark} strokeWidth="2" />
      {silhouette ? (
        <text x="50" y="66" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--muted-foreground)">
          ?
        </text>
      ) : (
        <>
          <ellipse cx="50" cy="74" rx="16" ry="10" fill={light} opacity="0.7" />
          {look.spots && (
            <g fill={dark} opacity="0.35">
              <circle cx="30" cy="66" r="3.5" />
              <circle cx="70" cy="62" r="4.5" />
              <circle cx="66" cy="76" r="2.5" />
            </g>
          )}
          <Eyes count={look.eyes} y={faceY - 6} />
          {look.cheeks && (
            <g fill="hsl(350 90% 75%)" opacity="0.7">
              <ellipse cx="31" cy={faceY + 6} rx="5" ry="3" />
              <ellipse cx="69" cy={faceY + 6} rx="5" ry="3" />
            </g>
          )}
          <Mouth kind={look.mouth} y={faceY + 6} dark={dark} />
          {special && (
            <g>
              <Sparkle x={14} y={22} s={5} color="hsl(50 100% 70%)" />
              <Sparkle x={88} y={34} s={4} color="hsl(50 100% 80%)" />
              <Sparkle x={84} y={12} s={3} color="#fff" />
            </g>
          )}
          {look.rarity === "legendary" && (
            <path d="M36 22 L40 8 L46 16 L50 4 L54 16 L60 8 L64 22 Z" fill="hsl(45 100% 55%)" stroke="hsl(35 90% 35%)" strokeWidth="1.5" />
          )}
        </>
      )}
    </svg>
  );
}
