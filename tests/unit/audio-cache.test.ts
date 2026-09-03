import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    _setBackendForTesting, getAudioSourceUrl, prefetchAyah, isCached,
    getCacheStats, clearCache, downloadSurah, formatBytes, setMaxBytes, getMaxBytes,
    type CacheBackend, type IndexEntry,
} from '../../services/audioCache';

// --- Memory backend used by every test ------------------------------------

function createMemoryBackend(): CacheBackend & { _store: Map<string, { bytes: number; url: string }> } {
    const store = new Map<string, { bytes: number; url: string }>();
    const makeUrl = (reciter: string, ayah: number) => 'mem://' + reciter + '/' + ayah;
    const key = (reciter: string, ayah: number) => reciter + ':' + ayah;
    return {
        _store: store,
        async lookup(reciter, ayah) {
            return store.has(key(reciter, ayah)) ? makeUrl(reciter, ayah) : null;
        },
        async store(reciter, ayah, bytes) {
            store.set(key(reciter, ayah), { bytes: bytes.byteLength, url: makeUrl(reciter, ayah) });
            return makeUrl(reciter, ayah);
        },
        async remove(reciter, ayah) {
            store.delete(key(reciter, ayah));
        },
        async has(reciter, ayah) {
            return store.has(key(reciter, ayah));
        },
        async list(): Promise<IndexEntry[]> {
            const out: IndexEntry[] = [];
            for (const [k, v] of store) {
                const [reciterId, ayahStr] = k.split(':');
                out.push({ reciterId, ayah: Number(ayahStr), bytes: v.bytes, lastAccessedAt: Date.now() });
            }
            return out;
        },
        async clear() {
            store.clear();
        },
    };
}

// --- fetch mock -----------------------------------------------------------

function mockFetch(map: Record<string, ArrayBuffer>) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (map[url]) {
            return new Response(map[url], { status: 200, headers: { 'Content-Type': 'audio/mpeg' } });
        }
        return new Response('not found', { status: 404 });
    });
}

const RECITER = 'ar.alafasy';

function ayahUrl(ayah: number) {
    return 'https://cdn.islamic.network/quran/audio/128/' + RECITER + '/' + ayah + '.mp3';
}

function dummyBytes(seed: number): ArrayBuffer {
    const buf = new ArrayBuffer(64);
    new Uint8Array(buf)[0] = seed & 0xff;
    return buf;
}

beforeEach(() => {
    // Each test gets a clean backend + clean fetch state.
    _setBackendForTesting(createMemoryBackend());
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('audioCache - cache miss path (first listen)', () => {
    it('fetches from the CDN and stores locally on a miss', async () => {
        const fetchSpy = mockFetch({ [ayahUrl(7)]: dummyBytes(7) });
        const src = await getAudioSourceUrl(RECITER, 7);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy.mock.calls[0][0]).toBe(ayahUrl(7));
        expect(src.fromCache).toBe(true);
        expect(src.url).toBe('mem://' + RECITER + '/7');
    });

    it('after first listen, a second call hits the cache without re-fetching', async () => {
        const fetchSpy = mockFetch({ [ayahUrl(8)]: dummyBytes(8) });
        await getAudioSourceUrl(RECITER, 8);
        const src2 = await getAudioSourceUrl(RECITER, 8);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(src2.fromCache).toBe(true);
        expect(src2.url).toBe('mem://' + RECITER + '/8');
    });
});

describe('audioCache - concurrency dedup', () => {
    it('two parallel getAudioSourceUrl calls only fetch once', async () => {
        const fetchSpy = mockFetch({ [ayahUrl(42)]: dummyBytes(42) });
        const [a, b] = await Promise.all([
            getAudioSourceUrl(RECITER, 42),
            getAudioSourceUrl(RECITER, 42),
        ]);
        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(a.url).toBe(b.url);
    });
});

describe('audioCache - network failures', () => {
    it('falls back to the remote URL on HTTP error', async () => {
        mockFetch({}); // 404 for everything
        const src = await getAudioSourceUrl(RECITER, 100);
        expect(src.fromCache).toBe(false);
        expect(src.url).toBe(ayahUrl(100));
    });

    it('falls back to the remote URL when fetch throws', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
        const src = await getAudioSourceUrl(RECITER, 200);
        expect(src.fromCache).toBe(false);
        expect(src.url).toBe(ayahUrl(200));
    });
});

