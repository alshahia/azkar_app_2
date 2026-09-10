/**
 * Repeat settings for the Quran recitation loop (M3-T2).
 *
 * Modelled after frontend-next's RepeatSettings: a { from, to, count, delayMs }
 * range that the AudioMiniPlayer consults when a single ayah finishes
 * playing. The context is intentionally tiny so the underlying audioQueue
 * still owns playback intent; this module only holds the parameters.
 *
 * Rules of thumb:
 *  - count <= 0 disables looping (default).
 *  - count === -1 means "infinite" and is normalised to a sentinel so the
 *    player never overflows a counter.
 *  - The range bounds are inclusive on both ends (arabic convention).
 *  - From-ayah > To-ayah in the same surah is treated as a single-ayah
 *    range and is silently rejected by setRange (the sheet prevents it
 *    before it gets here, but we guard again).
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type RepeatRangeSurahAyah = { surah: number; ayah: number };

export interface RepeatRange {
    from: RepeatRangeSurahAyah;
    to: RepeatRangeSurahAyah;
}

export interface RepeatSettingsState {
    range: RepeatRange | null;
    /** Total loop count for each ayah in the range. -1 = infinite. */
    count: number;
    /** Inter-ayah silence in milliseconds between repeats. 0..10000. */
    delayMs: number;
}

export interface RepeatSettingsApi extends RepeatSettingsState {
    /** True when the loop is active (range set + count > 0). */
    isActive: boolean;
    /** Inclusive test: is (surah, ayah) inside the active range? */
    isInRange(surah: number, ayah: number): boolean;
    setRange(range: RepeatRange | null): void;
    setCount(n: number): void;
    setDelayMs(ms: number): void;
    /** Resets everything to defaults. */
    clear(): void;
}

const DEFAULT_DELAY_MS = 0;
const MIN_DELAY_MS = 0;
const MAX_DELAY_MS = 10_000;

function clamp(n: number, lo: number, hi: number): number {
    return Math.min(hi, Math.max(lo, n));
}

function normalizedCount(n: number): number {
    if (!Number.isFinite(n)) return 0;
    if (n <= 0) return n === -1 ? -1 : 0;
    return Math.floor(n);
}

function rangesEqual(a: RepeatRange | null, b: RepeatRange | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return (
        a.from.surah === b.from.surah &&
        a.from.ayah === b.from.ayah &&
        a.to.surah === b.to.surah &&
        a.to.ayah === b.to.ayah
    );
}

function isFiniteRange(r: RepeatRange): boolean {
    if (r.from.surah < 1 || r.to.surah < 1) return false;
    if (r.from.ayah < 1 || r.to.ayah < 1) return false;
    if (r.from.surah !== r.to.surah) return r.from.surah < r.to.surah;
    return r.from.ayah <= r.to.ayah;
}

const RepeatSettingsContext = createContext<RepeatSettingsApi | null>(null);

export const RepeatSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [range, setRangeState] = useState<RepeatRange | null>(null);
    const [count, setCountState] = useState<number>(0);
    const [delayMs, setDelayMsState] = useState<number>(DEFAULT_DELAY_MS);

    const setRange = useCallback((next: RepeatRange | null) => {
        if (!next) {
            setRangeState(null);
            return;
        }
        if (!isFiniteRange(next)) {
            // Out-of-bounds or backwards (in the same surah). Drop silently;
            // the picker UI is responsible for showing the validation error.
            return;
        }
        setRangeState(prev => rangesEqual(prev, next) ? prev : next);
    }, []);

    const setCount = useCallback((n: number) => {
        setCountState(prev => {
            const norm = normalizedCount(n);
            return prev === norm ? prev : norm;
        });
    }, []);

    const setDelayMs = useCallback((ms: number) => {
        setDelayMsState(prev => {
            const clamped = clamp(Math.floor(ms), MIN_DELAY_MS, MAX_DELAY_MS);
            return prev === clamped ? prev : clamped;
        });
    }, []);

    const clear = useCallback(() => {
        setRangeState(prev => prev === null ? prev : null);
        setCountState(0);
        setDelayMsState(DEFAULT_DELAY_MS);
    }, []);

    const isInRange = useCallback(
        (surah: number, ayah: number) => {
            if (!range) return false;
            const { from, to } = range;
            const key = (s: number, a: number) => s * 100_000 + a;
            return key(surah, ayah) >= key(from.surah, from.ayah) && key(surah, ayah) <= key(to.surah, to.ayah);
        },
        [range],
    );

    const isActive = range !== null && count !== 0;

    const api = useMemo<RepeatSettingsApi>(
        () => ({ range, count, delayMs, isActive, isInRange, setRange, setCount, setDelayMs, clear }),
        [range, count, delayMs, isActive, isInRange, setRange, setCount, setDelayMs, clear],
    );

    return <RepeatSettingsContext.Provider value={api}>{children}</RepeatSettingsContext.Provider>;
};

export function useRepeatSettings(): RepeatSettingsApi {
    const ctx = useContext(RepeatSettingsContext);
    if (!ctx) throw new Error('useRepeatSettings must be used within RepeatSettingsProvider');
    return ctx;
}

/** Convenience: pure helpers exposed for tests + the picker UI. */
export const repeatHelpers = {
    isFiniteRange,
    clamp,
    rangesEqual,
    normalizedCount,
};
