/// <reference types="vite/client" />
/**
 * AudioCache - offline-first cache for Quran recitation audio.
 * See README at the bottom of this module's public API for a high-level overview.
 *
 * M1-T3 adds resumable downloads: backends MAY implement the optional
 * partial-file protocol (getPartialBytes/appendPartial/commitPartial/
 * discardPartial). The mobile backend streams each file into a .part file
 * so an interrupted download resumes from the exact byte offset; backends
 * without the protocol accumulate each file in memory instead.
 */

import { Capacitor } from '@capacitor/core';
import { ayahAudioUrl } from './QuranService';
import { APP_VERSION } from '../utils/version';

export interface AudioSource {
    url: string;
    fromCache: boolean;
}

export interface CacheStats {
    entries: number;
    totalBytes: number;
}

export interface DownloadProgress {
    done: number;
    total: number;
    bytesSoFar: number;
    currentAyah?: number;
    /** Bytes received so far for the file currently downloading. */
    currentAyahBytes?: number;
}

export interface SurahDownloadResult {
    downloaded: number;
    skipped: number;
    failed: number;
    bytes: number;
    /** True when the loop exited early because the caller paused it. */
    aborted?: boolean;
}

export interface IndexEntry {
    reciterId: string;
    ayah: number;
    bytes: number;
    lastAccessedAt: number;
}

export interface ReciterCacheStats {
    reciterId: string;
    entries: number;
    bytes: number;
}

interface CacheBackend {
    lookup(reciterId: string, globalAyah: number): Promise<string | null>;
    store(reciterId: string, globalAyah: number, bytes: ArrayBuffer): Promise<string>;
    remove(reciterId: string, globalAyah: number): Promise<void>;
    has(reciterId: string, globalAyah: number): Promise<boolean>;
    list(): Promise<IndexEntry[]>;
    clear(): Promise<void>;
    enforceCap?(targetBytes: number): Promise<void>;

    // --- Partial download protocol (all optional) ---

    /** Bytes already written to the partial file (0 when none). */
    getPartialBytes?(reciterId: string, ayah: number): Promise<number>;
    /** Appends a chunk; resolves with the new total written. */
    appendPartial?(reciterId: string, ayah: number, chunk: ArrayBuffer): Promise<number>;
    /** Promotes the partial file to a complete cached file. */
    commitPartial?(reciterId: string, ayah: number): Promise<string>;
    /** Throws away the partial file (e.g. server ignored a Range request). */
    discardPartial?(reciterId: string, ayah: number): Promise<void>;
    /** Deletes every cached file and partial of one reciter. */
    removeReciter?(reciterId: string): Promise<void>;
}

const DEFAULT_MAX_BYTES = 500 * 1024 * 1024;
let backendInstance: CacheBackend | null = null;
let maxBytes = DEFAULT_MAX_BYTES;
const inFlight = new Map<string, Promise<AudioSource>>();

export function _setBackendForTesting(b: CacheBackend | null): void {
    backendInstance = b;
    inFlight.clear();
}

export function setMaxBytes(bytes: number): void {
    if (!Number.isFinite(bytes) || bytes <= 0) return;
    maxBytes = Math.floor(bytes);
}

export function getMaxBytes(): number {
    return maxBytes;
}

let backendPromise: Promise<CacheBackend> | null = null;

function getBackend(): Promise<CacheBackend> {
    if (backendInstance) return Promise.resolve(backendInstance);
    if (backendPromise) return backendPromise;
    backendPromise = (async () => {
        if (Capacitor.isNativePlatform()) {
            // Dynamic import keeps the Capacitor Filesystem plugin out of the web bundle.
            const mod = await import('./audioCacheMobile');
            backendInstance = mod.createMobileBackend();
        } else {
            backendInstance = createWebBackend();
        }
        return backendInstance;
    })();
    return backendPromise;
}

function cacheKey(reciterId: string, ayah: number): string {
    // appVersion suffix isolates stale entries when the running app version
    // changes (format/layout bump). selfHealAudioCache clears the whole cache
    // when the manifest appVersion differs, but the per-key suffix is the
    // belt-and-braces guarantee that no old entry survives.
    return APP_VERSION + ':' + reciterId + ':' + ayah;
}

