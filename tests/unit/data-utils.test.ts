
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

    it('strips the full Arabic mark range incl. Quranic annotation signs', () => {
        // Compose a string that carries: Arabic letter mark 0651 (shadda),
        // Quranic annotation sign 06DD (end of ayah), and tatweel 0640.
        const input = 'اّ۝ـب';
        const out = normalizeArabic(input);
        expect(out).toBe('اب');
    });

    it('strips 06D6-06ED Quranic annotation range', () => {
        // 06D6 = small high meem; 06E9 = place of sajdah; 06ED = small low meem.
        const input = '\u06D6ا\u06E9ب\u06ED';
        const out = normalizeArabic(input);
        expect(out).toBe('اب');
    });

    it('strips 08D3-08FF Arabic extended marks', () => {
        // 08D3 = low meem, 08FF = unspecified in Arabic Extended-A; both stripped.
        const input = '\u08D3ا\u08FFب';
        const out = normalizeArabic(input);
        expect(out).toBe('اب');
    });

    it('strips bidi / zero-width controls and BOM', () => {
        const input = '\uFEFF\u200Eا\u200F\u202Aب\u202E\u2066';
        const out = normalizeArabic(input);
        expect(out).toBe('اب');
    });

    it('strips PUA codepoints (E000-F8FF)', () => {
        // F000 is a common PUA home for font-private glyphs; E001 too.
        const input = '\uE001ا\uF000ب';
        const out = normalizeArabic(input);
        expect(out).toBe('اب');
    });

    it('folds alef variants to bare alef', () => {
        expect(normalizeArabic('آ')).toBe('ا');
        expect(normalizeArabic('أ')).toBe('ا');
        expect(normalizeArabic('إ')).toBe('ا');
    });

    it('folds alef maqsura, ya-with-hamza, waw-with-hamza, taa marbuta', () => {
        expect(normalizeArabic('ى')).toBe('ي');
        expect(normalizeArabic('ئ')).toBe('ي');
        expect(normalizeArabic('ؤ')).toBe('و');
        expect(normalizeArabic('ة')).toBe('ه');
    });

    it('الرحمن matches الرحمن spelling variant (الرحمان)', () => {
        expect(normalizeArabic('الرحمن')).toBe(normalizeArabic('الرحمان'));
    });

    it('الله matches الله spelling variant (اللة)', () => {
        expect(normalizeArabic('الله')).toBe(normalizeArabic('اللة'));
    });

    it('folds Arabic-Indic digits to Latin digits', () => {
        expect(normalizeArabic('١٢٣')).toBe('123');
        expect(normalizeArabic('٠')).toBe('0');
    });

    it('lowercases Latin letters and trims surrounding whitespace', () => {
        expect(normalizeArabic('  ALPHA  ')).toBe('alpha');
    });

    it('keeps a query usable for diacritic-free searching of vocalized text', () => {
        // The azkar corpus is fully vocalized; users type bare text.
        const corpus = normalizeArabic('سُبْحَانَ اللَّهِ وَبِحَمْدِهِ');
        const query = normalizeArabic('سبحان الله');
        expect(corpus.includes(query)).toBe(true);
    });

    it('keeps a query usable for Quran search against vocalized ayahs', () => {
        const corpus = normalizeArabic('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
        const query = normalizeArabic('الرحمن');
        expect(corpus.includes(query)).toBe(true);
    });

    it('leaves a control id above the static zikr count untouched for ID hashing', () => {
        // IDs are produced from text; the normalizer must not produce chars
        // that would change the hash (bidi marks in particular).
        expect(normalizeArabic('xyz\u200E')).toBe('xyz');
        expect(normalizeArabic('XYZ')).toBe(normalizeArabic('xyz'));
    });

    it('handles an empty string', () => {
        expect(normalizeArabic('')).toBe('');
    });

    it('handles a string with only marks', () => {
        expect(normalizeArabic('\u064B\u064C\u064D\u064E\u064F')).toBe('');
    });

    it('leaves non-Arabic letters (Latin, digits) unchanged in casing-lower form', () => {
        expect(normalizeArabic('abc 123')).toBe('abc 123');
    });

    it('composes well across multiple folds', () => {
        // Mixed: shadda, PUA, alef-with-madda, BOM, ASCII trim. The bare
        // input has no taa marbuta so the fold chain stays unambiguous.
        const input = '  \uFEFF\uE001ال\u0651رح\u064Eم\u0627ن\uF000  ';
        const out = normalizeArabic(input);
        expect(out).toBe('الرحمن');
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
