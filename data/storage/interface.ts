
import { UserPreferences, ProgressState, Quote, Salawat, UserZikr, UserCategory, UserStats, QuranBookmark, QuranLastRead } from '../../types';

export interface StorageAdapter {
    initialize(): Promise<void>;
    
    // Preferences
    getPreferences(): Promise<UserPreferences>;
    savePreferences(prefs: UserPreferences): Promise<void>;
    
    // Progress
    getProgress(): Promise<ProgressState>;
    saveProgress(progress: ProgressState): Promise<void>;
    
    // Onboarding
    isOnboardingComplete(): Promise<boolean>;
    setOnboardingComplete(): Promise<void>;
    
    // Dynamic Content (User Added)
    getUserQuotes(): Promise<Quote[]>;
    addUserQuote(quote: Quote): Promise<void>;
    
    getUserSalawat(): Promise<Salawat[]>;
    addUserSalawat(salawat: Salawat): Promise<void>;

    // User Custom Categories
    getUserCategories(): Promise<UserCategory[]>;
    addUserCategory(category: UserCategory): Promise<void>;

    // User Custom Azkar
    getUserAzkar(): Promise<UserZikr[]>;
    addUserZikr(zikr: UserZikr): Promise<void>;
    updateUserZikr(zikr: UserZikr): Promise<void>;
    deleteUserZikr(id: number): Promise<void>;

    // Static Override Logic
    hideStaticZikr(id: number): Promise<void>;
    unhideStaticZikr(id: number): Promise<void>;
    getHiddenZikrIds(): Promise<number[]>;

    // Audio Caching
    saveAudio(key: string, base64Data: string): Promise<void>;
    getAudio(key: string): Promise<string | null>;

    // Stats
    getStats(): Promise<UserStats>;
    saveStats(stats: UserStats): Promise<void>;

    // Data Management
    exportData(): Promise<string>; // Returns JSON string
    importData(jsonData: string): Promise<boolean>; // Returns success

    // Quran
    getQuranBookmarks(): Promise<QuranBookmark[]>;
    saveQuranBookmarks(bookmarks: QuranBookmark[]): Promise<void>;
    getQuranLastRead(): Promise<QuranLastRead | null>;
    saveQuranLastRead(value: QuranLastRead | null): Promise<void>;

    // Internal migration flags (one-time data migrations)
    getFlag(key: string): Promise<boolean>;
    setFlag(key: string): Promise<void>;
}