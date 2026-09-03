
import { StorageAdapter } from './interface';
import { UserPreferences, ProgressState, Quote, Salawat, UserZikr, UserCategory, UserStats, QuranBookmark, QuranLastRead } from '../../types';
import { defaultPreferences, defaultStats } from './defaults';
import { validateBackup, normalizeUserZikr } from '../backup';
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
    FLAG_PREFIX: 'azkar_flag_',
    QURAN_BOOKMARKS: 'azkar_quran_bookmarks',
    QURAN_LAST_READ: 'azkar_quran_last_read'
};

/** JSON.parse that never throws: corrupted values fall back instead of
 *  permanently rejecting every dependent repository call. */
const readJson = <T>(key: string, fallback: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? (JSON.parse(stored) as T) : fallback;
    } catch (e) {
        console.error('Corrupted stored value for ' + key + ', using fallback.', e);
        return fallback;
    }
};

export class WebStorage implements StorageAdapter {
    /** Serializes read-modify-write mutations so rapid toggles / multiple tabs
     *  cannot interleave an await-read between another writer's read and write. */
    private mutationQueue: Promise<unknown> = Promise.resolve();

    private enqueue<T>(operation: () => Promise<T>): Promise<T> {
        const result = this.mutationQueue.then(operation, operation);
        this.mutationQueue = result.catch(() => undefined);
        return result;
    }

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

    savePreferences(prefs: UserPreferences): Promise<void> {
        return this.enqueue(async () => {
            try {
                localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
            } catch (e) {
                console.error('Failed saving preferences (quota?)', e);
                throw e;
            }
        });
    }

    async getProgress(): Promise<ProgressState> {
        return readJson<ProgressState>(KEYS.PROGRESS, {});
    }

    saveProgress(progress: ProgressState): Promise<void> {
        return this.enqueue(async () => {
            try {
                localStorage.setItem(KEYS.PROGRESS, JSON.stringify(progress));
            } catch (e) {
                console.error('Failed saving progress (quota?)', e);
                throw e;
            }
        });
    }

    async isOnboardingComplete(): Promise<boolean> {
        return localStorage.getItem(KEYS.ONBOARDING) === 'true';
    }

    async setOnboardingComplete(): Promise<void> {
        localStorage.setItem(KEYS.ONBOARDING, 'true');
    }

    // --- Migration flags ---

    async getFlag(key: string): Promise<boolean> {
        return localStorage.getItem(KEYS.FLAG_PREFIX + key) === 'true';
    }

    async setFlag(key: string): Promise<void> {
        localStorage.setItem(KEYS.FLAG_PREFIX + key, 'true');
    }

    // --- Dynamic Content ---

    async getUserQuotes(): Promise<Quote[]> {
        return readJson<Quote[]>(KEYS.USER_QUOTES, []);
    }

    addUserQuote(quote: Quote): Promise<void> {
        return this.enqueue(async () => {
            const current = await this.getUserQuotes();
            localStorage.setItem(KEYS.USER_QUOTES, JSON.stringify([...current, quote]));
        });
    }

    async getUserSalawat(): Promise<Salawat[]> {
        return readJson<Salawat[]>(KEYS.USER_SALAWAT, []);
    }

    addUserSalawat(salawat: Salawat): Promise<void> {
        return this.enqueue(async () => {
            const current = await this.getUserSalawat();
            localStorage.setItem(KEYS.USER_SALAWAT, JSON.stringify([...current, salawat]));
        });
    }

    // --- User Categories ---

    async getUserCategories(): Promise<UserCategory[]> {
        return readJson<UserCategory[]>(KEYS.USER_CATEGORIES, []);
    }

    addUserCategory(category: UserCategory): Promise<void> {
        return this.enqueue(async () => {
            const current = await this.getUserCategories();
            localStorage.setItem(KEYS.USER_CATEGORIES, JSON.stringify([...current, category]));
        });
    }

    // --- User Azkar ---

    async getUserAzkar(): Promise<UserZikr[]> {
        return readJson<UserZikr[]>(KEYS.USER_AZKAR, []);
    }

    addUserZikr(zikr: UserZikr): Promise<void> {
        return this.enqueue(async () => {
            const current = await this.getUserAzkar();
            localStorage.setItem(KEYS.USER_AZKAR, JSON.stringify([...current, zikr]));
        });
    }

    updateUserZikr(zikr: UserZikr): Promise<void> {
        return this.enqueue(async () => {
            const current = await this.getUserAzkar();
            const updated = current.map(z => z.id === zikr.id ? zikr : z);
            localStorage.setItem(KEYS.USER_AZKAR, JSON.stringify(updated));
        });
    }

    deleteUserZikr(id: number): Promise<void> {
        return this.enqueue(async () => {
            const current = await this.getUserAzkar();
            const filtered = current.filter(z => z.id !== id);
            localStorage.setItem(KEYS.USER_AZKAR, JSON.stringify(filtered));
        });
    }

    // --- Static Overrides ---

    async getHiddenZikrIds(): Promise<number[]> {
        return readJson<number[]>(KEYS.HIDDEN_STATIC, []);
    }

    hideStaticZikr(id: number): Promise<void> {
        return this.enqueue(async () => {
            const current = await this.getHiddenZikrIds();
            if (!current.includes(id)) {
                localStorage.setItem(KEYS.HIDDEN_STATIC, JSON.stringify([...current, id]));
            }
        });
    }

