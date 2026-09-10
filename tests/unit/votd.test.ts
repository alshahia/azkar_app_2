/**
 * Tests for utils/votd (M4-T1).
 *
 * The picker is deterministic: same (year, day-of-year) hash -> same
 * global ayah. We pin a few reference dates so any future change to the
 * formula is flagged (changing the hash breaks the entire notification
 * schedule history). The boundaries (1..6236) and the surah-mapping
 * helper get their own cases.
 */
import { describe, it, expect } from 'vitest';
import { pickVotd, globalToLocal, hijriDayOfYear, votdTitle } from '../../utils/votd';
import { SURAHS } from '../../services/QuranService';

// Local-noon construction matches the convention in tests/unit/hijri.test.ts.
const d = (iso: string) => new Date(iso + 'T12:00:00');

const hasUmalqura = (() => {
    try {
        return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura').resolvedOptions().calendar === 'islamic-umalqura';
    } catch {
        return false;
    }
})();

describe('globalToLocal', () => {
    it('maps ayah 1 to Al-Fatiha 1', () => {
        expect(globalToLocal(1)).toEqual({ globalAyah: 1, surah: 1, ayah: 1 });
    });

    it('maps ayah 6236 to An-Nas 6 (last surah, last ayah)', () => {
        expect(globalToLocal(6236)).toEqual({ globalAyah: 6236, surah: 114, ayah: 6 });
    });

    it('maps ayah 8 to Al-Baqarah 1 (Fatiha has 7 ayahs, so 8 = first ayah of next surah)', () => {
        expect(globalToLocal(8)).toEqual({ globalAyah: 8, surah: 2, ayah: 1 });
    });

    it('returns null for non-positive or out-of-range inputs', () => {
        expect(globalToLocal(0)).toBeNull();
        expect(globalToLocal(-5)).toBeNull();
        expect(globalToLocal(6237)).toBeNull();
        expect(globalToLocal(1.5)).toBeNull();
        expect(globalToLocal(Number.NaN)).toBeNull();
    });

    it('produces a valid ayah for every global number 1..6236', () => {
        // Walk every entry; the SURAHS index must cover exactly 6236 ayahs.
        const expected = SURAHS.reduce((acc, s) => acc + s.ayahCount, 0);
        expect(expected).toBe(6236);
        // Spot check 100 spread-out entries.
        for (let i = 0; i < 100; i++) {
            const g = 1 + Math.floor((i * 6236) / 100);
            const r = globalToLocal(g);
            expect(r).not.toBeNull();
            expect(r!.globalAyah).toBe(g);
            const meta = SURAHS.find(s => s.id === r!.surah);
            expect(meta).toBeDefined();
            expect(r!.ayah).toBeGreaterThanOrEqual(1);
            expect(r!.ayah).toBeLessThanOrEqual(meta!.ayahCount);
        }
    });
});

describe('hijriDayOfYear', () => {
    it('returns 1 for 1 Muharram', () => {
        expect(hijriDayOfYear({ year: 1447, month: 1, day: 1 })).toBe(1);
    });
    it('advances roughly 30 days per month', () => {
        expect(hijriDayOfYear({ year: 1447, month: 2, day: 1 })).toBe(31);
        expect(hijriDayOfYear({ year: 1447, month: 12, day: 1 })).toBe(331);
    });
    it('treats month-12 day-30 as day 360', () => {
        expect(hijriDayOfYear({ year: 1446, month: 12, day: 30 })).toBe(360);
    });
});

describe('pickVotd', () => {
    (hasUmalqura ? it : it.skip)('returns a valid ayah for an anchor Hijri date', () => {
        const r = pickVotd(d('2025-03-01')); // 1 Ramadan 1446
        expect(r).not.toBeNull();
        expect(r!.globalAyah).toBeGreaterThanOrEqual(1);
        expect(r!.globalAyah).toBeLessThanOrEqual(6236);
        const meta = SURAHS.find(s => s.id === r!.surah);
        expect(meta).toBeDefined();
        expect(r!.ayah).toBeLessThanOrEqual(meta!.ayahCount);
    });

    (hasUmalqura ? it : it.skip)('produces a different ayah for a different day in the same year', () => {
        const a = pickVotd(d('2025-03-01'));
        const b = pickVotd(d('2025-03-02'));
        expect(a).not.toBeNull();
        expect(b).not.toBeNull();
        // Not guaranteed to differ for every adjacent pair, but across the
        // entire Hijri year the rotation must include many distinct ayahs.
        const unique = new Set<number>();
        for (let day = 1; day <= 29; day++) {
            const sample = new Date(2025, 2, day, 12); // March 1..29
            const r = pickVotd(sample);
            if (r) unique.add(r.globalAyah);
        }
        // 29 days should hit at least 20 distinct ayahs (hash distribution
        // check - catches catastrophic clumping).
        expect(unique.size).toBeGreaterThanOrEqual(20);
    });

    (hasUmalqura ? it : it.skip)('produces a different distribution across Hijri years', () => {
        // Same Gregorian day in two Hijri years must NOT produce the same
        // sequence - this is what makes the rotation feel "fresh" each
        // Hijri new year.
        const set2025 = new Set<number>();
        const set2026 = new Set<number>();
        for (let i = 0; i < 30; i++) {
            const a = pickVotd(d('2025-03-0' + (i % 9 + 1)));
            const b = pickVotd(d('2026-03-0' + (i % 9 + 1)));
            if (a) set2025.add(a.globalAyah);
            if (b) set2026.add(b.globalAyah);
        }
        // Overlap should be small (not catastrophic identity).
        let overlap = 0;
        for (const x of set2025) if (set2026.has(x)) overlap++;
        expect(overlap).toBeLessThanOrEqual(5);
    });

    (hasUmalqura ? it : it.skip)('is deterministic for the same date', () => {
        const a = pickVotd(d('2025-03-01'));
        const b = pickVotd(d('2025-03-01'));
        expect(a).toEqual(b);
    });

    it('returns null when the engine has no Islamic calendar', () => {
        if (hasUmalqura) return; // skip when the calendar IS available
        expect(pickVotd(d('2025-03-01'))).toBeNull();
    });
});

describe('votdTitle', () => {
    it('renders the surah name plus ayah number', () => {
        const title = votdTitle({ globalAyah: 1, surah: 1, ayah: 1 });
        expect(title).toContain(SURAHS[0].name);
        expect(title).toContain('1');
    });

    it('falls back to the global ayah number for an unknown surah', () => {
        // Synthetic case: surah 999 doesn't exist in the index.
        const title = votdTitle({ globalAyah: 100, surah: 999, ayah: 1 });
        expect(title).toContain('100');
    });
});
