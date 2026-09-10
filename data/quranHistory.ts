/**
 * Quran read history helpers (M3-T5).
 *
 * The app keeps a small ring buffer (max QURAN_READ_HISTORY_MAX) of the
 * surahs the user actually opened in a SurahReader session. New entries
 * are pushed when the reader unmounts; duplicates within the buffer
 * (same surah + ayah as a recent entry) collapse so the list reads as a
 * true recent-history, not as a noise of repeated opens.
 */
import { QURAN_READ_HISTORY_MAX, type QuranReadHistoryEntry } from '../types';

/**
 * Insert a new entry at the front of the list, removing any prior entry
 * for the same (surah, ayah) within a 4-deep window, then truncate to
 * the configured maximum.
 */
export function pushQuranHistory(
    list: QuranReadHistoryEntry[],
    next: QuranReadHistoryEntry,
    max: number = QURAN_READ_HISTORY_MAX,
): QuranReadHistoryEntry[] {
    if (!list) return [next].slice(0, max);
    // Pull prior entries that match this surah+ayah so the list stays
    // clean (one entry per recent session).
    const filtered = list.filter(
        (entry) => !(entry.surah === next.surah && entry.ayah === next.ayah),
    );
    const inserted = [next, ...filtered];
    return inserted.slice(0, max);
}

/** Build a history entry from a QuranLastRead-shaped object. */
export function makeQuranHistoryEntry(
    surah: number,
    ayah: number,
    now: number = Date.now(),
): QuranReadHistoryEntry {
    return { surah, ayah, ts: now };
}

/** True when entry is the same (surah, ayah) as the last one. Useful
 *  for skipping a no-op push on rapid re-renders that re-fire the
 *  unmount effect. */
export function isSameAsLast(
    list: QuranReadHistoryEntry[],
    candidate: { surah: number; ayah: number },
): boolean {
    if (!list || list.length === 0) return false;
    const head = list[0];
    return head.surah === candidate.surah && head.ayah === candidate.ayah;
}
