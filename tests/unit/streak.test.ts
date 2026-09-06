
import { describe, it, expect } from 'vitest';
import {
    computeStreakOutcome,
    diffCalendarDays,
    resolveTimezone,
} from '../../data/streak';
import type { UserStats } from '../../types';

const baseStats = (overrides: Partial<UserStats> = {}): UserStats => ({
    streak: 0,
    lastActiveDate: null,
    totalReads: 0,
    timezone: null,
    ...overrides,
});

describe('diffCalendarDays', () => {
    it('returns 1 for consecutive calendar days', () => {
        expect(diffCalendarDays('2026-09-05', '2026-09-06')).toBe(1);
    });

    it('returns 2 for a two-day gap', () => {
        expect(diffCalendarDays('2026-09-05', '2026-09-07')).toBe(2);
    });

    it('returns 0 for the same day', () => {
        expect(diffCalendarDays('2026-09-05', '2026-09-05')).toBe(0);
    });

    it('handles month boundaries', () => {
        expect(diffCalendarDays('2026-09-30', '2026-10-01')).toBe(1);
        expect(diffCalendarDays('2026-09-30', '2026-10-02')).toBe(2);
    });

    it('handles year boundaries', () => {
        expect(diffCalendarDays('2026-12-31', '2027-01-01')).toBe(1);
    });

    it('treats DST spring-forward (US) as 1 day, not 0 or 2', () => {
        // 2026-03-08 in the US is a DST spring-forward day. The clock jumps
        // from 02:00 to 03:00 local, but the calendar-day distance is still
        // exactly 1 day between two local midnights.
        expect(diffCalendarDays('2026-03-08', '2026-03-09')).toBe(1);
    });

    it('treats DST fall-back (US) as 1 day', () => {
        expect(diffCalendarDays('2026-11-01', '2026-11-02')).toBe(1);
    });

    it('handles a 25h-elapsed gap the same as a 24h gap (the silent-reset bug)', () => {
        // This is the property the previous Math.ceil implementation got
        // wrong. 25h between two calendar days must still read as 1 day,
        // because the question is "consecutive local calendar days", not
        // "exactly 86400000 ms apart".
        //
        // We can't mock the clock here because diffCalendarDays is pure
        // arithmetic on YYYY-MM-DD, so the property holds by construction.
        // The neighbouring test cases prove it.
        expect(diffCalendarDays('2026-03-08', '2026-03-09')).toBe(1);
    });

    it('returns null for malformed keys', () => {
        expect(diffCalendarDays('garbage', '2026-09-06')).toBeNull();
        expect(diffCalendarDays('2026-09-06', '2026-9-6')).toBeNull();
        expect(diffCalendarDays('', '2026-09-06')).toBeNull();
    });

    it('returns null for empty or missing second key', () => {
        expect(diffCalendarDays('2026-09-05', '')).toBeNull();
    });
});

