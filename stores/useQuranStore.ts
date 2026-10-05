import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuranBookmark, QuranLastRead, QuranReadHistoryEntry } from '../types';
import { QURAN_READ_HISTORY_MAX } from '../types';

interface QuranState {
  // Bookmarks
  bookmarks: QuranBookmark[];
  
  // Last read position
  lastRead: QuranLastRead | null;
  
  // Read history
  readHistory: QuranReadHistoryEntry[];
  
  // Actions
  addBookmark: (bookmark: QuranBookmark) => void;
  removeBookmark: (surah: number, ayah: number) => void;
  isBookmarked: (surah: number, ayah: number) => boolean;
  setLastRead: (lastRead: QuranLastRead) => void;
  clearLastRead: () => void;
  addReadHistory: (entry: QuranReadHistoryEntry) => void;
  clearReadHistory: () => void;
  resetQuran: () => void;
}

const defaultQuranState = {
  bookmarks: [],
  lastRead: null,
  readHistory: [],
};

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      ...defaultQuranState,
      
      addBookmark: (bookmark) => set((state) => ({
        bookmarks: [...state.bookmarks, bookmark],
      })),
      
      removeBookmark: (surah, ayah) => set((state) => ({
        bookmarks: state.bookmarks.filter(
          b => !(b.surah === surah && b.ayah === ayah)
        ),
      })),
      
      isBookmarked: (surah, ayah) => {
        return get().bookmarks.some(b => b.surah === surah && b.ayah === ayah);
      },
      
      setLastRead: (lastRead) => set({ lastRead }),
      clearLastRead: () => set({ lastRead: null }),
      
      addReadHistory: (entry) => set((state) => ({
        readHistory: [entry, ...state.readHistory].slice(0, QURAN_READ_HISTORY_MAX),
      })),
      
      clearReadHistory: () => set({ readHistory: [] }),
      
      resetQuran: () => set(defaultQuranState),
    }),
    {
      name: 'azkar-quran',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
