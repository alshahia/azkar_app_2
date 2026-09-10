/**
 * Scroll-position preservation helper (M5-T8b).
 *
 * When toggling between modern and pixel mushaf views the new view
 * mounts a fresh DOM tree at the top of the scroll container. To
 * preserve the user's reading position we snapshot `scrollTop` before
 * the switch and restore it once the new view has laid out enough
 * content to honor the offset.
 *
 * This is a pure helper (no React) so the contract is locked without
 * a full render: callers pass refs, the helper reads the snapshot,
 * checks the new scrollHeight, and (if safe) writes scrollTop.
 */

export interface ScrollSnapshot {
    /** Set this before triggering the view switch. */
    snapshot: number | null;
    /** Clear this once the snapshot is consumed. */
    consume: () => void;
}

export function createScrollSnapshot(initial: number | null = null): ScrollSnapshot {
    let value = initial;
    return {
        get snapshot() { return value; },
        set snapshot(v: number | null) { value = v; },
        consume() { value = null; },
    };
}

/**
 * Try to restore the snapshot onto the container.
 * Returns true if the restoration happened (caller may want to log).
 * Returns false when:
 *   - snapshot is null (nothing to restore),
 *   - container is missing,
 *   - scrollHeight is not yet large enough (content still painting).
 */
export function tryRestoreScroll(
    snapshot: ScrollSnapshot,
    container: HTMLElement | null,
): boolean {
    const target = snapshot.snapshot;
    if (target === null) return false;
    if (!container) return false;
    if (container.scrollHeight <= target) return false;
    container.scrollTop = target;
    snapshot.consume();
    return true;
}
