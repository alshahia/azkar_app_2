
import { describe, it, expect } from 'vitest';
import { parseCount } from '../../data/utils';
import { normalizeArabic } from '../../data/arabic';
import { stableZikrId, MIN_STABLE_ID } from '../../data/ids';
import { STATIC_AZKAR_DATA } from '../../data/static/azkar';
import { validateBackup } from '../../data/backup';

describe('parseCount', () => {
    it('maps Arabic count words to numbers', () => {
        expect(parseCount('ثلاثين')).toBe(30);
        expect(parseCount('مائة')).toBe(100);
        expect(parseCount('سبع')).toBe(7);
    });

    it('is diacritic-insensitive', () => {
        expect(parseCount('ثَلَاثَ عَشَرَة')).toBe(13);
    });

    it('parses Eastern and Latin digits', () => {
        expect(parseCount('٣٤')).toBe(34);
        expect(parseCount('33')).toBe(33);
    });

    it('defaults to 1 when absent or unrecognised', () => {
        expect(parseCount(undefined)).toBe(1);
        expect(parseCount('كلمة غير رقمية')).toBe(1);
    });
});

describe('normalizeArabic', () => {
    it('strips diacritics and unifies letter forms', () => {
        const vocalized = normalizeArabic('سُبْحَانَ اللَّهِ');
        const plain = normalizeArabic('سبحان الله');
        expect(vocalized).toBe(plain);
    });
});

describe('stable zikr ids', () => {
    it('are deterministic, unique and in the stable range', () => {
        const seen = new Set<number>();
        for (const cat of STATIC_AZKAR_DATA) {
            for (const z of cat.azkar) {
                // Exact-text duplicates inside a category get a salt suffix;
                // accept any small salt rather than assuming salt=1.
                let matchesStableHash = false;
                for (let salt = 1; salt <= 10 && !matchesStableHash; salt++) {
                    if (stableZikrId(cat.id, z.arabic, salt) === z.id) matchesStableHash = true;
                }
                expect(matchesStableHash).toBe(true);
                expect(z.id).toBeGreaterThanOrEqual(MIN_STABLE_ID);
                expect(seen.has(z.id)).toBe(false);
                seen.add(z.id);
            }
        }
        expect(seen.size).toBeGreaterThan(800);
    });
});

describe('validateBackup', () => {
    it('accepts a well-formed payload', () => {
        const payload = { preferences: {}, progress: { '12': 3 }, userQuotes: [], hiddenStaticIds: [] };
        expect(() => validateBackup(payload)).not.toThrow();
    });

    it('rejects a malformed progress map', () => {
        expect(() => validateBackup({ progress: { a: 'nope' } })).toThrow(/INVALID_BACKUP:progress/);
    });
});
