/**
 * Tests for utils/scrollPreserve (M5-T8b).
 *
 * Locks the contract: snapshot the offset before a view switch, restore
 * it after the new view has laid out enough content. We test the
 * pure helper directly so we don't need a full MushafPageScreen render.
 */
import { describe, it, expect } from 'vitest';
import { createScrollSnapshot, tryRestoreScroll } from '../../utils/scrollPreserve';

function makeContainer(scrollHeight: number): HTMLDivElement {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollHeight', {
        configurable: true,
        get: () => scrollHeight,
    });
    let top = 0;
    Object.defineProperty(el, 'scrollTop', {
        configurable: true,
        get: () => top,
        set: (v: number) => { top = v; },
    });
    return el;
}

describe('createScrollSnapshot (M5-T8b)', () => {
    it('defaults to null', () => {
        const snap = createScrollSnapshot();
        expect(snap.snapshot).toBeNull();
    });

    it('accepts an initial value', () => {
        const snap = createScrollSnapshot(123);
        expect(snap.snapshot).toBe(123);
    });

    it('snapshot can be updated then consumed', () => {
        const snap = createScrollSnapshot();
        snap.snapshot = 200;
        expect(snap.snapshot).toBe(200);
        snap.consume();
        expect(snap.snapshot).toBeNull();
    });
});

describe('tryRestoreScroll (M5-T8b)', () => {
    it('is a no-op when snapshot is null', () => {
        const snap = createScrollSnapshot(null);
        const el = makeContainer(2000);
        expect(tryRestoreScroll(snap, el)).toBe(false);
        expect(el.scrollTop).toBe(0);
    });

    it('is a no-op when container is null', () => {
        const snap = createScrollSnapshot(500);
        expect(tryRestoreScroll(snap, null)).toBe(false);
        expect(snap.snapshot).toBe(500);
    });

    it('does NOT restore when scrollHeight has not yet reached the target', () => {
        // Pixel view is still loading, container reports a tiny
        // scrollHeight. We must not write scrollTop (it would clamp
        // to 0 and lose the real position once content finishes).
        const snap = createScrollSnapshot(500);
        const el = makeContainer(200);
        expect(tryRestoreScroll(snap, el)).toBe(false);
        expect(el.scrollTop).toBe(0);
        expect(snap.snapshot).toBe(500);
    });

    it('restores scrollTop and consumes the snapshot when content has laid out', () => {
        const snap = createScrollSnapshot(500);
        const el = makeContainer(2000);
        expect(tryRestoreScroll(snap, el)).toBe(true);
        expect(el.scrollTop).toBe(500);
        expect(snap.snapshot).toBeNull();
    });

    it('restores exactly when scrollHeight equals the target (boundary)', () => {
        // The check is <=, so scrollHeight === target still counts as
        // "not enough" — we want strictly larger to ensure there is
        // *some* content below the scroll point. This test pins that
        // behaviour.
        const snap = createScrollSnapshot(500);
        const el = makeContainer(500);
        expect(tryRestoreScroll(snap, el)).toBe(false);
        expect(el.scrollTop).toBe(0);
        // Bump by 1px and try again — now it should restore.
        Object.defineProperty(el, 'scrollHeight', {
            configurable: true,
            get: () => 501,
        });
        expect(tryRestoreScroll(snap, el)).toBe(true);
        expect(el.scrollTop).toBe(500);
    });
});
