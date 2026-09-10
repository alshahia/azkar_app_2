import { describe, it, expect } from 'vitest';
import {
    envelopePayload,
    isEnvelope,
    validateBackup,
    validatePayload,
    previewBackupCounts,
    mergePayload,
    BACKUP_SCHEMA,
    BACKUP_VERSION,
} from '../../data/backup';
import type { BackupPayload, BackupEnvelope } from '../../data/backup';
import type { Quote, Salawat, UserCategory, UserZikr, UserStats } from '../../types';

// ---- Fixtures (typed, minimal-but-valid) -----------------------------------

const theme: BackupPayload['preferences'] = { theme: 'emerald' };

const fullQuote = (id: string | number, text: string): Quote => ({ id, text, author: 'x' });
const fullSalawat = (id: string | number, text: string): Salawat => ({ id, text });
const fullCategory = (id: string, title: string): UserCategory => ({ id, title });
const fullAzkar = (id: number, arabic: string, categoryId: string): UserZikr => ({
    id,
    arabic,
    categoryId,
    isCustom: true,
    transliteration: '',
    translation: '',
    benefit: '',
    count: 1,
} as unknown as UserZikr);
const fullStats = (): UserStats => ({
    streak: 7,
    lastActiveDate: '2024-01-01',
    totalReads: 100,
    timezone: 'Asia/Riyadh',
});

// ---- Tests -----------------------------------------------------------------

describe('envelopePayload', () => {
    it('wraps a payload with schema/version/exportedAt', () => {
        const payload: BackupPayload = { preferences: theme };
        const before = Date.now();
        const env = envelopePayload(payload);
        const after = Date.now();
        expect(env.schema).toBe(BACKUP_SCHEMA);
        expect(env.version).toBe(BACKUP_VERSION);
        expect(env.exportedAt).toBeGreaterThanOrEqual(before);
        expect(env.exportedAt).toBeLessThanOrEqual(after);
        expect(env.payload).toBe(payload);
    });

    it('accepts an explicit exportedAt timestamp', () => {
        const env = envelopePayload({}, 12345);
        expect(env.exportedAt).toBe(12345);
    });
});

describe('isEnvelope', () => {
    it('returns true for a well-formed envelope', () => {
        expect(isEnvelope(envelopePayload({}))).toBe(true);
    });

    it('returns false for a bare legacy payload', () => {
        expect(isEnvelope({ preferences: theme })).toBe(false);
    });

    it('returns false for non-objects', () => {
        expect(isEnvelope(null)).toBe(false);
        expect(isEnvelope(undefined)).toBe(false);
        expect(isEnvelope('string')).toBe(false);
        expect(isEnvelope(42)).toBe(false);
        expect(isEnvelope([])).toBe(false);
    });

    it('returns false when payload is missing or non-object', () => {
        const bad1 = { schema: BACKUP_SCHEMA, version: BACKUP_VERSION, exportedAt: 1 } as unknown;
        expect(isEnvelope(bad1)).toBe(false);
        const bad2 = { schema: BACKUP_SCHEMA, version: BACKUP_VERSION, exportedAt: 1, payload: 'nope' } as unknown;
        expect(isEnvelope(bad2)).toBe(false);
    });
});

describe('validateBackup', () => {
    it('unwraps a v2 envelope to its inner payload', () => {
        const inner: BackupPayload = { preferences: { theme: 'blue' } };
        const env = envelopePayload(inner);
        expect(validateBackup(env)).toEqual(inner);
    });

    it('accepts a bare legacy payload and returns it as-is', () => {
        const legacy: BackupPayload = { stats: { streak: 7 } };
        expect(validateBackup(legacy)).toEqual(legacy);
    });

    it('throws INVALID_BACKUP:root for non-objects', () => {
        expect(() => validateBackup(null)).toThrow(/INVALID_BACKUP:root/);
        expect(() => validateBackup('x')).toThrow(/INVALID_BACKUP:root/);
    });

    it('throws INVALID_BACKUP:progress when a progress value is non-numeric', () => {
        const bad = { progress: { foo: 'bar' } };
        expect(() => validateBackup(bad)).toThrow(/INVALID_BACKUP:progress:foo/);
    });

    it('throws INVALID_BACKUP:userAzkar for malformed entries', () => {
        const bad = { userAzkar: [{ id: 1, arabic: 'a' }] };
        expect(() => validateBackup(bad)).toThrow(/INVALID_BACKUP:userAzkar:0/);
    });

    it('accepts a fully-populated payload', () => {
        const full: BackupPayload = {
            preferences: theme,
            progress: { morning: 3 },
            stats: { streak: 10 },
            userQuotes: [fullQuote(1, 'quote')],
            userSalawat: [fullSalawat(1, 'salawat')],
            userCategories: [fullCategory('c1', 't')],
            userAzkar: [fullAzkar(1, 'a', 'c1')],
            hiddenStaticIds: [5, 7],
            quranBookmarks: [{ surah: 1, ayah: 2, createdAt: 100 }],
            quranLastRead: { surah: 1, ayah: 3 },
        };
        expect(validateBackup(full)).toEqual(full);
    });
});

