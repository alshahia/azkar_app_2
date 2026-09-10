
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MIGRATIONS, runStorageMigrations, _setMigrationsForTesting } from '../../data/migrations';
import { LEGACY_ID_MAP } from '../../data/static/azkar';

/**
 * Full-shape fake adapter for the migration runner. Implements every method
 * the shipped v2 migration touches. Stores state in plain variables; the
 * `state` snapshot is recomputed on access so tests can assert the
 * after-state without mocking individual call sequences.
 */
const makeFakeStorage = () => {
    const flags = new Set<string>();
    let prefs: any = { favorites: [] };
    const progress: Record<string, number> = {};
    let hidden: number[] = [];
    let userAzkar: any[] = [];
    const storage = {
        flags: flags as Set<string>,
        state: {
            get prefs() { return prefs; },
            get progress() { return { ...progress }; },
            get hidden() { return [...hidden]; },
            get userAzkar() { return userAzkar.map(z => ({ ...z })); },
        },
        getFlag: vi.fn(async (k: string) => flags.has(k)),
        setFlag: vi.fn(async (k: string) => { flags.add(k); }),
        getPreferences: vi.fn(async () => prefs),
        savePreferences: vi.fn(async (p: any) => { prefs = p; }),
        getProgress: vi.fn(async () => ({ ...progress })),
        saveProgress: vi.fn(async (p: Record<string, number>) => {
            for (const k of Object.keys(progress)) delete progress[k];
            Object.assign(progress, p);
        }),
        getHiddenZikrIds: vi.fn(async () => [...hidden]),
        hideStaticZikr: vi.fn(async (id: number) => { if (!hidden.includes(id)) hidden.push(id); }),
        unhideStaticZikr: vi.fn(async (id: number) => { hidden = hidden.filter(x => x !== id); }),
        getUserAzkar: vi.fn(async () => userAzkar.map(z => ({ ...z }))),
        updateUserZikr: vi.fn(async (z: any) => { userAzkar = userAzkar.map(x => x.id === z.id ? z : x); }),
        addUserZikr: vi.fn(async (z: any) => { userAzkar.push(z); }),
        deleteUserZikr: vi.fn(async () => {}),
    } as any;
    // Convenience setters for test setup (the storage object itself stays
    // readonly from the test's perspective; tests talk to backing vars).
    storage.__seed = (s: { prefs?: any; progress?: Record<string, number>; hidden?: number[]; userAzkar?: any[] }) => {
        if (s.prefs) prefs = s.prefs;
        if (s.progress) { for (const k of Object.keys(progress)) delete progress[k]; Object.assign(progress, s.progress); }
        if (s.hidden) hidden = [...s.hidden];
        if (s.userAzkar) userAzkar = s.userAzkar.map(z => ({ ...z }));
    };
    return storage;
};

afterEach(() => {
    // Each test mutates the registry; never let one leak into the next.
    _setMigrationsForTesting(null);
});

describe('runStorageMigrations (ordered runner)', () => {
    it('runs every registered migration exactly once on first call', async () => {
        const storage = makeFakeStorage();
        await runStorageMigrations(storage);
        expect(storage.flags.size).toBe(MIGRATIONS.length);
        expect(storage.flags.has('id_migration_v2')).toBe(true);
    });

    it('is a no-op when re-invoked (idempotency)', async () => {
        const storage = makeFakeStorage();
        await runStorageMigrations(storage);
        const flagCallsAfterFirst = (storage.setFlag as any).mock.calls.length;
        await runStorageMigrations(storage);
        expect((storage.setFlag as any).mock.calls.length).toBe(flagCallsAfterFirst);
    });

    it('runs an unrun migration even when a later migration was already applied', async () => {
        const storage = makeFakeStorage();
        const synthetic = [
            { flag: 'a', run: vi.fn(async () => {}) },
            { flag: 'b', run: vi.fn(async () => {}) },
            { flag: 'c', run: vi.fn(async () => {}) },
        ];
        storage.flags.add('b'); // pre-mark the middle entry complete
        _setMigrationsForTesting(synthetic);
        await runStorageMigrations(storage);
        expect(synthetic[0].run).toHaveBeenCalledTimes(1);
        expect(synthetic[1].run).not.toHaveBeenCalled();
        expect(synthetic[2].run).toHaveBeenCalledTimes(1);
    });

    it('does not set the flag when a migration body throws (so retry is safe)', async () => {
        const storage = makeFakeStorage();
        const boom = vi.fn(async () => { throw new Error('boom'); });
        const synthetic = [
            { flag: 'ok', run: vi.fn(async () => {}) },
            { flag: 'boom', run: boom },
            { flag: 'never', run: vi.fn(async () => {}) },
        ];
        _setMigrationsForTesting(synthetic);
        await expect(runStorageMigrations(storage)).rejects.toThrow('boom');
        expect(storage.flags.has('ok')).toBe(true);
        expect(storage.flags.has('boom')).toBe(false);
        expect(storage.flags.has('never')).toBe(false);
        await expect(runStorageMigrations(storage)).rejects.toThrow('boom');
        expect(boom).toHaveBeenCalledTimes(2);
    });

    it('preserves the shipped v2 entry as the first migration', () => {
        expect(MIGRATIONS[0].flag).toBe('id_migration_v2');
    });

    it('v2 remaps legacy ids across preferences, progress, hidden and userAzkar.originalStaticId', async () => {
        const storage = makeFakeStorage();
        const legacyIds = Array.from(LEGACY_ID_MAP.keys()).slice(0, 3);
        const stableIds = legacyIds.map(id => LEGACY_ID_MAP.get(id)!);
        expect(legacyIds.every(id => id !== LEGACY_ID_MAP.get(id))).toBe(true);

        // Use a stable control id well above the static zikr count so the
        // v2 remap is guaranteed to leave it untouched (the legacy map's
        // max key is the total zikr count).
        const controlId = 90_000_000;
        storage.__seed({
            prefs: { favorites: [...legacyIds, controlId] },
            progress: Object.fromEntries(legacyIds.map(id => [String(id), 2])),
            hidden: [...legacyIds, controlId],
            userAzkar: legacyIds.map(id => ({ id: id + 100000, originalStaticId: id, isCustom: true })),
        });

        await runStorageMigrations(storage);

        expect(storage.state.prefs.favorites.sort()).toEqual([...stableIds, controlId].sort());
        expect(Object.keys(storage.state.progress).sort()).toEqual(stableIds.map(String).sort());
        expect(storage.state.progress[stableIds[0]]).toBe(2);
        expect(storage.state.hidden.sort()).toEqual([...stableIds, controlId].sort());
        for (let i = 0; i < legacyIds.length; i++) {
            expect(storage.state.userAzkar[i].originalStaticId).toBe(stableIds[i]);
        }
        expect(storage.flags.has('id_migration_v2')).toBe(true);
    });
});
