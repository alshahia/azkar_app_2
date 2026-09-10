/**
 * Reciter catalog - bundled verified list + additive refresh channel.
 *
 * The bundled catalog (data/static/reciters.json) only contains ids probed
 * against cdn.islamic.network. refreshRecitersIfWifi() merges NEW reciters
 * fetched from the alquran.cloud audio-editions list (the identifier source
 * behind the cdn.islamic.network per-ayah URL convention), but only after
 * each candidate id also passes a live HEAD probe against the CDN - a
 * reciter that answers 404 never enters the picker.
 *
 * The refresh is strictly additive and Wi-Fi-gated: cell data and
 * Data-Saver sessions never trigger a catalog fetch, and the merged result
 * is cached through the storage adapter so it survives restarts without an
 * app release.
 */

import { Capacitor } from '@capacitor/core';
import bundledCatalog from '../data/static/reciters.json';

export interface Reciter {
    id: string;          // identifier expected by cdn.islamic.network
    name: string;        // Arabic display name
    style: string;       // short description
}

const DEFAULT_RECITER_ID = 'ar.alafasy';
const KV_KEY = 'quran_reciter_cache';
const EDITIONS_URL = 'https://api.alquran.cloud/v1/edition?format=audio&language=ar';
const FETCH_TIMEOUT_MS = 10_000;
const PROBE_LIMIT = 40;           // never probe more new ids per refresh
const PROBE_CONCURRENCY = 5;

interface KvShape {
    additions: Reciter[];
    lastRefreshAt: number;
}

interface CatalogDeps {
    fetchFn: typeof fetch;
    isWifiFn: () => Promise<boolean>;
    probeFn: (id: string) => Promise<boolean>;
}

const defaultDeps: CatalogDeps = {
    fetchFn: (...args) => fetch(...args),
    isWifiFn: isWifi,
    probeFn: probeCdn,
};

let deps: CatalogDeps = defaultDeps;
let storage: { getKv: <T>(key: string) => Promise<T | null>; setKv: (key: string, value: unknown) => Promise<void> } | null = null;
let bundled: Reciter[] = (bundledCatalog.reciters as Reciter[]).slice();
let additions: Reciter[] = [];
let lastRefreshAt: number | null = null;
let initialized = false;
let refreshPromise: Promise<number> | null = null;
const listeners = new Set<() => void>();

// --- Test seam -----------------------------------------------------------

export function _setCatalogDepsForTesting(overrides: Partial<CatalogDeps> & {
    bundled?: Reciter[];
} | null): void {
    if (overrides === null) {
        deps = defaultDeps;
        bundled = (bundledCatalog.reciters as Reciter[]).slice();
        additions = [];
        lastRefreshAt = null;
        initialized = false;
        refreshPromise = null;
        listeners.clear();
        return;
    }
    deps = {
        fetchFn: overrides.fetchFn ?? defaultDeps.fetchFn,
        isWifiFn: overrides.isWifiFn ?? defaultDeps.isWifiFn,
        probeFn: overrides.probeFn ?? defaultDeps.probeFn,
    };
    if (overrides.bundled) bundled = overrides.bundled.slice();
    // Full state reset keeps tests isolated regardless of call shape.
    additions = [];
    lastRefreshAt = null;
    initialized = false;
    refreshPromise = null;
}

// --- Read API ------------------------------------------------------------

export function getReciters(): Reciter[] {
    return [...bundled, ...additions];
}

export function getReciter(id: string): Reciter | undefined {
    return getReciters().find(r => r.id === id);
}

export function getDefaultReciterId(): string {
    return getReciter(DEFAULT_RECITER_ID) ? DEFAULT_RECITER_ID : (getReciters()[0]?.id ?? DEFAULT_RECITER_ID);
}

export function getLastRefreshAt(): number | null {
    return lastRefreshAt;
}

export function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
}

function notify(): void {
    for (const fn of Array.from(listeners)) {
        try { fn(); } catch { /* listener errors never break the catalog */ }
    }
}

// --- Pure merge (unit-tested) --------------------------------------------

/** Bundled entries stay first and verbatim; extras are deduped by id. */
export function mergeReciters(bundledList: Reciter[], extra: Reciter[]): Reciter[] {
    const seen = new Set(bundledList.map(r => r.id));
    const merged = bundledList.slice();
    for (const r of extra) {
        if (!r || typeof r.id !== 'string' || !r.id) continue;
        if (seen.has(r.id)) continue;
        merged.push({ id: r.id, name: r.name || r.id, style: r.style || 'مرتل' });
        seen.add(r.id);
    }
    return merged;
}

// --- Init / refresh ------------------------------------------------------

