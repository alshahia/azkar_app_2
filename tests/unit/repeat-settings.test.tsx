import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
    RepeatSettingsProvider,
    useRepeatSettings,
    repeatHelpers,
    type RepeatRange,
} from '../../context/RepeatSettingsContext';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <RepeatSettingsProvider>{children}</RepeatSettingsProvider>
);

function fresh(): RepeatRange {
    return { from: { surah: 2, ayah: 1 }, to: { surah: 2, ayah: 5 } };
}

describe('RepeatSettingsContext', () => {
    it('starts with an inactive range and zero count', () => {
        const { result } = renderHook(() => useRepeatSettings(), { wrapper });
        expect(result.current.isActive).toBe(false);
        expect(result.current.range).toBeNull();
        expect(result.current.count).toBe(0);
        expect(result.current.delayMs).toBe(0);
    });

    it('becomes active when both range and count are set', () => {
        const { result } = renderHook(() => useRepeatSettings(), { wrapper });
        act(() => {
            result.current.setRange(fresh());
            result.current.setCount(3);
        });
        expect(result.current.isActive).toBe(true);
        expect(result.current.range).toEqual(fresh());
        expect(result.current.count).toBe(3);
    });

    it('isInRange honours the inclusive bounds', () => {
        const { result } = renderHook(() => useRepeatSettings(), { wrapper });
        act(() => {
            result.current.setRange({ from: { surah: 2, ayah: 10 }, to: { surah: 3, ayah: 5 } });
            result.current.setCount(1);
        });
        expect(result.current.isInRange(2, 10)).toBe(true);
        expect(result.current.isInRange(2, 286)).toBe(true);
        expect(result.current.isInRange(3, 1)).toBe(true);
        expect(result.current.isInRange(3, 5)).toBe(true);
        // outside bounds
        expect(result.current.isInRange(2, 9)).toBe(false);
        expect(result.current.isInRange(3, 6)).toBe(false);
        expect(result.current.isInRange(4, 1)).toBe(false);
    });

    it('rejects a backwards same-surah range', () => {
        const { result } = renderHook(() => useRepeatSettings(), { wrapper });
        const before = result.current.range;
        act(() => {
            result.current.setRange({ from: { surah: 2, ayah: 10 }, to: { surah: 2, ayah: 3 } });
        });
        expect(result.current.range).toBe(before);
        expect(result.current.isActive).toBe(false);
    });

    it('rejects out-of-bounds ayah numbers', () => {
        const { result } = renderHook(() => useRepeatSettings(), { wrapper });
        act(() => {
            result.current.setRange({ from: { surah: 0, ayah: 1 }, to: { surah: 1, ayah: 7 } });
        });
        expect(result.current.range).toBeNull();
    });

    it('setRange(null) clears it', () => {
        const { result } = renderHook(() => useRepeatSettings(), { wrapper });
        act(() => {
            result.current.setRange(fresh());
            result.current.setCount(2);
        });
        expect(result.current.isActive).toBe(true);
        act(() => result.current.setRange(null));
        expect(result.current.range).toBeNull();
        expect(result.current.isActive).toBe(false);
    });

    it('setCount normalises values: floor, -1 = infinite, drop non-finite', () => {
        const { result } = renderHook(() => useRepeatSettings(), { wrapper });
        act(() => result.current.setCount(2.7));
        expect(result.current.count).toBe(2);
        act(() => result.current.setCount(-1));
        expect(result.current.count).toBe(-1);
        act(() => result.current.setCount(0));
        expect(result.current.count).toBe(0);
        act(() => result.current.setCount(NaN));
        expect(result.current.count).toBe(0); // NaN normalised to 0
    });

    it('setDelayMs clamps to [0..10000] and floors', () => {
        const { result } = renderHook(() => useRepeatSettings(), { wrapper });
        act(() => result.current.setDelayMs(1500));
        expect(result.current.delayMs).toBe(1500);
        act(() => result.current.setDelayMs(99_999));
        expect(result.current.delayMs).toBe(10_000);
        act(() => result.current.setDelayMs(-50));
        expect(result.current.delayMs).toBe(0);
        act(() => result.current.setDelayMs(1500.5));
        expect(result.current.delayMs).toBe(1500);
    });

    it('clear() resets everything', () => {
        const { result } = renderHook(() => useRepeatSettings(), { wrapper });
        act(() => {
            result.current.setRange(fresh());
            result.current.setCount(5);
            result.current.setDelayMs(2000);
        });
        act(() => result.current.clear());
        expect(result.current.range).toBeNull();
        expect(result.current.count).toBe(0);
        expect(result.current.delayMs).toBe(0);
        expect(result.current.isActive).toBe(false);
    });

    it('throws a descriptive Error when used without a provider', () => {
        // The hook throws synchronously the moment it sees a missing
        // context, so a try/catch inside a render-hook child captures it
        // without React's uncaught-error machinery getting involved.
        let caught: unknown = null;
        function Probe() {
            try { useRepeatSettings(); } catch (e) { caught = e; }
            return null;
        }
        renderHook(() => Probe(), { wrapper: ({ children }) => <>{children}</> });
        expect(caught).toBeInstanceOf(Error);
        expect((caught as Error).message).toMatch(/RepeatSettingsProvider/);
    });

    it('helper: isFiniteRange flags valid inputs and rejects backwards', () => {
        expect(repeatHelpers.isFiniteRange({ from: { surah: 1, ayah: 1 }, to: { surah: 2, ayah: 5 } })).toBe(true);
        expect(repeatHelpers.isFiniteRange({ from: { surah: 2, ayah: 5 }, to: { surah: 2, ayah: 1 } })).toBe(false);
        expect(repeatHelpers.isFiniteRange({ from: { surah: -1, ayah: 1 }, to: { surah: 2, ayah: 5 } })).toBe(false);
        expect(repeatHelpers.isFiniteRange({ from: { surah: 1, ayah: 0 }, to: { surah: 2, ayah: 5 } })).toBe(false);
    });

    it('helper: rangesEqual returns true for null-vs-null and identical pairs', () => {
        expect(repeatHelpers.rangesEqual(null, null)).toBe(true);
        const a = fresh();
        const b: RepeatRange = { from: { surah: 2, ayah: 1 }, to: { surah: 2, ayah: 5 } };
        expect(repeatHelpers.rangesEqual(a, b)).toBe(true);
        expect(repeatHelpers.rangesEqual(a, null)).toBe(false);
    });
});