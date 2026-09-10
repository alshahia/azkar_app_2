
import { UserPreferences, ProgressState, Quote, Salawat, UserZikr, UserCategory, UserStats, QuranBookmark, QuranLastRead } from '../types';

/**
 * Legacy payload (exported by versions 1..3 of exportData()). Still
 * accepted as input via validateBackup() so users can restore from old
 * files. The current writer always wraps this shape in an envelope.
 */
export interface BackupPayload {
    preferences?: Partial<UserPreferences>;
    progress?: ProgressState;
    stats?: Partial<UserStats>;
    userQuotes?: Quote[];
    userSalawat?: Salawat[];
    userCategories?: UserCategory[];
    userAzkar?: UserZikr[];
    hiddenStaticIds?: number[];
    quranBookmarks?: QuranBookmark[];
    quranLastRead?: QuranLastRead | null;
}

/**
 * v2 envelope: { schema, version, exportedAt, payload }. The writer wraps
 * a BackupPayload in this shape; the validator unwraps either an envelope
 * or a bare legacy payload and returns the inner BackupPayload.
 */
export interface BackupEnvelope {
    schema: 'azkar-backup';
    version: 2;
    exportedAt: number;
    payload: BackupPayload;
}

export const BACKUP_SCHEMA = 'azkar-backup' as const;
export const BACKUP_VERSION = 2 as const;

/** Wraps a BackupPayload in the v2 envelope. */
export const envelopePayload = (payload: BackupPayload, exportedAt = Date.now()): BackupEnvelope => ({
    schema: BACKUP_SCHEMA,
    version: BACKUP_VERSION,
    exportedAt,
    payload,
});

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Returns true when the input looks like a v2 envelope. */
export const isEnvelope = (raw: unknown): raw is BackupEnvelope =>
    isObj(raw) && (raw as Record<string, unknown>).schema === BACKUP_SCHEMA && (raw as Record<string, unknown>).version === BACKUP_VERSION && isObj((raw as Record<string, unknown>).payload);

/**
 * Shared, strict validation for backup files used by BOTH storage adapters so
 * a given backup restores identically on web and mobile.
 * Accepts either the v2 envelope or a bare legacy payload (returns the inner
 * BackupPayload). Throws Error('INVALID_BACKUP:<detail>') on any malformed
 * section.
 */
export const validateBackup = (raw: unknown): BackupPayload => {
    if (!isObj(raw)) throw new Error('INVALID_BACKUP:root');
    const data = isEnvelope(raw) ? raw.payload : raw;
    return validatePayload(data);
};

/** Validate the inner payload shape. Exposed so callers can assert the inner form too. */
export const validatePayload = (data: unknown): BackupPayload => {
    if (!isObj(data)) throw new Error('INVALID_BACKUP:payload');
    const out: BackupPayload = {};

    if (data.preferences !== undefined) {
        if (!isObj(data.preferences)) throw new Error('INVALID_BACKUP:preferences');
        out.preferences = data.preferences as Partial<UserPreferences>;
    }
    if (data.progress !== undefined) {
        if (!isObj(data.progress)) throw new Error('INVALID_BACKUP:progress');
        const p: ProgressState = {};
        for (const [k, v] of Object.entries(data.progress)) {
            if (!isNum(v)) throw new Error('INVALID_BACKUP:progress:' + k);
            p[k] = v;
        }
        out.progress = p;
    }
    if (data.stats !== undefined) {
        if (!isObj(data.stats)) throw new Error('INVALID_BACKUP:stats');
        out.stats = data.stats as Partial<UserStats>;
    }

    const arr = (key: string, check: (item: unknown) => boolean): void => {
        if (data[key] === undefined) return;
        if (!Array.isArray(data[key])) throw new Error('INVALID_BACKUP:' + key);
        (data[key] as unknown[]).forEach((item, i) => {
            if (!check(item)) throw new Error('INVALID_BACKUP:' + key + ':' + i);
        });
        (out as Record<string, unknown>)[key] = data[key];
    };

    arr('userQuotes', q => isObj(q) && typeof q.text === 'string'
        && (typeof q.id === 'number' || typeof q.id === 'string'));
    arr('userSalawat', s => isObj(s) && typeof s.text === 'string'
        && (typeof s.id === 'number' || typeof s.id === 'string'));
    arr('userCategories', c => isObj(c) && typeof c.id === 'string' && typeof c.title === 'string');
    arr('userAzkar', z => isObj(z) && isNum(z.id as number) && typeof z.arabic === 'string'
        && typeof z.categoryId === 'string');
    arr('hiddenStaticIds', h => isNum(h));
    if (data.quranBookmarks !== undefined) {
        if (!Array.isArray(data.quranBookmarks)) throw new Error('INVALID_BACKUP:quranBookmarks');
        data.quranBookmarks.forEach((b: unknown, i: number) => {
            if (!isObj(b) || !isNum((b as Record<string, unknown>).surah) || !isNum((b as Record<string, unknown>).ayah)) {
                throw new Error('INVALID_BACKUP:quranBookmarks:' + i);
            }
        });
        out.quranBookmarks = data.quranBookmarks as QuranBookmark[];
    }
    if (data.quranLastRead !== undefined) {
        if (data.quranLastRead !== null && (!isObj(data.quranLastRead) ||
            !isNum((data.quranLastRead as Record<string, unknown>).surah) ||
            !isNum((data.quranLastRead as Record<string, unknown>).ayah))) {
            throw new Error('INVALID_BACKUP:quranLastRead');
        }
        out.quranLastRead = data.quranLastRead as QuranLastRead | null;
    }

    return out;
};

