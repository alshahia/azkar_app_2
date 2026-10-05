/**
 * Data Validation
 * Provides validation functions for repository data.
 */

import { UserZikr, UserCategory, Quote, Salawat, QuranBookmark, QuranLastRead, QuranReadHistoryEntry } from '../../types';
import { validateNotNull, validateArray } from './errorHandling';

/**
 * Validate a UserZikr object.
 */
export function validateUserZikr(zikr: UserZikr): boolean {
    try {
        validateNotNull(zikr, 'UserZikr is null or undefined');
        validateNotNull(zikr.id, 'UserZikr.id is null or undefined');
        validateNotNull(zikr.arabic, 'UserZikr.arabic is null or undefined');
        validateNotNull(zikr.categoryId, 'UserZikr.categoryId is null or undefined');
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate a UserCategory object.
 */
export function validateUserCategory(category: UserCategory): boolean {
    try {
        validateNotNull(category, 'UserCategory is null or undefined');
        validateNotNull(category.id, 'UserCategory.id is null or undefined');
        validateNotNull(category.title, 'UserCategory.title is null or undefined');
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate a Quote object.
 */
export function validateQuote(quote: Quote): boolean {
    try {
        validateNotNull(quote, 'Quote is null or undefined');
        validateNotNull(quote.id, 'Quote.id is null or undefined');
        validateNotNull(quote.text, 'Quote.text is null or undefined');
        validateNotNull(quote.author, 'Quote.author is null or undefined');
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate a Salawat object.
 */
export function validateSalawat(salawat: Salawat): boolean {
    try {
        validateNotNull(salawat, 'Salawat is null or undefined');
        validateNotNull(salawat.id, 'Salawat.id is null or undefined');
        validateNotNull(salawat.text, 'Salawat.text is null or undefined');
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate a QuranBookmark object.
 */
export function validateQuranBookmark(bookmark: QuranBookmark): boolean {
    try {
        validateNotNull(bookmark, 'QuranBookmark is null or undefined');
        validateNotNull(bookmark.surah, 'QuranBookmark.surah is null or undefined');
        validateNotNull(bookmark.ayah, 'QuranBookmark.ayah is null or undefined');
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate a QuranLastRead object.
 */
export function validateQuranLastRead(lastRead: QuranLastRead): boolean {
    try {
        validateNotNull(lastRead, 'QuranLastRead is null or undefined');
        validateNotNull(lastRead.surah, 'QuranLastRead.surah is null or undefined');
        validateNotNull(lastRead.ayah, 'QuranLastRead.ayah is null or undefined');
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate a QuranReadHistoryEntry object.
 */
export function validateQuranReadHistoryEntry(entry: QuranReadHistoryEntry): boolean {
    try {
        validateNotNull(entry, 'QuranReadHistoryEntry is null or undefined');
        validateNotNull(entry.surah, 'QuranReadHistoryEntry.surah is null or undefined');
        validateNotNull(entry.ayah, 'QuranReadHistoryEntry.ayah is null or undefined');
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate an array of UserZikr objects.
 */
export function validateUserZikrArray(zikrs: UserZikr[]): boolean {
    return validateArray(zikrs, validateUserZikr, 'Invalid UserZikr in array');
}

/**
 * Validate an array of UserCategory objects.
 */
export function validateUserCategoryArray(categories: UserCategory[]): boolean {
    return validateArray(categories, validateUserCategory, 'Invalid UserCategory in array');
}

/**
 * Validate an array of Quote objects.
 */
export function validateQuoteArray(quotes: Quote[]): boolean {
    return validateArray(quotes, validateQuote, 'Invalid Quote in array');
}

/**
 * Validate an array of Salawat objects.
 */
export function validateSalawatArray(salawat: Salawat[]): boolean {
    return validateArray(salawat, validateSalawat, 'Invalid Salawat in array');
}

/**
 * Validate an array of QuranBookmark objects.
 */
export function validateQuranBookmarkArray(bookmarks: QuranBookmark[]): boolean {
    return validateArray(bookmarks, validateQuranBookmark, 'Invalid QuranBookmark in array');
}

/**
 * Validate an array of QuranReadHistoryEntry objects.
 */
export function validateQuranReadHistoryEntryArray(entries: QuranReadHistoryEntry[]): boolean {
    return validateArray(entries, validateQuranReadHistoryEntry, 'Invalid QuranReadHistoryEntry in array');
}
