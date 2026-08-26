/**
 * Umm al-Qura Hijri calendar utilities.
 *
 * Source of truth: the official Saudi Umm al-Qura calendar tables (produced by
 * KACST), which ship inside every modern JS engine's ICU data as the
 * "islamic-umalqura" Intl calendar (authoritative for AH ~1300-1600).
 *
 * Cross-verified against api.aladhan.com/v1/gToH on the official anchors:
 *   2025-03-01 -> 1 Ramadan 1446, 2025-03-30 -> 1 Shawwal 1446,
 *   2025-06-06 -> 10 Dhu al-Hijjah 1446, 2025-06-26 -> 1 Muharram 1447.
 * These anchors are pinned in tests/unit/hijri.test.ts.
 */

export interface HijriParts {
    /** Hijri year, e.g. 1446 */
    year: number;
    /** Hijri month, 1-12 (1 = Muharram) */
    month: number;
    /** Hijri day of month, 1-30 */
    day: number;
}

// Preferred first: the real Umm al-Qura tables; 'islamic' (astronomical
// tabular) is only a last resort so the app still shows a genuine Islamic
// calendar on engines without Umm al-Qura data.
const CALENDAR_CANDIDATES = ['islamic-umalqura', 'islamic'] as const;

function buildFmt(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat | null {
    for (const cal of CALENDAR_CANDIDATES) {
        try {
            const fmt = new Intl.DateTimeFormat(locale + '-u-ca-' + cal, options);
            // An unknown calendar id does NOT throw - it silently falls back
            // to gregory. Verify what we actually got before trusting it.
            if (fmt.resolvedOptions().calendar !== cal) continue;
            return fmt;
        } catch { /* try next candidate */ }
    }
    return null;
}

// Latin-digit numeric formatter: formatToParts then yields ASCII numbers that
// parseInt can handle (Arabic locales default to Arabic-Indic digits).
let numericFmt: Intl.DateTimeFormat | null | undefined;
function getNumericFmt(): Intl.DateTimeFormat | null {
    if (numericFmt === undefined) {
        numericFmt = buildFmt('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' });
    }
    return numericFmt;
}

