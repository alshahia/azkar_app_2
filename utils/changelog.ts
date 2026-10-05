/**
 * CHANGELOG parser + what's-new gate (M4-T4).
 *
 * The CHANGELOG.md at repo root is the single source of truth. Each
 * version block starts with a heading `## <version> (<date>)`. The first
 * block at the top of the file is the most recent release; the parser
 * returns entries in the order they appear (newest first).
 *
 * The app stores `lastSeenVersion` in `UserPreferences.lastSeenVersion`.
 * On launch, if `currentAppVersion > lastSeenVersion`, every entry with
 * `version > lastSeenVersion` is rendered in the What's-new modal. The
 * user dismisses once and the choice is persisted.
 *
 * No markdown-to-HTML conversion: the parser only extracts the title +
 * bullet list for each version. Bullets are trimmed of the leading `-`
 * and any whitespace; bold/italic markers are stripped so the modal can
 * render plain text without an XSS vector.
 *
 * Loading strategy: production uses Vite's `?raw` import to bundle the
 * markdown into the chunk. Tests (vitest, which doesn't always honour
 * `?raw`) fall back to a Node `fs.readFileSync` so the bundled file
 * can be exercised end-to-end. The resolution happens once at module
 * load time and the parsed entry list is cached.
 */
// No static node: imports: the browser bundle can't resolve them and
// Rollup's __vite-browser-external shim throws at parse time. Every
// Node-only reference lives inside the async loader so the bundler
// can tree-shake them out of the production bundle.

async function loadChangelogRaw(): Promise<string> {
    try {
        // Vite production bundle path: the file is colocated at the repo
        // root, two levels up from utils/changelog.ts.
        const raw = (import.meta as { glob?: (p: string, opts: { query: string; eager: boolean }) => Record<string, { default: string }> }).glob;
        if (raw) {
            const matches = raw('../../CHANGELOG.md', { query: '?raw', eager: true }) as Record<string, { default: string }>;
            const first = Object.values(matches)[0];
            if (first) return first.default;
        }
    } catch {
        // Fall through to the Node fallback below.
    }
    // Vitest / Node path: read from disk. The Node built-ins are loaded
    // dynamically so the browser bundle never references them. Vite's
    // browser shim does NOT throw on the dynamic imports: it returns empty
    // stub objects (e.g. node:fs -> {}, node:url -> {} with no
    // fileURLToPath). So we can't rely on the try/catch alone to detect the
    // browser path — we also need to confirm the methods we actually call
    // exist as functions. Without that check, the cwd fallback below would
    // evaluate `process.cwd()` in a context where `process` is undefined
    // (ReferenceError).
    let fsMod: typeof import('node:fs') | null = null;
    let pathMod: typeof import('node:path') | null = null;
    let urlMod: typeof import('node:url') | null = null;
    try {
        fsMod = await import('node:fs');
        pathMod = await import('node:path');
        urlMod = await import('node:url');
    } catch {
        // Dynamic import itself failed (older bundlers / strict CSP).
        // No Node runtime available. Caller treats the failure as
        // "no entries" so the UI degrades to a hidden modal.
        return '';
    }
    // Some bundler/browser shims (Vite) return Proxy stubs that throw on
    // property access. Wrap each method probe so a hostile shim can't
    // escape into the cwd fallback and crash with a ReferenceError.
    const safeHasFn = (mod: unknown, name: string): boolean => {
        try {
            const fn = (mod as Record<string, unknown> | null)?.[name];
            return typeof fn === 'function';
        } catch {
            return false;
        }
    };
    const hasFsRead = safeHasFn(fsMod, 'readFileSync');
    const hasPathResolve = safeHasFn(pathMod, 'resolve');
    const hasPathDirname = safeHasFn(pathMod, 'dirname');
    const hasUrlFile = safeHasFn(urlMod, 'fileURLToPath');
    if (!hasFsRead || !hasPathResolve || !hasPathDirname) {
        // Browser path (or a stub that lacks the methods we need). The
        // production bundle above already serves CHANGELOG.md via Vite's
        // import.meta.glob, so reaching here means there really is nothing
        // to show.
        return '';
    }
    // Walk up from this module's URL until CHANGELOG.md is found, then
    // fall back to cwd. Vitest is configured to run with cwd at the
    // repo root, so the cwd fallback is the common case.
    const candidates: string[] = [];
    if (hasUrlFile) {
        try {
            const here = (pathMod as typeof import('node:path')).dirname(
                (urlMod as typeof import('node:url')).fileURLToPath(import.meta.url)
            );
            let dir = here;
            for (let i = 0; i < 6; i++) {
                candidates.push((pathMod as typeof import('node:path')).resolve(dir, 'CHANGELOG.md'));
                const parent = (pathMod as typeof import('node:path')).dirname(dir);
                if (parent === dir) break;
                dir = parent;
            }
        } catch {
            // fileURLToPath can throw on exotic import.meta.url shapes;
            // fall through to the cwd candidate.
        }
    }
    // `process` only exists in a Node runtime. The function checks above
    // already require real node:fs, so we're effectively in Node, but guard
    // the access so a partially-stubbed environment can't crash here.
    if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
        try {
            candidates.push(
                (pathMod as typeof import('node:path')).resolve(process.cwd(), 'CHANGELOG.md')
            );
        } catch {
            // ignore — fall through to the empty result
        }
    }
    for (const candidate of candidates) {
        try {
            return (fsMod as typeof import('node:fs')).readFileSync(candidate, 'utf8');
        } catch {
            // try the next candidate
        }
    }
    return '';
}

