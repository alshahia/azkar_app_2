/**
 * Unit tests for quranRepository (data/quranRepository.ts)
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { quranRepository } from '../../data/quranRepository';
import { getStorage } from '../../data/storage';
import type { QuranBookmark, QuranLastRead, QuranReadHistoryEntry } from '../../types';

// Mock the storage module
vi.mock('../../data/storage', () => ({
    getStorage: vi.fn(),
}));

const mockStorage = {
    getQuranBookmarks: vi.fn(),
    saveQuranBookmarks: vi.fn(),
    getQuranLastRead: vi.fn(),
    saveQuranLastRead: vi.fn(),
    getQuranReadHistory: vi.fn(),
    saveQuranReadHistory: vi.fn(),
};

describe('quranRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (getStorage as ReturnType<typeof vi.fn>).mockReturnValue(mockStorage);
        mockStorage.getQuranBookmarks.mockResolvedValue([]);
        mockStorage.getQuranLastRead.mockResolvedValue(null);
        mockStorage.getQuranReadHistory.mockResolvedValue([]);
    });

    describe('getBookmarks', () => {
        it('returns empty array when no bookmarks exist', async () => {
            const bookmarks = await quranRepository.getBookmarks();
            expect(bookmarks).toEqual([]);
        });

        it('returns bookmarks when they exist', async () => {
            const bookmarks: QuranBookmark[] = [
                { surah: 1, ayah: 1, createdAt: Date.now() },
                { surah: 2, ayah: 5, createdAt: Date.now() },
            ];
            mockStorage.getQuranBookmarks.mockResolvedValue(bookmarks);

            const result = await quranRepository.getBookmarks();
            expect(result).toEqual(bookmarks);
        });
    });

    describe('addBookmark', () => {
        it('adds a new bookmark', async () => {
            const bookmark: QuranBookmark = { surah: 1, ayah: 1, createdAt: Date.now() };
            mockStorage.getQuranBookmarks.mockResolvedValue([]);

            await quranRepository.addBookmark(bookmark);
            expect(mockStorage.saveQuranBookmarks).toHaveBeenCalledWith([bookmark]);
        });

        it('does not add duplicate bookmark', async () => {
            const bookmark: QuranBookmark = { surah: 1, ayah: 1, createdAt: Date.now() };
            mockStorage.getQuranBookmarks.mockResolvedValue([bookmark]);

            await quranRepository.addBookmark(bookmark);
            expect(mockStorage.saveQuranBookmarks).not.toHaveBeenCalled();
        });
    });

    describe('removeBookmark', () => {
        it('removes an existing bookmark', async () => {
            const bookmarks: QuranBookmark[] = [
                { surah: 1, ayah: 1, createdAt: Date.now() },
                { surah: 2, ayah: 5, createdAt: Date.now() },
            ];
            mockStorage.getQuranBookmarks.mockResolvedValue(bookmarks);

            await quranRepository.removeBookmark(1, 1);
            expect(mockStorage.saveQuranBookmarks).toHaveBeenCalledWith([{ surah: 2, ayah: 5, createdAt: bookmarks[1].createdAt }]);
        });

        it('does nothing when bookmark does not exist', async () => {
            const bookmarks: QuranBookmark[] = [{ surah: 1, ayah: 1, createdAt: Date.now() }];
            mockStorage.getQuranBookmarks.mockResolvedValue(bookmarks);

            await quranRepository.removeBookmark(999, 999);
            expect(mockStorage.saveQuranBookmarks).toHaveBeenCalledWith(bookmarks);
        });
    });

    describe('isBookmarked', () => {
        it('returns true when bookmark exists', async () => {
            const bookmarks: QuranBookmark[] = [{ surah: 1, ayah: 1, createdAt: Date.now() }];
            mockStorage.getQuranBookmarks.mockResolvedValue(bookmarks);

            const result = await quranRepository.isBookmarked(1, 1);
            expect(result).toBe(true);
        });

        it('returns false when bookmark does not exist', async () => {
            const bookmarks: QuranBookmark[] = [{ surah: 1, ayah: 1, createdAt: Date.now() }];
            mockStorage.getQuranBookmarks.mockResolvedValue(bookmarks);

            const result = await quranRepository.isBookmarked(2, 2);
            expect(result).toBe(false);
        });
    });

    describe('getLastRead', () => {
        it('returns null when no last read exists', async () => {
            const result = await quranRepository.getLastRead();
            expect(result).toBeNull();
        });

        it('returns last read when it exists', async () => {
            const lastRead: QuranLastRead = { surah: 1, ayah: 5 };
            mockStorage.getQuranLastRead.mockResolvedValue(lastRead);

            const result = await quranRepository.getLastRead();
            expect(result).toEqual(lastRead);
        });
    });

    describe('setLastRead', () => {
        it('saves last read position', async () => {
            const lastRead: QuranLastRead = { surah: 1, ayah: 5 };
            await quranRepository.setLastRead(lastRead);
            expect(mockStorage.saveQuranLastRead).toHaveBeenCalledWith(lastRead);
        });

        it('clears last read when null is passed', async () => {
            await quranRepository.setLastRead(null);
            expect(mockStorage.saveQuranLastRead).toHaveBeenCalledWith(null);
        });
    });

    describe('getReadHistory', () => {
        it('returns empty array when no history exists', async () => {
            const history = await quranRepository.getReadHistory();
            expect(history).toEqual([]);
        });

        it('returns history when it exists', async () => {
            const history: QuranReadHistoryEntry[] = [
                { surah: 1, ayah: 1, ts: Date.now() },
            ];
            mockStorage.getQuranReadHistory.mockResolvedValue(history);

            const result = await quranRepository.getReadHistory();
            expect(result).toEqual(history);
        });
    });

    describe('addReadHistory', () => {
        it('adds new entry to history', async () => {
            const entry: QuranReadHistoryEntry = { surah: 1, ayah: 1, ts: Date.now() };
            mockStorage.getQuranReadHistory.mockResolvedValue([]);

            await quranRepository.addReadHistory(entry);
            expect(mockStorage.saveQuranReadHistory).toHaveBeenCalledWith([entry]);
        });

        it('limits history to 10 entries', async () => {
            const existingHistory: QuranReadHistoryEntry[] = Array.from({ length: 10 }, (_, i) => ({
                surah: i + 1,
                ayah: 1,
                ts: Date.now() - i * 1000,
            }));
            mockStorage.getQuranReadHistory.mockResolvedValue(existingHistory);

            const newEntry: QuranReadHistoryEntry = { surah: 99, ayah: 1, ts: Date.now() };
            await quranRepository.addReadHistory(newEntry);

            const savedHistory = mockStorage.saveQuranReadHistory.mock.calls[0][0];
            expect(savedHistory.length).toBe(10);
            expect(savedHistory[0]).toEqual(newEntry);
        });
    });

    describe('clearReadHistory', () => {
        it('clears all history', async () => {
            await quranRepository.clearReadHistory();
            expect(mockStorage.saveQuranReadHistory).toHaveBeenCalledWith([]);
        });
    });
});
