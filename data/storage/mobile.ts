
import { StorageAdapter } from './interface';
import { UserPreferences, ProgressState, Quote, Salawat, UserZikr, UserCategory, UserStats } from '../../types';
import { defaultPreferences, defaultStats } from './defaults';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

export class MobileStorage implements StorageAdapter {
    private sqlite: SQLiteConnection;
    private db: SQLiteDBConnection | null = null;
    private readonly DB_NAME = 'azkar_db';

    constructor() {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    async initialize(): Promise<void> {
        try {
            this.db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', 1, false);
            await this.db.open();

            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS kv_store (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
            `);

            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS user_quotes (
                    id TEXT PRIMARY KEY,
                    text TEXT,
                    author TEXT,
                    source TEXT
                );
            `);

            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS user_salawat (
                    id TEXT PRIMARY KEY,
                    text TEXT,
                    description TEXT
                );
            `);

             // Table for User Categories
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS user_categories (
                    id TEXT PRIMARY KEY,
                    title TEXT
                );
            `);

            // Table for User Azkar - Updated with originalStaticId
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS user_azkar (
                    id INTEGER PRIMARY KEY,
                    categoryId TEXT,
                    arabic TEXT,
                    transliteration TEXT,
                    translation TEXT,
                    benefit TEXT,
                    reference TEXT,
                    count INTEGER,
                    isCustom INTEGER DEFAULT 1,
                    originalStaticId INTEGER
                );
            `);

            // Table for Hidden Static Azkar IDs
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS hidden_static_azkar (
                    id INTEGER PRIMARY KEY
                );
            `);

            // Table for Audio Caching
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS audio_cache (
                    key TEXT PRIMARY KEY,
                    data TEXT
                );
            `);

        } catch (error) {
            console.error('SQLite initialization failed:', error);
            throw error;
        }
    }

    private async getKV(key: string): Promise<any | null> {
        if (!this.db) return null;
        const res = await this.db.query('SELECT value FROM kv_store WHERE key = ?', [key]);
        if (res.values && res.values.length > 0) {
            return JSON.parse(res.values[0].value);
        }
        return null;
    }

    private async setKV(key: string, value: any): Promise<void> {
        if (!this.db) return;
        const json = JSON.stringify(value);
        await this.db.run('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)', [key, json]);
    }

    async getPreferences(): Promise<UserPreferences> {
        const stored = await this.getKV('preferences');
        if (stored) {
            // Ensure defaults for new fields
            return { ...defaultPreferences, ...stored, language: 'ar' };
        }
        return defaultPreferences;
    }

    async savePreferences(prefs: UserPreferences): Promise<void> {
        await this.setKV('preferences', prefs);
    }

    async getProgress(): Promise<ProgressState> {
        return (await this.getKV('progress')) || {};
    }

    async saveProgress(progress: ProgressState): Promise<void> {
        await this.setKV('progress', progress);
    }

    async isOnboardingComplete(): Promise<boolean> {
        const val = await this.getKV('onboarding');
        return val === true;
    }

    async setOnboardingComplete(): Promise<void> {
        await this.setKV('onboarding', true);
    }

    async getUserQuotes(): Promise<Quote[]> {
        if (!this.db) return [];
        const res = await this.db.query('SELECT * FROM user_quotes');
        return (res.values as Quote[]) || [];
    }

    async addUserQuote(quote: Quote): Promise<void> {
        if (!this.db) return;
        await this.db.run(
            'INSERT INTO user_quotes (id, text, author, source) VALUES (?, ?, ?, ?)', 
            [quote.id, quote.text, quote.author, quote.source || '']
        );
    }

    async getUserSalawat(): Promise<Salawat[]> {
        if (!this.db) return [];
        const res = await this.db.query('SELECT * FROM user_salawat');
        return (res.values as Salawat[]) || [];
    }

    async addUserSalawat(salawat: Salawat): Promise<void> {
        if (!this.db) return;
        await this.db.run(
            'INSERT INTO user_salawat (id, text, description) VALUES (?, ?, ?)',
            [salawat.id, salawat.text, salawat.description || '']
        );
    }

    // --- User Categories ---

    async getUserCategories(): Promise<UserCategory[]> {
        if (!this.db) return [];
        const res = await this.db.query('SELECT * FROM user_categories');
        return (res.values as UserCategory[]) || [];
    }

    async addUserCategory(category: UserCategory): Promise<void> {
        if (!this.db) return;
        await this.db.run(
            'INSERT INTO user_categories (id, title) VALUES (?, ?)',
            [category.id, category.title]
        );
    }

    // --- User Azkar ---

    async getUserAzkar(): Promise<UserZikr[]> {
        if (!this.db) return [];
        const res = await this.db.query('SELECT * FROM user_azkar');
        return (res.values || []).map(z => ({
            ...z,
            isCustom: z.isCustom === 1
        })) as UserZikr[];
    }

    async addUserZikr(zikr: UserZikr): Promise<void> {
        if (!this.db) return;
        // Insert with originalStaticId
        await this.db.run(
            'INSERT INTO user_azkar (id, categoryId, arabic, transliteration, translation, benefit, reference, count, isCustom, originalStaticId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                zikr.id, 
                zikr.categoryId, 
                zikr.arabic, 
                zikr.transliteration || '', 
                zikr.translation || '', 
                zikr.benefit || '', 
                zikr.reference || '', 
                zikr.count, 
                zikr.isCustom ? 1 : 0,
                zikr.originalStaticId || null
            ]
        );
    }

    async updateUserZikr(zikr: UserZikr): Promise<void> {
        if (!this.db) return;
        await this.db.run(
            'UPDATE user_azkar SET categoryId=?, arabic=?, transliteration=?, translation=?, benefit=?, reference=?, count=? WHERE id=?',
            [zikr.categoryId, zikr.arabic, zikr.transliteration || '', zikr.translation || '', zikr.benefit || '', zikr.reference || '', zikr.count, zikr.id]
        );
    }

    async deleteUserZikr(id: number): Promise<void> {
        if (!this.db) return;
        await this.db.run('DELETE FROM user_azkar WHERE id = ?', [id]);
    }

    // --- Static Overrides ---

    async getHiddenZikrIds(): Promise<number[]> {
        if (!this.db) return [];
        const res = await this.db.query('SELECT id FROM hidden_static_azkar');
        return (res.values || []).map(row => row.id);
    }

    async hideStaticZikr(id: number): Promise<void> {
        if (!this.db) return;
        // Ignore unique constraint violation if exists
        await this.db.run('INSERT OR IGNORE INTO hidden_static_azkar (id) VALUES (?)', [id]);
    }

    async unhideStaticZikr(id: number): Promise<void> {
        if (!this.db) return;
        await this.db.run('DELETE FROM hidden_static_azkar WHERE id = ?', [id]);
    }

    // --- Audio Caching ---

    async saveAudio(key: string, base64Data: string): Promise<void> {
        if (!this.db) return;
        await this.db.run('INSERT OR REPLACE INTO audio_cache (key, data) VALUES (?, ?)', [key, base64Data]);
    }

    async getAudio(key: string): Promise<string | null> {
        if (!this.db) return null;
        const res = await this.db.query('SELECT data FROM audio_cache WHERE key = ?', [key]);
        if (res.values && res.values.length > 0) {
            return res.values[0].data;
        }
        return null;
    }

    // --- Stats ---

    async getStats(): Promise<UserStats> {
        const stored = await this.getKV('stats');
        return stored ? { ...defaultStats, ...stored } : defaultStats;
    }

    async saveStats(stats: UserStats): Promise<void> {
        await this.setKV('stats', stats);
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
        if (!this.db) return false;
        try {
            const data = JSON.parse(jsonData);
            if (!data.preferences || !data.progress) throw new Error("Invalid backup file");

            await this.savePreferences(data.preferences);
            await this.saveProgress(data.progress);
            if (data.stats) await this.saveStats(data.stats);

            // Clear existing custom data before import to avoid conflicts/duplicates?
            // For now, let's truncate user tables
            await this.db.execute('DELETE FROM user_quotes');
            await this.db.execute('DELETE FROM user_salawat');
            await this.db.execute('DELETE FROM user_categories');
            await this.db.execute('DELETE FROM user_azkar');
            await this.db.execute('DELETE FROM hidden_static_azkar');

            // Bulk Insert helpers could be used, but loop is safer for types
            if (Array.isArray(data.userQuotes)) {
                for (const q of data.userQuotes) await this.addUserQuote(q);
            }
            if (Array.isArray(data.userSalawat)) {
                for (const s of data.userSalawat) await this.addUserSalawat(s);
            }
            if (Array.isArray(data.userCategories)) {
                for (const c of data.userCategories) await this.addUserCategory(c);
            }
            if (Array.isArray(data.userAzkar)) {
                for (const z of data.userAzkar) await this.addUserZikr(z);
            }
            if (Array.isArray(data.hiddenStaticIds)) {
                for (const id of data.hiddenStaticIds) await this.hideStaticZikr(id);
            }

            return true;
        } catch (e) {
            console.error("Import failed:", e);
            return false;
        }
    }
}