describe('audioCache - helpers', () => {
    it('isCached reflects backend state', async () => {
        mockFetch({ [ayahUrl(1)]: dummyBytes(1) });
        expect(await isCached(RECITER, 1)).toBe(false);
        await getAudioSourceUrl(RECITER, 1);
        expect(await isCached(RECITER, 1)).toBe(true);
    });

    it('getCacheStats aggregates entries and bytes', async () => {
        mockFetch({
            [ayahUrl(1)]: dummyBytes(1),
            [ayahUrl(2)]: dummyBytes(2),
            [ayahUrl(3)]: dummyBytes(3),
        });
        await getAudioSourceUrl(RECITER, 1);
        await getAudioSourceUrl(RECITER, 2);
        await getAudioSourceUrl(RECITER, 3);
        const stats = await getCacheStats();
        expect(stats.entries).toBe(3);
        expect(stats.totalBytes).toBe(64 * 3);
    });

    it('clearCache wipes everything', async () => {
        mockFetch({ [ayahUrl(1)]: dummyBytes(1) });
        await getAudioSourceUrl(RECITER, 1);
        await clearCache();
        expect((await getCacheStats()).entries).toBe(0);
    });

    it('prefetchAyah resolves without throwing even if fetch fails', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('nope'));
        prefetchAyah(RECITER, 50);
        await new Promise(r => setTimeout(r, 10));
        // No throw, no state leak.
        expect(await isCached(RECITER, 50)).toBe(false);
    });
});

describe('audioCache - downloadSurah', () => {
    it('skips already-cached entries and downloads the rest', async () => {
        mockFetch({
            [ayahUrl(1)]: dummyBytes(1),
            [ayahUrl(2)]: dummyBytes(2),
            [ayahUrl(3)]: dummyBytes(3),
        });
        await getAudioSourceUrl(RECITER, 1); // pre-cache
        const events: number[] = [];
        const res = await downloadSurah(
            RECITER,
            [{ globalNumber: 1 }, { globalNumber: 2 }, { globalNumber: 3 }],
            p => events.push(p.done),
        );
        expect(res.skipped).toBe(1);
        expect(res.downloaded).toBe(2);
        expect(res.failed).toBe(0);
        expect(events[events.length - 1]).toBe(3);
    });

    it('counts failures but keeps going', async () => {
        mockFetch({ [ayahUrl(1)]: dummyBytes(1) });
        const res = await downloadSurah(
            RECITER,
            [{ globalNumber: 1 }, { globalNumber: 2 }],
        );
        expect(res.downloaded).toBe(1);
        expect(res.failed).toBe(1);
    });
});

describe('audioCache - formatBytes', () => {
    it('returns "0" for non-positive or non-finite', () => {
        expect(formatBytes(0)).toBe('0');
        expect(formatBytes(-10)).toBe('0');
        expect(formatBytes(NaN)).toBe('0');
    });
    it('uses Arabic unit suffixes for human readability', () => {
        const s = formatBytes(2 * 1024 * 1024);
        expect(s).toContain('م.ب');
        expect(s).toContain('2');
    });
    it('formats bytes, kilobytes, megabytes, and gigabytes', () => {
        expect(formatBytes(500)).toMatch(/ب$/);
        expect(formatBytes(2048)).toMatch(/ك\.ب$/);
        expect(formatBytes(5 * 1024 * 1024)).toMatch(/م\.ب$/);
        expect(formatBytes(2 * 1024 * 1024 * 1024)).toMatch(/ج\.ب$/);
    });
});

describe('audioCache - cap setter', () => {
    it('setMaxBytes rejects non-positive or non-finite values', () => {
        setMaxBytes(getMaxBytes());
        const before = getMaxBytes();
        setMaxBytes(0);
        setMaxBytes(-1);
        setMaxBytes(NaN);
        expect(getMaxBytes()).toBe(before);
    });
    it('setMaxBytes updates the cap', () => {
        setMaxBytes(1234);
        expect(getMaxBytes()).toBe(1234);
    });
});
