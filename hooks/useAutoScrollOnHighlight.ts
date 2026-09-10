import { useEffect, useRef } from 'react';

/**
 * useAutoScrollOnHighlight (M5-T8a).
 *
 * Smoothly scrolls the target ayah element into view whenever the
 * `key` changes — but ONLY if the element is not already visible in
 * the scroll container. This is the difference between "follow along"
 * (you scroll, we re-centre you) and "fight the user" (we re-centre
 * you even when you manually scrolled to compare two ayahs).
 *
 * Implementation notes:
 *   - We read the target's position with `getBoundingClientRect`
 *     against the *container's* rect, not the viewport's. The Quran
 *     reader scrolls inside an inner panel with a sticky header, so
 *     viewport visibility is misleading.
 *   - `behavior: 'smooth'` matches the existing scroll call in
 *     SurahReaderScreen; 'center' keeps the ayah visible above the
 *     bottom nav / mini-player while leaving the sticky header in
 *     view.
 *   - The hook is a pure side-effect: it never sets state, so it
 *     doesn't fall under react-hooks v7 set-state-in-effect.
 *   - When the element is missing (not yet rendered / out of range)
 *     we silently no-op; the caller can re-trigger the effect with
 *     a different key once the ayah list finishes loading.
 */
export interface AutoScrollOptions {
    /** Element id selector WITHOUT the leading '#'. */
    elementId: string;
    /** Scroll container; passed in as a ref so the hook can read
     *  `.current` inside the effect (refs must not be dereferenced
     *  during render — eslint react-hooks/refs). */
    containerRef: React.RefObject<HTMLElement | null>;
    /** Re-run on every change of this value. Typically the playing
     *  ayah number, or the playback seq + ayah tuple. */
    key: unknown;
    /** Visibility margin in px. If any edge of the element sits
     *  within this distance of the container's edge, we consider it
     *  visible and skip the scroll. Default 80. */
    margin?: number;
}

export function useAutoScrollOnHighlight({ elementId, containerRef, key, margin = 80 }: AutoScrollOptions): void {
    const lastKeyRef = useRef<unknown>(undefined);

    useEffect(() => {
        // Skip the very first run — the reader mounts with the playback
        // ayah already set, and the user hasn't interacted yet. We
        // don't want to yank them down on every screen open.
        if (lastKeyRef.current === undefined) {
            lastKeyRef.current = key;
            return;
        }
        if (lastKeyRef.current === key) return;
        lastKeyRef.current = key;

        const container = containerRef.current;
        if (!container) return;
        if (!elementId) return;
        const el = container.querySelector<HTMLElement>('#' + CSS.escape(elementId));
        if (!el) return;

        const elRect = el.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();
        const topIn = elRect.top >= cRect.top - margin && elRect.top <= cRect.bottom + margin;
        // Element is visible if its top edge sits within the container's
        // visible band (margin-fudged). Most long ayahs are taller than
        // the container; checking both edges would over-trigger. We only
        // check the top edge so a manually-scrolled ayah (top off-screen)
        // stays where the user put it.
        const visible = topIn;
        if (visible) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [elementId, containerRef, key, margin]);
}
