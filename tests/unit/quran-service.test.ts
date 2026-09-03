import { describe, it, expect } from 'vitest';
import {
    SURAHS, JUZ_STARTS, totalAyat, showsBismillahHeader,
    normalizeArabic, searchSurahs, positionFromGlobal, ayahAudioUrl, toArabicDigits,
} from '../../services/QuranService';

describe('QuranService - static dataset integrity', () => {
    it('ships exactly 114 surahs', () => {
        expect(SURAHS.length).toBe(114);
    });

    it('contains 6236 ayahs in total (Hafs mushaf)', () => {
        expect(totalAyat()).toBe(6236);
    });

    it('lists every surah with required metadata', () => {
        for (const s of SURAHS) {
            expect(s.id).toBeGreaterThanOrEqual(1);
            expect(s.id).toBeLessThanOrEqual(114);
            expect(s.name).toBeTruthy();
            expect(s.transliteration).toBeTruthy();
            expect(['مكية', 'مدنية']).toContain(s.revelation);
            expect(s.ayahCount).toBeGreaterThan(0);
            expect(s.firstPage).toBeGreaterThanOrEqual(1);
        }
    });

    it('has 30 juz starts', () => {
        expect(JUZ_STARTS.length).toBe(30);
        expect(JUZ_STARTS[0].juz).toBe(1);
        expect(JUZ_STARTS[29].juz).toBe(30);
    });
});

describe('QuranService - basmilla header logic', () => {
    it('hides the header for Al-Fatiha', () => {
        expect(showsBismillahHeader(1)).toBe(false);
    });
    it('hides the header for At-Tawbah', () => {
        expect(showsBismillahHeader(9)).toBe(false);
    });
    it('shows the header for every other surah', () => {
        for (const s of SURAHS) {
            if (s.id === 1 || s.id === 9) continue;
            expect(showsBismillahHeader(s.id)).toBe(true);
        }
    });
});

describe('QuranService - normalizeArabic', () => {
    it('strips harakat and tatweel', () => {
        expect(normalizeArabic('بِسْمِ')).toBe('بسم');
        expect(normalizeArabic('الـحمـد')).toBe('الـحمد'.replace(/\u0640/g, ''));
    });
    it('unifies alef and hamza forms', () => {
        expect(normalizeArabic('إبراهيم')).toBe('ابراهيم');
        expect(normalizeArabic('ٱلله')).toBe('الله');
    });
    it('lowercases Latin for transliteration lookups', () => {
        expect(normalizeArabic('Al-Fatiha')).toBe('al-fatiha');
    });
});

describe('QuranService - searchSurahs', () => {
    it('returns every surah for an empty query', () => {
        expect(searchSurahs('').length).toBe(114);
    });
    it('matches by transliteration (case + diacritic insensitive)', () => {
        // "al-faa" is the canonical romanization of the long vowel in Al-Faatiha.
        const fatiha = searchSurahs('al-faa');
        expect(fatiha.length).toBeGreaterThan(0);
        expect(fatiha[0].id).toBe(1);
    });
    it('matches by Arabic name fragment', () => {
        const baqara = searchSurahs('بقرة');
        expect(baqara[0].id).toBe(2);
    });
    it('matches by numeric id', () => {
        expect(searchSurahs('112')[0].id).toBe(112);
    });
    it('matches by the prefixed form "سورة N"', () => {
        expect(searchSurahs('سورة 1')[0].id).toBe(1);
    });
    it('returns nothing for unrelated queries', () => {
        expect(searchSurahs('xyznotaquranterm')).toEqual([]);
    });
});

describe('QuranService - positionFromGlobal', () => {
    it('maps global #1 to Al-Fatiha 1', () => {
        expect(positionFromGlobal(1)).toEqual({ surah: 1, ayah: 1 });
    });
    it('maps global #7 to Al-Fatiha 7', () => {
        expect(positionFromGlobal(7)).toEqual({ surah: 1, ayah: 7 });
    });
    it('maps global #8 to Al-Baqara 1', () => {
        expect(positionFromGlobal(8)).toEqual({ surah: 2, ayah: 1 });
    });
    it('maps global #6236 to An-Nas 6', () => {
        expect(positionFromGlobal(6236)).toEqual({ surah: 114, ayah: 6 });
    });
    it('throws for out-of-range global numbers', () => {
        expect(() => positionFromGlobal(0)).toThrow();
        expect(() => positionFromGlobal(6237)).toThrow();
    });
});

describe('QuranService - audio URL + helpers', () => {
    it('builds the canonical cdn.islamic.network per-ayah URL', () => {
        expect(ayahAudioUrl('ar.alafasy', 262)).toBe('https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3');
    });
    it('renders Arabic-Indic digits', () => {
        expect(toArabicDigits(0)).toBe('٠');
        expect(toArabicDigits(286)).toBe('٢٨٦');
    });
});
