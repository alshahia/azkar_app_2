/**
 * Pre-dev cache clear (added 2026-09 after the AzkarListScreen stale-transform
 * incident).
 *
 * Vite's dependency-graph optimizer (node_modules/.vite/) is sticky across
 * HMR. When an import is reshuffled — for example swapping one heroicon
 * for another in a screen component — the optimizer can keep serving the
 * pre-edit transform to the browser even after the source file is
 * correct on disk. The user sees a ReferenceError to the removed symbol
 * and TypeScript + the test suite both pass.
 *
 * Wiping node_modules/.vite/ before every `vite` start forces a fresh
 * prebundle so the dev server can never out-live a real source change.
 * Cold starts are slightly slower the first time, but normal HMR after
 * that is unaffected.
 *
 * Cross-platform: uses fs.rmSync so it works on Windows and POSIX.
 * Safe to run when the directory is missing.
 */
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const cacheDir = join(process.cwd(), 'node_modules', '.vite');

if (existsSync(cacheDir)) {
    rmSync(cacheDir, { recursive: true, force: true });
    console.log('[predev] cleared node_modules/.vite/ to avoid stale transforms');
} else {
    // First run on a fresh clone — nothing to clear, stay quiet unless verbose.
    if (process.env.PREDEV_VERBOSE === '1') {
        console.log('[predev] no node_modules/.vite/ to clear');
    }
}
