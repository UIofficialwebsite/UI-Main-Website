/* Unknown IITians PWA service worker.
 * Intentionally conservative: this site handles live payments, so page
 * navigations are always network-first (online users get the freshest HTML
 * and the latest hashed JS bundles). Only Vite's content-hashed, immutable
 * static assets are cache-first. There is no aggressive offline caching of
 * API/payment responses. */
const CACHE = 'ui-pwa-v1';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Never intercept cross-origin requests (Cashfree, Google, Supabase, GA, etc.)
  if (url.origin !== self.location.origin) return;

  // Page navigations: network-first, fall back to cached app shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL).then((r) => r || Response.error()))
    );
    return;
  }

  // Content-hashed, immutable static assets: cache-first.
  if (/\.(?:js|css|woff2?|png|jpe?g|svg|webp|ico|gif)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
  }
  // Everything else falls through to the default network handling.
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
