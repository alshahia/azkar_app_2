
import type { UserStats } from '../types';

/**
 * The shape returned by `incrementStreak` so the calling screen can
 * surface the correct UX (toast for preserved, banner for reset).
 *
 * - `same-day`: the user already counted today; nothing to show.
 * - `preserved`: recited on the immediately preceding calendar day in
 *   the user's timezone; streak grows by one.
 * - `reset`: missed at least one full calendar day; streak restarts at 1
 *   (was `wasStreak` > 0 before this call).
 * - `first-time`: never recorded a lastActiveDate; streak starts at 1.
 */
export type StreakOutcome =
  | { kind: 'same-day'; streak: number }
  | { kind: 'first-time'; streak: 1 }
  | { kind: 'preserved'; streak: number; wasStreak: number }
  | { kind: 'reset'; streak: 1; wasStreak: number };

/**
 * Resolve the IANA timezone the streak should be measured in.
 *
 * Preference order:
 * 1. The timezone stored at the time of the previous increment — this
 *    protects a user who travels across the date line or relocates
 *    mid-streak from having a calendar-day gap misread as a gap.
 * 2. The device's current timezone (`Intl.DateTimeFormat`), used both
 *    for first-time users and as a fallback.
 */
export function resolveTimezone(prev: Pick<UserStats, 'timezone'>): string {
  if (prev.timezone) return prev.timezone;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Parse a YYYY-MM-DD key as a calendar date (year, month, day).
 *
 * Returns null if the key is malformed. Callers should treat that as
 * "gap" (i.e. reset to 1) so we never silently grow the streak on
 * garbage input.
 */
function parseKey(key: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const [, y, m, d] = match;
  return { y: Number(y), m: Number(m), d: Number(d) };
}

/**
 * Calendar-day difference between two YYYY-MM-DD keys.
 *
 * The keys are produced by `getLocalDateKey()` in the user's timezone,
 * so they already represent local calendar days. Two adjacent
 * local-calendar days always yield exactly 1, regardless of timezone
 * offset, DST transitions, or travel. This is the property that fixes
 * the silent-reset bug: the previous code parsed the keys as UTC
 * midnights and compared with `Math.ceil`, which misclassified 25h
 * spring-forward gaps as missed days.
 *
 * Examples (all yield diffDays=1):
 *   2026-09-05 → 2026-09-06   (consecutive local days)
 *   2026-03-08 → 2026-03-09   (across a US spring-forward DST jump)
 *   2026-10-31 → 2026-11-01   (across a fall-back DST jump)
 *
 * Returns null if either key is malformed; the caller then treats the
 * transition as a gap.
 */
export function diffCalendarDays(prevKey: string, todayKey: string): number | null {
  const a = parseKey(prevKey);
  const b = parseKey(todayKey);
  if (!a || !b) return null;
  // Date.UTC treats (y, m-1, d) as a calendar date and returns the ms
  // count for the equivalent UTC midnight — this is purely for
  // arithmetic and never displayed as a wall-clock time.
  const prev = Date.UTC(a.y, a.m - 1, a.d);
  const today = Date.UTC(b.y, b.m - 1, b.d);
  return Math.round((today - prev) / 86_400_000);
}

/**
 * Pure streak logic. The caller provides the current `UserStats` and
 * a `todayKey` produced by `getLocalDateKey()` in the user's timezone.
 *
 * This function is the source of truth for "did the user preserve
 * their streak?" — it does **not** mutate state and does **not** read
 * the clock. Tests inject specific date keys to exercise the
 * 24h / 48h / DST boundaries without mocking `Date`.
 */
export function computeStreakOutcome(
  prev: UserStats,
  todayKey: string,
): StreakOutcome {
  // Same calendar day → no change, no UX.
  if (prev.lastActiveDate === todayKey) {
    return { kind: 'same-day', streak: prev.streak };
  }

  // First time ever recorded → streak begins.
  if (!prev.lastActiveDate) {
    return { kind: 'first-time', streak: 1 };
  }

  const diffDays = diffCalendarDays(prev.lastActiveDate, todayKey);

  // Malformed keys are treated as a gap so we never silently grow the
  // streak on garbage input.
  if (diffDays === null) {
    return { kind: 'reset', streak: 1, wasStreak: prev.streak };
  }

  if (diffDays === 1) {
    return { kind: 'preserved', streak: prev.streak + 1, wasStreak: prev.streak };
  }

  // diffDays === 0 (shouldn't happen — same-day check above caught it
  // but defensive), diffDays >= 2 (gap), or diffDays < 0 (clock went
  // backwards) — all reset.
  return { kind: 'reset', streak: 1, wasStreak: prev.streak };
}
