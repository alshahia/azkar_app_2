/// <reference types="vite/client" />
/**
 * AudioCache - offline-first cache for Quran recitation audio.
 * See README at the bottom of this module's public API for a high-level overview.
 */

import { Capacitor } from '@capacitor/core';
import { ayahAudioUrl } from './QuranService';

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
}

export interface SurahDownloadResult {
    downloaded: number;
    skipped: number;
    failed: number;
    bytes: number;
}

export interface IndexEntry {
    reciterId: string;
    ayah: number;
    bytes: number;
    lastAccessedAt: number;
}

interface CacheBackend {
    lookup(reciterId: string, globalAyah: number): Promise<string | null>;
    store(reciterId: string, globalAyah: number, bytes: ArrayBuffer): Promise<string>;
    remove(reciterId: string, globalAyah: number): Promise<void>;
    has(reciterId: string, globalAyah: number): Promise<boolean>;
    list(): Promise<IndexEntry[]>;
    clear(): Promise<void>;
    enforceCap?(targetBytes: number): Promise<void>;
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
    return reciterId + ':' + ayah;
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

export async function downloadSurah(
    reciterId: string,
    surahAyat: ReadonlyArray<{ globalNumber: number }>,
    onProgress?: (p: DownloadProgress) => void,
): Promise<SurahDownloadResult> {
    const total = surahAyat.length;
    let downloaded = 0;
    let skipped = 0;
    let failed = 0;
    let bytes = 0;
    for (let i = 0; i < surahAyat.length; i++) {
        const a = surahAyat[i];
        onProgress?.({ done: i, total, bytesSoFar: bytes, currentAyah: a.globalNumber });
        try {
            const backend = await getBackend();
            if (await backend.has(reciterId, a.globalNumber)) {
                skipped++;
            } else {
                const res = await fetch(ayahAudioUrl(reciterId, a.globalNumber));
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const buf = await res.arrayBuffer();
                await backend.store(reciterId, a.globalNumber, buf);
                downloaded++;
                bytes += buf.byteLength;
            }
        } catch (e) {
            console.warn('AudioCache: failed downloading ayah', a.globalNumber, e);
            failed++;
        }
    }
    onProgress?.({ done: total, total, bytesSoFar: bytes });
    try {
        await (await getBackend()).enforceCap?.(maxBytes);
    } catch (e) {
        console.warn('AudioCache: cap enforcement failed', e);
    }
    return { downloaded, skipped, failed, bytes };
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
    const CACHE_NAME = 'quran-audio-v1';

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
        },
    };
}

export type { CacheBackend };
