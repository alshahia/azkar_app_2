/**
 * Tafsir registry (M3-T4).
 *
 * Currently only Muyassar is bundled (1/114 surahs are offline).
 * Adding a second tafsir (e.g. Ibn Kathir) is a content-only change:
 * drop the JSON under data/static/quran/tafsir/<tafsirId>/<surah>.json
 * and append an entry below.
 *
 * Each loader accepts a surahId and returns the [ayah1, ayah2, ...] array
 * so callers stay agnostic of the underlying transport. Today both
 * loaders are bundler-glob imports; a future on-demand loader might hit
 * alquran.cloud with an ephemeral IndexedDB cache.
 */
import { loadTafsir as loadMuyassar } from './QuranService';

export interface TafsirDescriptor {
    id: string;
    label: string;
    /** Display name in Arabic for the picker chip strip. */
    labelAr: string;
    shortName: string;
    language: 'ar';
    source: string;
    license: string;
    load(surahId: number): Promise<string[]>;
}

const REGISTRY: TafsirDescriptor[] = [
    {
        id: 'muyassar',
        label: 'Tafsir al-Muyassar',
        labelAr: 'التفسير الميسر',
        shortName: 'الميسر',
        language: 'ar',
        source: 'King Fahd Complex - ',
        license: 'Royal Court of Saudi Arabia (free redistribution)',
        load: async (surahId) => loadMuyassar(surahId),
    },
];

export function getTafsir(id: string): TafsirDescriptor | undefined {
    return REGISTRY.find((t) => t.id === id);
}

export function listTafsirs(): TafsirDescriptor[] {
    return REGISTRY.slice();
}

export const DEFAULT_TAFSIR_ID = 'muyassar';
