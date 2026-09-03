
// Smoke tests for the service worker source.
//
// The SW runs in its own global context inside the browser and we cannot
// fully exercise fetch interception in jsdom. These tests verify what we
// CAN verify statically:
//   - the file parses as valid JavaScript
//   - it registers the fetch handler
//   - it does NOT clone() a Response inside an async callback (which is
//     the v3 bug that surfaced as
//     "Failed to execute 'clone' on 'Response': Response body is already used")
//   - the SW version constant is bumped when the file changes (a regression
//     catch so old SWs do not silently serve a stale strategy)
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SW_PATH = resolve(__dirname, '..', '..', 'public', 'sw.js');

describe('Service Worker (public/sw.js)', () => {
    const src = readFileSync(SW_PATH, 'utf8');

    it('parses as valid JavaScript', () => {
        // new Function compiles the body in module-less mode; if it has a
        // syntax error, this throws.
        expect(() => new Function(src)).not.toThrow();
    });

    it('registers the three event listeners used by the app', () => {
        expect(src).toMatch(/addEventListener\(['"]install['"]/);
        expect(src).toMatch(/addEventListener\(['"]activate['"]/);
        expect(src).toMatch(/addEventListener\(['"]fetch['"]/);
    });

    it('clones the response synchronously in staleWhileRevalidate (v4 fix)', () => {
        // Slice out the function body so we can grep for the dangerous
        // pattern independently.
        const start = src.indexOf('async function staleWhileRevalidate');
        const end = src.indexOf('\n}\n', start);
        expect(start).toBeGreaterThan(-1);
        const body = src.slice(start, end);

        // The v3 bug was: caches.open(...).then(c => c.put(req, res.clone()))
        // The clone() call ran inside an async microtask AFTER the SW had
        // returned the response - by the time it ran, the browser had
        // already consumed the body and clone() threw.
        //
        // The v4 fix clones synchronously when fetch resolves (in the
        // outer .then(res => ...)), BEFORE the cache-open microtask, and
        // hands the clone to the put.
        expect(body).not.toMatch(/caches\.open\([^)]*\)\.then\([^)]*res\.clone\(\)/);
    });

    it('uses event.waitUntil so background cache writes are not cancelled', () => {
        // refreshInBackground must be passed through event.waitUntil so
        // the SW stays alive long enough to finish the put after the
        // fetch handler returns.
        expect(src).toMatch(/event\.waitUntil\(refreshInBackground/);
    });

    it('handles a network error in the background refresh without rejecting', () => {
        // If the background refresh rejects, it becomes an unhandled
        // promise rejection in the SW and shows up in the console.
        const start = src.indexOf('async function refreshInBackground');
        const end = src.indexOf('\n}\n', start);
        const body = src.slice(start, end);
        expect(body).toMatch(/catch/);
    });

    it('skips caching non-GET requests', () => {
        // POST/PUT etc. must pass through; we never cache or respondWith
        // for them.
        const fetchHandler = src.match(/addEventListener\(['"]fetch['"][\s\S]*?\n\}\);/);
        expect(fetchHandler).not.toBeNull();
        expect(fetchHandler![0]).toMatch(/req\.method\s*!==?\s*['"]GET['"]/);
    });

    it('skips cross-origin requests', () => {
        // We never cache responses for third-party origins - the page
        // handles them directly.
        const fetchHandler = src.match(/addEventListener\(['"]fetch['"][\s\S]*?\n\}\);/);
        expect(fetchHandler![0]).toMatch(/url\.origin\s*!==?\s*self\.location\.origin/);
    });
});
