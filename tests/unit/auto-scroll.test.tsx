/**
 * Tests for hooks/useAutoScrollOnHighlight (M5-T8a).
 *
 * Strategy: build a fake container with a single child whose rect we
 * control. The hook reads `.current` inside the effect, so we wrap
 * the fixture in a `React.createRef()` and pass the ref object.
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderHook } from '@testing-library/react';
import { useAutoScrollOnHighlight } from '../../hooks/useAutoScrollOnHighlight';

/** Build a fake scroll container + child. The container is wrapped in
 *  a real React ref so the hook's effect sees a non-null `.current`. */
function makeFixture(opts: { visible: boolean; id?: string }): {
    containerRef: React.RefObject<HTMLDivElement | null>;
    target: HTMLElement;
    spy: ReturnType<typeof vi.fn>;
} {
    const container = document.createElement('div');
    Object.defineProperty(container, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
            top: 0, left: 0, right: 100, bottom: 600,
            width: 100, height: 600, x: 0, y: 0,
            toJSON: () => ({}),
        }),
    });

    const id = opts.id ?? 'ayah-1-2';
    const target = document.createElement('div');
    target.id = id;
    const top = opts.visible ? 200 : 1200;
    Object.defineProperty(target, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
            top, left: 0, right: 100, bottom: top + 40,
            width: 100, height: 40, x: 0, y: top,
            toJSON: () => ({}),
        }),
    });
    const spy = vi.fn();
    target.scrollIntoView = spy;
    container.appendChild(target);

    const containerRef = React.createRef<HTMLDivElement>();
    (containerRef as { current: HTMLDivElement | null }).current = container;
    return { containerRef, target, spy };
}

interface HarnessProps { elementId: string; containerRef: React.RefObject<HTMLDivElement | null>; key: unknown; margin?: number; }
function useHarness(opts: HarnessProps) {
    useAutoScrollOnHighlight(opts);
    return null;
}

describe('useAutoScrollOnHighlight (M5-T8a)', () => {
    it('does NOT scroll on the first mount (key ref is undefined)', () => {
        const { containerRef, spy } = makeFixture({ visible: false });
        renderHook(() => useHarness({ elementId: 'ayah-1-2', containerRef, key: 2 }));
        expect(spy).not.toHaveBeenCalled();
    });

    it('scrolls when the key changes and the element is offscreen', () => {
        const { containerRef, spy } = makeFixture({ visible: false });
        const { rerender } = renderHook(
            ({ key }) => useHarness({ elementId: 'ayah-1-2', containerRef, key }),
            { initialProps: { key: 2 } },
        );
        expect(spy).not.toHaveBeenCalled();
        rerender({ key: 3 });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    });

    it('does NOT scroll when the element is already visible', () => {
        const { containerRef, spy } = makeFixture({ visible: true });
        const { rerender } = renderHook(
            ({ key }) => useHarness({ elementId: 'ayah-1-2', containerRef, key }),
            { initialProps: { key: 2 } },
        );
        rerender({ key: 3 });
        expect(spy).not.toHaveBeenCalled();
    });

    it('does NOT scroll when the key did not change', () => {
        const { containerRef, spy } = makeFixture({ visible: false });
        const { rerender } = renderHook(
            ({ key }) => useHarness({ elementId: 'ayah-1-2', containerRef, key }),
            { initialProps: { key: 2 } },
        );
        rerender({ key: 2 });
        expect(spy).not.toHaveBeenCalled();
    });

    it('silently no-ops when the element does not exist in the container', () => {
        const container = document.createElement('div');
        Object.defineProperty(container, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                top: 0, left: 0, right: 100, bottom: 600,
                width: 100, height: 600, x: 0, y: 0,
                toJSON: () => ({}),
            }),
        });
        const containerRef = React.createRef<HTMLDivElement>();
        (containerRef as { current: HTMLDivElement | null }).current = container;
        const { rerender } = renderHook(
            ({ key }) => useHarness({ elementId: 'missing', containerRef, key }),
            { initialProps: { key: 1 } },
        );
        expect(() => rerender({ key: 2 })).not.toThrow();
    });

    it('silently no-ops when the elementId is empty (no playback ayah yet)', () => {
        const { containerRef } = makeFixture({ visible: false });
        const { rerender } = renderHook(
            ({ key }) => useHarness({ elementId: '', containerRef, key }),
            { initialProps: { key: 1 } },
        );
        expect(() => rerender({ key: 2 })).not.toThrow();
    });

    it('silently no-ops when the container ref has no current element', () => {
        const containerRef = React.createRef<HTMLDivElement>();
        const { rerender } = renderHook(
            ({ key }) => useHarness({ elementId: 'ayah-1-2', containerRef, key }),
            { initialProps: { key: 1 } },
        );
        expect(() => rerender({ key: 2 })).not.toThrow();
    });

    it('honors a custom visibility margin', () => {
        // Element top sits just below the container bottom (615 > 600).
        // A small margin (10) treats the element as offscreen and
        // scrolls; a larger margin (80) treats it as still visible.
        const container = document.createElement('div');
        Object.defineProperty(container, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                top: 0, left: 0, right: 100, bottom: 600,
                width: 100, height: 600, x: 0, y: 0,
                toJSON: () => ({}),
            }),
        });
        const target = document.createElement('div');
        target.id = 'ayah-1-3';
        Object.defineProperty(target, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({
                top: 615, left: 0, right: 100, bottom: 655,
                width: 100, height: 40, x: 0, y: 615,
                toJSON: () => ({}),
            }),
        });
        const spy = vi.fn();
        target.scrollIntoView = spy;
        container.appendChild(target);
        const containerRef = React.createRef<HTMLDivElement>();
        (containerRef as { current: HTMLDivElement | null }).current = container;

        const { rerender } = renderHook(
            ({ key, margin }) => useHarness({ elementId: 'ayah-1-3', containerRef, key, margin }),
            { initialProps: { key: 1, margin: 10 } },
        );
        rerender({ key: 2, margin: 10 });
        expect(spy).toHaveBeenCalledTimes(1);
        vi.clearAllMocks();

        rerender({ key: 3, margin: 80 });
        expect(spy).not.toHaveBeenCalled();
    });
});
