
import { StorageAdapter } from './storage/interface';
import { LEGACY_ID_MAP } from './static/azkar';
import { ProgressState, UserZikr } from '../types';

export interface Migration {
    /** Stable identifier persisted via storage.setFlag(). Re-running must be a no-op. */
    flag: string;
    /** Body of the migration. Must be idempotent: re-running on already-migrated data must be a no-op. */
    run: (storage: StorageAdapter) => Promise<void>;
}

/**
 * Ordered registry of data migrations. Append new entries at the END; never
 * reorder or mutate a shipped entry (its flag is already set on existing
 * installs). Each entry must remain idempotent for the lifetime of the app.
 */
export const MIGRATIONS: readonly Migration[] = [
    // --- v2: legacy sequential zikr ids -> deterministic stable ids. ---
    // Reproduces the OLD counter assignment over the CURRENT declaration
    // order, which is exactly what shipped builds used, then rewrites every
    // persisted reference. Already-migrated values (>= MIN_STABLE_ID) are not
    // keys in LEGACY_ID_MAP and pass through untouched, so re-running is safe.
    {
        flag: 'id_migration_v2',
        run: async (storage) => {
            const remap = (id: number): number => LEGACY_ID_MAP.get(id) ?? id;

            // --- read everything first, transform in memory ---
            const prefs = await storage.getPreferences();
            const favorites = Array.from(new Set((prefs.favorites || []).map(remap)));

            const oldProgress = await storage.getProgress();
            const progress: ProgressState = {};
            for (const [key, value] of Object.entries(oldProgress)) {
                const numeric = Number(key);
                const mapped = Number.isFinite(numeric) ? String(remap(numeric)) : key;
                progress[mapped] = (progress[mapped] || 0) + (value || 0);
            }

            const hiddenIds = Array.from(new Set((await storage.getHiddenZikrIds()).map(remap)));

            const userAzkar = await storage.getUserAzkar();
            const remappedAzkar: UserZikr[] = userAzkar.map(z =>
                typeof z.originalStaticId === 'number'
                    ? { ...z, originalStaticId: remap(z.originalStaticId) }
                    : z
            );

            // --- write back ---
            await storage.savePreferences({ ...prefs, favorites });
            await storage.saveProgress(progress);

            const beforeHidden = new Set(await storage.getHiddenZikrIds());
            const afterHidden = new Set(hiddenIds);
            for (const id of beforeHidden) {
                if (!afterHidden.has(id)) await storage.unhideStaticZikr(id);
            }
            for (const id of afterHidden) {
                if (!beforeHidden.has(id)) await storage.hideStaticZikr(id);
            }

            for (let i = 0; i < userAzkar.length; i++) {
                if (remappedAzkar[i].originalStaticId !== userAzkar[i].originalStaticId) {
                    await storage.updateUserZikr(remappedAzkar[i]);
                }
            }
        },
    },
];

/**
 * Runs every migration that hasn't yet been marked complete. Each migration
 * sets its own flag only after its body succeeds; an interrupted run leaves
 * the flag unset so the migration retries on next launch.
 *
 * Migrations are independent of PRAGMA-style schema migrations (see
 * MobileStorage.applySchemaMigrations). Those change table shape; these
 * rewrite stored data values and are scoped to flag-keyed one-shot work.
 */
export const runStorageMigrations = async (storage: StorageAdapter): Promise<void> => {
    for (const migration of activeMigrations) {
        if (await storage.getFlag(migration.flag)) continue;
        await migration.run(storage);
        // Flag last so an interrupted run retries cleanly.
        await storage.setFlag(migration.flag);
    }
};

/** Internal mutable view of the registry, used by the test escape hatch. */
let activeMigrations: readonly Migration[] = MIGRATIONS;

/**
 * Test-only: replace the active registry. Pass `null` to restore the
 * production MIGRATIONS constant. Production callers never touch this.
 */
export const _setMigrationsForTesting = (overrides: readonly Migration[] | null): void => {
    activeMigrations = overrides === null ? MIGRATIONS : overrides;
};
