import { describe, it, expect } from 'vitest';
import {
    listTafsirs,
    getTafsir,
    DEFAULT_TAFSIR_ID,
} from '../../services/tafsirRegistry';

/**
 * tafsirRegistry - the single source of truth for which tafsirs are
 * bundled. Today only Muyassar is bundled; a future pass drops a new
 * descriptor here without touching the picker UI.
 */

describe('tafsirRegistry', () => {
    it('exposes the default tafsir id as muyassar today', () => {
        expect(DEFAULT_TAFSIR_ID).toBe('muyassar');
    });

    it('listTafsirs includes Muyassar with the correct labels', () => {
        const items = listTafsirs();
        expect(items.length).toBeGreaterThan(0);
        const muyassar = items.find((t) => t.id === 'muyassar');
        expect(muyassar).toBeTruthy();
        expect(muyassar!.labelAr).toBe('التفسير الميسر');
        expect(muyassar!.source).toContain('King Fahd');
    });

    it('getTafsir returns the descriptor by id', () => {
        const t = getTafsir('muyassar');
        expect(t).toBeDefined();
        expect(t!.language).toBe('ar');
    });

    it('getTafsir returns undefined for an unknown id', () => {
        expect(getTafsir('does-not-exist')).toBeUndefined();
    });

    it('every descriptor exposes a load() that is callable', () => {
        for (const t of listTafsirs()) {
            expect(typeof t.load).toBe('function');
            // Calling without a real surahId will throw via QuranService.
            // We just confirm the descriptor is structurally valid.
        }
    });

    it('listTafsirs returns a fresh array each call (no shared mutation)', () => {
        const a = listTafsirs();
        const b = listTafsirs();
        expect(a).not.toBe(b);
        expect(a).toEqual(b);
    });
});
