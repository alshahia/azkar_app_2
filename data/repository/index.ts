/**
 * Repository Index
 * Central export for all repositories.
 * 
 * All repositories follow the same pattern:
 * - Singleton objects with async methods
 * - Consistent error handling
 * - Clear separation of concerns
 */

export { azkarRepository } from '../azkarRepository';
export { quotesRepository, salawatRepository } from '../repository';
export { quranRepository } from '../quranRepository';
export { prayerTimesRepository } from '../prayerTimesRepository';
export { BaseRepository, type Repository } from './base';
export { 
    RepositoryError, 
    RepositoryErrorCode, 
    withErrorHandling, 
    validateNotNull, 
    validateArray, 
    safeParse 
} from './errorHandling';
export {
    validateUserZikr,
    validateUserCategory,
    validateQuote,
    validateSalawat,
    validateQuranBookmark,
    validateQuranLastRead,
    validateQuranReadHistoryEntry,
    validateUserZikrArray,
    validateUserCategoryArray,
    validateQuoteArray,
    validateSalawatArray,
    validateQuranBookmarkArray,
    validateQuranReadHistoryEntryArray
} from './validation';
