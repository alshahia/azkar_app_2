/**
 * Font readiness helpers for the Mushaf reader (M3-T6).
 *
 * The Uthmani Quran font is the only font that uses font-display:block so
 * the browser hides text until the file is loaded. To avoid an unresponsive
 * Mushaf we call document.fonts.load(...) up-front, which triggers the load
 * and resolves when the browser has both the font file and the OpenType face
 * ready to lay out.
 *
 * SurahReaderScreen and MushafPageScreen both gate the body on a single
 * shared promise returned by preloadUthmaniFonts(); the first call downloads,
 * the rest await the same promise. The helper is idempotent and tolerant of
 * environments without document.fonts (Node tests, SSR).
 */

export interface FontLoadStatus {
    /** True when both Uthmani + Colored faces are loaded (or were skipped
     *  because the API is unavailable). */
    ready: boolean;
    /** Family names that were requested. */
    families: string[];
    /** Error messages captured from document.fonts.load rejections. */
    errors: string[];
}

/** The exact family names used by the @font-face in index.css. Kept in one
 *  place so a rename propagates. */
export const UTHMANI_FONT_FAMILIES = [
    'Amiri Quran',
    'Amiri Quran Colored',
] as const;

/**
 * Preloads both Uthmani face names. Returns a single shared promise so
 * concurrent callers all wait on the same request. Subsequent callers
 * after resolution get the cached value instantly.
 */
let sharedPromise: Promise<FontLoadStatus> | null = null;

export function preloadUthmaniFonts(): Promise<FontLoadStatus> {
    if (sharedPromise) return sharedPromise;
    sharedPromise = (async (): Promise<FontLoadStatus> => {
        const families: string[] = [...UTHMANI_FONT_FAMILIES];
        // Server-side rendering, vitest with jsdom, or extremely old browsers
        // may not expose document.fonts. We cannot wait - resolve with
        // ready:true so the reader renders the best-available font chain
        // (Scheherazade / Amiri UI).
        if (typeof document === 'undefined' || !document.fonts) {
            return { ready: true, families, errors: [] };
        }
        const errors: string[] = [];
        const results = await Promise.allSettled([
            // request each face at a representative size; document.fonts.load
            // inspects the actual glyphs the browser would lay out and only
            // resolves once the face is fully decoded.
            document.fonts.load('1em "Amiri Quran"'),
            document.fonts.load('1em "Amiri Quran Colored"'),
        ]);
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            if (r.status === 'rejected') {
                const msg = r.reason && (r.reason as { message?: string }).message
                    ? (r.reason as { message?: string }).message
                    : String(r.reason);
                errors.push('font-load-' + families[i] + ': ' + msg);
            }
        }
        // Wait until the FontFaceSet finishes its bookkeeping. ready resolves
        // once every queued load (including the one document.fonts.load just
        // triggered) is settled, so a slow disk cache can't leak through.
        try {
            await document.fonts.ready;
        } catch {
            errors.push('document.fonts.ready rejected');
        }
        // Individual load() rejections are recorded for telemetry but do not
        // pin the gate on a spinner - the 800ms safety cap in each reader
        // ensures a corrupt font cache never locks the screen. Only a
        // document.fonts.ready rejection (which means the FontFaceSet is
        // structurally unavailable) is treated as hard failure.
        const hardFailure = errors.some((e) => e === 'document.fonts.ready rejected');
        return { ready: !hardFailure, families, errors };
    })();
    return sharedPromise;
}

/**
 * Test seam: clears the shared promise so each test gets a clean slate.
 * Production code never calls this.
 */
export function _resetFontReadyForTests(): void {
    sharedPromise = null;
}