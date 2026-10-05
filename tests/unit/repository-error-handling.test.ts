/**
 * Unit tests for error handling and validation utilities
 */
import { describe, it, expect } from 'vitest';
import {
    RepositoryError,
    RepositoryErrorCode,
    withErrorHandling,
    validateNotNull,
    validateArray,
    safeParse,
} from '../../data/repository/errorHandling';
import {
    validateUserZikr,
    validateUserCategory,
    validateQuote,
    validateSalawat,
    validateQuranBookmark,
    validateQuranLastRead,
    validateQuranReadHistoryEntry,
} from '../../data/repository/validation';
import type { UserZikr, UserCategory, Quote, Salawat, QuranBookmark, QuranLastRead, QuranReadHistoryEntry } from '../../types';

describe('RepositoryError', () => {
    it('creates error with message and code', () => {
        const error = new RepositoryError('Test error', RepositoryErrorCode.UNKNOWN);
        expect(error.message).toBe('Test error');
        expect(error.code).toBe(RepositoryErrorCode.UNKNOWN);
        expect(error.name).toBe('RepositoryError');
    });

    it('includes cause when provided', () => {
        const cause = new Error('Original error');
        const error = new RepositoryError('Wrapped error', RepositoryErrorCode.UNKNOWN, cause);
        expect(error.cause).toBe(cause);
    });
});

describe('withErrorHandling', () => {
    it('returns result when operation succeeds', async () => {
        const result = await withErrorHandling(() => Promise.resolve('success'));
        expect(result).toBe('success');
    });

    it('wraps errors in RepositoryError', async () => {
        await expect(
            withErrorHandling(() => Promise.reject(new Error('Test error')))
        ).rejects.toThrow(RepositoryError);
    });

    it('preserves existing RepositoryError', async () => {
        const originalError = new RepositoryError('Original', RepositoryErrorCode.UNKNOWN);
        await expect(
            withErrorHandling(() => Promise.reject(originalError))
        ).rejects.toBe(originalError);
    });

    it('uses custom error message when provided', async () => {
        await expect(
            withErrorHandling(
                () => Promise.reject(new Error('Test error')),
                RepositoryErrorCode.STORAGE_UNAVAILABLE,
                'Custom message'
            )
        ).rejects.toThrow('Custom message');
    });
});

describe('validateNotNull', () => {
    it('does not throw for non-null values', () => {
        expect(() => validateNotNull('value', 'message')).not.toThrow();
        expect(() => validateNotNull(0, 'message')).not.toThrow();
        expect(() => validateNotNull(false, 'message')).not.toThrow();
    });

    it('throws for null values', () => {
        expect(() => validateNotNull(null, 'message')).toThrow(RepositoryError);
    });

    it('throws for undefined values', () => {
        expect(() => validateNotNull(undefined, 'message')).toThrow(RepositoryError);
    });
});

describe('validateArray', () => {
    it('returns true for valid arrays', () => {
        const result = validateArray([1, 2, 3], (item) => typeof item === 'number', 'Invalid');
        expect(result).toBe(true);
    });

    it('throws for non-arrays', () => {
        expect(() => validateArray('not an array' as unknown as number[], () => true, 'Invalid')).toThrow(RepositoryError);
    });

    it('throws when any item fails validation', () => {
        expect(() => validateArray([1, 'two', 3], (item) => typeof item === 'number', 'Invalid')).toThrow(RepositoryError);
    });
});

describe('safeParse', () => {
    it('parses valid JSON', () => {
        const result = safeParse('{"key": "value"}', {});
        expect(result).toEqual({ key: 'value' });
    });

    it('returns fallback for invalid JSON', () => {
        const fallback = { default: true };
        const result = safeParse('invalid json', fallback);
        expect(result).toBe(fallback);
    });

    it('logs warning when error message is provided', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        safeParse('invalid', {}, 'Warning message');
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});

describe('validateUserZikr', () => {
    it('returns true for valid UserZikr', () => {
        const zikr: UserZikr = {
            id: 1,
            arabic: 'test',
            categoryId: 'morning',
            isCustom: true,
            transliteration: '',
            translation: '',
            benefit: '',
            reference: '',
            count: 1,
        };
        expect(validateUserZikr(zikr)).toBe(true);
    });

    it('returns false for invalid UserZikr', () => {
        expect(validateUserZikr(null as unknown as UserZikr)).toBe(false);
        expect(validateUserZikr({} as UserZikr)).toBe(false);
    });
});

describe('validateUserCategory', () => {
    it('returns true for valid UserCategory', () => {
        const category: UserCategory = {
            id: 'cat-1',
            title: 'Category',
        };
        expect(validateUserCategory(category)).toBe(true);
    });

    it('returns false for invalid UserCategory', () => {
        expect(validateUserCategory(null as unknown as UserCategory)).toBe(false);
        expect(validateUserCategory({} as UserCategory)).toBe(false);
    });
});

describe('validateQuote', () => {
    it('returns true for valid Quote', () => {
        const quote: Quote = {
            id: 1,
            text: 'Quote text',
            author: 'Author',
        };
        expect(validateQuote(quote)).toBe(true);
    });

    it('returns false for invalid Quote', () => {
        expect(validateQuote(null as unknown as Quote)).toBe(false);
        expect(validateQuote({} as Quote)).toBe(false);
    });
});

describe('validateSalawat', () => {
    it('returns true for valid Salawat', () => {
        const salawat: Salawat = {
            id: 1,
            text: 'Salawat text',
        };
        expect(validateSalawat(salawat)).toBe(true);
    });

    it('returns false for invalid Salawat', () => {
        expect(validateSalawat(null as unknown as Salawat)).toBe(false);
        expect(validateSalawat({} as Salawat)).toBe(false);
    });
});

describe('validateQuranBookmark', () => {
    it('returns true for valid QuranBookmark', () => {
        const bookmark: QuranBookmark = {
            surah: 1,
            ayah: 1,
            createdAt: Date.now(),
        };
        expect(validateQuranBookmark(bookmark)).toBe(true);
    });

    it('returns false for invalid QuranBookmark', () => {
        expect(validateQuranBookmark(null as unknown as QuranBookmark)).toBe(false);
        expect(validateQuranBookmark({} as QuranBookmark)).toBe(false);
    });
});

describe('validateQuranLastRead', () => {
    it('returns true for valid QuranLastRead', () => {
        const lastRead: QuranLastRead = {
            surah: 1,
            ayah: 1,
        };
        expect(validateQuranLastRead(lastRead)).toBe(true);
    });

    it('returns false for invalid QuranLastRead', () => {
        expect(validateQuranLastRead(null as unknown as QuranLastRead)).toBe(false);
        expect(validateQuranLastRead({} as QuranLastRead)).toBe(false);
    });
});

describe('validateQuranReadHistoryEntry', () => {
    it('returns true for valid QuranReadHistoryEntry', () => {
        const entry: QuranReadHistoryEntry = {
            surah: 1,
            ayah: 1,
            ts: Date.now(),
        };
        expect(validateQuranReadHistoryEntry(entry)).toBe(true);
    });

    it('returns false for invalid QuranReadHistoryEntry', () => {
        expect(validateQuranReadHistoryEntry(null as unknown as QuranReadHistoryEntry)).toBe(false);
        expect(validateQuranReadHistoryEntry({} as QuranReadHistoryEntry)).toBe(false);
    });
});
