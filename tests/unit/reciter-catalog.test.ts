import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    _setCatalogDepsForTesting, getReciters, getReciter, getDefaultReciterId,
    mergeReciters, refreshRecitersIfWifi, initCatalog, type Reciter,
} from '../../services/reciterCatalog';

const BUNDLED: Reciter[] = [
    { id: 'ar.alafasy', name: 'مشاري العفاسي', style: 'مرتل' },
    { id: 'ar.husary', name: 'محمود خليل الحصري', style: 'مرتل' },
];

const kvMap = new Map<string, unknown>();
const storage = {
    getKv: async <T,>(key: string): Promise<T | null> => (kvMap.has(key) ? (kvMap.get(key) as T) : null),
    setKv: async (key: string, value: unknown): Promise<void> => { kvMap.set(key, value); },
};

beforeEach(() => {
    kvMap.clear();
    _setCatalogDepsForTesting({ bundled: BUNDLED });
});

afterEach(() => {
    _setCatalogDepsForTesting(null);
    vi.restoreAllMocks();
});

function editionRow(identifier: string, name = 'New Reciter') {
    return { identifier, name, englishName: name, format: 'audio', type: 'audio', language: 'ar' };
}

describe('mergeReciters (pure)', () => {
    it('appends extras after the bundled list and dedups by id', () => {
        const merged = mergeReciters(BUNDLED, [
            { id: 'ar.new', name: 'جديد', style: 'مرتل' },
            { id: 'ar.alafasy', name: 'مكرر', style: 'مرتل' },
        ]);
        expect(merged.map(r => r.id)).toEqual(['ar.alafasy', 'ar.husary', 'ar.new']);
        expect(merged[0].name).toBe('مشاري العفاسي'); // bundled entries stay verbatim
    });

    it('skips malformed extras and supplies defaults', () => {
        const merged = mergeReciters(BUNDLED, [
            { id: '', name: 'x', style: '' },
            null as unknown as Reciter,
            { id: 'ar.ok', name: '', style: '' },
        ]);
        expect(merged.map(r => r.id)).toEqual(['ar.alafasy', 'ar.husary', 'ar.ok']);
        expect(merged[2]).toMatchObject({ name: 'ar.ok', style: 'مرتل' });
    });
});

describe('refreshRecitersIfWifi (M1-T4)', () => {
    it('adds only Wi-Fi-gated, CDN-verified reciters and persists them', async () => {
        kvMap.set('quran_reciter_cache', undefined);
        _setCatalogDepsForTesting({
            bundled: BUNDLED,
            isWifiFn: async () => true,
            fetchFn: (async () => new Response(JSON.stringify({
                code: 200,
                data: [
                    editionRow('ar.verified'),
                    editionRow('ar.ignored2'),
                    editionRow('en.skipme'),
                ],
            }), { status: 200 })) as unknown as typeof fetch,
            probeFn: async (id) => id === 'ar.verified',
        });
        await initCatalog(storage);
        const added = await refreshRecitersIfWifi();
        expect(added).toBe(1);
        expect(getReciter('ar.verified')).toMatchObject({ name: 'New Reciter', style: 'مرتل' });
        expect(getReciters().map(r => r.id)).toEqual(['ar.alafasy', 'ar.husary', 'ar.verified']);
        // Persisted for the next launch.
        expect(kvMap.get('quran_reciter_cache')).toMatchObject({
            additions: [{ id: 'ar.verified', name: 'New Reciter', style: 'مرتل' }],
        });
    });

    it('never fetches when the connection is metered/unknown', async () => {
        const fetchSpy = vi.fn();
        _setCatalogDepsForTesting({
            bundled: BUNDLED,
            isWifiFn: async () => false,
            fetchFn: fetchSpy as unknown as typeof fetch,
            probeFn: async () => true,
        });
        await initCatalog(storage);
        const added = await refreshRecitersIfWifi();
        expect(added).toBe(0);
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('drops candidates that fail the CDN probe', async () => {
        _setCatalogDepsForTesting({
            bundled: BUNDLED,
            isWifiFn: async () => true,
            fetchFn: (async () => new Response(JSON.stringify({ code: 200, data: [editionRow('ar.dead404')] }), { status: 200 })) as unknown as typeof fetch,
            probeFn: async () => false,
        });
        await initCatalog(storage);
        const added = await refreshRecitersIfWifi();
        expect(added).toBe(0);
        expect(getReciter('ar.dead404')).toBeUndefined();
    });

    it('is idempotent: a second refresh adds nothing new', async () => {
        _setCatalogDepsForTesting({
            bundled: BUNDLED,
            isWifiFn: async () => true,
            fetchFn: (async () => new Response(JSON.stringify({ code: 200, data: [editionRow('ar.verified')] }), { status: 200 })) as unknown as typeof fetch,
            probeFn: async () => true,
        });
        await initCatalog(storage);
        expect(await refreshRecitersIfWifi()).toBe(1);
        expect(await refreshRecitersIfWifi()).toBe(0);
        expect(getReciters()).toHaveLength(3);
    });
});

describe('initCatalog - persisted additions', () => {
    it('restores the additive cache from kv without a refresh', async () => {
        kvMap.set('quran_reciter_cache', {
            additions: [{ id: 'ar.cached', name: 'من الذاكرة', style: 'مرتل' }],
            lastRefreshAt: 123,
        });
        await initCatalog(storage);
        expect(getReciters().map(r => r.id)).toEqual(['ar.alafasy', 'ar.husary', 'ar.cached']);
        expect(getDefaultReciterId()).toBe('ar.alafasy');
    });

    it('falls back to the bundled catalog on corrupt kv values', async () => {
        kvMap.set('quran_reciter_cache', { additions: 'not-an-array' });
        await initCatalog(storage);
        expect(getReciters().map(r => r.id)).toEqual(['ar.alafasy', 'ar.husary']);
    });
});
