
import { describe, it, expect } from 'vitest';
import { _computeHighlightsForTest } from '../../components/screens/SearchScreen';

describe('SearchScreen - _computeHighlightsForTest (highlight ranges)', () => {
    it('returns [] when the ayah text is empty', () => {
        expect(_computeHighlightsForTest('', ['الرحمن'])).toEqual([]);
    });

    it('returns [] when no query tokens', () => {
        expect(_computeHighlightsForTest('بسم الله', [])).toEqual([]);
    });

    it('finds an exact stem and returns its byte range', () => {
        const text = 'بسم الله الرحمن';
        const ranges = _computeHighlightsForTest(text, ['الرحمن']);
        expect(ranges.length).toBe(1);
        expect(text.slice(ranges[0][0], ranges[0][1])).toBe('الرحمن');
    });

    it('matches a clitic-prefixed occurrence after stripping the clitic', () => {
        // 'والرحمن' -> 'رحمن' (after clitic strip). Query 'رحمن' matches.
        const text = 'بسم الله والرحمن';
        const ranges = _computeHighlightsForTest(text, ['رحمن']);
        expect(ranges.length).toBe(1);
        expect(text.slice(ranges[0][0], ranges[0][1])).toBe('والرحمن');
    });

    it('matches by prefix (query shorter than indexed stem)', () => {
        const text = 'بسم الله الرحمن';
        const ranges = _computeHighlightsForTest(text, ['الرح']);
        expect(ranges.length).toBe(1);
        expect(text.slice(ranges[0][0], ranges[0][1])).toBe('الرحمن');
    });

    it('returns one range per occurrence when the token repeats', () => {
        const text = 'الرحمن الرحيم';
        const ranges = _computeHighlightsForTest(text, ['الرحمن']);
        expect(ranges.length).toBe(1);
        expect(text.slice(ranges[0][0], ranges[0][1])).toBe('الرحمن');
    });

    it('strips diacritics before matching (الرحمن vs الرَّحْمَن)', () => {
        expect(_computeHighlightsForTest('الرَّحْمَن', ['الرحمن']).length).toBe(1);
    });

    it('does not produce a match when the prefix is a different word', () => {
        // 'الرحمن' is not a prefix of 'الرحيم', so no match.
        expect(_computeHighlightsForTest('الرحيم', ['الرحمن']).length).toBe(0);
    });

    it('handles multiple query tokens - finds every stem instance', () => {
        const text = 'بسم الله الرحمن الرحيم';
        const ranges = _computeHighlightsForTest(text, ['الرحمن', 'الرحيم']);
        expect(ranges.length).toBe(2);
    });

    it('returns ranges in source order', () => {
        const text = 'الرحيم الرحمن';
        const ranges = _computeHighlightsForTest(text, ['الرحمن', 'الرحيم']);
        expect(ranges.length).toBe(2);
        expect(ranges[0][0]).toBeLessThan(ranges[1][0]);
    });

    it('protects closed-form lemma الله from clitic collapse', () => {
        // 'لله' would normally collapse via 'لل' clitic strip; the closed-form
        // table keeps it whole so users querying 'الله' or 'لله' still match.
        const text = 'بسم الله الرحمن الرحيم';
        const ranges = _computeHighlightsForTest(text, ['الله']);
        expect(ranges.length).toBe(1);
        expect(text.slice(ranges[0][0], ranges[0][1])).toBe('الله');
    });
});
