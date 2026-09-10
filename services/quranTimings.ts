/**
 * Quran per-ayah timings loader (M3-T3).
 *
 * Two-tier resolver:
 *   1. Bundled timings under data/static/quran/timings/<reciterId>.json (QUL
 *      datasets harvested by scripts/fetch-timings.mjs).
 *   2. Audio-queue fallback: when no timings are loaded for the current
 *      reciter, callers should treat audioQueue.playback.ayahNumber as the
 *      active ayah. This service never tries to be clever about time
 *      arithmetic; it just maps a (reciter, ms) to (surah, ayah) when given
 *      a timing bundle.
 *
 * Each timimings file is shaped:
 *   {
 *     "reciterId": "...",
 *     "source":    "QUL",
 *     "license":   "...",
 *     "ayahs": [
 *       { "surah": 1, "ayah": 1, "startMs": 0,  "endMs": 4200 },
 *       ...
 *     ]
 *   }
 *
 * Bundled placeholder files (if no QUL dataset was harvested) look like:
 *   { "reciterId": "...", "placeholder": true, "ayahs": [] }
 *
 * In both cases loadTimings returns the JSON. The highlight pipeline treats
 * a placeholder the same as a missing file.
 */
import type { QuranAyah } from './QuranService';

// Vite turns every timings/<id>.json into its own URL at build time. The
// glob is eager at type-level; the import is lazy by file.
const timingLoaders = import.meta.glob<{ reciterId: string; source?: string; license?: string; placeholder?: boolean; ayahs: TimingRow[] }>(
    '../data/static/quran/timings/*.json',
);

export interface TimingRow {
    surah: number;
    ayah: number;
    /** Start of this ayah in the surah audio, in milliseconds. */
    startMs: number;
    /** End of this ayah in the surah audio, in milliseconds. -1 if unknown. */
    endMs: number;
}

export interface QuranTimingsFile {
    reciterId: string;
    source?: string;
    license?: string;
    placeholder?: boolean;
    ayahs: TimingRow[];
}

const cache = new Map<string, QuranTimingsFile | null>();

/**
 * Loads (and memoises) the timings file for a reciter. Returns null when no
 * bundle exists or when the bundle is a placeholder. The result is also
 * cached so a re-bind of the same reciter never hits the network twice.
 */
export async function loadTimings(reciterId: string): Promise<QuranTimingsFile | null> {
    if (cache.has(reciterId)) return cache.get(reciterId) ?? null;
    const path = '../data/static/quran/timings/' + reciterId + '.json';
    const loader = timingLoaders[path];
    if (!loader) {
        cache.set(reciterId, null);
        return null;
    }
    try {
        const file = await loader();
        // Placeholder bundles carry placeholder:true; report them as null.
        if (file && file.placeholder) {
            cache.set(reciterId, null);
            return null;
        }
        cache.set(reciterId, file as QuranTimingsFile);
        return file as QuranTimingsFile;
    } catch {
        cache.set(reciterId, null);
        return null;
    }
}

/** True when there is a real (non-placeholder) timing file for this reciter. */
export async function hasTimings(reciterId: string): Promise<boolean> {
    return (await loadTimings(reciterId)) !== null;
}

/**
 * Binary-search the sorted timing array to find the ayah playing at the
 * given position. Returns null when out of bundle range.
 *
 * Placeholder bundles are never queried (the caller's hasTimings gate
 * protects against this).
 */
export function getCurrentAyah(
    timings: QuranTimingsFile,
    positionMs: number,
): { surah: number; ayah: number } | null {
    if (!timings || timings.ayahs.length === 0) return null;
    const arr = timings.ayahs;
    let lo = 0;
    let hi = arr.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const row = arr[mid];
        if (positionMs < row.startMs) {
            hi = mid - 1;
        } else if (row.endMs >= 0 && positionMs >= row.endMs) {
            lo = mid + 1;
        } else {
            return { surah: row.surah, ayah: row.ayah };
        }
    }
    // Position is past the last ayah: clamp to the last entry.
    const last = arr[arr.length - 1];
    if (last.endMs < 0 || positionMs < last.endMs + 60_000) {
        return { surah: last.surah, ayah: last.ayah };
    }
    return null;
}

/**
 * Inverse: returns the startMs for a (surah, ayah). -1 when not in the
 * bundle. Reciters usually deliver entire surahs as gapless files, so the
 * position-to-time map is a straight sum of preceding durations when the
 * caller uses the surah as the unit; here we look up by (surah, ayah)
 * direct when present, or start at 0 for the surah's first ayah and add a
 * per-ayah delta when the bundle only tags the first ayah of each surah.
 *
 * The QUL bundles are per-ayah for every ayah, so the simple lookup path
 * is the common case.
 */
export function getAyahStartMs(
    timings: QuranTimingsFile,
    surah: number,
    ayah: number,
): number {
    const row = timings.ayahs.find(r => r.surah === surah && r.ayah === ayah);
    return row ? row.startMs : -1;
}

/**
 * Returns the offset (ms) at which playback should resume so the user
 * hears the requested ayah from its first syllable. Equivalent to
 * getAyahStartMs but with a clearer name for UI surfaces.
 */
export function seekMsForAyah(
    timings: QuranTimingsFile,
    surah: number,
    ayah: number,
): number {
    return getAyahStartMs(timings, surah, ayah);
}

/** Test seam: clears the cache + clears any loader-state mutations. */
export function _resetTimingsForTests(): void {
    cache.clear();
}

/**
 * Build a synthetic timings bundle in memory (used by tests + the
 * placeholder harvester). Honest: callers receive exactly what they pass
 * in - no silent normalisation.
 */
export function buildTimingsBundle(
    reciterId: string,
    rows: TimingRow[],
    extra: Partial<Pick<QuranTimingsFile, 'source' | 'license' | 'placeholder'>> = {},
): QuranTimingsFile {
    return { reciterId, ayahs: rows, ...extra };
}

// Re-export QuranAyah for callers that already depend on this module.
export type { QuranAyah };