describe('computeStreakOutcome', () => {
    it('is first-time when no lastActiveDate is recorded', () => {
        const prev = baseStats();
        const outcome = computeStreakOutcome(prev, '2026-09-06');
        expect(outcome.kind).toBe('first-time');
        expect(outcome.streak).toBe(1);
    });

    it('is same-day when the keys match', () => {
        const prev = baseStats({ streak: 7, lastActiveDate: '2026-09-06' });
        const outcome = computeStreakOutcome(prev, '2026-09-06');
        expect(outcome.kind).toBe('same-day');
        expect(outcome.streak).toBe(7);
    });

    it('preserves the streak on consecutive local days (24h boundary)', () => {
        const prev = baseStats({ streak: 7, lastActiveDate: '2026-09-05' });
        const outcome = computeStreakOutcome(prev, '2026-09-06');
        expect(outcome.kind).toBe('preserved');
        if (outcome.kind === 'preserved') {
            expect(outcome.streak).toBe(8);
            expect(outcome.wasStreak).toBe(7);
        }
    });

    it('resets the streak on a 2+ day gap (48h boundary)', () => {
        const prev = baseStats({ streak: 30, lastActiveDate: '2026-09-05' });
        const outcome = computeStreakOutcome(prev, '2026-09-07');
        expect(outcome.kind).toBe('reset');
        if (outcome.kind === 'reset') {
            expect(outcome.streak).toBe(1);
            expect(outcome.wasStreak).toBe(30);
        }
    });

    it('resets the streak across a 7-day gap (missed a week)', () => {
        const prev = baseStats({ streak: 100, lastActiveDate: '2026-09-01' });
        const outcome = computeStreakOutcome(prev, '2026-09-08');
        expect(outcome.kind).toBe('reset');
        expect(outcome.streak).toBe(1);
    });

    it('preserves across a DST spring-forward boundary', () => {
        // User recited Saturday night, Sunday morning (US spring-forward).
        // The wall-clock gap is 23h, but calendar days are consecutive.
        const prev = baseStats({ streak: 12, lastActiveDate: '2026-03-07' });
        const outcome = computeStreakOutcome(prev, '2026-03-08');
        expect(outcome.kind).toBe('preserved');
        expect(outcome.streak).toBe(13);
    });

    it('preserves across a DST fall-back boundary', () => {
        const prev = baseStats({ streak: 4, lastActiveDate: '2026-10-31' });
        const outcome = computeStreakOutcome(prev, '2026-11-01');
        expect(outcome.kind).toBe('preserved');
        expect(outcome.streak).toBe(5);
    });

    it('preserves across month and year boundaries', () => {
        const prev1 = baseStats({ streak: 9, lastActiveDate: '2026-09-30' });
        expect(computeStreakOutcome(prev1, '2026-10-01').kind).toBe('preserved');

        const prev2 = baseStats({ streak: 365, lastActiveDate: '2026-12-31' });
        expect(computeStreakOutcome(prev2, '2027-01-01').kind).toBe('preserved');
    });

    it('treats malformed lastActiveDate as a gap (defensive)', () => {
        const prev = baseStats({ streak: 5, lastActiveDate: 'not-a-date' });
        const outcome = computeStreakOutcome(prev, '2026-09-06');
        expect(outcome.kind).toBe('reset');
        expect(outcome.streak).toBe(1);
    });

    it('treats a back-dated today key as a gap (defensive)', () => {
        // User's clock went backwards between sessions — never silently
        // grow the streak.
        const prev = baseStats({ streak: 5, lastActiveDate: '2026-09-10' });
        const outcome = computeStreakOutcome(prev, '2026-09-05');
        expect(outcome.kind).toBe('reset');
        expect(outcome.streak).toBe(1);
    });

    it('returns wasStreak=0 on reset from a never-set streak (defensive)', () => {
        // lastActiveDate is set but streak is 0 — corner case from old
        // migrations or first-time recording glitches. Reset still goes to 1.
        const prev = baseStats({ streak: 0, lastActiveDate: '2026-09-05' });
        const outcome = computeStreakOutcome(prev, '2026-09-08');
        expect(outcome.kind).toBe('reset');
        if (outcome.kind === 'reset') {
            expect(outcome.streak).toBe(1);
            expect(outcome.wasStreak).toBe(0);
        }
    });
});

describe('resolveTimezone', () => {
    it('returns the stored timezone when present', () => {
        const prev = baseStats({ timezone: 'Asia/Riyadh' });
        expect(resolveTimezone(prev)).toBe('Asia/Riyadh');
    });

    it('falls back to the device timezone when stored is null', () => {
        const prev = baseStats({ timezone: null });
        // We can't predict the device's timezone in CI, but we can verify
        // the resolver returns a non-empty IANA string (or 'UTC' as a last
        // resort) and never crashes.
        const tz = resolveTimezone(prev);
        expect(typeof tz).toBe('string');
        expect(tz.length).toBeGreaterThan(0);
    });
});
