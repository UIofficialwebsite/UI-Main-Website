/* Unknown IITians PWA service worker.
 * Intentionally conservative: this site handles live payments, so page
 * navigations are always network-first (online users get the freshest HTML
 * and the latest hashed JS bundles). Only Vite's content-hashed, immutable
 * static assets are cache-first.
 *
 * CRITICAL: Vercel's SPA catch-all rewrite serves index.html (HTTP 200) for any
 * unmatched path — including a stale/missing hashed chunk. We must NEVER cache or
 * serve that HTML under a .js/.css URL, or the app boots with HTML where script
 * is expected and white-screens permanently. Hence the content-type guard below.
 * The cache name is versioned so a new SW purges any previously poisoned cache. */
const CACHE = 'ui-pwa-v2';
const OFFLINE_URL = '/';

self.addEventListener('install', () => {
  // Activate immediately; the offline shell is (re)populated on first navigation.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop every older cache (incl. any poisoned v1 entries).
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// A response is safe to treat as a real same-origin asset only if it's a basic
// 200 that is NOT the SPA's HTML fallback for a .js/.css request.
function isUsableAsset(url, res) {
  if (!res || !res.ok || res.type !== 'basic') return false;
  const isScriptOrStyle = /\.(?:js|css)$/.test(url.pathname);
  const ct = res.headers.get('content-type') || '';
  if (isScriptOrStyle && ct.includes('text/html')) return false; // SPA fallback — reject
  return true;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Never intercept cross-origin requests (Cashfree, Google, Supabase, GA, etc.)
  if (url.origin !== self.location.origin) return;

  // Page navigations: network-first. Keep the LATEST good HTML as the offline
  // shell so a fallback is never a months-old build referencing dead chunks.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(OFFLINE_URL, copy)).catch(() => {});
          }
          return res;
        } catch {
          const cached = await caches.match(OFFLINE_URL);
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Content-hashed, immutable static assets: cache-first, but only ever cache or
  // serve a genuine asset response (never the HTML catch-all — see guard above).
  if (/\.(?:js|css|woff2?|png|jpe?g|svg|webp|ico|gif)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (isUsableAsset(url, res)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
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

/* ---- Web Push ----
 * Payload (JSON) sent by the send-push edge function:
 *   { title, body, url?, icon?, tag? }
 * Falls back gracefully if a push arrives with no/non-JSON data. */
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_e) {
    data = { title: 'Unknown IITians', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Unknown IITians';
  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || undefined,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an already-open tab on this origin instead of opening a new one.
      for (const client of clientList) {
        try {
          const url = new URL(client.url);
          if (url.origin === self.location.origin && 'focus' in client) {
            client.navigate(target);
            return client.focus();
          }
        } catch (_e) { /* ignore malformed client url */ }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
