import type { Figure } from "./types";

// Simple SVG figures for geometry tasks. Drawn with currentColor so they follow
// the light/dark theme; the unknown is highlighted in the accent colour.
// Figures are illustrations, not to scale.

const W = 300;
const H = 190;
const STROKE = `fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"`;
const DASH = `fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"`;

type Label = { x: number; y: number; text: string; anchor?: "start" | "middle" | "end"; highlight?: boolean };

function text({ x, y, text, anchor = "middle", highlight }: Label): string {
  const fill = highlight ? "var(--primary)" : "currentColor";
  const weight = highlight ? "700" : "500";
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-size="15" font-weight="${weight}" font-family="ui-monospace, monospace">${text}</text>`;
}

function svg(body: string, alt: string): Figure {
  return {
    kind: "svg",
    alt,
    svg: `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${alt}" style="width:100%;height:auto;color:inherit">${body}</svg>`,
  };
}

/** Small square marking a right angle at (x, y), opening towards (dx, dy). */
function rightAngle(x: number, y: number, dx: number, dy: number, size = 12): string {
  return `<path d="M ${x + dx * size} ${y} L ${x + dx * size} ${y + dy * size} L ${x} ${y + dy * size}" ${STROKE} stroke-width="1.5" />`;
}

/** Fit a w×h shape into the drawing area while keeping its proportions (clamped so it stays readable). */
function fit(w: number, h: number, maxW = 200, maxH = 120) {
  const ratio = Math.min(Math.max(w / h, 0.6), 3);
  let width = maxW;
  let height = width / ratio;
  if (height > maxH) {
    height = maxH;
    width = height * ratio;
  }
  return { width, height, x: (W - width) / 2, y: (H - height) / 2 + 5 };
}

export function rectangleFigure(w: number, h: number, labels: { bottom: string; side: string; highlightSide?: boolean; highlightBottom?: boolean }): Figure {
  const r = fit(w, h);
  return svg(
    `<rect x="${r.x}" y="${r.y}" width="${r.width}" height="${r.height}" ${STROKE} />` +
      text({ x: r.x + r.width / 2, y: r.y + r.height + 22, text: labels.bottom, highlight: labels.highlightBottom }) +
      text({ x: r.x + r.width + 10, y: r.y + r.height / 2 + 5, text: labels.side, anchor: "start", highlight: labels.highlightSide }),
    `Rektangel med sidorna ${labels.bottom} och ${labels.side}`,
  );
}

/** Triangle with base b and height h (dashed). `apex` 0–1 moves the top along the base. */
export function triangleFigure(b: number, h: number, labels: { base: string; height: string }, apex = 0.35): Figure {
  const r = fit(b, h, 210, 120);
  const ax = r.x + r.width * apex;
  return svg(
    `<path d="M ${r.x} ${r.y + r.height} L ${r.x + r.width} ${r.y + r.height} L ${ax} ${r.y} Z" ${STROKE} />` +
      `<line x1="${ax}" y1="${r.y}" x2="${ax}" y2="${r.y + r.height}" ${DASH} />` +
      rightAngle(ax, r.y + r.height, 1, -1, 10) +
      text({ x: r.x + r.width / 2, y: r.y + r.height + 22, text: labels.base }) +
      text({ x: ax - 8, y: r.y + r.height / 2 + 5, text: labels.height, anchor: "end" }),
    `Triangel med basen ${labels.base} och höjden ${labels.height}`,
  );
}

export function parallelogramFigure(b: number, h: number, labels: { base: string; height: string }): Figure {
  const r = fit(b * 1.25, h, 220, 115);
  const shift = r.width * 0.2;
  const left = r.x;
  const bottom = r.y + r.height;
  const hx = left + shift + 14;
  return svg(
    `<path d="M ${left} ${bottom} L ${left + r.width - shift} ${bottom} L ${left + r.width} ${r.y} L ${left + shift} ${r.y} Z" ${STROKE} />` +
      `<line x1="${hx}" y1="${r.y}" x2="${hx}" y2="${bottom}" ${DASH} />` +
      rightAngle(hx, bottom, 1, -1, 10) +
      text({ x: left + (r.width - shift) / 2, y: bottom + 22, text: labels.base }) +
      text({ x: hx + 8, y: r.y + r.height / 2 + 5, text: labels.height, anchor: "start" }),
    `Parallellogram med basen ${labels.base} och höjden ${labels.height}`,
  );
}

