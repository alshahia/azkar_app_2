
import React from 'react';

export interface Zikr {
  id: number;
  arabic: string;
  transliteration: string | null;
  translation: string | null;
  benefit: string | null;
  reference: string | null;
  count: number;
}

export interface Category {
  id: string;
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  azkar: Zikr[];
  isUserCreated?: boolean; // Flag to identify user-created categories
}

export interface UserCategory {
    id: string;
    title: string;
}

export interface UserZikr extends Zikr {
    categoryId: string;
    isCustom: boolean; // Flag to identify user-added content
    originalStaticId?: number; // ID of the static zikr this one replaced (if applicable)
}

// New Content Types for Widgets
export interface Quote {
    id: string | number; // String for static, number/timestamp for local
    text: string;
    author: string;
    source?: string; // Optional source
}

export interface Salawat {
    id: string | number;
    text: string;
    description?: string;
}

export type Screen = 
  | 'welcome' 
  | 'notifications' 
  | 'personalize' 
  | 'home' 
  | 'categories' 
  | 'favorites' 
  | 'settings'
  | 'audioSettings'
  | 'notificationSettings'
  | 'azkarList'
  | 'azkarDay'
  | 'reportBug'
  | 'aboutUs'
  | 'khatma'
  | 'globalSearch'
  | 'completion'
  | 'addZikr'
  | 'sessionSummary'
  | 'tasbeeh'
  | 'search'
  | 'prayerTimes'
  | 'qibla'
  | 'calendar'
  | 'shareEditor'
  | 'quran'
  | 'surahReader'
  | 'mushafPage'
  | 'asmaUlHusna'
  | 'hadith'
  | 'zakat'
  | 'duas'
  | 'wordByWord'
  | 'moonSighting'
  | 'readingStats'
  | 'islamicLibrary'
  | 'memorization';

export type ProgressState = {
    // Keys stringify on every JSON/storage round-trip, so the signature is
    // string-based; numeric zikr ids coerce transparently on access.
    [zikrId: string]: number;
};

export type AppLanguage = 'ar';
export type AppTheme = 'emerald' | 'blue' | 'rose' | 'amber' | 'purple' | 'cyan';

/**
 * Visual identity of the dark surface of the app. Each style defines its own
 * body background, card surface, border, text, and accent — applied through
 * CSS variables in index.css. The picker in SettingsScreen lists all five.
 *
 * Each dark style has a paired light variant in the LightStyleFamily below;
 * when darkMode is off the user still keeps the same family.
 *
 * - verdant   → الزمرد الليلي · النور       (refined emerald midnight → ivory)
 * - cosmic    → الكون النيلي · الفجر الوردي  (deep space indigo → rose dawn) — DEFAULT
 * - forest    → الغابة المسحورة · البستان   (layered emerald → mint sage)
 * - coral     → الليل المرجاني · الزهرة     (warm maroon → coral bloom)
 * - obsidian  → السبج · الرخام              (pure black → clean marble)
 */
export type DarkStyle = 'verdant' | 'cosmic' | 'forest' | 'coral' | 'obsidian';

export type HomeLayout = 'focus' | 'stream' | 'dashboard' | 'simple';

/** Mushaf page-mode renderer. 'modern' = page-grouped flow using the app's
 *  own cards; 'pixel' = the printed-Mushaf look from @tarekeldeeb/quran-madina-react. */
export type MushafMode = 'modern' | 'pixel';

export interface CustomReminder {
    id: number; // Unique ID for notification scheduling
    categoryId: string;
    categoryTitle: string;
    time: string; // "hh:mm A"
    enabled: boolean;
}

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
}

export interface UserStats {
    streak: number;
    lastActiveDate: string | null; // YYYY-MM-DD in the user's local timezone at the time of the increment
    totalReads: number; // Lifetime total
    timezone: string | null; // IANA name (e.g. "Asia/Riyadh"); captured on first increment so a cross-timezone move doesn't misread a calendar-day gap as a gap
}

// Re-export the streak outcome so the AppContext signature and any
// consumer (CompletionScreen, future pre-prayer banner) can type-check
// against the same shape without re-implementing the union.
import type { StreakOutcome } from './data/streak';
export type { StreakOutcome };

