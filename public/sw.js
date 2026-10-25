// Minimal service worker: makes the app installable. No offline caching yet,
// so students always get fresh tasks and progress from the server.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass through to the network.
});