export function circleFigure(label: string, kind: "radius" | "diameter"): Figure {
  const cx = W / 2;
  const cy = H / 2;
  const radius = 70;
  const line =
    kind === "radius"
      ? `<line x1="${cx}" y1="${cy}" x2="${cx + radius}" y2="${cy}" stroke="currentColor" stroke-width="2" />`
      : `<line x1="${cx - radius}" y1="${cy}" x2="${cx + radius}" y2="${cy}" stroke="currentColor" stroke-width="2" />`;
  return svg(
    `<circle cx="${cx}" cy="${cy}" r="${radius}" ${STROKE} />` +
      `<circle cx="${cx}" cy="${cy}" r="3" fill="currentColor" />` +
      line +
      text({ x: kind === "radius" ? cx + radius / 2 : cx, y: cy - 10, text: label }),
    `Cirkel med ${kind === "radius" ? "radien" : "diametern"} ${label}`,
  );
}

/** "House": rectangle with a triangle on top. */
export function houseFigure(labels: { width: string; wallHeight: string; roofHeight: string }): Figure {
  const x = 70;
  const w = 160;
  const wallTop = 85;
  const bottom = 160;
  const roofTop = 25;
  return svg(
    `<path d="M ${x} ${bottom} L ${x + w} ${bottom} L ${x + w} ${wallTop} L ${x} ${wallTop} Z" ${STROKE} />` +
      `<path d="M ${x} ${wallTop} L ${x + w / 2} ${roofTop} L ${x + w} ${wallTop}" ${STROKE} />` +
      `<line x1="${x + w / 2}" y1="${roofTop}" x2="${x + w / 2}" y2="${wallTop}" ${DASH} />` +
      text({ x: x + w / 2, y: bottom + 22, text: labels.width }) +
      text({ x: x + w + 10, y: (wallTop + bottom) / 2 + 5, text: labels.wallHeight, anchor: "start" }) +
      // Low in the roof triangle, where it is wide enough for the label.
      text({ x: x + w / 2 + 6, y: wallTop - 10, text: labels.roofHeight, anchor: "start" }),
    `Figur: en rektangel med en triangel ovanpå`,
  );
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Arc between two directions (degrees, counter-clockwise from the positive x-axis). */
function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  const x1 = cx + r * Math.cos(rad(from));
  const y1 = cy - r * Math.sin(rad(from));
  const x2 = cx + r * Math.cos(rad(to));
  const y2 = cy - r * Math.sin(rad(to));
  const large = to - from > 180 ? 1 : 0;
  return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 0 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="currentColor" stroke-width="1.5" />`;
}

function labelAt(cx: number, cy: number, r: number, deg: number, label: string, highlight = false): string {
  return text({ x: cx + r * Math.cos(rad(deg)), y: cy - r * Math.sin(rad(deg)) + 5, text: label, highlight });
}

/** A straight line with a ray: two angles that together make 180°. */
export function straightAngleFigure(known: number, knownLabel: string, unknownLabel: string): Figure {
  const cx = W / 2;
  const cy = 140;
  const len = 120;
  const rx = cx + len * Math.cos(rad(known));
  const ry = cy - len * Math.sin(rad(known));
  return svg(
    `<line x1="${cx - len}" y1="${cy}" x2="${cx + len}" y2="${cy}" stroke="currentColor" stroke-width="2" />` +
      `<line x1="${cx}" y1="${cy}" x2="${rx.toFixed(1)}" y2="${ry.toFixed(1)}" stroke="currentColor" stroke-width="2" />` +
      arc(cx, cy, 30, 0, known) +
      arc(cx, cy, 24, known, 180) +
      labelAt(cx, cy, 52, known / 2, knownLabel) +
      labelAt(cx, cy, 50, (known + 180) / 2, unknownLabel, true),
    `En rät linje delas av en stråle i vinklarna ${knownLabel} och ${unknownLabel}`,
  );
}

/** A right angle split by a ray: two angles that together make 90°. */
export function rightAngleSplitFigure(known: number, knownLabel: string, unknownLabel: string): Figure {
  const cx = 90;
  const cy = 160;
  const len = 140;
  const rx = cx + len * Math.cos(rad(known));
  const ry = cy - len * Math.sin(rad(known));
  return svg(
    `<line x1="${cx}" y1="${cy}" x2="${cx + len}" y2="${cy}" stroke="currentColor" stroke-width="2" />` +
      `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - len}" stroke="currentColor" stroke-width="2" />` +
      `<line x1="${cx}" y1="${cy}" x2="${rx.toFixed(1)}" y2="${ry.toFixed(1)}" stroke="currentColor" stroke-width="2" />` +
      rightAngle(cx, cy, 1, -1, 14) +
      arc(cx, cy, 45, 0, known) +
      arc(cx, cy, 38, known, 90) +
      labelAt(cx, cy, 72, known / 2, knownLabel) +
      labelAt(cx, cy, 66, (known + 90) / 2, unknownLabel, true),
    `En rät vinkel delas i vinklarna ${knownLabel} och ${unknownLabel}`,
  );
}

