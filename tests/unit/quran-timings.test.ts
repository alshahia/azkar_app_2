import { describe, it, expect, beforeEach } from 'vitest';
import {
    getCurrentAyah,
    getAyahStartMs,
    seekMsForAyah,
    buildTimingsBundle,
    _resetTimingsForTests,
    type TimingRow,
    type QuranTimingsFile,
} from '../../services/quranTimings';

/**
 * quranTimings - per-reciter ayah timings resolver (M3-T3).
 *
 * Vitest can't read the vite-glob URLs, so we test the pure helpers
 * (getCurrentAyah, getAyahStartMs, seekMsForAyah, buildTimingsBundle)
 * against synthetic bundles. The fetch path is covered indirectly:
 * when the loader cache returns null (no bundle) the AudioMiniPlayer
 * already falls back to audioQueue.playback.ayahNumber.
 */

function makeBundle(rows: TimingRow[]): QuranTimingsFile {
    return buildTimingsBundle('test.reciter', rows, { source: 'synth', license: 'public-domain' });
}

describe('quranTimings - getCurrentAyah binary search', () => {
    beforeEach(() => {
        _resetTimingsForTests();
    });

    it('returns null for an empty bundle', () => {
        const bundle = makeBundle([]);
        expect(getCurrentAyah(bundle, 0)).toBeNull();
        expect(getCurrentAyah(bundle, 1000)).toBeNull();
    });

    it('returns the matching ayah at the start of its range', () => {
        const bundle = makeBundle([
            { surah: 1, ayah: 1, startMs: 0,    endMs: 1000 },
            { surah: 1, ayah: 2, startMs: 1000, endMs: 2200 },
            { surah: 1, ayah: 3, startMs: 2200, endMs: 3500 },
        ]);
        expect(getCurrentAyah(bundle, 0)).toEqual({ surah: 1, ayah: 1 });
        expect(getCurrentAyah(bundle, 999)).toEqual({ surah: 1, ayah: 1 });
        expect(getCurrentAyah(bundle, 1000)).toEqual({ surah: 1, ayah: 2 });
        expect(getCurrentAyah(bundle, 2200)).toEqual({ surah: 1, ayah: 3 });
    });

    it('clamps to the last ayah for positions near the end', () => {
        const bundle = makeBundle([
            { surah: 1, ayah: 1, startMs: 0,    endMs: 1000 },
            { surah: 1, ayah: 2, startMs: 1000, endMs: 2000 },
        ]);
        // 30s past the last ayah - within the trailing grace window.
        expect(getCurrentAyah(bundle, 30_000)).toEqual({ surah: 1, ayah: 2 });
        // Two minutes past the last ayah - past the grace window, returns null.
        expect(getCurrentAyah(bundle, 200_000)).toBeNull();
    });

    it('treats endMs:-1 as open-ended', () => {
        const bundle = makeBundle([
            { surah: 1, ayah: 1, startMs: 0,    endMs: -1 },
        ]);
        expect(getCurrentAyah(bundle, 0)).toEqual({ surah: 1, ayah: 1 });
        expect(getCurrentAyah(bundle, 999_999)).toEqual({ surah: 1, ayah: 1 });
    });

    it('handles hundreds of rows efficiently (linear sanity check)', () => {
        const rows: TimingRow[] = [];
        for (let i = 1; i <= 200; i++) {
            rows.push({ surah: 1, ayah: i, startMs: (i - 1) * 1000, endMs: i * 1000 });
        }
        const bundle = makeBundle(rows);
        expect(getCurrentAyah(bundle, 0)).toEqual({ surah: 1, ayah: 1 });
        expect(getCurrentAyah(bundle, 51_500)).toEqual({ surah: 1, ayah: 52 });
        expect(getCurrentAyah(bundle, 199_500)).toEqual({ surah: 1, ayah: 200 });
    });
});

describe('quranTimings - getAyahStartMs / seekMsForAyah', () => {
    it('returns the recorded startMs for a known ayah', () => {
        const bundle = makeBundle([
            { surah: 2, ayah: 1, startMs: 1200, endMs: 4500 },
            { surah: 2, ayah: 2, startMs: 4500, endMs: 8000 },
        ]);
        expect(getAyahStartMs(bundle, 2, 1)).toBe(1200);
        expect(getAyahStartMs(bundle, 2, 2)).toBe(4500);
    });

    it('returns -1 for an ayah absent from the bundle', () => {
        const bundle = makeBundle([
            { surah: 2, ayah: 1, startMs: 1200, endMs: 4500 },
        ]);
        expect(getAyahStartMs(bundle, 2, 99)).toBe(-1);
        expect(getAyahStartMs(bundle, 99, 1)).toBe(-1);
    });

    it('seekMsForAyah is the same as getAyahStartMs', () => {
        const bundle = makeBundle([
            { surah: 1, ayah: 1, startMs: 0, endMs: 1000 },
            { surah: 1, ayah: 2, startMs: 1000, endMs: 2000 },
        ]);
        expect(seekMsForAyah(bundle, 1, 2)).toBe(getAyahStartMs(bundle, 1, 2));
    });
});

describe('quranTimings - buildTimingsBundle', () => {
    it('echoes inputs and supports the license/source meta', () => {
        const bundle = buildTimingsBundle('synth', [
            { surah: 1, ayah: 1, startMs: 0, endMs: 1000 },
        ], { source: 'quranicaudio', license: 'CC-BY 4.0' });
        expect(bundle.reciterId).toBe('synth');
        expect(bundle.source).toBe('quranicaudio');
        expect(bundle.license).toBe('CC-BY 4.0');
        expect(bundle.ayahs.length).toBe(1);
    });

    it('defaults placeholder to undefined', () => {
        const bundle = buildTimingsBundle('synth', []);
        expect(bundle.placeholder).toBeUndefined();
    });
});