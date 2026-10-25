"use client";

import { useEffect } from "react";

/** Registers /sw.js so the site is installable as a PWA. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Not critical: the site works fine without a service worker.
      });
  }, []);

  return null;
}