/** Triangle with the three angles labelled (one is the unknown). */
export function triangleAnglesFigure(a: number, b: number, labels: [string, string, string], highlight: 0 | 1 | 2): Figure {
  // Place the base horizontally and compute the apex from the two base angles.
  const baseLen = 220;
  const x0 = 40;
  const y0 = 165;
  const tanA = Math.tan(rad(a));
  const tanB = Math.tan(rad(b));
  let apexX = x0 + (baseLen * tanB) / (tanA + tanB);
  let apexY = y0 - (apexX - x0) * tanA;
  // Keep very pointy triangles inside the frame.
  if (apexY < 15) {
    const k = (y0 - 15) / (y0 - apexY);
    apexX = x0 + (apexX - x0) * k;
    apexY = 15;
  }
  return svg(
    `<path d="M ${x0} ${y0} L ${x0 + baseLen} ${y0} L ${apexX.toFixed(1)} ${apexY.toFixed(1)} Z" ${STROKE} />` +
      text({ x: x0 + 34, y: y0 - 8, text: labels[0], anchor: "start", highlight: highlight === 0 }) +
      text({ x: x0 + baseLen - 34, y: y0 - 8, text: labels[1], anchor: "end", highlight: highlight === 1 }) +
      text({ x: apexX, y: apexY + 34, text: labels[2], highlight: highlight === 2 }),
    `Triangel med vinklarna ${labels.join(", ")}`,
  );
}

/** Two crossing lines: vertical angles are equal, neighbours sum to 180°. */
export function crossingLinesFigure(angle: number, knownLabel: string, unknownLabel: string, unknownIsVertical: boolean): Figure {
  const cx = W / 2;
  const cy = H / 2;
  const len = 120;
  const dx = len * Math.cos(rad(angle));
  const dy = len * Math.sin(rad(angle));
  const unknownAt = unknownIsVertical ? 180 + angle / 2 : (angle + 180) / 2;
  return svg(
    `<line x1="${cx - len}" y1="${cy}" x2="${cx + len}" y2="${cy}" stroke="currentColor" stroke-width="2" />` +
      `<line x1="${(cx - dx).toFixed(1)}" y1="${(cy + dy).toFixed(1)}" x2="${(cx + dx).toFixed(1)}" y2="${(cy - dy).toFixed(1)}" stroke="currentColor" stroke-width="2" />` +
      arc(cx, cy, 26, 0, angle) +
      labelAt(cx, cy, 48, angle / 2, knownLabel) +
      (unknownIsVertical ? arc(cx, cy, 26, 180, 180 + angle) : arc(cx, cy, 22, angle, 180)) +
      labelAt(cx, cy, 48, unknownAt, unknownLabel, true),
    `Två linjer som korsar varandra, med vinklarna ${knownLabel} och ${unknownLabel}`,
  );
}
