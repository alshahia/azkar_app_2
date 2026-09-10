import React from 'react';
import { getSurah, type SurahMeta } from '../../services/QuranService';

/**
 * Decorative surah header for the Mushaf page mode, echoing the ornate frame
 * used in the printed Madinah Mushaf (top of every surah boundary on a page).
 * Renders the surah's Arabic name inside a curved double-line frame with a
 * small ornamental flourish on each end. The center has a flat label area
 * sized to the surah name so the frame hugs the text instead of stretching
 * the full width.
 */
const SurahPageHeader: React.FC<{ surah: SurahMeta }> = ({ surah }) => {
    return (
        <div className="flex flex-col items-center my-5 select-none" dir="rtl">
            <svg
                viewBox="0 0 360 56"
                className="w-full max-w-md text-primary-500/70 dark:text-primary-400/60"
                aria-hidden
            >
                {/* outer frame */}
                <path
                    d="M30 6 H330 C345 6 354 15 354 28 C354 41 345 50 330 50 H30 C15 50 6 41 6 28 C6 15 15 6 30 6 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                />
                {/* inner frame */}
                <path
                    d="M34 12 H326 C339 12 348 20 348 28 C348 36 339 44 326 44 H34 C21 44 12 36 12 28 C12 20 21 12 34 12 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.7"
                    opacity="0.55"
                />
                {/* left tip ornament */}
                <g transform="translate(6 28)">
                    <circle r="2.4" fill="currentColor" opacity="0.75" />
                    <circle cx="-7" r="1.6" fill="currentColor" opacity="0.5" />
                </g>
                {/* right tip ornament */}
                <g transform="translate(354 28)">
                    <circle r="2.4" fill="currentColor" opacity="0.75" />
                    <circle cx="7" r="1.6" fill="currentColor" opacity="0.5" />
                </g>
            </svg>
            <p
                className="font-quran text-2xl sm:text-3xl text-primary-800 dark:text-primary-100 -mt-9 px-6 bg-gray-50 dark:bg-[#12241C] relative z-10"
                style={{ lineHeight: '2' }}
            >
                سُورَةُ {surah.name.replace(/^سُورَةُ\s*/, '')}
            </p>
        </div>
    );
};

/**
 * One-line look-up so callers can pass a raw id without touching the service.
 */
export const SurahPageHeaderForId: React.FC<{ surahId: number }> = ({ surahId }) => {
    const s = getSurah(surahId);
    if (!s) return null;
    return <SurahPageHeader surah={s} />;
};

export default SurahPageHeader;
