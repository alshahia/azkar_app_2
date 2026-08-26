
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
  | 'contactUs'
  | 'completion'
  | 'addZikr'
  | 'sessionSummary'
  | 'tasbeeh'
  | 'search'
  | 'prayerTimes'
  | 'qibla'
  | 'calendar'
  | 'shareEditor';

export type ProgressState = {
    [zikrId: number]: number; // key is zikr.id, value is completion count
};

export type AppLanguage = 'ar';
export type AppTheme = 'emerald' | 'blue' | 'rose' | 'amber' | 'purple' | 'cyan';

export type HomeLayout = 'focus' | 'stream' | 'dashboard' | 'simple';

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
    lastActiveDate: string | null; // YYYY-MM-DD
    totalReads: number; // Lifetime total
}

export interface UserPreferences {
    darkMode: boolean;
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
}

export interface AppContextType {
  navigate: (screen: Screen, params?: any) => void;
  favorites: number[];
  toggleFavorite: (id: number) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  notifications: boolean;
  toggleNotifications: () => void;
  
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
  incrementStreak: () => void;
  incrementTotalReads: (count: number) => void;
}