export interface UserPreferences {
    darkMode: boolean;
    // Dark surface identity. Optional for backward compat with prefs records
    // persisted before the multi-style picker shipped; the App.tsx hydration
    // falls back to 'cosmic' (the default) and writes it back on next save.
    darkStyle?: DarkStyle;
    theme: AppTheme; // Added Theme
    notifications: boolean; // Deprecated or Master switch, keeping for backward compat
    morningReminderEnabled: boolean;
    morningReminderTime: string; // "hh:mm A"
    eveningReminderEnabled: boolean;
    eveningReminderTime: string; // "hh:mm A"
    fontSize: number; // 1 to 8
    favorites: number[];
    language: AppLanguage;
    homeLayout: HomeLayout;
    apiKey?: string; // User provided API Key
    voiceName: string; // TTS Voice name
    audioAutoSave: boolean; // Cache audio locally
    audioLoopDefault: boolean; // Global preference for loop mode
    hapticsEnabled: boolean; // Global preference for haptic feedback
    customReminders: CustomReminder[]; // User defined category reminders
    
    // Prayer Times Settings
    location?: LocationCoordinates | null;
    calculationMethod?: string; // 'MuslimWorldLeague' | 'Egyptian' etc.
    prayerNotificationsEnabled: boolean;

    // Mushaf page-mode reader preferences
    mushafMode?: MushafMode;   // default 'modern'
    mushafTajweed?: boolean;   // swap font-quran -> font-quran-colored

    // Tafsir switching (M3-T4). Default 'muyassar'; the registry lists every
    // bundled source. Adding a new tafsir is a content-only change.
    tafsirId?: string;

    // Keep the screen on while the SurahReader is open (M4-T5).
    // Default true; the hook is a silent no-op when the browser API is
    // missing (older WebViews / pre-iOS-16.4 PWA).
    wakeLockEnabled?: boolean;

    // Verse-of-the-Day (M4-T1). Default true so the daily-reminder flow
    // starts producing value immediately; the user can disable in
    // NotificationSettingsScreen.
    votdEnabled?: boolean;
    votdTime?: string; // "hh:mm A", defaults to "06:00 AM"

    // Highest changelog version the user has dismissed (M4-T4). When the
    // app version exceeds this, the What's-new modal re-opens on launch.
    lastSeenVersion?: string;

    // Active UI locale (M5-T6). Today only 'ar' is shipped; the field is
    // here so future locales can drop in without a schema migration. The
    // adapter reads this on hydrate to resolve locale-aware defaults.
    currentLocale?: import('./data/storage/locale').SupportedLocale;
}

export interface AppContextType {
  navigate: (screen: Screen, params?: any) => void;
  favorites: number[];
  toggleFavorite: (id: number) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  // The dark surface identity — chooses which of the 5 DarkStyle palettes
  // (cosmic / verdant / forest / coral / obsidian) the app renders.
  darkStyle: DarkStyle;
  setDarkStyle: (s: DarkStyle) => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  notifications: boolean;
  toggleNotifications: (enabled?: boolean) => void;
  
  // Detailed Notification Settings
  morningReminderEnabled: boolean;
  setMorningReminderEnabled: (enabled: boolean) => void;
  morningReminderTime: string;
  setMorningReminderTime: (time: string) => void;
  eveningReminderEnabled: boolean;
  setEveningReminderEnabled: (enabled: boolean) => void;
  eveningReminderTime: string;
  setEveningReminderTime: (time: string) => void;

  fontSize: number;
  setFontSize: (size: number) => void;
  progress: ProgressState;
  updateProgress: (zikrId: number, count: number) => void;
  incrementProgress: (zikrId: number, by?: number) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  homeLayout: HomeLayout;
  setHomeLayout: (layout: HomeLayout) => void;
  categories: Category[]; // Dynamic categories loaded from repository
  refreshData: () => Promise<void>; // Trigger a reload of dynamic data
  editZikr: (zikr: UserZikr) => Promise<void>;
  deleteZikr: (id: number) => Promise<void>;
  apiKey: string;
  setApiKey: (key: string) => void;
  voiceName: string;
  setVoiceName: (voice: string) => void;
  
  // Audio & Custom Reminders
  audioAutoSave: boolean;
  setAudioAutoSave: (enabled: boolean) => void;
  audioLoopDefault: boolean;
  setAudioLoopDefault: (enabled: boolean) => void;
  hapticsEnabled: boolean;
  toggleHaptics: () => void;
  
  customReminders: CustomReminder[];
  addCustomReminder: (reminder: CustomReminder) => void;
  removeCustomReminder: (id: number) => void;

  // Location & Prayer Times
  location: LocationCoordinates | null | undefined;
  setLocation: (loc: LocationCoordinates | null) => void;
  prayerNotificationsEnabled: boolean;
  setPrayerNotificationsEnabled: (enabled: boolean) => void;