    unhideStaticZikr(id: number): Promise<void> {
        return this.enqueue(async () => {
            const current = await this.getHiddenZikrIds();
            const updated = current.filter(hiddenId => hiddenId !== id);
            localStorage.setItem(KEYS.HIDDEN_STATIC, JSON.stringify(updated));
        });
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

    // --- Quran ---

    async getQuranBookmarks(): Promise<QuranBookmark[]> {
        return readJson<QuranBookmark[]>(KEYS.QURAN_BOOKMARKS, []);
    }

    saveQuranBookmarks(bookmarks: QuranBookmark[]): Promise<void> {
        return this.enqueue(async () => {
            try {
                localStorage.setItem(KEYS.QURAN_BOOKMARKS, JSON.stringify(bookmarks));
            } catch (e) {
                console.error('Failed saving Quran bookmarks', e);
                throw e;
            }
        });
    }

    async getQuranLastRead(): Promise<QuranLastRead | null> {
        return readJson<QuranLastRead | null>(KEYS.QURAN_LAST_READ, null);
    }

    saveQuranLastRead(value: QuranLastRead | null): Promise<void> {
        return this.enqueue(async () => {
            try {
                if (value === null) localStorage.removeItem(KEYS.QURAN_LAST_READ);
                else localStorage.setItem(KEYS.QURAN_LAST_READ, JSON.stringify(value));
            } catch (e) {
                console.error('Failed saving Quran last-read', e);
                throw e;
            }
        });
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
        try {
            localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
        } catch (e) {
            console.error('Failed saving stats (quota?)', e);
        }
    }

    // --- Data Management ---

    async exportData(): Promise<string> {
        const prefs = await this.getPreferences();
        const data = {
            preferences: { ...prefs, apiKey: '' }, // never leak the user's Gemini key into shareable backups
            progress: await this.getProgress(),
            stats: await this.getStats(),
            userQuotes: await this.getUserQuotes(),
            userSalawat: await this.getUserSalawat(),
            userCategories: await this.getUserCategories(),
            userAzkar: await this.getUserAzkar(),
            hiddenStaticIds: await this.getHiddenZikrIds(),
            quranBookmarks: await this.getQuranBookmarks(),
            quranLastRead: await this.getQuranLastRead(),
            timestamp: Date.now(),
            version: 3
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * Validated restore with rollback.
     * Semantics (aligned with MobileStorage): a section present in the backup
     * REPLACES local data wholesale; absent sections leave local data intact.
     * Nothing is written until validation passes; any write failure restores
     * the previous values.
     */
    async importData(jsonData: string): Promise<boolean> {
        let payload;
        try {
            payload = validateBackup(JSON.parse(jsonData));
        } catch (e) {
            console.error('Import failed validation:', e);
            return false;
        }

        const touchedKeys: string[] = [KEYS.PREFERENCES, KEYS.PROGRESS];
        if (payload.stats) touchedKeys.push(KEYS.STATS);
        if (payload.userQuotes) touchedKeys.push(KEYS.USER_QUOTES);
        if (payload.userSalawat) touchedKeys.push(KEYS.USER_SALAWAT);
        if (payload.userCategories) touchedKeys.push(KEYS.USER_CATEGORIES);
        if (payload.userAzkar) touchedKeys.push(KEYS.USER_AZKAR);
        if (payload.hiddenStaticIds) touchedKeys.push(KEYS.HIDDEN_STATIC);
        if (payload.quranBookmarks) touchedKeys.push(KEYS.QURAN_BOOKMARKS);
        if (payload.quranLastRead !== undefined) touchedKeys.push(KEYS.QURAN_LAST_READ);

        const snapshot = new Map<string, string | null>();
        for (const key of touchedKeys) snapshot.set(key, localStorage.getItem(key));

        try {
            if (payload.preferences) {
                await this.savePreferences({ ...defaultPreferences, ...payload.preferences, language: 'ar' } as UserPreferences);
            }
            if (payload.progress) await this.saveProgress(payload.progress);
            if (payload.stats) await this.saveStats({ ...defaultStats, ...payload.stats });

            const putRaw = (key: string, value: unknown) =>
                localStorage.setItem(key, JSON.stringify(value));

            if (payload.userQuotes) putRaw(KEYS.USER_QUOTES, payload.userQuotes);
            if (payload.userSalawat) putRaw(KEYS.USER_SALAWAT, payload.userSalawat);
            if (payload.userCategories) putRaw(KEYS.USER_CATEGORIES, payload.userCategories);
            if (payload.userAzkar) putRaw(KEYS.USER_AZKAR, payload.userAzkar.map(normalizeUserZikr));
            if (payload.hiddenStaticIds) putRaw(KEYS.HIDDEN_STATIC, payload.hiddenStaticIds);
            if (payload.quranBookmarks) putRaw(KEYS.QURAN_BOOKMARKS, payload.quranBookmarks);
            if (payload.quranLastRead !== undefined) {
                if (payload.quranLastRead === null) localStorage.removeItem(KEYS.QURAN_LAST_READ);
                else putRaw(KEYS.QURAN_LAST_READ, payload.quranLastRead);
            }
            return true;
        } catch (e) {
            console.error('Import failed mid-write, rolling back:', e);
            for (const [key, value] of snapshot) {
                try {
                    if (value === null) localStorage.removeItem(key);
                    else localStorage.setItem(key, value);
                } catch (restoreError) {
                    console.error('Rollback failed for ' + key, restoreError);
                }
            }
            return false;
        }
    }
}