import { ImageResponse } from "next/og";

/** Renders the app icon (terminal-style "S_" on near-black) as a square PNG. */
export function renderAppIcon(size: number, { maskable = false } = {}) {
  // Maskable icons get cropped to a circle, so keep the glyph inside the safe zone.
  const glyphScale = maskable ? 0.36 : 0.48;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e0e0e",
          border: maskable ? "none" : `${Math.max(2, size * 0.02)}px solid #3a3a3a`,
          borderRadius: maskable ? 0 : size * 0.12,
          color: "#f5654a",
          fontSize: size * glyphScale,
          fontWeight: 700,
          fontFamily: "monospace",
        }}
      >
        S_
      </div>
    ),
    { width: size, height: size },
  );
}
