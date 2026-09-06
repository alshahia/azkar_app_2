
import type { PrayerTimes } from 'adhan';

export interface WatchedPrayer {
    /** Arabic name, e.g. "الفجر" */
    name: string;
    /** adhan key (fajr / dhuhr / asr / maghrib / isha) — keeps the contract
     *  with NotificationService.extra.prayer consistent. */
    key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
    /** Date object for the prayer time */
    time: Date;
    /** Milliseconds remaining until the prayer, always >= 0 while watched */
    msUntil: number;
}

/**
 * The overlay reveals when the prayer is within `thresholdMs` of "now".
 * Default 30s gives the user enough time to finish what they're reading
 * and orient, without feeling pre-emptive.
 */
export const DEFAULT_PRE_PRAYER_THRESHOLD_MS = 30_000;

/**
 * The overlay auto-dismisses after this many ms, even without a tap.
 * Matches the user's "~10s before each prayer" intent.
 */
export const DEFAULT_OVERLAY_DURATION_MS = 10_000;

interface PrayerEntry {
    name: string;
    key: WatchedPrayer['key'];
    time: Date;
}

/**
 * Pure: given today's prayer times and the current wall clock, return
 * the next prayer whose time falls within the threshold window. Returns
 * null if no prayer is in that window yet.
 *
 * The function does NOT advance to "tomorrow" — if all of today's
 * prayers are past, the caller should re-call with tomorrow's
 * PrayerTimes (which is how the watcher useEffect rotates).
 */
export function findUpcomingPrayerWithinWindow(
    today: PrayerTimes,
    now: Date,
    thresholdMs: number = DEFAULT_PRE_PRAYER_THRESHOLD_MS,
): WatchedPrayer | null {
    const entries: PrayerEntry[] = [
        { name: 'الفجر',  key: 'fajr',    time: today.fajr },
        { name: 'الظهر',  key: 'dhuhr',   time: today.dhuhr },
        { name: 'العصر',  key: 'asr',     time: today.asr },
        { name: 'المغرب', key: 'maghrib', time: today.maghrib },
        { name: 'العشاء', key: 'isha',    time: today.isha },
    ];

    const nowMs = now.getTime();

    // Find the soonest prayer that is still in the future OR is within
    // the threshold window (so a 10s-after-prayer call still reveals the
    // overlay for the trailing edge of the moment).
    let chosen: { entry: PrayerEntry; msUntil: number } | null = null;
    for (const entry of entries) {
        const msUntil = entry.time.getTime() - nowMs;
        // Skip prayers that have already passed the threshold window
        // (more than thresholdMs in the past).
        if (msUntil < -thresholdMs) continue;
        // Otherwise this is a candidate. We want the soonest one that
        // hasn't been dismissed — i.e. the smallest non-negative msUntil,
        // or the most recent past prayer within the trailing threshold.
        if (chosen === null) {
            chosen = { entry, msUntil };
            continue;
        }
        // Prefer the prayer that is closest to "now" — whether just
        // past or just ahead. The overlay is for "this moment", not
        // for the next prayer an hour away.
        if (Math.abs(msUntil) < Math.abs(chosen.msUntil)) {
            chosen = { entry, msUntil };
        }
    }

    if (!chosen) return null;

    // Only reveal if the prayer is within the forward threshold (the
    // overlay previews the upcoming prayer) OR has just happened
    // (trailing edge so the user sees the moment after athan sounds).
    if (chosen.msUntil > thresholdMs) return null;

    return {
        name: chosen.entry.name,
        key: chosen.entry.key,
        time: chosen.entry.time,
        msUntil: chosen.msUntil,
    };
}