/** Loads the persisted additive cache. Safe to call more than once. */
export async function initCatalog(
    kv: { getKv: <T>(key: string) => Promise<T | null>; setKv: (key: string, value: unknown) => Promise<void> },
): Promise<void> {
    storage = kv;
    if (initialized) return;
    initialized = true;
    try {
        const cached = await kv.getKv<KvShape>(KV_KEY);
        if (cached && Array.isArray(cached.additions)) {
            additions = mergeReciters([], cached.additions);
            lastRefreshAt = typeof cached.lastRefreshAt === 'number' ? cached.lastRefreshAt : null;
            if (additions.length > 0) notify();
        }
    } catch {
        // Corrupt cache simply falls back to the bundled list.
    }
}

/**
 * Merges new reciters while on Wi-Fi. Returns the number of ids added.
 * Concurrent callers share one in-flight refresh.
 */
export function refreshRecitersIfWifi(): Promise<number> {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
        try {
            if (!initialized) return 0; // never refresh before hydration
            if (!(await deps.isWifiFn())) return 0;
            const remote = await fetchAudioEditions();
            const known = new Set(getReciters().map(r => r.id));
            const candidates = remote.filter(r => !known.has(r.id)).slice(0, PROBE_LIMIT);
            const verified: Reciter[] = [];
            // Probe in small batches so a slow CDN never stalls the refresh.
            for (let i = 0; i < candidates.length; i += PROBE_CONCURRENCY) {
                const batch = candidates.slice(i, i + PROBE_CONCURRENCY);
                const results = await Promise.all(batch.map(async r => ({
                    reciter: r,
                    ok: await deps.probeFn(r.id).catch(() => false),
                })));
                for (const res of results) {
                    if (res.ok && !known.has(res.reciter.id)) {
                        verified.push(res.reciter);
                        known.add(res.reciter.id);
                    }
                }
            }
            if (verified.length === 0) return 0;
            additions = mergeReciters(additions, verified);
            lastRefreshAt = Date.now();
            if (storage) {
                try {
                    await storage.setKv(KV_KEY, { additions, lastRefreshAt } satisfies KvShape);
                } catch { /* best-effort persistence */ }
            }
            notify();
            return verified.length;
        } finally {
            refreshPromise = null;
        }
    })();
    return refreshPromise;
}

// --- Internals -----------------------------------------------------------

async function isWifi(): Promise<boolean> {
    try {
        if (Capacitor.isNativePlatform()) {
            const { Network } = await import('@capacitor/network');
            const status = await Network.getStatus();
            return status.connectionType === 'wifi';
        }
        // Web: Network Information API. When metering is unknown we stay
        // conservative and skip the refresh entirely.
        const conn = (navigator as unknown as {
            connection?: { type?: string; effectiveType?: string; saveData?: boolean };
        }).connection;
        if (!conn || conn.saveData) return false;
        return conn.type === 'wifi' || conn.type === 'ethernet';
    } catch {
        return false;
    }
}

interface EditionRow {
    identifier?: string;
    name?: string;
    englishName?: string;
    format?: string;
    type?: string;
    language?: string;
}

/** Arabic-dominant display name, falling back to the transliterated one. */
function pickDisplayName(row: EditionRow): string {
    const arabic = [row.name, row.englishName].find(n => typeof n === 'string' && /[\u0600-\u06FF]/.test(n));
    return arabic || row.name || row.englishName || '';
}

async function fetchAudioEditions(): Promise<Reciter[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await deps.fetchFn(EDITIONS_URL, { signal: controller.signal });
        if (!res.ok) return [];
        const payload = (await res.json()) as { data?: EditionRow[] | { editions?: EditionRow[] } } | EditionRow[];
        const rows: EditionRow[] = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.data)
                ? payload.data
                : Array.isArray(payload.data?.editions)
                    ? payload.data.editions
                    : [];
        const out: Reciter[] = [];
        for (const row of rows) {
            if (!row || typeof row.identifier !== 'string') continue;
            if (!row.identifier.startsWith('ar.')) continue;
            if (row.format && row.format !== 'audio') continue;
            if (row.type && row.type !== 'audio') continue;
            out.push({ id: row.identifier, name: pickDisplayName(row) || row.identifier, style: 'مرتل' });
        }
        return out;
    } catch {
        return [];
    } finally {
        clearTimeout(timer);
    }
}

async function probeCdn(id: string): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const url = 'https://cdn.islamic.network/quran/audio/128/' + encodeURIComponent(id) + '/1.mp3';
        const res = await deps.fetchFn(url, { method: 'HEAD', signal: controller.signal });
        return res.ok;
    } catch {
        return false;
    } finally {
        clearTimeout(timer);
    }
}
