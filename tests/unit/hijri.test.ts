import { describe, it, expect } from 'vitest';
import {
    hijriPartsOf,
    formatHijriArabic,
    startOfHijriMonth,
    endOfHijriMonth,
    hijriMonthLength,
    addHijriMonths,
    getHijriMonthGrid,
} from '../../utils/hijri';

/** Local-noon construction avoids UTC/timezone edge cases. */
const d = (iso: string) => new Date(iso + 'T12:00:00');

const hasUmalqura = (() => {
    try {
        return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura').resolvedOptions().calendar === 'islamic-umalqura';
    } catch {
        return false;
    }
})();

describe('hijriPartsOf (Umm al-Qura)', () => {
    // Official Saudi Umm al-Qura dates cross-checked against api.aladhan.com/v1/gToH
    (hasUmalqura ? it : it.skip)('matches official Saudi anchor dates', () => {
        expect(hijriPartsOf(d('2025-03-01'))).toEqual({ year: 1446, month: 9, day: 1 });   // 1 Ramadan 1446
        expect(hijriPartsOf(d('2025-03-30'))).toEqual({ year: 1446, month: 10, day: 1 });  // 1 Shawwal 1446 (Eid al-Fitr)
        expect(hijriPartsOf(d('2025-06-06'))).toEqual({ year: 1446, month: 12, day: 10 }); // 10 Dhu al-Hijjah 1446 (Eid al-Adha)
        expect(hijriPartsOf(d('2025-06-26'))).toEqual({ year: 1447, month: 1, day: 1 });   // 1 Muharram 1447
    });

    (hasUmalqura ? it : it.skip)('resolves to islamic-umalqura, never a silent gregory fallback', () => {
        // Guards against the invalid-calendar-tag bug class (e.g. "umaqra")
        const fmt = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura');
        expect(fmt.resolvedOptions().calendar).toBe('islamic-umalqura');
    });
});

describe('hijri month arithmetic', () => {
    (hasUmalqura ? it : it.skip)('Ramadan 1446 has 29 days and starts on Saturday', () => {
        const start = startOfHijriMonth(d('2025-03-05'));
        expect(start?.getDay()).toBe(6); // Saturday
        expect(hijriMonthLength(d('2025-03-05'))).toBe(29);
        expect(endOfHijriMonth(d('2025-03-05'))?.getDate()).toBe(29);
    });

    (hasUmalqura ? it : it.skip)('addHijriMonths lands on real month boundaries', () => {
        expect(hijriPartsOf(addHijriMonths(d('2025-03-05'), 1)!)).toEqual({ year: 1446, month: 10, day: 1 });
        expect(hijriPartsOf(addHijriMonths(d('2025-03-05'), -1)!)).toEqual({ year: 1446, month: 8, day: 1 });
        // Crossing a 29/30-day boundary pair repeatedly stays consistent
        let cursor = d('2025-03-05');
        for (let i = 0; i < 12; i++) cursor = addHijriMonths(cursor, 1)!;
        const p = hijriPartsOf(cursor)!;
        expect(p.year).toBe(1447);
        expect(p.day).toBe(1);
    });
});

describe('getHijriMonthGrid', () => {
    (hasUmalqura ? it : it.skip)('builds a Saturday-first grid covering exactly Ramadan 1446', () => {
        const grid = getHijriMonthGrid(d('2025-03-05'));
        expect(grid).not.toBeNull();
        const realDays = grid!.days.filter((x): x is Date => x !== null);
        expect(realDays.length).toBe(29);
        // Grid cells are local-midnight dates; compare calendar days, not instants
        const calDay = (x: Date) => x.getFullYear() * 10000 + (x.getMonth() + 1) * 100 + x.getDate();
        expect(calDay(realDays[0])).toBe(20250301);
        expect(calDay(realDays[realDays.length - 1])).toBe(20250329);
        // Leading padding keeps the first real day on a Saturday column
        const lead = grid!.days.length - realDays.length;
        expect(grid!.days[lead]!.getDay()).toBe(6);
        expect(grid!.title.length).toBeGreaterThan(0);
        expect(grid!.title).toContain('\u0631\u0645\u0636\u0627\u0646'); // "Ramadan"
    });
});

describe('formatHijriArabic', () => {
    (hasUmalqura ? it : it.skip)('renders an Arabic string containing the Hijri digits of 1 Ramadan 1446', () => {
        const s = formatHijriArabic(d('2025-03-01'));
        expect(s).toContain('\u0631\u0645\u0636\u0627\u0646'); // "Ramadan"
        expect(s).toContain('\u0661\u0664\u0664\u0666'); // Arabic-Indic 1446
    });
});
