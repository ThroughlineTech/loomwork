// Loomwork Mobile — Service Worker
// Network-first for navigations, cache-first for assets
// Cache name is bumped each deploy to ensure updates reach PWA users

const CACHE_VERSION = "2026-03-03T00";  // bump with each deploy
const CACHE_NAME = `loomwork-mobile-${CACHE_VERSION}`;
const SHELL_URLS = ["/mobile/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Purge all old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle /mobile/ navigations — let API calls and other requests pass through
  if (
    event.request.mode === "navigate" &&
    (url.pathname === "/mobile" || url.pathname.startsWith("/mobile/"))
  ) {
    // Network-first: try network, fall back to cache for offline support
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});