export interface ChangelogEntry {
    /** Semver string, e.g. "1.1.0". */
    version: string;
    /** Date string from the heading, e.g. "2026-09-10". May be empty. */
    date: string;
    /** Plain-text bullets (already stripped of markdown markers). */
    bullets: string[];
}

const VERSION_HEADING = /^##\s+(?:v?)([0-9]+(?:\.[0-9]+){0,2})\b(?:\s*[()[]([^)\]]+)[)\]])?\s*$/;
const BULLET = /^\s*[-*]\s+(.+?)\s*$/;

/** Parse the bundled CHANGELOG.md into a list of entries (newest first). */
export function parseChangelog(rawText: string): ChangelogEntry[] {
    const lines = rawText.split(/\r?\n/);
    const entries: ChangelogEntry[] = [];
    let current: ChangelogEntry | null = null;

    for (const line of lines) {
        const heading = line.match(VERSION_HEADING);
        if (heading) {
            if (current) entries.push(current);
            current = { version: heading[1], date: (heading[2] || '').trim(), bullets: [] };
            continue;
        }
        if (!current) continue;
        const bulletMatch = line.match(BULLET);
        if (bulletMatch) {
            current.bullets.push(stripInlineMarkdown(bulletMatch[1]));
            continue;
        }
        // Ignore blank lines and non-bullet content between bullets.
    }
    if (current) entries.push(current);
    return entries;
}

/** Strip the markdown markers the modal cares about: **bold**, *italic*,
 *  `code`, and trailing whitespace. Anything else passes through; we
 *  intentionally do NOT parse links so a paste of "http://..." stays as
 *  plain text (no XSS via an injected [label](href)). */
function stripInlineMarkdown(s: string): string {
    return s
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .trim();
}

/** Compare two semver strings. Returns -1 / 0 / 1 like Array#sort.
 *  Missing components are treated as 0 (so "1" == "1.0.0"). */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
    const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
    const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] ?? 0;
        const y = pb[i] ?? 0;
        if (x < y) return -1;
        if (x > y) return 1;
    }
    return 0;
}

/** Bundled CHANGELOG.md parsed lazily on first access; tests pass an
 *  explicit `rawText` instead of importing this module. */
let cachedEntries: ChangelogEntry[] | null = null;
let cachedRaw: string | null = null;
async function getRaw(): Promise<string> {
    if (cachedRaw === null) cachedRaw = await loadChangelogRaw();
    return cachedRaw;
}
let cachedLoadPromise: Promise<ChangelogEntry[]> | null = null;
export function loadChangelogEntries(): Promise<ChangelogEntry[]> {
    if (cachedEntries) return Promise.resolve(cachedEntries);
    if (!cachedLoadPromise) {
        cachedLoadPromise = getRaw().then((raw) => {
            const entries = parseChangelog(raw);
            cachedEntries = entries;
            return entries;
        });
    }
    return cachedLoadPromise;
}

/** Return the entries whose version is strictly greater than `lastSeen`.
 *  If `lastSeen` is null/empty, every entry is returned (first launch).
 *  Async because the underlying loadChangelogEntries reads from disk
 *  under vitest and from the Vite ?raw import under the production
 *  bundle; both paths return a Promise. */
export async function entriesSince(lastSeen: string | null | undefined, entries?: ChangelogEntry[]): Promise<ChangelogEntry[]> {
    const list = entries ?? (await loadChangelogEntries());
    if (!lastSeen) return list;
    return list.filter((e) => compareSemver(e.version, lastSeen) > 0);
}

/** Reset the cache (test seam). */
export function _resetChangelogCache(): void {
    cachedEntries = null;
    cachedRaw = null;
}
