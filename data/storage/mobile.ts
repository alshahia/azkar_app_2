
import { StorageAdapter } from './interface';
import { UserPreferences, ProgressState, Quote, Salawat, UserZikr, UserCategory, UserStats, QuranBookmark, QuranLastRead, QuranReadHistoryEntry } from '../../types';
import { defaultPreferences, defaultStats } from './defaults';
import { validateBackup, normalizeUserZikr, envelopePayload, mergePayload, type BackupPayload } from '../backup';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { secureKeyStore } from '../../services/secureKey';

export class MobileStorage implements StorageAdapter {
    private sqlite: SQLiteConnection;
    private db: SQLiteDBConnection | null = null;
    private readonly DB_NAME = 'azkar_db';
    private initPromise: Promise<void> | null = null;
    private static readonly KEYS = {
        QURAN_BOOKMARKS: 'azkar_quran_bookmarks',
        QURAN_LAST_READ: 'azkar_quran_last_read',
        QURAN_READ_HISTORY: 'azkar_quran_read_history',
    };

    constructor() {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    /**
     * Idempotent initialization. Every public method goes through ensureDb(),
     * so callers no longer need to know whether initialize() ran first.
     */
    initialize(): Promise<void> {
        if (!this.initPromise) {
            this.initPromise = this.doInitialize().catch(error => {
                console.error('SQLite initialization failed:', error);
                try {
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('azkar-storage-error'));
                    }
                } catch {}
                throw error;
            });
        }
        return this.initPromise;
    }

    private async doInitialize(): Promise<void> {
        const db = await this.sqlite.createConnection(this.DB_NAME, false, 'no-encryption', 1, false);
        await db.open();

        await db.execute(`
            CREATE TABLE IF NOT EXISTS kv_store (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS user_quotes (
                id TEXT PRIMARY KEY,
                text TEXT,
                author TEXT,
                source TEXT
            );
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS user_salawat (
                id TEXT PRIMARY KEY,
                text TEXT,
                description TEXT
            );
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS user_categories (
                id TEXT PRIMARY KEY,
                title TEXT
            );
        `);

        // Fresh installs get the full shape immediately.
        await db.execute(`
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

        await db.execute(`
            CREATE TABLE IF NOT EXISTS hidden_static_azkar (
                id INTEGER PRIMARY KEY
            );
        `);

        await db.execute(`
            CREATE TABLE IF NOT EXISTS audio_cache (
                key TEXT PRIMARY KEY,
                data TEXT
            );
        `);

        await this.applySchemaMigrations(db);
        this.db = db;
    }

    /**
     * Versioned schema migrations (PRAGMA user_version).
     * Step 0 -> 1: add originalStaticId for databases created before that
     * column existed. Harmless on fresh installs (column already present).
     */
    private async applySchemaMigrations(db: SQLiteDBConnection): Promise<void> {
        let version = 0;
        try {
            const res = await db.query('PRAGMA user_version');
            const row = res && res.values && res.values[0];
            if (row) {
                version = Number(row.user_version !== undefined ? row.user_version : Object.values(row)[0]) || 0;
            }
        } catch (e) {
            console.error('Could not read user_version, assuming 0:', e);
        }

        const migrations: Array<(db: SQLiteDBConnection) => Promise<void>> = [
            async (db) => {
                try {
                    await db.execute('ALTER TABLE user_azkar ADD COLUMN originalStaticId INTEGER');
                } catch {
                    // Column already exists on fresh installs - not an error.
                }
            }
        ];

        while (version < migrations.length) {
            await migrations[version](db);
            version++;
            await db.execute('PRAGMA user_version = ' + version);
        }
    }

    /** Resolves with an open connection or rejects STORAGE_UNAVAILABLE. */
    private async ensureDb(): Promise<SQLiteDBConnection> {
        if (this.db) return this.db;
        await this.initialize();
        if (!this.db) throw new Error('STORAGE_UNAVAILABLE');
        return this.db;
    }

    private async getKV<T>(key: string): Promise<T | null> {
        const db = await this.ensureDb();
        try {
            const res = await db.query('SELECT value FROM kv_store WHERE key = ?', [key]);
            if (res.values && res.values.length > 0) {
                return JSON.parse(res.values[0].value) as T;
            }
        } catch (e) {
            console.error('Corrupted kv value for ' + key + ', treating as missing.', e);
        }
        return null;
    }

    private async setKV(key: string, value: unknown): Promise<void> {
        const db = await this.ensureDb();
        const json = JSON.stringify(value);
        await db.run('INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)', [key, json]);
    }

    async getPreferences(): Promise<UserPreferences> {
        const stored = await this.getKV<UserPreferences>('preferences');
        if (stored) {
            // Legacy installs may still have apiKey written to kv_store. Migrate
            // it to the platform secure store once, then strip it from the
            // stored blob so it never re-enters localStorage / SQLite.
            let sanitized = stored;
            if (stored.apiKey) {
                try {
                    await secureKeyStore.set(stored.apiKey);
                    sanitized = { ...stored, apiKey: '' };
                    await this.setKV('preferences', sanitized);
                } catch (e) {
                    console.error('Legacy apiKey migration failed:', e);
                }
            }
            return { ...defaultPreferences, ...sanitized, apiKey: '', language: 'ar' };
        }
        return defaultPreferences;
    }

    async savePreferences(prefs: UserPreferences): Promise<void> {
        // Never persist apiKey alongside other prefs — the secure store is its
        // single source of truth. Caller manages apiKey separately via
        // secureKeyStore.set().
        const { apiKey: _omitted, ...safe } = prefs;
        void _omitted;
        await this.setKV('preferences', safe);
    }

    async getProgress(): Promise<ProgressState> {
        return (await this.getKV<ProgressState>('progress')) || {};
    }

    async saveProgress(progress: ProgressState): Promise<void> {
        await this.setKV('progress', progress);
    }

    async isOnboardingComplete(): Promise<boolean> {
        const val = await this.getKV<boolean>('onboarding');
        return val === true;
    }

    async setOnboardingComplete(): Promise<void> {
        await this.setKV('onboarding', true);
    }

    // --- Migration flags ---

    async getFlag(key: string): Promise<boolean> {
        const val = await this.getKV<boolean>('flag:' + key);
        return val === true;
    }

    async setFlag(key: string): Promise<void> {
        await this.setKV('flag:' + key, true);
    }

    // --- Generic kv (session-ish app state; excluded from backups) ---

    async getKv<T>(key: string): Promise<T | null> {
        return this.getKV<T>('kv:' + key);
    }

    async setKv(key: string, value: unknown): Promise<void> {
        await this.setKV('kv:' + key, value);
    }

    // --- Dynamic Content ---

    async getUserQuotes(): Promise<Quote[]> {
        const db = await this.ensureDb();
        const res = await db.query('SELECT * FROM user_quotes');
        return ((res.values as Quote[]) || []).map(q => ({ ...q, id: Number(q.id) }));
    }

    async addUserQuote(quote: Quote): Promise<void> {
        const db = await this.ensureDb();
        // IGNORE: duplicate ids (e.g. same-millisecond legacy backups) skip instead of throwing.
        await db.run(
            'INSERT OR IGNORE INTO user_quotes (id, text, author, source) VALUES (?, ?, ?, ?)',
            [String(quote.id), quote.text, quote.author, quote.source || '']
        );
    }

    async getUserSalawat(): Promise<Salawat[]> {
        const db = await this.ensureDb();
        const res = await db.query('SELECT * FROM user_salawat');
        return ((res.values as Salawat[]) || []).map(s => ({ ...s, id: Number(s.id) }));
    }

    async addUserSalawat(salawat: Salawat): Promise<void> {
        const db = await this.ensureDb();
        await db.run(
            'INSERT OR IGNORE INTO user_salawat (id, text, description) VALUES (?, ?, ?)',
            [String(salawat.id), salawat.text, salawat.description || '']
        );
    }

    // --- User Categories ---

    async getUserCategories(): Promise<UserCategory[]> {
        const db = await this.ensureDb();
        const res = await db.query('SELECT * FROM user_categories');
        return (res.values as UserCategory[]) || [];
    }

    async addUserCategory(category: UserCategory): Promise<void> {
        const db = await this.ensureDb();
        await db.run(
            'INSERT OR REPLACE INTO user_categories (id, title) VALUES (?, ?)',
            [category.id, category.title]
        );
    }

    // --- User Azkar ---

    async getUserAzkar(): Promise<UserZikr[]> {
        const db = await this.ensureDb();
        const res = await db.query('SELECT * FROM user_azkar');
        return (res.values || []).map(z => ({
            ...z,
            isCustom: z.isCustom === 1
        })) as UserZikr[];
    }

    async addUserZikr(zikr: UserZikr): Promise<void> {
        const db = await this.ensureDb();
        await db.run(
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
                typeof zikr.originalStaticId === 'number' ? zikr.originalStaticId : null
            ]
        );
    }

    async updateUserZikr(zikr: UserZikr): Promise<void> {
        const db = await this.ensureDb();
        await db.run(
            'UPDATE user_azkar SET categoryId=?, arabic=?, transliteration=?, translation=?, benefit=?, reference=?, count=?, isCustom=?, originalStaticId=? WHERE id=?',
            [
                zikr.categoryId,
                zikr.arabic,
                zikr.transliteration || '',
                zikr.translation || '',
                zikr.benefit || '',
                zikr.reference || '',
                zikr.count,
                zikr.isCustom ? 1 : 0,
                typeof zikr.originalStaticId === 'number' ? zikr.originalStaticId : null,
                zikr.id
            ]
        );
    }

    async deleteUserZikr(id: number): Promise<void> {
        const db = await this.ensureDb();
        await db.run('DELETE FROM user_azkar WHERE id = ?', [id]);
    }

    // --- Static Overrides ---

    async getHiddenZikrIds(): Promise<number[]> {
        const db = await this.ensureDb();
        const res = await db.query('SELECT id FROM hidden_static_azkar');
        return (res.values || []).map(row => Number(row.id));
    }

    async hideStaticZikr(id: number): Promise<void> {
        const db = await this.ensureDb();
        await db.run('INSERT OR IGNORE INTO hidden_static_azkar (id) VALUES (?)', [id]);
    }

    async unhideStaticZikr(id: number): Promise<void> {
        const db = await this.ensureDb();
        await db.run('DELETE FROM hidden_static_azkar WHERE id = ?', [id]);
    }

    // --- Audio Caching ---

    async saveAudio(key: string, base64Data: string): Promise<void> {
        const db = await this.ensureDb();
        await db.run('INSERT OR REPLACE INTO audio_cache (key, data) VALUES (?, ?)', [key, base64Data]);
    }

    async getAudio(key: string): Promise<string | null> {
        const db = await this.ensureDb();
        const res = await db.query('SELECT data FROM audio_cache WHERE key = ?', [key]);
        if (res.values && res.values.length > 0) {
            return res.values[0].data;
        }
        return null;
    }

    // --- Stats ---

    async getStats(): Promise<UserStats> {
        const stored = await this.getKV<UserStats>('stats');
        return stored ? { ...defaultStats, ...stored } : defaultStats;
    }

    async saveStats(stats: UserStats): Promise<void> {
        await this.setKV('stats', stats);
    }

    // --- Quran ---

    async getQuranBookmarks(): Promise<QuranBookmark[]> {
        return (await this.getKV<QuranBookmark[]>(MobileStorage.KEYS.QURAN_BOOKMARKS)) ?? [];
    }

    async saveQuranBookmarks(bookmarks: QuranBookmark[]): Promise<void> {
        await this.setKV(MobileStorage.KEYS.QURAN_BOOKMARKS, bookmarks);
    }

    async getQuranLastRead(): Promise<QuranLastRead | null> {
        return (await this.getKV<QuranLastRead | null>(MobileStorage.KEYS.QURAN_LAST_READ)) ?? null;
    }

    async saveQuranLastRead(value: QuranLastRead | null): Promise<void> {
        await this.setKV(MobileStorage.KEYS.QURAN_LAST_READ, value);
    }

    async getQuranReadHistory(): Promise<QuranReadHistoryEntry[]> {
        return (await this.getKV<QuranReadHistoryEntry[]>(MobileStorage.KEYS.QURAN_READ_HISTORY)) ?? [];
    }

    async saveQuranReadHistory(value: QuranReadHistoryEntry[]): Promise<void> {
        await this.setKV(MobileStorage.KEYS.QURAN_READ_HISTORY, value);
    }

// --- Data Management ---

    async exportData(): Promise<string> {
        const prefs = await this.getPreferences();
        const payload: BackupPayload = {
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
        };
        return JSON.stringify(envelopePayload(payload, Date.now()), null, 2);
    }

    /**
     * Validated restore inside a single SQL transaction.
     * `mode` defaults to 'replace' (current behavior): sections present in
     * the backup replace local data wholesale, absent sections are left
     * untouched. 'merge' unions per-id collections with incoming values
     * winning on collision, and merges object sections key-by-key. Any
     * failure rolls the whole transaction back - previous data survives.
     */
    async importData(jsonData: string, opts?: { mode?: 'replace' | 'merge' }): Promise<boolean> {
        let incoming;
        try {
            incoming = validateBackup(JSON.parse(jsonData));
        } catch (e) {
            console.error('Import failed validation:', e);
            return false;
        }
        const mode = opts?.mode ?? 'replace';
        // Read the current payload so merge can union with it. For 'replace'
        // mode the read is wasted but the alternative (branching every
        // section write) is harder to keep aligned across adapters.
        const existing: BackupPayload = mode === 'merge' ? {
            preferences: await this.getPreferences(),
            progress: await this.getProgress(),
            stats: await this.getStats(),
            userQuotes: await this.getUserQuotes(),
            userSalawat: await this.getUserSalawat(),
            userCategories: await this.getUserCategories(),
            userAzkar: await this.getUserAzkar(),
            hiddenStaticIds: await this.getHiddenZikrIds(),
            quranBookmarks: await this.getQuranBookmarks(),
            quranLastRead: await this.getQuranLastRead(),
        } : {};
        const payload: BackupPayload = mode === 'merge' ? mergePayload(existing, incoming) : incoming;

        const db = await this.ensureDb();
        await db.beginTransaction();
        try {
            if (payload.preferences) {
                await this.savePreferences({ ...defaultPreferences, ...payload.preferences, language: 'ar' } as UserPreferences);
            }
            if (payload.progress) await this.saveProgress(payload.progress);
            if (payload.stats) await this.saveStats({ ...defaultStats, ...payload.stats });

            // 'replace' path: clear + insert. 'merge' path: skip the DELETE so
            // local-only rows survive (addX methods use INSERT OR IGNORE / OR
            // REPLACE, which already dedupe per primary key).
            if (payload.userQuotes) {
                if (mode === 'replace') await db.execute('DELETE FROM user_quotes');
                for (const q of payload.userQuotes) await this.addUserQuote(q);
            }
            if (payload.userSalawat) {
                if (mode === 'replace') await db.execute('DELETE FROM user_salawat');
                for (const s of payload.userSalawat) await this.addUserSalawat(s);
            }
            if (payload.userCategories) {
                if (mode === 'replace') await db.execute('DELETE FROM user_categories');
                for (const c of payload.userCategories) await this.addUserCategory(c);
            }
            if (payload.userAzkar) {
                if (mode === 'replace') await db.execute('DELETE FROM user_azkar');
                for (const raw of payload.userAzkar) {
                    const z = normalizeUserZikr(raw);
                    await this.addUserZikr(z);
                }
            }
            if (payload.hiddenStaticIds) {
                if (mode === 'replace') await db.execute('DELETE FROM hidden_static_azkar');
                for (const id of payload.hiddenStaticIds) await db.run('INSERT OR IGNORE INTO hidden_static_azkar (id) VALUES (?)', [id]);
            }
            if (payload.quranBookmarks) {
                await this.saveQuranBookmarks(payload.quranBookmarks);
            }
            if (payload.quranLastRead !== undefined) {
                await this.saveQuranLastRead(payload.quranLastRead);
            }

            await db.commitTransaction();
            return true;
        } catch (e) {
            console.error('Import failed, rolling back:', e);
            try { await db.rollbackTransaction(); } catch (rollbackError) {
                console.error('Rollback itself failed:', rollbackError);
            }
            return false;
        }
    }
}