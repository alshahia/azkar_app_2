
import { UserPreferences, ProgressState, Quote, Salawat, UserCategory, UserZikr, UserStats, QuranBookmark, QuranLastRead } from '../types';

/**
 * Shared, strict validation for backup files used by BOTH storage adapters so
 * a given backup restores identically on web and mobile.
 * Throws Error('INVALID_BACKUP:<detail>') on any malformed section.
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

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export const validateBackup = (raw: unknown): BackupPayload => {
    if (!isObj(raw)) throw new Error('INVALID_BACKUP:root');
    const data = raw as Record<string, unknown>;
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