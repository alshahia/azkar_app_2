
import { StorageAdapter } from './storage/interface';
import { LEGACY_ID_MAP } from './static/azkar';
import { ProgressState, UserZikr } from '../types';

const FLAG = 'id_migration_v2';

/**
 * One-time migration: legacy sequential zikr ids -> deterministic stable ids.
 *
 * Reproduces the OLD counter assignment over the CURRENT declaration order,
 * which is exactly what shipped builds used, then rewrites every persisted
 * reference. Idempotent: already-migrated values (>= MIN_STABLE_ID) are not
 * keys in LEGACY_ID_MAP and pass through untouched.
 */
export const runStorageMigrations = async (storage: StorageAdapter): Promise<void> => {
    if (await storage.getFlag(FLAG)) return;

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

    // Flag last so an interrupted run retries cleanly.
    await storage.setFlag(FLAG);
};
