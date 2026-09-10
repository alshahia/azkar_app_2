
import { describe, it, expect } from 'vitest';
import { tokenizeAyah, stripClitic, normalizeWord, CLITICS } from '../../workers/quranSearchTokens';

describe('quranSearchTokens - tokenizeAyah', () => {
    it('strips Quranic marks and folds alef variants', () => {
        const out = tokenizeAyah('بِسْمِ اللَّهِ');
        expect(out.join(' ')).toBe('بسم الله');
    });

    it('drops 1-letter Arabic stop words (و، ف، ب، ل، ك)', () => {
        const out = tokenizeAyah('و ب ل ك');
        expect(out).toEqual([]);
    });

    it('keeps 2+ letter words even if they look like stop words', () => {
        expect(tokenizeAyah('ثم')).toEqual(['ثم']);
    });

    it('strips multi-char clitic prefixes (وال/بال/فال/كال/لل)', () => {
        expect(tokenizeAyah('والرحمن')).toEqual(['رحمن']);
        expect(tokenizeAyah('بالرحمن')).toEqual(['رحمن']);
        expect(tokenizeAyah('فالرحمن')).toEqual(['رحمن']);
        expect(tokenizeAyah('كالرحمن')).toEqual(['رحمن']);
        expect(tokenizeAyah('للرحمن')).toEqual(['رحمن']);
    });

    it('does NOT strip the bare article ال (closed forms stay whole)', () => {
        // Users actively query 'الرحمن' / 'الرحيم'; stripping 'ال' would
        // collapse them and lose recall. Confirmed closed forms stay whole.
        expect(tokenizeAyah('الرحمن')).toEqual(['الرحمن']);
        expect(tokenizeAyah('الرحيم')).toEqual(['الرحيم']);
        expect(tokenizeAyah('الله')).toEqual(['الله']);
    });

    it('does NOT include the bare article ال in CLITICS', () => {
        expect(CLITICS).not.toContain('ال');
    });

    it('folds alef maqsura to ya', () => {
        expect(tokenizeAyah('موسىٰ')).toEqual(['موسي']);
    });

    it('handles a string of pure punctuation as empty', () => {
        expect(tokenizeAyah('.,;:')).toEqual([]);
    });

    it('handles an empty string', () => {
        expect(tokenizeAyah('')).toEqual([]);
    });

    it('preserves order of stems within an ayah', () => {
        // 'لله' has the preposition ل + closed form الله. With no multi-char
        // clitic prefix that matches ('ل' is filtered as a stop word; 'ال' is
        // not in CLITICS), the tokenize stays as 'لله'.
        const out = tokenizeAyah('الحمد لله رب العالمين');
        expect(out).toEqual(['الحمد', 'لله', 'رب', 'العالمين']);
    });

    it('clitic list is ordered longest-first so longer prefixes win', () => {
        expect(CLITICS.indexOf('وال')).toBeLessThan(CLITICS.indexOf('لل'));
    });

    it('stripClitic is a no-op when no clitic matches', () => {
        expect(stripClitic('رحمن')).toBe('رحمن');
    });

    it('normalizeWord produces the same form as tokenizeAyah-then-join', () => {
        expect(normalizeWord('بِسْمِ')).toBe('بسم');
    });
});
