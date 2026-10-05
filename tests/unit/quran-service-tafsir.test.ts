import { describe, it, expect } from 'vitest';
import { loadTafsir } from '../../services/QuranService';

/**
 * Regression guard for a silent Vite/JSON-import bug:
 *
 *   import.meta.glob('../path/*.json') returns a loader whose resolved
 *   value is the *module namespace* (`{ default: ... }`), not the bare
 *   JSON value. Without `import: 'default'`, the consumer has to do
 *   `.default` to reach the array — otherwise `arr[ayahNumber - 1]`
 *   silently returns `undefined` and TafsirSheet shows its
 *   "لا يوجد تفسير لهذه الآية." empty-state copy even when the data
 *   is on disk and perfectly aligned.
 *
 * The text path (`loadSurah`) was never affected because the text
 * files are wrapped as `{ s, a }` and the consumer reads `mod.a`.
 * The tafsir path was affected because the files are bare arrays.
 *
 * If a future refactor drops `import: 'default'` from the tafsir
 * glob (or someone mirrors the same pattern elsewhere), this test
 * catches it before the UI does.
 */
describe('QuranService.loadTafsir (regression: Vite JSON default-import)', () => {
    it('returns a real string array for a Fatiha-style surah', async () => {
        const arr = await loadTafsir(1);
        expect(Array.isArray(arr)).toBe(true);
        expect((arr as unknown as { default?: unknown }).default).toBeUndefined();
        expect(arr.length).toBe(7);
        for (const entry of arr) {
            expect(typeof entry).toBe('string');
            expect(entry.length).toBeGreaterThan(0);
        }
    });

    it('returns an array index-aligned to ayahs (1-indexed ayah N lives at arr[N-1])', async () => {
        const arr = await loadTafsir(112); // Al-Ikhlas: 4 ayahs, very short, easy to eyeball.
        expect(arr.length).toBe(4);
        // Al-Ikhlas ayah 1 opens with "قل -أيها الرسول-" in the bundled Muyassar text.
        expect(arr[0]).toMatch(/قل/);
        // Ayah 4 mentions "لم يكن له مماثلا" — verifies a non-first index actually resolves.
        expect(arr[3]).toMatch(/مماثلا/);
    });

    it('does not leak the module namespace wrapper for any surah', async () => {
        for (const surahId of [1, 2, 36, 55, 67, 112, 114]) {
            const arr = await loadTafsir(surahId);
            expect(Array.isArray(arr), `surah ${surahId} should be an array`).toBe(true);
            const wrapper = arr as unknown as { default?: unknown };
            expect(wrapper.default, `surah ${surahId} should not expose .default`).toBeUndefined();
        }
    });
});
