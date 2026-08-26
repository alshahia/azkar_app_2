
import { normalizeArabic } from './arabic';

export interface RawZikr {
    arabic: string;
    transliteration: string | null;
    translation: string | null;
    benefit: string | null;
    reference: string | null;
    count: number;
}

/**
 * Parses repetition counts that arrive either as numbers or as strings
 * ("3", "100", "ثلاثاً", "ثلاث عشرة", "مائة", Eastern digits "٣٤"...).
 *
 * IMPORTANT: the ladder below is ordered longest/most-specific first.
 * Earlier revisions matched generic substrings first, which silently turned
 * "ثلاثين" (30) and "ثلاث عشرة" (13) into 3 and made "33"/"34" unreachable.
 */
export const parseCount = (count: number | string | null | undefined): number => {
    if (typeof count === 'number') {
        return Number.isFinite(count) && count > 0 ? Math.floor(count) : 1;
    }
    if (typeof count !== 'string') return 1;

    const trimmed = count.trim();
    if (!trimmed) return 1;

    const western = parseInt(trimmed, 10);
    if (!Number.isNaN(western)) return western;

    const s = normalizeArabic(trimmed);

    const eastern = parseInt(s, 10);
    if (!Number.isNaN(eastern)) return eastern;

    if (s.includes('34')) return 34;
    if (s.includes('33')) return 33;
    // s is normalized: مائة -> مايه and مئة -> ميه (hamza-ya/taa rules).
    // Word-bounded match so unrelated words that merely CONTAIN these letter
    // sequences (e.g. رقميه contains ميه) are not misread as "hundred".
    const padded = ' ' + s + ' ';
    const HUNDRED_RE = / (?:\u0645\u0627\u0626\u0629|\u0645\u0627\u0626\u0647|\u0645\u0627\u064a\u0647|\u0645\u0626\u0629|\u0645\u0626\u0647|\u0645\u064a\u0647) /;
    if (s.includes('100') || HUNDRED_RE.test(padded)) return 100;
    // Decades must be tested before their cardinal roots ('ثلاثين' contains 'ثلاث').
    if (s.includes('عشرين')) return 20;
    if (s.includes('ثلاثين')) return 30;
    if (s.includes('اربعين')) return 40;
    if (s.includes('خمسين')) return 50;
    if (s.includes('سبعين')) return 70;
    if (s.includes('تسعين')) return 90;
    // "-ashara" teens: the leading cardinal disambiguates (ثلاث عشرة = 13 ...).
    if (s.includes('عشر')) {
        if (s.includes('ثلاث')) return 13;
        if (s.includes('اربع')) return 14;
        if (s.includes('خمس')) return 15;
        if (s.includes('ست')) return 16;
        if (s.includes('سبع')) return 17;
        if (s.includes('ثمان')) return 18;
        if (s.includes('تسع')) return 19;
        return 10;
    }
    if (s.includes('ثلاث')) return 3;
    if (s.includes('اربع')) return 4;
    if (s.includes('خمس')) return 5;
    if (s.includes('سبع')) return 7;
    return 1;
};

export const z = (
    arabic: string,
    translation: string | null = null,
    reference: string | null = null,
    count: number | string | null = 1,
    benefit: string | null = null,
    transliteration: string | null = null
): RawZikr => ({
    arabic,
    transliteration,
    translation,
    benefit,
    reference,
    count: parseCount(count)
});
