import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets verification builds use their own folder (NEXT_DIST_DIR=.next-verify)
  // so they never disturb a running `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Cache Components is left off: almost every page is personalised via the
  // Supabase session cookie, so a static shell would gain us very little.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
