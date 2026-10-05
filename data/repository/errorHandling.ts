/**
 * Repository Error Handling
 * Provides consistent error handling for all repositories.
 */

/**
 * Custom error class for repository operations.
 */
export class RepositoryError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'RepositoryError';
    }
}

/**
 * Error codes for repository operations.
 */
export const RepositoryErrorCode = {
    STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
    DATA_CORRUPTED: 'DATA_CORRUPTED',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    UNKNOWN: 'UNKNOWN'
} as const;

export type RepositoryErrorCode = typeof RepositoryErrorCode[keyof typeof RepositoryErrorCode];

/**
 * Wrap a repository operation with error handling.
 */
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorCode: RepositoryErrorCode = RepositoryErrorCode.UNKNOWN,
    errorMessage?: string
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof RepositoryError) {
            throw error;
        }
        
        const message = errorMessage || `Repository operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        throw new RepositoryError(message, errorCode, error instanceof Error ? error : undefined);
    }
}

/**
 * Validate that a value is not null or undefined.
 */
export function validateNotNull<T>(value: T | null | undefined, message: string): asserts value is T {
    if (value === null || value === undefined) {
        throw new RepositoryError(message, RepositoryErrorCode.VALIDATION_FAILED);
    }
}

/**
 * Validate that an array contains only valid items.
 */
export function validateArray<T>(items: T[], validator: (item: T) => boolean, message: string): boolean {
    if (!Array.isArray(items)) {
        throw new RepositoryError(message, RepositoryErrorCode.VALIDATION_FAILED);
    }
    
    for (const item of items) {
        if (!validator(item)) {
            throw new RepositoryError(message, RepositoryErrorCode.VALIDATION_FAILED);
        }
    }
    return true;
}

/**
 * Safely parse JSON with error handling.
 */
export function safeParse<T>(json: string, fallback: T, errorMessage?: string): T {
    try {
        return JSON.parse(json) as T;
    } catch (error) {
        if (errorMessage) {
            console.warn(errorMessage, error);
        }
        return fallback;
    }
}
