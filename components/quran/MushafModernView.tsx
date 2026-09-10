import React from 'react';
import type { QuranAyah } from '../../services/QuranService';
import { getSurah } from '../../services/QuranService';
import { toArabicDigits } from '../../services/QuranService';
import SurahPageHeader from './SurahPageHeader';
import BismillahHeader from './BismillahHeader';
import { showsBismillahHeader } from '../../services/QuranService';

interface MushafModernViewProps {
    page: number;
    ayahs: QuranAyah[];
    /** When true, swap font-quran -> font-quran-colored (Tajweed rules as
     *  OpenType color glyphs). */
    tajweed: boolean;
}

/**
 * "Modern" Mushaf page renderer. Renders every ayah of a single page as a
 * continuous Uthmani block grouped by surah, with a decorative surah header
 * (and Bismillah) at each surah boundary on the page. This is intentionally
 * a vertical flow rather than the printed Mushaf's line-by-line reflow: it
 * is mobile-friendly, requires no per-line layout database, and keeps the
 * existing AyahCard's typographic vocabulary so the page mode and ayah mode
 * feel like one product.
 */
const MushafModernView: React.FC<MushafModernViewProps> = ({ page, ayahs, tajweed }) => {
    const fontClass = tajweed ? 'font-quran-colored' : 'font-quran';

    return (
        <div className="px-4 sm:px-6 py-2" dir="rtl">
            {ayahs.map((ayah, i) => {
                const prev = i > 0 ? ayahs[i - 1] : null;
                const surahChanged = !prev || prev.surahId !== ayah.surahId;
                // The very first ayah of the page is the natural entry into
                // the page; the surah header above the body has already drawn.
                // Skip the inline header/basmala for it so we don't double up.
                const isFirstOnPage = i === 0;
                const showHeader = surahChanged && !isFirstOnPage;
                const showBismillah = surahChanged && showsBismillahHeader(ayah.surahId);
                const surah = getSurah(ayah.surahId);
                const arabicNumber = toArabicDigits(ayah.number);

                const block: React.ReactNode[] = [];
                if (showHeader && surah) {
                    block.push(<SurahPageHeader key={'hdr-' + ayah.surahId + '-' + ayah.number} surah={surah} />);
                }
                if (showBismillah) {
                    block.push(<BismillahHeader key={'b-' + ayah.surahId + '-' + ayah.number} />);
                }

                block.push(
                    <p
                        key={'a-' + ayah.surahId + '-' + ayah.number}
                        id={'ayah-' + ayah.surahId + '-' + ayah.number}
                        className={`${fontClass} text-right text-gray-900 dark:text-gray-100 leading-[2.2] tracking-wide my-3`}
                        style={{ fontSize: 'var(--quran-fs, 1.4rem)' }}
                    >
                        {ayah.text}
                        <span
                            aria-hidden
                            className="inline-flex items-center justify-center align-middle mx-2 select-none"
                        >
                            <span className="relative inline-flex items-center justify-center w-8 h-8">
                                <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full text-primary-600/70 dark:text-primary-400/70" aria-hidden>
                                    <path d="M20 2 L24.7 15.3 L38 20 L24.7 24.7 L20 38 L15.3 24.7 L2 20 L15.3 15.3 Z" fill="currentColor" opacity="0.15" />
                                    <path d="M20 2 L24.7 15.3 L38 20 L24.7 24.7 L20 38 L15.3 24.7 L2 20 L15.3 15.3 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                                </svg>
                                <span className="relative text-[11px] font-bold text-primary-700 dark:text-primary-300 tabular-nums">{arabicNumber}</span>
                            </span>
                        </span>
                    </p>
                );
                return block;
            })}
            <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-6 select-none">
                صفحة {page}
            </p>
        </div>
    );
};

export default MushafModernView;
