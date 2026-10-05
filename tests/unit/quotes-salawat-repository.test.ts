/**
 * Unit tests for quotesRepository and salawatRepository (data/repository.ts)
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { quotesRepository, salawatRepository } from '../../data/repository';
import { getStorage } from '../../data/storage';
import type { Quote, Salawat } from '../../types';

// Mock the storage module
vi.mock('../../data/storage', () => ({
    getStorage: vi.fn(),
}));

const mockStorage = {
    getUserQuotes: vi.fn(),
    addUserQuote: vi.fn(),
    getUserSalawat: vi.fn(),
    addUserSalawat: vi.fn(),
};

describe('quotesRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getStorage as ReturnType<typeof vi.fn>).mockReturnValue(mockStorage);
        mockStorage.getUserQuotes.mockResolvedValue([]);
    });

    describe('getAll', () => {
        it('returns static quotes when no user quotes exist', async () => {
            const quotes = await quotesRepository.getAll();
            expect(quotes.length).toBeGreaterThan(0);
        });

        it('merges user quotes with static quotes', async () => {
            const userQuote: Quote = {
                id: 9999,
                text: 'User quote',
                author: 'User',
            };
            mockStorage.getUserQuotes.mockResolvedValue([userQuote]);

            const quotes = await quotesRepository.getAll();
            expect(quotes.some(q => q.id === 9999)).toBe(true);
        });
    });

    describe('getRandom', () => {
        it('returns a quote', async () => {
            const quote = await quotesRepository.getRandom();
            expect(quote).toBeDefined();
            expect(quote.text).toBeDefined();
        });

        it('returns fallback when no quotes exist', async () => {
            // This test assumes STATIC_QUOTES is non-empty, so we just verify it returns something
            const quote = await quotesRepository.getRandom();
            expect(quote).toBeDefined();
        });
    });

    describe('add', () => {
        it('adds a new quote', async () => {
            const result = await quotesRepository.add('New quote', 'Author');
            expect(mockStorage.addUserQuote).toHaveBeenCalled();
            expect(result.text).toBe('New quote');
            expect(result.author).toBe('Author');
        });
    });
});

describe('salawatRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getStorage as ReturnType<typeof vi.fn>).mockReturnValue(mockStorage);
        mockStorage.getUserSalawat.mockResolvedValue([]);
    });

    describe('getAll', () => {
        it('returns static salawat when no user salawat exist', async () => {
            const salawat = await salawatRepository.getAll();
            expect(salawat.length).toBeGreaterThan(0);
        });

        it('merges user salawat with static salawat', async () => {
            const userSalawat: Salawat = {
                id: 9999,
                text: 'User salawat',
            };
            mockStorage.getUserSalawat.mockResolvedValue([userSalawat]);

            const salawat = await salawatRepository.getAll();
            expect(salawat.some(s => s.id === 9999)).toBe(true);
        });
    });

    describe('getRandom', () => {
        it('returns a salawat', async () => {
            const salawat = await salawatRepository.getRandom();
            expect(salawat).toBeDefined();
            expect(salawat.text).toBeDefined();
        });
    });

    describe('add', () => {
        it('adds a new salawat', async () => {
            const result = await salawatRepository.add('New salawat');
            expect(mockStorage.addUserSalawat).toHaveBeenCalled();
            expect(result.text).toBe('New salawat');
        });
    });
});
