import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppTheme, DarkStyle, AppLanguage, HomeLayout, CustomReminder, Category, UserZikr, MushafMode } from '../types';
import { azkarRepository } from '../data/azkarRepository';

interface PreferencesState {
  // Theme
  darkMode: boolean;
  theme: AppTheme;
  darkStyle: DarkStyle;
  
  // Language
  language: AppLanguage;
  
  // Layout
  homeLayout: HomeLayout;
  
  // Font
  fontSize: number;
  
  // Audio
  voiceName: string;
  audioAutoSave: boolean;
  audioLoopDefault: boolean;
  
  // Haptics
  hapticsEnabled: boolean;
  
  // Notifications
  notifications: boolean;
  morningReminderEnabled: boolean;
  morningReminderTime: string;
  eveningReminderEnabled: boolean;
  eveningReminderTime: string;
  prayerNotificationsEnabled: boolean;
  
  // Location
  location: { latitude: number; longitude: number } | null;
  
  // Quran display
  mushafMode: MushafMode;
  mushafTajweed: boolean;
  tafsirId: string;
  wakeLockEnabled: boolean;
  votdEnabled: boolean;
  votdTime: string;
  
  // Version
  lastSeenVersion: string | null;
  
  // Favorites
  favorites: number[];
  
  // API Key
  apiKey: string;
  
  // Custom Reminders
  customReminders: CustomReminder[];
  
  // Categories (dynamic data)
  categories: Category[];
  
  // Loading state
  isLoading: boolean;
  
  // Actions
  setPreferences: (prefs: Partial<PreferencesState>) => void;
  setLoading: (value: boolean) => void;
  setDarkMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  setTheme: (value: AppTheme) => void;
  setDarkStyle: (value: DarkStyle) => void;
  setLanguage: (value: AppLanguage) => void;
  setHomeLayout: (value: HomeLayout) => void;
  setFontSize: (value: number) => void;
  setVoiceName: (value: string) => void;
  setAudioAutoSave: (value: boolean) => void;
  setAudioLoopDefault: (value: boolean) => void;
  setHapticsEnabled: (value: boolean) => void;
  toggleHaptics: () => void;
  setNotifications: (value: boolean) => void;
  toggleNotifications: () => void;
  setMorningReminder: (enabled: boolean, time: string) => void;
  setMorningReminderEnabled: (enabled: boolean) => void;
  setMorningReminderTime: (time: string) => void;
  setEveningReminder: (enabled: boolean, time: string) => void;
  setEveningReminderEnabled: (enabled: boolean) => void;
  setEveningReminderTime: (time: string) => void;
  setPrayerNotifications: (value: boolean) => void;
  setLocation: (value: { latitude: number; longitude: number } | null) => void;
  setMushafMode: (value: MushafMode) => void;
  setMushafTajweed: (value: boolean) => void;
  setTafsirId: (value: string) => void;
  setWakeLockEnabled: (value: boolean) => void;
  setVotd: (enabled: boolean, time: string) => void;
  setVotdEnabled: (enabled: boolean) => void;
  setVotdTime: (time: string) => void;
  setLastSeenVersion: (value: string | null) => void;
  setApiKey: (key: string) => void;
  toggleFavorite: (id: number) => void;
  addCustomReminder: (reminder: CustomReminder) => void;
  removeCustomReminder: (id: number) => void;
  setCategories: (categories: Category[]) => void;
  refreshData: () => Promise<void>;
  editZikr: (zikr: UserZikr) => Promise<void>;
  deleteZikr: (id: number) => Promise<void>;
  resetPreferences: () => void;
}