describe('validatePayload (inner-only)', () => {
    it('accepts a bare inner payload without an envelope', () => {
        expect(validatePayload({ preferences: theme })).toEqual({ preferences: theme });
    });

    it('throws INVALID_BACKUP:payload for non-objects', () => {
        expect(() => validatePayload(null)).toThrow(/INVALID_BACKUP:payload/);
    });
});

describe('previewBackupCounts', () => {
    const full: BackupPayload = {
        preferences: theme,
        progress: { morning: 3, evening: 1 },
        stats: { streak: 10 },
        userQuotes: [fullQuote(1, 'q1'), fullQuote(2, 'q2')],
        userSalawat: [fullSalawat(1, 's1')],
        userCategories: [fullCategory('c1', 't')],
        userAzkar: [fullAzkar(1, 'a', 'c1')],
        hiddenStaticIds: [1, 2, 3],
        quranBookmarks: [{ surah: 1, ayah: 2, createdAt: 0 }],
        quranLastRead: { surah: 1, ayah: 1 },
    };

    it('returns counts for a v2 envelope', () => {
        const env = envelopePayload(full, 999);
        const counts = previewBackupCounts(env);
        expect(counts).not.toBeNull();
        expect(counts!.preferences).toBe(1);
        expect(counts!.progress).toBe(2);
        expect(counts!.stats).toBe(1);
        expect(counts!.userQuotes).toBe(2);
        expect(counts!.userSalawat).toBe(1);
        expect(counts!.userCategories).toBe(1);
        expect(counts!.userAzkar).toBe(1);
        expect(counts!.hiddenStaticIds).toBe(3);
        expect(counts!.quranBookmarks).toBe(1);
        expect(counts!.quranLastRead).toBe(1);
        expect(counts!.hasEnvelope).toBe(true);
        expect(counts!.exportedAt).toBe(999);
    });

    it('marks legacy payloads and zeros exportedAt', () => {
        const counts = previewBackupCounts(full);
        expect(counts).not.toBeNull();
        expect(counts!.hasEnvelope).toBe(false);
        expect(counts!.exportedAt).toBe(0);
    });

    it('counts empty/missing sections as 0', () => {
        const counts = previewBackupCounts({});
        expect(counts).toEqual({
            preferences: 0,
            progress: 0,
            stats: 0,
            userQuotes: 0,
            userSalawat: 0,
            userCategories: 0,
            userAzkar: 0,
            hiddenStaticIds: 0,
            quranBookmarks: 0,
            quranLastRead: 0,
            hasEnvelope: false,
            exportedAt: 0,
        });
    });

    it('returns null for invalid input (does not throw)', () => {
        expect(previewBackupCounts(null)).toBeNull();
        expect(previewBackupCounts('nope')).toBeNull();
        expect(previewBackupCounts({ progress: { foo: 'bar' } })).toBeNull();
    });
});

