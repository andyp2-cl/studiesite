import { ImageResponse } from "next/og";

/** Renders the app icon (green tile with a stylised "S") as a square PNG. */
export function renderAppIcon(size: number, { maskable = false } = {}) {
  // Maskable icons get cropped to a circle, so keep the glyph inside the safe zone.
  const glyphScale = maskable ? 0.45 : 0.6;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1ed760 0%, #0f8a3c 100%)",
          borderRadius: maskable ? 0 : size * 0.22,
          color: "#121212",
          fontSize: size * glyphScale,
          fontWeight: 800,
          letterSpacing: -size * 0.02,
        }}
      >
        S
      </div>
    ),
    { width: size, height: size },
  );
}
