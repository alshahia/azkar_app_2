import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    preloadUthmaniFonts,
    _resetFontReadyForTests,
    UTHMANI_FONT_FAMILIES,
} from '../../utils/fontReady';

/**
 * fontReady - shared Mushaf font gate (M3-T6).
 *
 * The production gate waits on document.fonts.load() + document.fonts.ready.
 * jsdom has no FontFaceSet by default, so the helper short-circuits to a
 * synthetic ready:true. To exercise the document-fonts code path we inject
 * a fake document.fonts onto jsdom's real document (which is the same
 * object that lives at globalThis.document).
 */

type FontsStub = { load: (text: string) => Promise<unknown[]>; ready: Promise<void> };
type DocLike = { fonts?: FontsStub } & Document;
const originalDocument = (globalThis as unknown as { document?: DocLike }).document;
const originalFonts = originalDocument && originalDocument.fonts;

afterEach(() => {
    if (originalDocument) {
        if (originalFonts === undefined) {
            delete (originalDocument as unknown as { fonts?: unknown }).fonts;
        } else {
            (originalDocument as unknown as { fonts: unknown }).fonts = originalFonts;
        }
        (globalThis as unknown as { document: DocLike }).document = originalDocument;
    } else {
        delete (globalThis as unknown as { document?: unknown }).document;
    }
});

function attachFakeFonts(fake: FontsStub): void {
    // Ensure `typeof document !== 'undefined'` and document.fonts is truthy
    // so the helper enters the load()/ready() branch instead of short-circuiting.
    if (!originalDocument) throw new Error('jsdom document is required');
    (originalDocument as unknown as { fonts: unknown }).fonts = fake;
    (globalThis as unknown as { document: DocLike }).document = originalDocument;
}

function detachFonts(): void {
    if (originalDocument) {
        if (originalFonts === undefined) {
            delete (originalDocument as unknown as { fonts?: unknown }).fonts;
        } else {
            (originalDocument as unknown as { fonts: unknown }).fonts = originalFonts;
        }
    }
    delete (globalThis as unknown as { document?: unknown }).document;
}

describe('fontReady - preloadUthmaniFonts', () => {
    beforeEach(() => {
        _resetFontReadyForTests();
        detachFonts();
    });

    it('UTHMANI_FONT_FAMILIES exposes exactly the two faces wired in index.css', () => {
        expect(UTHMANI_FONT_FAMILIES).toEqual(['Amiri Quran', 'Amiri Quran Colored']);
    });

    it('resolves ready when document.fonts is unavailable', async () => {
        const status = await preloadUthmaniFonts();
        expect(status.ready).toBe(true);
        expect(status.families).toEqual(['Amiri Quran', 'Amiri Quran Colored']);
        expect(status.errors).toEqual([]);
    });

    it('returns the same shared promise when called twice in parallel', async () => {
        _resetFontReadyForTests();
        const a = preloadUthmaniFonts();
        const b = preloadUthmaniFonts();
        expect(a).toBe(b);
        const [sa, sb] = await Promise.all([a, b]);
        expect(sa).toBe(sb);
    });

    it('absorbs load() rejections without flipping ready:false', async () => {
        _resetFontReadyForTests();
        const load = vi.fn().mockRejectedValue(new Error('synth-fail'));
        const ready = vi.fn().mockResolvedValue(undefined);
        attachFakeFonts({ load, ready: Promise.resolve() });
        const status = await preloadUthmaniFonts();
        expect(load).toHaveBeenCalledTimes(2);
        expect(status.errors.length).toBe(2);
        expect(status.ready).toBe(true);
    });

    it('captures document.fonts.ready rejection and flips ready:false', async () => {
        _resetFontReadyForTests();
        const load = vi.fn().mockResolvedValue([]);
        const ready = vi.fn().mockRejectedValue(new Error('synth-ready-fail'));
        attachFakeFonts({ load, ready: Promise.reject(new Error('synth-ready-fail')) });
        const status = await preloadUthmaniFonts();
        expect(status.errors).toContain('document.fonts.ready rejected');
        expect(status.ready).toBe(false);
    });

    it('resolves ready:true on a happy path', async () => {
        _resetFontReadyForTests();
        const load = vi.fn().mockResolvedValue([]);
        const ready = vi.fn().mockResolvedValue(undefined);
        attachFakeFonts({ load, ready: Promise.resolve() });
        const status = await preloadUthmaniFonts();
        expect(load).toHaveBeenCalledTimes(2);
        expect(load).toHaveBeenCalledWith('1em "Amiri Quran"');
        expect(load).toHaveBeenCalledWith('1em "Amiri Quran Colored"');
        expect(status.ready).toBe(true);
        expect(status.errors).toEqual([]);
    });

    it('_resetFontReadyForTests clears the shared cache', async () => {
        await preloadUthmaniFonts();
        _resetFontReadyForTests();
        const fresh = preloadUthmaniFonts();
        expect(typeof fresh.then).toBe('function');
        void fresh;
    });
});