export async function getAudioSourceUrl(reciterId: string, globalAyah: number): Promise<AudioSource> {
    const key = cacheKey(reciterId, globalAyah);
    const pending = inFlight.get(key);
    if (pending) return pending;

    const promise = (async (): Promise<AudioSource> => {
        const backend = await getBackend();
        try {
            const local = await backend.lookup(reciterId, globalAyah);
            if (local) return { url: local, fromCache: true };
        } catch (e) {
            console.warn('AudioCache lookup failed; falling back to network', e);
        }

        try {
            const res = await fetch(ayahAudioUrl(reciterId, globalAyah));
            if (!res.ok) throw new Error('HTTP ' + res.status + ' fetching ayah audio');
            const buf = await res.arrayBuffer();
            try {
                const local = await backend.store(reciterId, globalAyah, buf);
                return { url: local, fromCache: true };
            } catch (e) {
                console.warn('AudioCache store failed; using remote URL', e);
                return { url: ayahAudioUrl(reciterId, globalAyah), fromCache: false };
            }
        } catch (e) {
            console.warn('AudioCache fetch failed', e);
            return { url: ayahAudioUrl(reciterId, globalAyah), fromCache: false };
        }
    })();

    inFlight.set(key, promise);
    try {
        return await promise;
    } finally {
        inFlight.delete(key);
    }
}

export function prefetchAyah(reciterId: string, globalAyah: number): void {
    void getAudioSourceUrl(reciterId, globalAyah).catch(() => undefined);
}

export async function isCached(reciterId: string, globalAyah: number): Promise<boolean> {
    try {
        return await (await getBackend()).has(reciterId, globalAyah);
    } catch {
        return false;
    }
}

export async function getCacheStats(): Promise<CacheStats> {
    try {
        const list = await (await getBackend()).list();
        const totalBytes = list.reduce((sum, e) => sum + e.bytes, 0);
        return { entries: list.length, totalBytes };
    } catch {
        return { entries: 0, totalBytes: 0 };
    }
}

export async function clearCache(): Promise<void> {
    try {
        await (await getBackend()).clear();
    } catch (e) {
        console.warn('AudioCache clear failed', e);
    }
}

/** Cache usage grouped by reciter, largest first (Settings cleanup view). */
export async function getCacheStatsByReciter(): Promise<ReciterCacheStats[]> {
    try {
        const list = await (await getBackend()).list();
        const map = new Map<string, ReciterCacheStats>();
        for (const e of list) {
            const cur = map.get(e.reciterId) ?? { reciterId: e.reciterId, entries: 0, bytes: 0 };
            cur.entries += 1;
            cur.bytes += e.bytes;
            map.set(e.reciterId, cur);
        }
        return Array.from(map.values()).sort((a, b) => b.bytes - a.bytes);
    } catch {
        return [];
    }
}

/** Deletes every cached file and partial belonging to one reciter. */
export async function removeReciterAudio(reciterId: string): Promise<void> {
    try {
        const backend = await getBackend();
        await backend.removeReciter?.(reciterId);
    } catch (e) {
        console.warn('AudioCache removeReciter failed', e);
    }
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
    return view.byteOffset === 0 && view.byteLength === view.buffer.byteLength
        ? view.buffer as ArrayBuffer
        : view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

/**
 * Streams one ayah file into the backend with byte-offset resume:
 *  1. ask the backend how many bytes already sit in its partial file
 *  2. request the remainder with "Range: bytes=N-" (HTTP 206), or the whole
 *     file when the server ignores Range (HTTP 200 -> partial discarded)
 *  3. append chunks as they arrive so an interruption keeps every byte
 *  4. commit the partial into a complete cached file
 * Backends without the partial protocol fall back to in-memory accumulation.
 */
async function fetchAndStreamStore(
    backend: CacheBackend,
    reciterId: string,
    globalAyah: number,
    onFileBytes?: (bytes: number) => void,
): Promise<number> {
    let offset = 0;
    if (backend.getPartialBytes) {
        offset = await backend.getPartialBytes(reciterId, globalAyah);
        if (!Number.isFinite(offset) || offset < 0) offset = 0;
    }

    const init: RequestInit | undefined = offset > 0
        ? { headers: { Range: 'bytes=' + offset + '-' } }
        : undefined;
    const res = await fetch(ayahAudioUrl(reciterId, globalAyah), init);
    if (!res.ok) throw new Error('HTTP ' + res.status);

    if (res.status !== 206 && offset > 0) {
        // Server ignored the Range header - restart the file from scratch.
        offset = 0;
        try { await backend.discardPartial?.(reciterId, globalAyah); } catch { /* best-effort */ }
    }

    const body = res.body;
    if (!body) {
        // Older engines: no streaming - read the whole file in one shot.
        const buf = await res.arrayBuffer();
        if (offset > 0) {
            try { await backend.discardPartial?.(reciterId, globalAyah); } catch { /* best-effort */ }
        }
        await backend.store(reciterId, globalAyah, buf);
        return buf.byteLength;
    }

    const reader = body.getReader();
    const memoryChunks: Uint8Array[] = [];
    // A 206 body starts AT the requested offset (bytes we still need), and a
    // 200 body (Range ignored) has already had its partial discarded - so in
    // both cases every byte read is appended to the backend as-is.
    let written = offset;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value || value.byteLength === 0) continue;
            if (backend.appendPartial) {
                written = await backend.appendPartial(reciterId, globalAyah, toArrayBuffer(value));
            } else {
                memoryChunks.push(value);
                written += value.byteLength;
            }
            onFileBytes?.(written);
        }
        if (backend.appendPartial && backend.commitPartial) {
            const url = await backend.commitPartial(reciterId, globalAyah);
            void url;
        } else {
            const parts: ArrayBuffer[] = memoryChunks.map(c => toArrayBuffer(c));
            const merged = new Uint8Array(written);
            let pos = 0;
            for (const part of parts) {
                merged.set(new Uint8Array(part), pos);
                pos += part.byteLength;
            }
            await backend.store(reciterId, globalAyah, merged.buffer as ArrayBuffer);
        }
        return written;
    } catch (e) {
        // Keep whatever reached the backend; the next attempt resumes.
        try { await reader.cancel(); } catch { /* already closed */ }
        throw e;
    }
}

