import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProgressState, UserStats, StreakOutcome } from '../types';
import { defaultStats } from '../data/storage/defaults';
import { computeStreakOutcome, resolveTimezone } from '../data/streak';

const getLocalDateKey = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

interface ProgressStoreState {
  progress: ProgressState;
  stats: UserStats;
  
  updateProgress: (zikrId: number, count: number) => void;
  incrementProgress: (zikrId: number, by?: number) => void;
  incrementStreak: () => StreakOutcome;
  incrementTotalReads: (count: number) => void;
  resetProgress: () => void;
  setProgress: (progress: ProgressState) => void;
  setStats: (stats: UserStats) => void;
}

export const useProgressStore = create<ProgressStoreState>()(
  persist(
    (set) => ({
      progress: {},
      stats: defaultStats,
      
      updateProgress: (zikrId, count) => set((state) => ({
        progress: { ...state.progress, [zikrId]: count }
      })),
      
      incrementProgress: (zikrId, by = 1) => set((state) => ({
        progress: { ...state.progress, [zikrId]: (state.progress[zikrId] || 0) + by }
      })),
      
      incrementStreak: () => {
        const today = getLocalDateKey();
        let outcome: StreakOutcome = { kind: 'same-day', streak: 0 };
        
        set((state) => {
          const tz = state.stats.timezone || resolveTimezone(state.stats);
          const computed = computeStreakOutcome(
            { ...state.stats, timezone: tz },
            today,
          );
          outcome = computed;
          
          if (computed.kind === 'same-day') return state;
          
          return {
            stats: {
              ...state.stats,
              streak: computed.streak,
              lastActiveDate: today,
              timezone: tz,
            },
          };
        });
        
        return outcome;
      },
      
      incrementTotalReads: (count) => set((state) => ({
        stats: { ...state.stats, totalReads: state.stats.totalReads + count }
      })),
      
      resetProgress: () => set({ progress: {} }),
      setProgress: (progress) => set({ progress }),
      setStats: (stats) => set({ stats }),
    }),
    {
      name: 'azkar-progress',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            return JSON.parse(str);
          } catch {
            // Corrupt persisted state must not crash rehydration.
            return null;
          }
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