// Long-form Arabic formatter for headers/titles ("\u0661 \u0631\u0645\u0636\u0627\u0646 \u0661\u0664\u0664\u0666 \u0647\u0640").
let arabicLongFmt: Intl.DateTimeFormat | null | undefined;
function getArabicLongFmt(): Intl.DateTimeFormat | null {
    if (arabicLongFmt === undefined) {
        arabicLongFmt = buildFmt('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return arabicLongFmt;
}

// Month-name-only formatter for month-name consumers.
let arabicMonthFmt: Intl.DateTimeFormat | null | undefined;
function getArabicMonthFmt(): Intl.DateTimeFormat | null {
    if (arabicMonthFmt === undefined) {
        arabicMonthFmt = buildFmt('ar-SA', { month: 'long' });
    }
    return arabicMonthFmt;
}

/** Whether a real Islamic calendar (Umm al-Qura preferred) is available. */
export function isHijriSupported(): boolean {
    return buildFmt('en-US', { day: 'numeric' }) !== null;
}

/**
 * Numeric Hijri parts of a Date according to the Umm al-Qura calendar,
 * or null when no Islamic calendar is available in this engine.
 */
export function hijriPartsOf(date: Date): HijriParts | null {
    const fmt = getNumericFmt();
    if (!fmt) return null;
    const parts = fmt.formatToParts(date);
    const num = (type: string): number => parseInt(parts.find(p => p.type === type)?.value ?? '', 10);
    const year = num('year');
    const month = num('month');
    const day = num('day');
    if ([year, month, day].some(v => Number.isNaN(v))) return null;
    return { year, month, day };
}

/**
 * Long-form Arabic Hijri date string ("\u0661 \u0631\u0645\u0636\u0627\u0646 \u0661\u0664\u0664\u0666 \u0647\u0640").
 * Falls back to plain Gregorian ar-SA when no Islamic calendar exists.
 */
export function formatHijriArabic(date: Date): string {
    const fmt = getArabicLongFmt();
    if (fmt) return fmt.format(date);
    return date.toLocaleDateString('ar-SA');
}

/** Arabic Hijri month name for the month containing date, or null. */
export function hijriMonthNameOf(date: Date): string | null {
    const fmt = getArabicMonthFmt();
    if (!fmt) return null;
    const part = fmt.formatToParts(date).find(p => p.type === 'month')?.value;
    return part || null;
}

function addDays(date: Date, n: number): Date {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
}

/** First Gregorian date of the Hijri month containing date, or null. */
export function startOfHijriMonth(date: Date): Date | null {
    const ref = hijriPartsOf(date);
    if (!ref) return null;
    let cur = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let guard = 0;
    while (guard++ < 35) {
        const prev = addDays(cur, -1);
        const p = hijriPartsOf(prev);
        if (!p || p.year !== ref.year || p.month !== ref.month) break;
        cur = prev;
    }
    return cur;
}

/** Last Gregorian date of the Hijri month containing date, or null. */
export function endOfHijriMonth(date: Date): Date | null {
    const ref = hijriPartsOf(date);
    if (!ref) return null;
    let cur = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let guard = 0;
    while (guard++ < 35) {
        const next = addDays(cur, 1);
        const p = hijriPartsOf(next);
        if (!p || p.year !== ref.year || p.month !== ref.month) break;
        cur = next;
    }
    return cur;
}

/** Number of days (29 or 30) in the Hijri month containing date, or null. */
export function hijriMonthLength(date: Date): number | null {
    const start = startOfHijriMonth(date);
    const end = endOfHijriMonth(date);
    if (!start || !end) return null;
    return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

/**
 * Shift by whole Hijri months and land exactly on the first day of the
 * target month (replaces fragile +/-29-day arithmetic). Returns null when
 * no Islamic calendar is available.
 */
export function addHijriMonths(date: Date, n: number): Date | null {
    const base = startOfHijriMonth(date);
    const bp = base && hijriPartsOf(base);
    if (!base || !bp) return null;
    const targetIndex = bp.year * 12 + (bp.month - 1) + n;
    let probe = base;
    let dir = 0;
    let guard = 0;
    while (guard++ < 70) {
        const p = hijriPartsOf(probe);
        if (!p) return null;
        const diff = targetIndex - (p.year * 12 + (p.month - 1));
        if (diff === 0) return startOfHijriMonth(probe);
        // Consecutive days enumerate every Hijri month index monotonically,
        // so stepping one day at a time always lands exactly on the boundary.
        if (dir !== 0 && Math.sign(diff) !== dir) return null;
        dir = Math.sign(diff);
        probe = addDays(probe, dir);
    }
    return null;
}

export interface HijriMonthGrid {
    /** Saturday-first column layout; leading nulls pad week 1. */
    days: (Date | null)[];
    /** Arabic title without the leading day number, e.g. "\u0631\u0645\u0636\u0627\u0646 \u0661\u0664\u0664\u0666 \u0647\u0640". */
    title: string;
}

/**
 * Calendar grid for the Hijri month containing refDate,
 * or null when no Islamic calendar is available.
 */
export function getHijriMonthGrid(refDate: Date): HijriMonthGrid | null {
    if (!isHijriSupported()) return null;
    const start = startOfHijriMonth(refDate);
    const end = endOfHijriMonth(refDate);
    if (!start || !end) return null;

    const days: (Date | null)[] = [];
    const lead = (start.getDay() + 1) % 7; // Saturday-first columns
    for (let i = 0; i < lead; i++) days.push(null);
    let cur = start;
    while (cur.getTime() <= end.getTime()) {
        days.push(new Date(cur.getTime()));
        cur = addDays(cur, 1);
    }

    const longFmt = getArabicLongFmt();
    const title = longFmt ? longFmt.format(refDate).split(' ').slice(1).join(' ') : '';
    return { days, title };
}