export async function downloadSurah(
    reciterId: string,
    surahAyat: ReadonlyArray<{ globalNumber: number }>,
    onProgress?: (p: DownloadProgress) => void,
    shouldContinue?: () => boolean,
): Promise<SurahDownloadResult> {
    const total = surahAyat.length;
    let downloaded = 0;
    let skipped = 0;
    let failed = 0;
    let bytes = 0;
    let aborted = false;
    let lastEmit = 0;
    const backend = await getBackend();
    for (let i = 0; i < total; i++) {
        if (shouldContinue && !shouldContinue()) {
            aborted = true;
            break;
        }
        const a = surahAyat[i];
        onProgress?.({ done: i, total, bytesSoFar: bytes, currentAyah: a.globalNumber, currentAyahBytes: 0 });
        try {
            // Two-lane rule: if the same file is being fetched for playback
            // right now, wait for it instead of downloading a second copy.
            const pending = inFlight.get(cacheKey(reciterId, a.globalNumber));
            if (pending) await pending.catch(() => undefined);
            if (await backend.has(reciterId, a.globalNumber)) {
                skipped++;
                continue;
            }
            const stored = await fetchAndStreamStore(backend, reciterId, a.globalNumber, fileBytes => {
                const now = Date.now();
                if (now - lastEmit < 150) return;
                lastEmit = now;
                onProgress?.({
                    done: i,
                    total,
                    bytesSoFar: bytes + fileBytes,
                    currentAyah: a.globalNumber,
                    currentAyahBytes: fileBytes,
                });
            });
            downloaded++;
            bytes += stored;
            onProgress?.({
                done: i + 1,
                total,
                bytesSoFar: bytes,
                currentAyah: a.globalNumber,
                currentAyahBytes: stored,
            });
        } catch (e) {
            console.warn('AudioCache: failed downloading ayah', a.globalNumber, e);
            failed++;
        }
    }
    if (!aborted) {
        onProgress?.({ done: total, total, bytesSoFar: bytes });
        try {
            await backend.enforceCap?.(maxBytes);
        } catch (e) {
            console.warn('AudioCache: cap enforcement failed', e);
        }
    }
    return { downloaded, skipped, failed, bytes, aborted };
}

export function formatBytes(n: number): string {
    if (!Number.isFinite(n) || n <= 0) return '0';
    const units = ['ب', 'ك.ب', 'م.ب', 'ج.ب'];
    let value = n;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit++;
    }
    const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1);
    return rounded + ' ' + units[unit];
}

