import React from 'react';
import { getSurah } from '../../services/QuranService';

/**
 * Page footer for Mushaf page mode. Mirrors the printed Mushaf's bottom margin:
 *   [surah ending on this page]  |  page number  |  [surah starting on this page]
 *
 * In Arabic RTL the layout reads right-to-left, so "starting surah" is on the
 * right and "ending surah" is on the left. When the page only contains one
 * surah (the common mid-surah case), only the page number is shown.
 */
const PageFooter: React.FC<{ page: number; endingSurahId: number; startingSurahId: number }> = ({
    page, endingSurahId, startingSurahId,
}) => {
    const starting = getSurah(startingSurahId);
    const ending = getSurah(endingSurahId);
    const sameSurah = endingSurahId === startingSurahId;

    // Strip the "سُورَةُ " prefix the index.json names carry so the footer
    // reads just the bare surah name (matches the printed Mushaf).
    const bare = (s?: { name: string }) => (s ? s.name.replace(/^سُورَةُ\s*/, '') : '');

    return (
        <div className="w-full flex items-center justify-between gap-2 mt-4 mb-2 px-2 select-none" dir="rtl">
            <span className="flex-1 text-right text-sm sm:text-base font-quran text-primary-700 dark:text-primary-300 truncate">
                {sameSurah ? '' : bare(ending)}
            </span>
            <span
                className="font-quran font-bold text-primary-800 dark:text-primary-100 tabular-nums text-base sm:text-lg px-3"
                aria-label={'صفحة ' + page}
            >
                {page}
            </span>
            <span className="flex-1 text-left text-sm sm:text-base font-quran text-primary-700 dark:text-primary-300 truncate">
                {bare(starting)}
            </span>
        </div>
    );
};

export default PageFooter;
