/**
 * On-this-day dataset (M4-T2).
 *
 * Curated Hijri-keyed entries for the "Today" digest card. Each entry is
 * tied to a (hijriMonth, hijriDay) pair and renders only when today's
 * Hijri date matches.
 *
 * Authenticity posture (per plan): every entry has a `source` field
 * pointing at a verified classical reference (hadith collection, sira,
 * etc.). The bundled dataset ships in stub mode (10 entries spanning
 * the year's major occasions); the full 366-entry calendar is a separate
 * curation effort. The script `scripts/validate-onthisday.mjs` enforces
 * the full-dataset contract (366 keys, no Sufi Urs / sectarian events,
 * every entry has a `source` field) and accepts the partial-stub file
 * when `stubMode: true`.
 */
import onthisdayData from './static/onthisday.json';

export type OnThisDayType = 'event' | 'birth' | 'death' | 'occasion';

export interface OnThisDayEntry {
    /** Stable identifier (kebab-case). */
    id: string;
    /** Hijri month, 1-12 (1 = Muharram). */
    hijriMonth: number;
    /** Hijri day of month, 1-30. */
    hijriDay: number;
    type: OnThisDayType;
    /** Arabic title, rendered as the card heading. */
    title: string;
    /** Arabic body (1-3 short sentences). Optional: a "title-only" entry
     *  is still useful for the digest card. */
    body?: string;
    /** Authenticated source for the entry. */
    source: string;
    /** Optional license string (defaults to internal-curated). */
    license?: string;
}

interface OnThisDayFile {
    schema: string;
    version: number;
    stubMode?: boolean;
    note?: string;
    entries: OnThisDayEntry[];
}

/** Module-scoped view of the imported JSON; consumers should not need
 *  the wrapper shape. */
const dataset: OnThisDayFile = onthisdayData as OnThisDayFile;

/** All entries, sorted by (month, day) for deterministic iteration. */
const sortedEntries: OnThisDayEntry[] = [...dataset.entries].sort((a, b) => {
    if (a.hijriMonth !== b.hijriMonth) return a.hijriMonth - b.hijriMonth;
    return a.hijriDay - b.hijriDay;
});

/** Look up entries for a Hijri (month, day). Returns 0..N entries
 *  (the dataset allows multiple events on the same day). */
export function getOnThisDay(month: number, day: number): OnThisDayEntry[] {
    if (!Number.isInteger(month) || month < 1 || month > 12) return [];
    if (!Number.isInteger(day) || day < 1 || day > 30) return [];
    return sortedEntries.filter(e => e.hijriMonth === month && e.hijriDay === day);
}

/** Returns true when the file is shipping in stub mode (i.e. the full
 *  366-entry calendar has not been curated yet). Useful for a one-line
 *  "قيد الإعداد" hint in the UI. */
export function isOnThisDayStub(): boolean {
    return dataset.stubMode === true;
}

/** Total number of entries shipped in the bundle. */
export function onThisDayEntryCount(): number {
    return dataset.entries.length;
}

/** Compact MM-DD key the cache + validation script use to enforce the
 *  366-entry contract when the file moves out of stub mode. */
export function onThisDayKey(entry: OnThisDayEntry): string {
    const m = String(entry.hijriMonth).padStart(2, '0');
    const d = String(entry.hijriDay).padStart(2, '0');
    return m + '-' + d;
}
