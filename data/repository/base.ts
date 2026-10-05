import { getStorage } from '../storage';

/**
 * Base repository interface that all repositories should implement.
 * Provides a consistent pattern for data access.
 */
export interface Repository<T> {
    getAll(): Promise<T[]>;
    getById(id: string | number): Promise<T | undefined>;
    add(item: T): Promise<void>;
    update(item: T): Promise<void>;
    delete(id: string | number): Promise<void>;
}

/**
 * Base repository class that provides common functionality.
 * All repositories should extend this class.
 */
export abstract class BaseRepository<T extends { id: string | number }> implements Repository<T> {
    protected storage = getStorage();
    protected cache: T[] | null = null;
    protected cacheValid = false;

    abstract getAll(): Promise<T[]>;
    abstract getById(id: string | number): Promise<T | undefined>;
    abstract add(item: T): Promise<void>;
    abstract update(item: T): Promise<void>;
    abstract delete(id: string | number): Promise<void>;

    /**
     * Invalidate the cache. Call this after any mutation.
     */
    protected invalidateCache(): void {
        this.cache = null;
        this.cacheValid = false;
    }

    /**
     * Get all items from cache or storage.
     */
    protected async getCached(): Promise<T[]> {
        if (this.cacheValid && this.cache) {
            return this.cache;
        }
        this.cache = await this.getAll();
        this.cacheValid = true;
        return this.cache;
    }
}
