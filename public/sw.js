
/* Azkar App service worker (v3)
 * Strategy:
 *  - Navigations (HTML): network-first with cache fallback -> updates ship
 *    immediately; offline still boots the app shell.
 *  - Hashed build assets (/assets/*): cache-first (content-addressed).
 *  - Other same-origin GETs: stale-while-revalidate.
 * The old v2 worker cached a Tailwind CDN URL and a font stylesheet this app
 * never loaded; that list is gone, and old caches are purged on activate.
 */
const CACHE_NAME = 'azkar-v3';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/images/icon-192.png'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url))))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never intercept cross-origin

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(networkFirstShell(req));
    return;
  }

  event.respondWith(staleWhileRevalidate(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.status === 200) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, res.clone());
  }
  return res;
}

async function networkFirstShell(req) {
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put('/index.html', fresh.clone());
    }
    return fresh;
  } catch (e) {
    const cached = (await caches.match(req)) || (await caches.match('/index.html'));
    if (cached) return cached;
    throw e;
  }
}

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const refresh = fetch(req).then(res => {
    if (res && res.status === 200) {
      caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
    }
    return res;
  }).catch(() => undefined);
  return cached || (await refresh) || Response.error();
}
