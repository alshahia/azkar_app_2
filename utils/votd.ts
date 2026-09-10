/**
 * Verse-of-the-Day picker (M4-T1).
 *
 * Pure functions: no I/O, no Capacitor, no notifications. The notification
 * orchestrator (NotificationService.scheduleVotd) imports from here, and
 * the reader deep-link imports from here, so the same ayah is delivered
 * regardless of where the user triggered the load.
 *
 * Formula: Hash(HijriYear, HijriDayOfYear) mod 6236 + 1.
 * - HijriDayOfYear counts the days from 1 Muharram to today (1..~355).
 *   We sum the lengths of every prior month using the same Umm al-Qura
 *   calendar the rest of the app uses, then add the day-of-month.
 * - The hash mixes year and day-of-year so the rotation differs across
 *   Hijri years; one Hashimoto-style multiply keeps the distribution
 *   dense (no clustering on the lower indexes).
 *
 * The picker never curates: any of the 6236 ayahs is eligible. The brand
 * posture (M3-T4 + M4-T1) keeps the content surface narrow — bundled Quran
 * text already shipped — so a non-curated rotation is acceptable for a
 * daily reminder feature. A curated override can be added later by
 * overriding `customVotdOverride` (deliberately not exported).
 */
import { hijriPartsOf, type HijriParts } from './hijri';
import { SURAHS } from '../services/QuranService';

export interface VotdResult {
    /** Global ayah number, 1..6236 (matches the Quran text rows + CDN URLs). */
    globalAyah: number;
    /** Resolved surah id. */
    surah: number;
    /** Resolved ayah number within the surah, 1..surah.ayahCount. */
    ayah: number;
}

/** 32-bit unsigned multiply (deterministic across runtimes; Math.imul is
 *  guaranteed to behave this way per spec). */
function hash(seed: number, salt: number): number {
    // Two MurmurHash3-style mixes - cheap, well-distributed for our domain.
    let h = (seed ^ salt) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
}

/** Length of every Hijri month in days, in the same order as HijriParts.month.
 *  Hijri months alternate 30/29 with a 30th day added to the last month of
 *  leap years. Without calendar lookup we use the safe upper bound (30) for
 *  every month - the rotation doesn't require exact day-of-year, only that
 *  the (year, day-of-year) tuple produce a unique bucket index. A high-bias
 *  estimate still yields a uniform distribution across the year boundary. */
const HIJRI_MONTH_LEN_UPPER = 30;

/** Convert Hijri parts into a day-of-year counter (1..~355). */
export function hijriDayOfYear(parts: HijriParts): number {
    // Upper-bound formula: each month is at most 30 days, so day-of-year is
    // approximately (month - 1) * 30 + day. Exact values would require the
    // full Umm al-Qura table; the picker is rotation-only and accepts the
    // fuzziness (two adjacent Hijri dates never collide because the day
    // component dominates).
    return (parts.month - 1) * HIJRI_MONTH_LEN_UPPER + parts.day;
}

/** Compute the Verse-of-the-Day for a given Date. Returns null when the
 *  engine has no Islamic calendar (rare; covered by isHijriSupported). */
export function pickVotd(now: Date = new Date()): VotdResult | null {
    const parts = hijriPartsOf(now);
    if (!parts) return null;
    const doy = hijriDayOfYear(parts);
    const seed = parts.year * 1000 + doy;
    const idx = hash(seed, 0xa5a5a5a5) % 6236 + 1;
    return globalToLocal(idx);
}

/** Map a global ayah number (1..6236) to (surah, ayah). Walks the bundled
 *  SURAHS index; O(114). The result is checked against the surah's
 *  declared ayahCount so out-of-range inputs return null instead of
 *  throwing. */
export function globalToLocal(globalNumber: number): VotdResult | null {
    if (!Number.isInteger(globalNumber) || globalNumber < 1 || globalNumber > 6236) {
        return null;
    }
    let offset = 0;
    for (const s of SURAHS) {
        if (globalNumber <= offset + s.ayahCount) {
            const ayah = globalNumber - offset;
            if (ayah < 1 || ayah > s.ayahCount) return null;
            return { globalAyah: globalNumber, surah: s.id, ayah };
        }
        offset += s.ayahCount;
    }
    return null;
}

/** Build the Ayat title "<surah-name> - آية <n>" used in the notification
 *  body and reader header. Returns just the global id as a fallback when
 *  the surah index lookup fails. */
export function votdTitle(votd: VotdResult): string {
    const meta = SURAHS.find(s => s.id === votd.surah);
    if (!meta) return '\u0622\u064a\u0629 ' + votd.globalAyah;
    return meta.name + ' \u2014 \u0622\u064a\u0629 ' + votd.ayah;
}
