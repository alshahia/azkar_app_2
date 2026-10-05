/**
 * Unit tests for WebStorage (data/storage/web.ts) — the localStorage-backed
 * StorageAdapter used on web.
 *
 * External dependencies are replaced with in-memory fakes:
 *   - localStorage: a Map-backed Storage mock stubbed onto globalThis
 *   - idb-keyval:   a Map-backed get/set/del mock (audio cache)
 *   - services/secureKey: a stub secureKeyStore (imported by web.ts, unused)
 *
 * Note: the backup API is exportData()/importData() — the "exportBackup" /
 * "importBackup" of the fix plan refer to these same methods.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { WebStorage } from '../../data/storage/web';
import { defaultPreferences, defaultStats } from '../../data/storage/defaults';
import { envelopePayload, isEnvelope, validateBackup } from '../../data/backup';
import type { UserPreferences, UserZikr } from '../../types';

// --- idb-keyval mock --------------------------------------------------------
// vi.hoisted keeps the backing store alive across the hoisted vi.mock factory.

const { idbStore } = vi.hoisted(() => {
    const store = new Map<string, unknown>();
    return { idbStore: store };
});

vi.mock('idb-keyval', () => ({
    get: vi.fn((key: string) => Promise.resolve(idbStore.get(key))),
    set: vi.fn((key: string, value: unknown) => {
        idbStore.set(key, value);
        return Promise.resolve();
    }),
    del: vi.fn((key: string) => {
        idbStore.delete(key);
        return Promise.resolve();
    }),
}));

vi.mock('../../services/secureKey', () => ({
    secureKeyStore: {
        get: vi.fn().mockResolvedValue(''),
        set: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
    },
}));

// --- localStorage mock ------------------------------------------------------

interface LocalStorageMock {
    readonly length: number;
    key(index: number): string | null;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}

function createLocalStorageMock(): LocalStorageMock {
    const map = new Map<string, string>();
    return {
        get length(): number {
            return map.size;
        },
        key(index: number): string | null {
            return Array.from(map.keys())[index] ?? null;
        },
        getItem(key: string): string | null {
            return map.has(key) ? (map.get(key) as string) : null;
        },
        setItem(key: string, value: string): void {
            map.set(key, String(value));
        },
        removeItem(key: string): void {
            map.delete(key);
        },
        clear(): void {
            map.clear();
        },
    };
}

// --- document.visibilityState helper ----------------------------------------

/** jsdom exposes document.visibilityState as a read-only accessor; shadow it
 *  with a writable value for one test and restore the original descriptor. */
function stubVisibilityState(state: 'hidden' | 'visible'): () => void {
    const owner = Object.getOwnPropertyDescriptor(document, 'visibilityState') ? document : Document.prototype;
    const original = Object.getOwnPropertyDescriptor(owner, 'visibilityState');
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true, writable: true });
    return () => {
        if (original) {
            Object.defineProperty(owner, 'visibilityState', original);
        } else {
            delete (document as unknown as { visibilityState?: unknown }).visibilityState;
        }
    };
}