describe('mergePayload', () => {
    it('merges preferences key-by-key with incoming winning', () => {
        const existing: BackupPayload = { preferences: { theme: 'emerald', fontSize: 'lg' } as unknown as BackupPayload['preferences'] };
        const incoming: BackupPayload = { preferences: { theme: 'blue' } };
        const merged = mergePayload(existing, incoming);
        expect(merged.preferences).toEqual({ theme: 'blue', fontSize: 'lg' });
    });

    it('keeps existing when incoming omits a section', () => {
        const existing: BackupPayload = { userQuotes: [fullQuote(1, 'q1')] };
        const incoming: BackupPayload = {};
        const merged = mergePayload(existing, incoming);
        expect(merged.userQuotes).toEqual([fullQuote(1, 'q1')]);
    });

    it('dedupes per-id collections (incoming wins)', () => {
        const existing: BackupPayload = {
            userQuotes: [fullQuote(1, 'old'), fullQuote(2, 'q2')],
        };
        const incoming: BackupPayload = {
            userQuotes: [fullQuote(1, 'new'), fullQuote(3, 'q3')],
        };
        const merged = mergePayload(existing, incoming);
        expect(merged.userQuotes).toEqual([
            fullQuote(1, 'new'),
            fullQuote(2, 'q2'),
            fullQuote(3, 'q3'),
        ]);
    });

    it('unions hiddenStaticIds (set semantics)', () => {
        const existing: BackupPayload = { hiddenStaticIds: [1, 2, 3] };
        const incoming: BackupPayload = { hiddenStaticIds: [3, 4, 5] };
        const merged = mergePayload(existing, incoming);
        expect(merged.hiddenStaticIds?.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('dedupes quranBookmarks by surah:ayah', () => {
        const existing: BackupPayload = {
            quranBookmarks: [
                { surah: 1, ayah: 1, createdAt: 100 },
                { surah: 2, ayah: 5, createdAt: 200 },
            ],
        };
        const incoming: BackupPayload = {
            quranBookmarks: [
                { surah: 1, ayah: 1, createdAt: 999 },
                { surah: 3, ayah: 7, createdAt: 300 },
            ],
        };
        const merged = mergePayload(existing, incoming);
        const keys = merged.quranBookmarks!.map(b => b.surah + ':' + b.ayah).sort();
        expect(keys).toEqual(['1:1', '2:5', '3:7']);
        // Incoming wins on collision (1:1 has newer createdAt)
        const first = merged.quranBookmarks!.find(b => b.surah === 1 && b.ayah === 1);
        expect(first!.createdAt).toBe(999);
    });

    it('replaces quranLastRead when incoming defines it', () => {
        const existing: BackupPayload = { quranLastRead: { surah: 1, ayah: 1 } };
        const incoming: BackupPayload = { quranLastRead: { surah: 5, ayah: 10 } };
        expect(mergePayload(existing, incoming).quranLastRead).toEqual({ surah: 5, ayah: 10 });
    });

    it('clears quranLastRead when incoming sets null', () => {
        const existing: BackupPayload = { quranLastRead: { surah: 1, ayah: 1 } };
        const incoming: BackupPayload = { quranLastRead: null };
        expect(mergePayload(existing, incoming).quranLastRead).toBeNull();
    });

    it('does not mutate the input payloads', () => {
        const existing: BackupPayload = {
            preferences: theme,
            userQuotes: [fullQuote(1, 'old')],
        };
        const incoming: BackupPayload = {
            preferences: { theme: 'blue' },
            userQuotes: [fullQuote(2, 'q2')],
        };
        const existingSnapshot = JSON.stringify(existing);
        const incomingSnapshot = JSON.stringify(incoming);
        mergePayload(existing, incoming);
        expect(JSON.stringify(existing)).toBe(existingSnapshot);
        expect(JSON.stringify(incoming)).toBe(incomingSnapshot);
    });

    it('handles missing sections gracefully', () => {
        const merged = mergePayload({}, {});
        expect(merged).toEqual({});
    });

    it('merges stats key-by-key with incoming winning', () => {
        const existing: BackupPayload = { stats: { streak: 5, totalReads: 50 } as Partial<UserStats> };
        const incoming: BackupPayload = { stats: { streak: 10 } as Partial<UserStats> };
        const merged = mergePayload(existing, incoming);
        expect(merged.stats).toEqual({ streak: 10, totalReads: 50 });
    });

    it('fullStats() can be round-tripped through envelope + merge', () => {
        const a: BackupPayload = { stats: fullStats() };
        const env: BackupEnvelope = envelopePayload(a, 1);
        const recovered = validateBackup(env);
        expect(recovered.stats).toEqual(fullStats());
        const merged = mergePayload({}, recovered);
        expect(merged.stats).toEqual(fullStats());
    });
});

describe('envelope round-trip', () => {
    it('envelope -> validateBackup -> previewBackupCounts recovers counts', () => {
        const original: BackupPayload = {
            preferences: theme,
            progress: { morning: 3 },
            userAzkar: [fullAzkar(1, 'a', 'c1')],
        };
        const env: BackupEnvelope = envelopePayload(original, 1000);
        const recovered = validateBackup(env);
        expect(recovered).toEqual(original);
        const counts = previewBackupCounts(env);
        expect(counts!.exportedAt).toBe(1000);
        expect(counts!.hasEnvelope).toBe(true);
        expect(counts!.userAzkar).toBe(1);
    });
});
