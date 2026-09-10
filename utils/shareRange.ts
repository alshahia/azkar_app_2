/**
 * Range-aware copy + share helpers for Quran verse groups.
 *
 * The single-ayah case is handled by utils/share's copyText/shareText;
 * these helpers expand the same surface for the multi-ayah range that the
 * VerseActionModalContainer can request. Today the modal exposes only a
 * single-ayah "copy range" placeholder (the inline row stays primary for
 * verse-level shortcuts); the range path is wired here so a future pass
 * can compose both without touching the modal API.
 */
import { copyText, shareText } from './share';

export interface VerseRangeItem {
    surah: number;
    ayah: number;
    text: string;
}

/** Formats a range of verses with a header (سورة X - الآيات Y..Z). */
export function formatRange(items: VerseRangeItem[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0].text;
    const first = items[0];
    const last = items[items.length - 1];
    if (first.surah !== last.surah) {
        // Cross-surah range: rare in this codebase; emit each verse on
        // its own line.
        return items.map((it) => '(' + it.surah + ':' + it.ayah + ') ' + it.text).join('\n');
    }
    return 'سورة ' + first.surah + ' - الآيات ' + first.ayah + '..' + last.ayah + '\n\n'
        + items.map((it) => it.text).join(' ');
}

/** Copies a range (or a single verse) to the clipboard. */
export async function copyMultiple(items: VerseRangeItem[]): Promise<boolean> {
    return copyText(formatRange(items));
}

/** Invokes the system share sheet with a range. */
export async function shareMultiple(items: VerseRangeItem[]): Promise<void> {
    return shareText('القرآن الكريم', formatRange(items));
}