  // Stats
  stats: UserStats;
  incrementStreak: () => StreakOutcome;
  incrementTotalReads: (count: number) => void;

  // Quran
  quranBookmarks: QuranBookmark[];
  addQuranBookmark: (b: QuranBookmark) => Promise<void>;
  removeQuranBookmark: (surah: number, ayah: number) => Promise<void>;
  quranLastRead: QuranLastRead | null;
  setQuranLastRead: (l: QuranLastRead) => Promise<void>;
  clearQuranLastRead: () => Promise<void>;
  mushafMode: MushafMode;
  setMushafMode: (m: MushafMode) => Promise<void>;
  mushafTajweed: boolean;
  setMushafTajweed: (v: boolean) => Promise<void>;

  // Tafsir preference (M3-T4). Drives the chip picker in TafsirSheet.
  tafsirId: string;
  setTafsirId: (id: string) => Promise<void>;

  // Keep the screen on while the reader is open (M4-T5). Silently
  // no-ops when the browser API is missing; defaults to true so users
  // get the calmer reading experience out of the box.
  wakeLockEnabled: boolean;
  setWakeLockEnabled: (v: boolean) => void;

  // Verse-of-the-Day (M4-T1). The notification is re-scheduled whenever
  // enabled/time flips, and on app foreground. Defaults to enabled at
  // 06:00 local.
  votdEnabled: boolean;
  setVotdEnabled: (v: boolean) => void;
  votdTime: string;
  setVotdTime: (t: string) => void;

  // Read history (M3-T5). The reader pushes on unmount; the index screen
  // renders the most recent N.
  quranReadHistory: QuranReadHistoryEntry[];
  appendQuranHistory: (entry: QuranReadHistoryEntry) => void;
}

export interface QuranBookmark {
  surah: number;
  ayah: number;
  createdAt: number;
}

export interface QuranLastRead {
  surah: number;
  ayah: number;
}

/**
 * One reading session entry. Pushed on SurahReader unmount so the user
 * has a quick way to jump back to where they were, even weeks later.
 * Capped at 10 entries (ring buffer, oldest dropped).
 */
export interface QuranReadHistoryEntry {
  surah: number;
  ayah: number;
  ts: number;
}

export const QURAN_READ_HISTORY_MAX = 10;

// === Prayer Types (merged from types/prayer.ts) ===

export interface PrayerTimes {
  fajr: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface WatchedPrayer {
  name: string;
  key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  time: Date;
  msUntil: number;
}

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

// === Quran Types (merged from types/quran.ts — only non-conflicting) ===

export interface Surah {
  id: number;
  name: string;
  englishName: string;
  ayahCount: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Ayah {
  number: number;
  text: string;
  surah: number;
  juz: number;
  page: number;
}

// === Khatma Types (merged from types/khatma.ts) ===

export interface Khatma {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  targetDays: number;
  completedDays: number;
  pagesRead: number[];
  ayahsRead: number[];
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  completedAt?: string;
}

export interface KhatmaProgress {
  khatmaId: string;
  date: string;
  pagesRead: number[];
  ayahsRead: number[];
  duration?: number;
}

export interface ReadingStats {
  totalAyahsRead: number;
  totalPagesRead: number;
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string | null;
  dailyStats: DailyReadingStats[];
  weeklyStats: WeeklyReadingStats[];
  monthlyStats: MonthlyReadingStats[];
}

export interface DailyReadingStats {
  date: string;
  ayahsRead: number;
  pagesRead: number;
  duration: number;
}

export interface WeeklyReadingStats {
  weekStart: string;
  weekEnd: string;
  ayahsRead: number;
  pagesRead: number;
  duration: number;
}

export interface MonthlyReadingStats {
  month: string;
  ayahsRead: number;
  pagesRead: number;
  duration: number;
}

export interface KhatmaPreset {
  id: string;
  name: string;
  nameAr: string;
  days: number;
  description: string;
}

export const KHATMA_PRESETS: KhatmaPreset[] = [
  { id: '30days', name: '30 Days', nameAr: '٣٠ يوم', days: 30, description: 'ختمة في شهر واحد' },
  { id: '3months', name: '3 Months', nameAr: '٣ أشهر', days: 90, description: 'ختمة في ثلاثة أشهر' },
  { id: '6months', name: '6 Months', nameAr: '٦ أشهر', days: 180, description: 'ختمة في ستة أشهر' },
  { id: '1year', name: '1 Year', nameAr: 'سنة', days: 365, description: 'ختمة في سنة كاملة' },
];