beforeEach(() => {
    idbStore.clear();
    vi.stubGlobal('localStorage', createLocalStorageMock());
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

// --- Tests ------------------------------------------------------------------

describe('WebStorage - initialize', () => {
    it('initialize() resolves successfully', async () => {
        const storage = new WebStorage();
        await expect(storage.initialize()).resolves.toBeUndefined();
        storage.dispose();
    });

    it('initialize() registers visibilitychange and beforeunload listeners', async () => {
        const addSpy = vi.spyOn(document, 'addEventListener');
        const storage = new WebStorage();
        await storage.initialize();
        expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
        expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
        storage.dispose();
    });

    it('dispose() detaches the listeners registered by initialize()', async () => {
        const removeSpy = vi.spyOn(document, 'removeEventListener');
        const storage = new WebStorage();
        await storage.initialize();
        storage.dispose();
        expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    it('repeated initialize() calls do not stack duplicate listeners', async () => {
        const storage = new WebStorage();
        await storage.initialize();
        await storage.initialize();
        const flushSpy = vi.spyOn(storage, 'flush');
        const restore = stubVisibilityState('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        expect(flushSpy).toHaveBeenCalledTimes(1);
        restore();
        storage.dispose();
    });
});

describe('WebStorage - preferences', () => {
    it('getPreferences() returns defaults when nothing is stored', async () => {
        const storage = new WebStorage();
        const prefs = await storage.getPreferences();
        expect(prefs).toEqual(defaultPreferences);
        expect(prefs.darkMode).toBe(true);
        expect(prefs.theme).toBe('emerald');
        expect(prefs.fontSize).toBe(2);
        expect(prefs.language).toBe('ar');
        expect(prefs.favorites).toEqual([]);
    });

    it('savePreferences() persists and getPreferences() retrieves', async () => {
        const storage = new WebStorage();
        const prefs: UserPreferences = {
            ...defaultPreferences,
            darkMode: false,
            theme: 'blue',
            fontSize: 5,
            favorites: [1, 2, 3],
            voiceName: 'Ava',
        };
        await storage.savePreferences(prefs);
        const loaded = await storage.getPreferences();
        expect(loaded.darkMode).toBe(false);
        expect(loaded.theme).toBe('blue');
        expect(loaded.fontSize).toBe(5);
        expect(loaded.favorites).toEqual([1, 2, 3]);
        expect(loaded.voiceName).toBe('Ava');
        // Fields the test did not touch keep their defaults.
        expect(loaded.language).toBe('ar');
        expect(loaded.notifications).toBe(true);
    });

    it('savePreferences() strips apiKey before writing to localStorage', async () => {
        const storage = new WebStorage();
        await storage.savePreferences({ ...defaultPreferences, apiKey: 'super-secret-key' });
        const loaded = await storage.getPreferences();
        expect(loaded.apiKey).toBe('');
        const raw = localStorage.getItem('azkarAppPreferences');
        expect(raw).not.toBeNull();
        expect((JSON.parse(raw as string) as Record<string, unknown>).apiKey).toBeUndefined();
    });
});

describe('WebStorage - progress', () => {
    it('getProgress() returns an empty object when nothing is stored', async () => {
        const storage = new WebStorage();
        await expect(storage.getProgress()).resolves.toEqual({});
    });

    it('saveProgress() persists and getProgress() retrieves', async () => {
        const storage = new WebStorage();
        const progress = { 1: 5, 2: 12, 42: 1 };
        await storage.saveProgress(progress);
        await expect(storage.getProgress()).resolves.toEqual(progress);
    });
});

describe('WebStorage - stats', () => {
    it('getStats() returns defaults when nothing is stored', async () => {
        const storage = new WebStorage();
        await expect(storage.getStats()).resolves.toEqual(defaultStats);
    });

    it('saveStats() persists and getStats() retrieves', async () => {
        const storage = new WebStorage();
        const stats = { streak: 8, lastActiveDate: '2024-03-15', totalReads: 64, timezone: 'Asia/Riyadh' };
        await storage.saveStats(stats);
        await expect(storage.getStats()).resolves.toEqual(stats);
    });
});

describe('WebStorage - corrupted data', () => {
    it('getPreferences() falls back to defaults on corrupted JSON', async () => {
        localStorage.setItem('azkarAppPreferences', '{ this is not valid json');
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const storage = new WebStorage();
        await expect(storage.getPreferences()).resolves.toEqual(defaultPreferences);
        expect(errorSpy).toHaveBeenCalled();
    });

    it('getProgress() falls back to an empty object on corrupted JSON', async () => {
        localStorage.setItem('azkarAppProgress', 'not-json-at-all');
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const storage = new WebStorage();
        await expect(storage.getProgress()).resolves.toEqual({});
        expect(errorSpy).toHaveBeenCalled();
    });

    it('getStats() falls back to defaults on corrupted JSON', async () => {
        localStorage.setItem('azkar_user_stats', '###corrupted###');
        const storage = new WebStorage();
        await expect(storage.getStats()).resolves.toEqual(defaultStats);
    });
});

describe('WebStorage - backup export', () => {
    it('exportData() returns a valid v2 backup envelope', async () => {
        const storage = new WebStorage();
        const json = await storage.exportData();
        expect(typeof json).toBe('string');
        const backup = JSON.parse(json);
        expect(isEnvelope(backup)).toBe(true);
        expect(backup.schema).toBe('azkar-backup');
        expect(backup.version).toBe(2);
        expect(typeof backup.exportedAt).toBe('number');
        // The envelope must survive the shared validator unchanged.
        expect(validateBackup(backup)).toEqual(backup.payload);
        // The user's API key must never leak into a shareable backup.
        expect(backup.payload.preferences?.apiKey).toBe('');
    });

    it('exportData() reflects the current storage state', async () => {
        const storage = new WebStorage();
        await storage.savePreferences({ ...defaultPreferences, darkMode: false, theme: 'rose', fontSize: 6 });
        await storage.saveProgress({ 9: 3 });
        await storage.saveStats({ streak: 4, lastActiveDate: '2024-01-20', totalReads: 30, timezone: 'UTC' });
        const backup = JSON.parse(await storage.exportData());
        expect(backup.payload.preferences?.darkMode).toBe(false);
        expect(backup.payload.preferences?.theme).toBe('rose');
        expect(backup.payload.progress).toEqual({ 9: 3 });
        expect(backup.payload.stats?.streak).toBe(4);
    });
});

describe('WebStorage - backup import', () => {
    it('importData() restores an exported backup correctly', async () => {
        const storage = new WebStorage();
        await storage.savePreferences({ ...defaultPreferences, darkMode: false, theme: 'rose', fontSize: 4 });
        await storage.saveProgress({ 1: 10, 2: 20 });
        await storage.saveStats({ streak: 12, lastActiveDate: '2024-07-04', totalReads: 250, timezone: 'Asia/Dubai' });
        await storage.addUserQuote({ id: 1, text: 'quote one', author: 'author' });
        const customZikr: UserZikr = {
            id: 7,
            arabic: 'zikr text',
            transliteration: null,
            translation: null,
            benefit: null,
            reference: null,
            count: 3,
            categoryId: 'custom-1',
            isCustom: true,
        };
        await storage.addUserZikr(customZikr);

        const backup = await storage.exportData();

        // Wipe everything, then restore from the backup alone.
        localStorage.clear();
        idbStore.clear();

        await expect(storage.importData(backup)).resolves.toBe(true);

        const prefs = await storage.getPreferences();
        expect(prefs.darkMode).toBe(false);
        expect(prefs.theme).toBe('rose');
        expect(prefs.fontSize).toBe(4);
        await expect(storage.getProgress()).resolves.toEqual({ 1: 10, 2: 20 });
        await expect(storage.getStats()).resolves.toEqual({
            streak: 12,
            lastActiveDate: '2024-07-04',
            totalReads: 250,
            timezone: 'Asia/Dubai',
        });
        await expect(storage.getUserQuotes()).resolves.toEqual([{ id: 1, text: 'quote one', author: 'author' }]);
        const azkar = await storage.getUserAzkar();
        expect(azkar).toHaveLength(1);
        expect(azkar[0].id).toBe(7);
        expect(azkar[0].isCustom).toBe(true);
    });

    it('importData() returns false for malformed JSON', async () => {
        const storage = new WebStorage();
        await expect(storage.importData('{ not json')).resolves.toBe(false);
    });

    it('importData() returns false when the payload fails validation', async () => {
        const storage = new WebStorage();
        const bad = JSON.stringify({ progress: { morning: 'lots' } });
        await expect(storage.importData(bad)).resolves.toBe(false);
    });

    it('importData() with mode "merge" unions collections with local data', async () => {
        const storage = new WebStorage();
        await storage.addUserQuote({ id: 1, text: 'local', author: 'a' });
        const backup = JSON.stringify(envelopePayload({
            preferences: { theme: 'blue' },
            userQuotes: [{ id: 2, text: 'incoming', author: 'b' }],
        }));
        await expect(storage.importData(backup, { mode: 'merge' })).resolves.toBe(true);
        const quotes = await storage.getUserQuotes();
        expect(quotes.map(q => q.id).sort()).toEqual([1, 2]);
        expect((await storage.getPreferences()).theme).toBe('blue');
    });

    it('importData() rolls back to previous values when a write fails', async () => {
        const storage = new WebStorage();
        await storage.saveProgress({ 1: 1 });
        await storage.addUserQuote({ id: 1, text: 'local quote', author: 'a' });

        const backup = JSON.stringify(envelopePayload({
            progress: { 2: 2 },
            userQuotes: [{ id: 2, text: 'incoming quote', author: 'b' }],
        }));

        // Fail the user-quotes write mid-import (putRaw is not guarded, so the
        // throw reaches importData's try/catch and triggers the rollback).
        const ls = globalThis.localStorage as unknown as LocalStorageMock;
        const originalSetItem = ls.setItem.bind(ls);
        ls.setItem = (key: string, value: string): void => {
            if (key === 'azkar_user_quotes') throw new Error('disk full');
            originalSetItem(key, value);
        };

        await expect(storage.importData(backup)).resolves.toBe(false);

        // The pre-import values were restored.
        await expect(storage.getProgress()).resolves.toEqual({ 1: 1 });
        await expect(storage.getUserQuotes()).resolves.toEqual([{ id: 1, text: 'local quote', author: 'a' }]);
    });
});

describe('WebStorage - flush', () => {
    it('flush() resolves immediately when the queue is empty', async () => {
        await expect(new WebStorage().flush()).resolves.toBeUndefined();
    });

    it('flush() resolves once every pending mutation has settled', async () => {
        const storage = new WebStorage();
        const completed: string[] = [];
        const first = storage.saveProgress({ a: 1 }).then(() => completed.push('first'));
        const second = storage.saveProgress({ b: 2 }).then(() => completed.push('second'));
        await storage.flush();
        expect(completed).toEqual(['first', 'second']);
        await first;
        await second;
    });

    it('flush() never rejects even when a mutation fails', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const broken: LocalStorageMock = {
            ...createLocalStorageMock(),
            setItem: (): void => {
                throw new Error('quota exceeded');
            },
        };
        vi.stubGlobal('localStorage', broken);
        const storage = new WebStorage();
        const mutation = storage.saveProgress({ a: 1 });
        await expect(mutation).rejects.toThrow('quota exceeded');
        // The queue tail swallows the failure, so flush() still resolves.
        await expect(storage.flush()).resolves.toBeUndefined();
        expect(errorSpy).toHaveBeenCalled();
    });
});

describe('WebStorage - mutation serialization', () => {
    it('concurrent read-modify-write mutations never lose an update', async () => {
        const storage = new WebStorage();
        await storage.addUserQuote({ id: 1, text: 'first', author: 'a' });
        await Promise.all([
            storage.addUserQuote({ id: 2, text: 'second', author: 'b' }),
            storage.addUserQuote({ id: 3, text: 'third', author: 'c' }),
        ]);
        const quotes = await storage.getUserQuotes();
        expect(quotes.map(q => q.id)).toEqual([1, 2, 3]);
    });

    it('enqueued mutations execute strictly in FIFO order', async () => {
        const writes: string[] = [];
        const ls = createLocalStorageMock();
        const originalSetItem = ls.setItem.bind(ls);
        ls.setItem = (key: string, value: string): void => {
            writes.push(key + '=' + value);
            originalSetItem(key, value);
        };
        vi.stubGlobal('localStorage', ls);
        const storage = new WebStorage();
        await Promise.all([
            storage.saveProgress({ a: 1 }),
            storage.saveProgress({ b: 2 }),
            storage.saveProgress({ c: 3 }),
        ]);
        expect(writes).toEqual([
            'azkarAppProgress={"a":1}',
            'azkarAppProgress={"b":2}',
            'azkarAppProgress={"c":3}',
        ]);
    });

    it('a later mutation never reads state mid-way through an earlier one', async () => {
        const events: string[] = [];
        const ls = createLocalStorageMock();
        const originalGetItem = ls.getItem.bind(ls);
        const originalSetItem = ls.setItem.bind(ls);
        ls.getItem = (key: string): string | null => {
            events.push('get:' + key);
            return originalGetItem(key);
        };
        ls.setItem = (key: string, value: string): void => {
            events.push('set:' + key);
            originalSetItem(key, value);
        };
        vi.stubGlobal('localStorage', ls);
        const storage = new WebStorage();
        await Promise.all([
            storage.addUserQuote({ id: 1, text: 'q1', author: 'a' }),
            storage.addUserQuote({ id: 2, text: 'q2', author: 'b' }),
        ]);
        const quoteEvents = events.filter(e => e.includes('azkar_user_quotes'));
        // Each mutation's read is immediately followed by its own write; a
        // get/get/set/set pattern would prove the reads interleaved.
        expect(quoteEvents).toEqual([
            'get:azkar_user_quotes',
            'set:azkar_user_quotes',
            'get:azkar_user_quotes',
            'set:azkar_user_quotes',
        ]);
    });
});

describe('WebStorage - audio cache', () => {
    it('saveAudio() persists and getAudio() retrieves', async () => {
        const storage = new WebStorage();
        await storage.saveAudio('surah-1-ayah-1', 'base64:abc');
        await expect(storage.getAudio('surah-1-ayah-1')).resolves.toBe('base64:abc');
        expect(vi.mocked(idbSet)).toHaveBeenCalledWith('azkar_audio_surah-1-ayah-1', 'base64:abc');
    });

    it('getAudio() returns null for a missing key', async () => {
        const storage = new WebStorage();
        await expect(storage.getAudio('missing')).resolves.toBeNull();
    });

    it('saveAudio() overwrites an existing entry', async () => {
        const storage = new WebStorage();
        await storage.saveAudio('k', 'first');
        await storage.saveAudio('k', 'second');
        await expect(storage.getAudio('k')).resolves.toBe('second');
    });

    it('saveAudio() swallows IndexedDB failures', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(idbSet).mockRejectedValueOnce(new Error('idb unavailable'));
        const storage = new WebStorage();
        await expect(storage.saveAudio('k', 'data')).resolves.toBeUndefined();
        expect(errorSpy).toHaveBeenCalled();
    });

    it('getAudio() returns null when IndexedDB fails', async () => {
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.mocked(idbGet).mockRejectedValueOnce(new Error('idb down'));
        const storage = new WebStorage();
        await expect(storage.getAudio('k')).resolves.toBeNull();
        expect(errorSpy).toHaveBeenCalled();
    });
});
