import { QuranBookmark, QuranLastRead, QuranReadHistoryEntry } from '../types';
import { getStorage } from './storage';

/**
 * Quran Repository
 * Encapsulates all Quran data access (bookmarks, last read, read history).
 */
export const quranRepository = {
    // --- Bookmarks ---
    getBookmarks: async (): Promise<QuranBookmark[]> => {
        const storage = getStorage();
        return await storage.getQuranBookmarks();
    },

    addBookmark: async (bookmark: QuranBookmark): Promise<void> => {
        const storage = getStorage();
        const bookmarks = await storage.getQuranBookmarks();
        const exists = bookmarks.some(b => b.surah === bookmark.surah && b.ayah === bookmark.ayah);
        if (!exists) {
            await storage.saveQuranBookmarks([...bookmarks, bookmark]);
        }
    },

    removeBookmark: async (surah: number, ayah: number): Promise<void> => {
        const storage = getStorage();
        const bookmarks = await storage.getQuranBookmarks();
        const filtered = bookmarks.filter(b => !(b.surah === surah && b.ayah === ayah));
        await storage.saveQuranBookmarks(filtered);
    },

    isBookmarked: async (surah: number, ayah: number): Promise<boolean> => {
        const storage = getStorage();
        const bookmarks = await storage.getQuranBookmarks();
        return bookmarks.some(b => b.surah === surah && b.ayah === ayah);
    },

    // --- Last Read ---
    getLastRead: async (): Promise<QuranLastRead | null> => {
        const storage = getStorage();
        return await storage.getQuranLastRead();
    },

    setLastRead: async (lastRead: QuranLastRead | null): Promise<void> => {
        const storage = getStorage();
        await storage.saveQuranLastRead(lastRead);
    },

    // --- Read History ---
    getReadHistory: async (): Promise<QuranReadHistoryEntry[]> => {
        const storage = getStorage();
        return await storage.getQuranReadHistory();
    },

    addReadHistory: async (entry: QuranReadHistoryEntry): Promise<void> => {
        const storage = getStorage();
        const history = await storage.getQuranReadHistory();
        // Add to front, keep only last 10 entries
        const updated = [entry, ...history].slice(0, 10);
        await storage.saveQuranReadHistory(updated);
    },

    clearReadHistory: async (): Promise<void> => {
        const storage = getStorage();
        await storage.saveQuranReadHistory([]);
    }
};