const defaultPreferences = {
  darkMode: false,
  theme: 'emerald' as AppTheme,
  darkStyle: 'cosmic' as DarkStyle,
  language: 'ar' as AppLanguage,
  homeLayout: 'stream' as HomeLayout,
  fontSize: 2,
  voiceName: '',
  audioAutoSave: true,
  audioLoopDefault: false,
  hapticsEnabled: true,
  notifications: true,
  morningReminderEnabled: true,
  morningReminderTime: '06:00 AM',
  eveningReminderEnabled: true,
  eveningReminderTime: '06:00 PM',
  prayerNotificationsEnabled: true,
  location: null,
  mushafMode: 'modern' as const,
  mushafTajweed: false,
  tafsirId: 'default',
  wakeLockEnabled: true,
  votdEnabled: true,
  votdTime: '06:00 AM',
  lastSeenVersion: null,
  favorites: [],
  apiKey: '',
  customReminders: [],
  categories: [],
  isLoading: true,
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaultPreferences,
      
      setPreferences: (prefs) => set(prefs),
      setLoading: (value) => set({ isLoading: value }),
      setDarkMode: (value) => set({ darkMode: value }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setTheme: (value) => set({ theme: value }),
      setDarkStyle: (value) => set({ darkStyle: value }),
      setLanguage: (value) => set({ language: value }),
      setHomeLayout: (value) => set({ homeLayout: value }),
      setFontSize: (value) => set({ fontSize: value }),
      setVoiceName: (value) => set({ voiceName: value }),
      setAudioAutoSave: (value) => set({ audioAutoSave: value }),
      setAudioLoopDefault: (value) => set({ audioLoopDefault: value }),
      setHapticsEnabled: (value) => set({ hapticsEnabled: value }),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),
      setNotifications: (value) => set({ notifications: value }),
      toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
      setMorningReminder: (enabled, time) => set({ morningReminderEnabled: enabled, morningReminderTime: time }),
      setMorningReminderEnabled: (enabled) => set({ morningReminderEnabled: enabled }),
      setMorningReminderTime: (time) => set({ morningReminderTime: time }),
      setEveningReminder: (enabled, time) => set({ eveningReminderEnabled: enabled, eveningReminderTime: time }),
      setEveningReminderEnabled: (enabled) => set({ eveningReminderEnabled: enabled }),
      setEveningReminderTime: (time) => set({ eveningReminderTime: time }),
      setPrayerNotifications: (value) => set({ prayerNotificationsEnabled: value }),
      setLocation: (value) => set({ location: value }),
      setMushafMode: (value) => set({ mushafMode: value }),
      setMushafTajweed: (value) => set({ mushafTajweed: value }),
      setTafsirId: (value) => set({ tafsirId: value }),
      setWakeLockEnabled: (value) => set({ wakeLockEnabled: value }),
      setVotd: (enabled, time) => set({ votdEnabled: enabled, votdTime: time }),
      setVotdEnabled: (enabled) => set({ votdEnabled: enabled }),
      setVotdTime: (time) => set({ votdTime: time }),
      setLastSeenVersion: (value) => set({ lastSeenVersion: value }),
      setApiKey: (key) => set({ apiKey: key }),
      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter(favId => favId !== id)
          : [...state.favorites, id],
      })),
      addCustomReminder: (reminder) => set((state) => ({
        customReminders: [...state.customReminders, reminder],
      })),
      removeCustomReminder: (id) => set((state) => ({
        customReminders: state.customReminders.filter(r => r.id !== id),
      })),
      setCategories: (categories) => set({ categories }),
      refreshData: async () => {
        try {
          const cats = await azkarRepository.getAllCategories();
          set({ categories: cats });
        } catch (error) {
          console.error("Failed to refresh categories:", error);
        }
      },
      editZikr: async (zikr) => {
        try {
          await azkarRepository.updateZikr(zikr);
          const cats = await azkarRepository.getAllCategories();
          set({ categories: cats });
        } catch (error) {
          console.error("Failed to update zikr", error);
        }
      },
      deleteZikr: async (id) => {
        try {
          await azkarRepository.deleteZikr(id);
          const cats = await azkarRepository.getAllCategories();
          set({ categories: cats });
        } catch (error) {
          console.error("Failed to delete zikr", error);
        }
      },
      resetPreferences: () => set(defaultPreferences),
    }),
    {
      name: 'azkar-preferences',
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
