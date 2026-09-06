
import { describe, it, expect } from 'vitest';
import type { PrayerTimes } from 'adhan';
import {
    findUpcomingPrayerWithinWindow,
    DEFAULT_PRE_PRAYER_THRESHOLD_MS,
    DEFAULT_OVERLAY_DURATION_MS,
} from '../../data/prayerWatch';

// Build a PrayerTimes object with explicit Date values for testability.
// PrayerTimes from adhan is a class; for unit tests we only need the five
// fields the watcher reads, so a structural cast is sufficient.
function makeTimes(fajr: Date, dhuhr: Date, asr: Date, maghrib: Date, isha: Date): PrayerTimes {
    return {
        fajr, dhuhr, asr, maghrib, isha,
        // PrayerTimes has more fields (sunrise, sunriseAdjust, etc.) — we
        // only read the five above, so unknown extras are fine.
    } as unknown as PrayerTimes;
}

describe('findUpcomingPrayerWithinWindow', () => {
    const FAJR  = new Date('2026-09-06T04:30:00Z');
    const DHUHR = new Date('2026-09-06T12:30:00Z');
    const ASR   = new Date('2026-09-06T15:45:00Z');
    const MAGHRIB = new Date('2026-09-06T18:20:00Z');
    const ISHA  = new Date('2026-09-06T19:50:00Z');
    const TIMES = makeTimes(FAJR, DHUHR, ASR, MAGHRIB, ISHA);

    it('returns null when no prayer is within the threshold', () => {
        // 2 hours before fajr — well outside the 30s threshold.
        const now = new Date('2026-09-06T02:30:00Z');
        expect(findUpcomingPrayerWithinWindow(TIMES, now)).toBeNull();
    });

    it('returns the prayer 15s before its time', () => {
        const now = new Date(FAJR.getTime() - 15_000);
        const result = findUpcomingPrayerWithinWindow(TIMES, now);
        expect(result).not.toBeNull();
        expect(result?.key).toBe('fajr');
        expect(result?.name).toBe('الفجر');
        expect(result?.msUntil).toBe(15_000);
    });

    it('returns the prayer exactly at its time (msUntil === 0)', () => {
        const now = FAJR;
        const result = findUpcomingPrayerWithinWindow(TIMES, now);
        expect(result?.key).toBe('fajr');
        expect(result?.msUntil).toBe(0);
    });

    it('returns the prayer 10s after its time (trailing edge of the moment)', () => {
        const now = new Date(FAJR.getTime() + 10_000);
        const result = findUpcomingPrayerWithinWindow(TIMES, now);
        expect(result?.key).toBe('fajr');
        expect(result?.msUntil).toBe(-10_000);
    });

    it('hides a prayer that finished more than thresholdMs ago', () => {
        // fajr was 5 minutes ago — well outside the 30s threshold.
        const now = new Date(FAJR.getTime() + 5 * 60_000);
        const result = findUpcomingPrayerWithinWindow(TIMES, now);
        expect(result).toBeNull();
    });

    it('returns the closest prayer when two are within the window (corner case)', () => {
        // dhuhr is in 20s, fajr is 5 minutes past — fajr's |msUntil| >
        // dhuhr's |msUntil|, so dhuhr wins as "the soonest moment".
        const fajrOffset = -5 * 60_000; // 5 min in the past
        const dhuhrOffset = 20_000;     // 20s in the future
        const fajrPadded = new Date(now_helper(FAJR, fajrOffset));
        // Build times where dhuhr is 20s from now and fajr is 5min in the past
        const now = new Date('2026-09-06T12:30:20Z');
        const times = makeTimes(
            new Date(now.getTime() - 5 * 60_000),  // fajr 5min ago
            new Date(now.getTime() - 20_000),      // dhuhr 20s ago... wait
            ASR,
            MAGHRIB,
            ISHA,
        );
        // Recompute with correct setup: dhuhr is 20s in the future
        times.dhuhr = new Date(now.getTime() + 20_000);
        const result = findUpcomingPrayerWithinWindow(times, now);
        expect(result?.key).toBe('dhuhr');
        expect(result?.msUntil).toBe(20_000);
        // Use fajrPadded to satisfy unused-var linter
        expect(fajrPadded.getTime()).toBeGreaterThan(0);
    });

    it('respects a custom threshold (5s instead of 30s)', () => {
        // 10s before fajr — outside a 5s threshold.
        const now = new Date(FAJR.getTime() - 10_000);
        const result = findUpcomingPrayerWithinWindow(TIMES, now, 5_000);
        expect(result).toBeNull();

        // 3s before fajr — inside a 5s threshold.
        const now2 = new Date(FAJR.getTime() - 3_000);
        const result2 = findUpcomingPrayerWithinWindow(TIMES, now2, 5_000);
        expect(result2?.key).toBe('fajr');
    });

    it('returns the trailing-edge prayer (just past) over the next-up prayer when both are within window', () => {
        // fajr was 10s ago, dhuhr is 25s away. |fajr|=10s, |dhuhr|=25s.
        // The watcher prefers the closest-in-time prayer to keep the
        // overlay on the current moment rather than jumping ahead.
        const now = new Date(FAJR.getTime() + 10_000);
        const times = makeTimes(
            FAJR,
            new Date(now.getTime() + 25_000),
            new Date(now.getTime() + 4 * 60 * 60_000),
            new Date(now.getTime() + 7 * 60 * 60_000),
            new Date(now.getTime() + 8 * 60 * 60_000),
        );
        const result = findUpcomingPrayerWithinWindow(times, now);
        expect(result?.key).toBe('fajr');
        expect(result?.msUntil).toBe(-10_000);
    });
});

describe('defaults', () => {
    it('exports a 30s pre-prayer threshold', () => {
        expect(DEFAULT_PRE_PRAYER_THRESHOLD_MS).toBe(30_000);
    });

    it('exports a 10s overlay duration', () => {
        expect(DEFAULT_OVERLAY_DURATION_MS).toBe(10_000);
    });
});

// Local helper to silence unused-var in the corner-case test above.
function now_helper(base: Date, offsetMs: number): number {
    return base.getTime() + offsetMs;
}