function createWebBackend(): CacheBackend {
    // CACHE_NAME is suffixed with the running APP_VERSION so any code release
    // that changes the audio format or cache layout invalidates the previous
    // cache automatically. selfHealAudioCache() also clears it when the bundled
    // manifest reports a different appVersion.
    const CACHE_NAME = 'quran-audio-' + APP_VERSION;

    // In-memory partials: they survive a failed HTTP response within the
    // session but not a page reload - the browser keeps the tab (and its
    // network stack) alive for the whole download in practice.
    const partials = new Map<string, { chunks: ArrayBuffer[]; bytes: number }>();

    async function open(): Promise<Cache | null> {
        if (typeof caches === 'undefined') return null;
        try {
            return await caches.open(CACHE_NAME);
        } catch (e) {
            console.warn('AudioCache: Cache API unavailable', e);
            return null;
        }
    }

    function buildPath(reciterId: string, globalAyah: number): string {
        return '/quran-audio/' + encodeURIComponent(reciterId) + '/' + globalAyah + '.mp3';
    }

    return {
        async lookup(reciterId, globalAyah): Promise<string | null> {
            const cache = await open();
            if (!cache) return null;
            const req = new Request(buildPath(reciterId, globalAyah));
            const hit = await cache.match(req);
            if (!hit) return null;
            const blob = await hit.blob();
            return URL.createObjectURL(blob);
        },
        async store(reciterId, globalAyah, bytes): Promise<string> {
            const cache = await open();
            const req = new Request(buildPath(reciterId, globalAyah));
            if (cache) {
                const res = new Response(bytes, {
                    headers: { 'Content-Type': 'audio/mpeg' },
                });
                try { await cache.put(req, res); } catch (e) {
                    console.warn('AudioCache: cache.put failed', e);
                }
            }
            const blob = new Blob([bytes], { type: 'audio/mpeg' });
            return URL.createObjectURL(blob);
        },
        async remove(reciterId, globalAyah): Promise<void> {
            const cache = await open();
            if (!cache) return;
            const req = new Request(buildPath(reciterId, globalAyah));
            await cache.delete(req);
        },
        async has(reciterId, globalAyah): Promise<boolean> {
            const cache = await open();
            if (!cache) return false;
            const req = new Request(buildPath(reciterId, globalAyah));
            const hit = await cache.match(req);
            return Boolean(hit);
        },
        async list(): Promise<IndexEntry[]> {
            const cache = await open();
            if (!cache) return [];
            const keys = await cache.keys();
            const out: IndexEntry[] = [];
            for (const req of keys) {
                try {
                    const url = new URL(req.url);
                    const segs = url.pathname.split('/').filter(Boolean);
                    if (segs.length < 3 || segs[0] !== 'quran-audio') continue;
                    const reciterId = decodeURIComponent(segs[1]);
                    const ayah = Number(segs[2].replace(/\.mp3$/, ''));
                    if (!Number.isFinite(ayah)) continue;
                    const hit = await cache.match(req);
                    const bytes = hit ? (await hit.blob()).size : 0;
                    out.push({ reciterId, ayah, bytes, lastAccessedAt: Date.now() });
                } catch {
                    // ignore malformed entries
                }
            }
            return out;
        },
        async clear(): Promise<void> {
            if (typeof caches === 'undefined') return;
            await caches.delete(CACHE_NAME);
            partials.clear();
        },
        async getPartialBytes(reciterId, ayah): Promise<number> {
            return partials.get(cacheKey(reciterId, ayah))?.bytes ?? 0;
        },
        async appendPartial(reciterId, ayah, chunk): Promise<number> {
            const key = cacheKey(reciterId, ayah);
            const entry = partials.get(key) ?? { chunks: [], bytes: 0 };
            entry.chunks.push(chunk);
            entry.bytes += chunk.byteLength;
            partials.set(key, entry);
            return entry.bytes;
        },
        async commitPartial(reciterId, ayah): Promise<string> {
            const key = cacheKey(reciterId, ayah);
            const entry = partials.get(key);
            partials.delete(key);
            if (!entry) return this.store(reciterId, ayah, new ArrayBuffer(0));
            const merged = new Uint8Array(entry.bytes);
            let pos = 0;
            for (const chunk of entry.chunks) {
                merged.set(new Uint8Array(chunk), pos);
                pos += chunk.byteLength;
            }
            return this.store(reciterId, ayah, merged.buffer as ArrayBuffer);
        },
        async discardPartial(reciterId, ayah): Promise<void> {
            partials.delete(cacheKey(reciterId, ayah));
        },
        async removeReciter(reciterId): Promise<void> {
            const cache = await open();
            if (cache) {
                const keys = await cache.keys();
                const prefix = '/quran-audio/' + encodeURIComponent(reciterId) + '/';
                await Promise.all(keys
                    .filter(req => new URL(req.url).pathname.startsWith(prefix))
                    .map(req => cache.delete(req)));
            }
            for (const key of Array.from(partials.keys())) {
                if (key.startsWith(reciterId + ':')) partials.delete(key);
            }
        },
    };
}

export type { CacheBackend };
