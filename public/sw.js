
/* Azkar App service worker (v4)
 *
 * History:
 *  v1: cache-only (too aggressive)
 *  v2: stale-while-revalidate only
 *  v3: network-first for navigations, stale-while-revalidate for /assets/*
 *      and other same-origin GETs. Still suffered from a body-consumed race
 *      where `res.clone()` inside the cache-open microtask failed because
 *      the browser had already read the response body that the SW returned
 *      (the SW is async; the browser can start reading before the cache
 *      put microtask runs).
 *  v4: clone the response synchronously when fetch resolves, hand the clone
 *      to the cache put, and use event.waitUntil so the SW stays alive
 *      long enough to finish background writes. Background refreshes no
 *      longer race with the page consuming the cached body.
 *
 * Strategy:
 *  - Navigations (HTML): network-first with cache fallback -> updates ship
 *    immediately; offline still boots the app shell.
 *  - Hashed build assets (/assets/*): cache-first (content-addressed).
 *  - Other same-origin GETs: stale-while-revalidate.
 *
 * v4 change: clone the response SYNCHRONOUSLY when fetch resolves, then
 * hand the clone to the cache put. The previous version cloned inside a
 * later microtask (after caches.open().then(c => ...)) which raced with
 * the browser consuming the response body and produced:
 *   "Failed to execute 'clone' on 'Response': Response body is already used"
 * Background cache writes are now attached to event.waitUntil so they are
 * not cancelled when the fetch handler returns.
 */
const CACHE_NAME = 'azkar-v4';
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
        event.respondWith(networkFirstShell(req, event));
        return;
    }

    event.respondWith(staleWhileRevalidate(req, event));
});

async function cacheFirst(req) {
    const cached = await caches.match(req);
    if (cached) return cached;
    let res;
    try {
        res = await fetch(req);
    } catch (e) {
        return Response.error();
    }
    if (res && res.status === 200) {
        // Clone synchronously while the body is untouched.
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => undefined);
    }
    return res;
}

async function networkFirstShell(req, event) {
    try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200) {
            const copy = fresh.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(c => c.put('/index.html', copy)).catch(() => undefined));
        }
        return fresh;
    } catch (e) {
        const cached = (await caches.match(req)) || (await caches.match('/index.html'));
        if (cached) return cached;
        throw e;
    }
}

async function staleWhileRevalidate(req, event) {
    const cached = await caches.match(req);

    if (cached) {
        // Return cached immediately; refresh in the background.
        // event.waitUntil keeps the SW alive long enough to finish the put
        // and prevents the browser from cancelling our background fetch.
        event.waitUntil(refreshInBackground(req));
        return cached;
    }

    // No cached copy: fetch fresh, clone immediately, queue cache write.
    let res;
    try {
        res = await fetch(req);
    } catch (e) {
        return Response.error();
    }
    if (res && res.status === 200) {
        const copy = res.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => undefined));
    }
    return res;
}

async function refreshInBackground(req) {
    try {
        const res = await fetch(req);
        if (!res || res.status !== 200) return;
        // Clone synchronously before any consumer (including this function's
        // own awaits below) can touch the body.
        const copy = res.clone();
        const cache = await caches.open(CACHE_NAME);
        await cache.put(req, copy);
    } catch (e) {
        // Cache write failures must never propagate; they would surface as
        // an unhandled rejection in the SW.
    }
}
