import { describe, it, expect } from 'vitest';
import {
    pushQuranHistory,
    makeQuranHistoryEntry,
    isSameAsLast,
} from '../../data/quranHistory';
import { QURAN_READ_HISTORY_MAX } from '../../types';

/**
 * Quran read history (M3-T5): append + dedupe + cap helpers.
 */

function ts(n: number): number { return 1_700_000_000_000 + n; }

describe('quranHistory - pushQuranHistory', () => {
    it('starts from an empty list and returns the new entry', () => {
        const entry = makeQuranHistoryEntry(2, 5, ts(10));
        const out = pushQuranHistory([], entry);
        expect(out).toEqual([entry]);
    });

    it('puts the new entry first so most-recent sorts by index', () => {
        const a = makeQuranHistoryEntry(1, 1, ts(10));
        const b = makeQuranHistoryEntry(1, 2, ts(20));
        const out = pushQuranHistory([a], b);
        expect(out[0]).toEqual(b);
        expect(out[1]).toEqual(a);
    });

    it('removes any prior entry for the same (surah, ayah)', () => {
        const old = makeQuranHistoryEntry(2, 5, ts(10));
        const other = makeQuranHistoryEntry(3, 1, ts(20));
        const fresh = makeQuranHistoryEntry(2, 5, ts(30));
        const out = pushQuranHistory([old, other], fresh);
        expect(out[0]).toEqual(fresh);
        expect(out).toHaveLength(2);
        expect(out.find(e => e.surah === 2 && e.ayah === 5 && e.ts === ts(10))).toBeUndefined();
    });

    it('caps the list at the configured maximum', () => {
        const entries = Array.from({ length: QURAN_READ_HISTORY_MAX + 5 }, (_, i) =>
            makeQuranHistoryEntry(1, i + 1, ts(i)));
        let list: ReturnType<typeof makeQuranHistoryEntry>[] = [];
        for (const e of entries) list = pushQuranHistory(list, e);
        expect(list).toHaveLength(QURAN_READ_HISTORY_MAX);
        // The most-recent insertion should be at the head.
        expect(list[0]).toEqual(entries[entries.length - 1]);
    });

    it('honors a custom max (test-only override)', () => {
        let list: ReturnType<typeof makeQuranHistoryEntry>[] = [];
        for (let i = 0; i < 10; i++) list = pushQuranHistory(list, makeQuranHistoryEntry(1, i + 1, ts(i)), 3);
        expect(list).toHaveLength(3);
    });

    it('tolerates a null/undefined list (defensive)', () => {
        const entry = makeQuranHistoryEntry(1, 1, ts(10));
        // @ts-expect-error checking the defensive path.
        const out = pushQuranHistory(undefined, entry);
        expect(out).toEqual([entry]);
    });
});

describe('quranHistory - makeQuranHistoryEntry', () => {
    it('builds the canonical shape', () => {
        const e = makeQuranHistoryEntry(114, 6, ts(5));
        expect(e).toEqual({ surah: 114, ayah: 6, ts: ts(5) });
    });

    it('defaults the ts to Date.now() when omitted', () => {
        const before = Date.now();
        const e = makeQuranHistoryEntry(1, 1);
        const after = Date.now();
        expect(e.ts).toBeGreaterThanOrEqual(before);
        expect(e.ts).toBeLessThanOrEqual(after);
    });
});

describe('quranHistory - isSameAsLast', () => {
    it('false for an empty list', () => {
        expect(isSameAsLast([], { surah: 1, ayah: 1 })).toBe(false);
    });

    it('true when the head matches surah+ayah', () => {
        const list = [makeQuranHistoryEntry(2, 5, ts(1))];
        expect(isSameAsLast(list, { surah: 2, ayah: 5 })).toBe(true);
        expect(isSameAsLast(list, { surah: 3, ayah: 5 })).toBe(false);
        expect(isSameAsLast(list, { surah: 2, ayah: 6 })).toBe(false);
    });
});