/** Normalize a user-zikr coming from a (possibly old) backup. */
export const normalizeUserZikr = (z: UserZikr): UserZikr => ({ ...z, isCustom: z.isCustom !== false });

/** Section counts for the preview UI. Counts nullable arrays as 0. */
export interface BackupPreviewCounts {
    preferences: number;
    progress: number;
    stats: number;
    userQuotes: number;
    userSalawat: number;
    userCategories: number;
    userAzkar: number;
    hiddenStaticIds: number;
    quranBookmarks: number;
    quranLastRead: number;
    /** True when the input was a v2 envelope (vs a bare legacy payload). */
    hasEnvelope: boolean;
    /** Exported-at timestamp (ms epoch) when known; 0 for legacy payloads. */
    exportedAt: number;
}

/** Compute the per-section counts for the preview modal. Never throws. */
export const previewBackupCounts = (raw: unknown): BackupPreviewCounts | null => {
    try {
        const payload = validateBackup(raw);
        const isEnv = isEnvelope(raw);
        const exportedAt = isEnv ? raw.exportedAt : 0;
        return {
            preferences: payload.preferences ? 1 : 0,
            progress: payload.progress ? Object.keys(payload.progress).length : 0,
            stats: payload.stats ? 1 : 0,
            userQuotes: payload.userQuotes?.length ?? 0,
            userSalawat: payload.userSalawat?.length ?? 0,
            userCategories: payload.userCategories?.length ?? 0,
            userAzkar: payload.userAzkar?.length ?? 0,
            hiddenStaticIds: payload.hiddenStaticIds?.length ?? 0,
            quranBookmarks: payload.quranBookmarks?.length ?? 0,
            quranLastRead: payload.quranLastRead === undefined ? 0 : 1,
            hasEnvelope: isEnv,
            exportedAt,
        };
    } catch {
        return null;
    }
};

/**
 * Compute a merged payload by UNIONing the existing storage state with the
 * incoming backup. Per-id collections (quotes/salawat/categories/azkar/
 * bookmarks/hiddenStaticIds) are deduped by their primary id and incoming
 * values win on collision so a newer backup overrides older local copies
 * without nuking local-only entries. Object sections (preferences/progress/
 * stats) are merged key-by-key with the backup values winning.
 * quranLastRead is replaced if the backup carries it.
 *
 * The caller is responsible for reading the existing storage state and
 * writing the merged result back. This function is pure - no I/O.
 */
export const mergePayload = (existing: BackupPayload, incoming: BackupPayload): BackupPayload => {
    const out: BackupPayload = { ...existing };

    if (incoming.preferences) {
        out.preferences = { ...(existing.preferences ?? {}), ...incoming.preferences };
    }
    if (incoming.progress) {
        out.progress = { ...(existing.progress ?? {}), ...incoming.progress };
    }
    if (incoming.stats) {
        out.stats = { ...(existing.stats ?? {}), ...incoming.stats };
    }

    const dedupeById = <T extends { id: string | number }>(cur: T[] | undefined, inc: T[] | undefined): T[] | undefined => {
        if (!inc) return cur;
        const map = new Map<string | number, T>();
        for (const item of cur ?? []) map.set(item.id, item);
        for (const item of inc) map.set(item.id, item);
        return Array.from(map.values());
    };

    out.userQuotes = dedupeById(existing.userQuotes, incoming.userQuotes);
    out.userSalawat = dedupeById(existing.userSalawat, incoming.userSalawat);
    out.userCategories = dedupeById(existing.userCategories, incoming.userCategories);
    out.userAzkar = dedupeById(existing.userAzkar, incoming.userAzkar);

    if (incoming.hiddenStaticIds) {
        const s = new Set<number>([...(existing.hiddenStaticIds ?? []), ...incoming.hiddenStaticIds]);
        out.hiddenStaticIds = Array.from(s);
    }

    if (incoming.quranBookmarks) {
        const map = new Map<string, QuranBookmark>();
        const key = (b: QuranBookmark): string => `${b.surah}:${b.ayah}`;
        for (const b of existing.quranBookmarks ?? []) map.set(key(b), b);
        for (const b of incoming.quranBookmarks) map.set(key(b), b);
        out.quranBookmarks = Array.from(map.values());
    }

    if (incoming.quranLastRead !== undefined) {
        out.quranLastRead = incoming.quranLastRead;
    }

    return out;
};
