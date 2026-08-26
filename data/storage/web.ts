
import { StorageAdapter } from './interface';
import { UserPreferences, ProgressState, Quote, Salawat, UserZikr, UserCategory, UserStats } from '../../types';
import { defaultPreferences, defaultStats } from './defaults';
import { get, set } from 'idb-keyval';

const KEYS = {
    PREFERENCES: 'azkarAppPreferences',
    PROGRESS: 'azkarAppProgress',
    ONBOARDING: 'azkarAppOnboardingComplete',
    USER_QUOTES: 'azkar_user_quotes',
    USER_SALAWAT: 'azkar_user_salawat',
    USER_CATEGORIES: 'azkar_user_categories',
    USER_AZKAR: 'azkar_user_custom_azkar',
    HIDDEN_STATIC: 'azkar_hidden_static_ids',
    AUDIO_PREFIX: 'azkar_audio_',
    STATS: 'azkar_user_stats',
};

export class WebStorage implements StorageAdapter {
    async initialize(): Promise<void> {
        return Promise.resolve();
    }

    async getPreferences(): Promise<UserPreferences> {
        try {
            const stored = localStorage.getItem(KEYS.PREFERENCES);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure defaults for new fields
                return { ...defaultPreferences, ...parsed, language: 'ar' }; 
            }
        } catch (e) {
            console.error('Error loading preferences', e);
        }
        return defaultPreferences;
    }

    async savePreferences(prefs: UserPreferences): Promise<void> {
        localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
    }

    async getProgress(): Promise<ProgressState> {
        try {
            const stored = localStorage.getItem(KEYS.PROGRESS);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }

    async saveProgress(progress: ProgressState): Promise<void> {
        localStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
    }

    async isOnboardingComplete(): Promise<boolean> {
        return localStorage.getItem(KEYS.ONBOARDING) === 'true';
    }

    async setOnboardingComplete(): Promise<void> {
        localStorage.setItem(KEYS.ONBOARDING, 'true');
    }

    // --- Dynamic Content ---

    async getUserQuotes(): Promise<Quote[]> {
        const stored = localStorage.getItem(KEYS.USER_QUOTES);
        return stored ? JSON.parse(stored) : [];
    }

    async addUserQuote(quote: Quote): Promise<void> {
        const current = await this.getUserQuotes();
        localStorage.setItem(KEYS.USER_QUOTES, JSON.stringify([...current, quote]));
    }

    async getUserSalawat(): Promise<Salawat[]> {
        const stored = localStorage.getItem(KEYS.USER_SALAWAT);
        return stored ? JSON.parse(stored) : [];
    }

    async addUserSalawat(salawat: Salawat): Promise<void> {
        const current = await this.getUserSalawat();
        localStorage.setItem(KEYS.USER_SALAWAT, JSON.stringify([...current, salawat]));
    }

    // --- User Categories ---

    async getUserCategories(): Promise<UserCategory[]> {
        const stored = localStorage.getItem(KEYS.USER_CATEGORIES);
        return stored ? JSON.parse(stored) : [];
    }

    async addUserCategory(category: UserCategory): Promise<void> {
        const current = await this.getUserCategories();
        localStorage.setItem(KEYS.USER_CATEGORIES, JSON.stringify([...current, category]));
    }

    // --- User Azkar ---

    async getUserAzkar(): Promise<UserZikr[]> {
        const stored = localStorage.getItem(KEYS.USER_AZKAR);
        return stored ? JSON.parse(stored) : [];
    }

    async addUserZikr(zikr: UserZikr): Promise<void> {
        const current = await this.getUserAzkar();
        localStorage.setItem(KEYS.USER_AZKAR, JSON.stringify([...current, zikr]));
    }

    async updateUserZikr(zikr: UserZikr): Promise<void> {
        const current = await this.getUserAzkar();
        const updated = current.map(z => z.id === zikr.id ? zikr : z);
        localStorage.setItem(KEYS.USER_AZKAR, JSON.stringify(updated));
    }

    async deleteUserZikr(id: number): Promise<void> {
        const current = await this.getUserAzkar();
        const filtered = current.filter(z => z.id !== id);
        localStorage.setItem(KEYS.USER_AZKAR, JSON.stringify(filtered));
    }

    // --- Static Overrides ---

    async getHiddenZikrIds(): Promise<number[]> {
        const stored = localStorage.getItem(KEYS.HIDDEN_STATIC);
        return stored ? JSON.parse(stored) : [];
    }

    async hideStaticZikr(id: number): Promise<void> {
        const current = await this.getHiddenZikrIds();
        if (!current.includes(id)) {
            localStorage.setItem(KEYS.HIDDEN_STATIC, JSON.stringify([...current, id]));
        }
    }

    async unhideStaticZikr(id: number): Promise<void> {
        const current = await this.getHiddenZikrIds();
        const updated = current.filter(hiddenId => hiddenId !== id);
        localStorage.setItem(KEYS.HIDDEN_STATIC, JSON.stringify(updated));
    }

    // --- Audio Caching (IndexedDB) ---
    
    async saveAudio(key: string, base64Data: string): Promise<void> {
        try {
            await set(KEYS.AUDIO_PREFIX + key, base64Data);
        } catch (e) {
            console.error('Failed to save audio to IndexedDB', e);
        }
    }

    async getAudio(key: string): Promise<string | null> {
        try {
            const val = await get(KEYS.AUDIO_PREFIX + key);
            return val || null;
        } catch (e) {
            console.error('Failed to get audio from IndexedDB', e);
            return null;
        }
    }

    // --- Stats ---
    
    async getStats(): Promise<UserStats> {
        try {
            const stored = localStorage.getItem(KEYS.STATS);
            if (stored) {
                return { ...defaultStats, ...JSON.parse(stored) };
            }
        } catch(e) {}
        return defaultStats;
    }

    async saveStats(stats: UserStats): Promise<void> {
        localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
    }

    // --- Data Management ---

    async exportData(): Promise<string> {
        const data = {
            preferences: await this.getPreferences(),
            progress: await this.getProgress(),
            stats: await this.getStats(),
            userQuotes: await this.getUserQuotes(),
            userSalawat: await this.getUserSalawat(),
            userCategories: await this.getUserCategories(),
            userAzkar: await this.getUserAzkar(),
            hiddenStaticIds: await this.getHiddenZikrIds(),
            timestamp: Date.now(),
            version: 1
        };
        return JSON.stringify(data, null, 2);
    }

    async importData(jsonData: string): Promise<boolean> {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate basic structure
            if (!data.preferences || !data.progress) throw new Error("Invalid backup file");

            // Restore
            await this.savePreferences(data.preferences);
            await this.saveProgress(data.progress);
            if (data.stats) await this.saveStats(data.stats);
            
            if (Array.isArray(data.userQuotes)) localStorage.setItem(KEYS.USER_QUOTES, JSON.stringify(data.userQuotes));
            if (Array.isArray(data.userSalawat)) localStorage.setItem(KEYS.USER_SALAWAT, JSON.stringify(data.userSalawat));
            if (Array.isArray(data.userCategories)) localStorage.setItem(KEYS.USER_CATEGORIES, JSON.stringify(data.userCategories));
            if (Array.isArray(data.userAzkar)) localStorage.setItem(KEYS.USER_AZKAR, JSON.stringify(data.userAzkar));
            if (Array.isArray(data.hiddenStaticIds)) localStorage.setItem(KEYS.HIDDEN_STATIC, JSON.stringify(data.hiddenStaticIds));

            return true;
        } catch (e) {
            console.error("Import failed:", e);
            return false;
        }
    }
}
