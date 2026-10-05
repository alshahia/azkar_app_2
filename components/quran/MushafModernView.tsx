import React from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';
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
    /**
     * Optional callback fired when the user taps the per-ayah "التفسير" chip
     * rendered next to the ayah-number marker. Parents that wire a Tafsir
     * sheet can open it for the (surahId, ayah) tuple. When this prop is
     * omitted, the chip is hidden entirely so the modern view stays a
     * pure reader.
     */
    onAyahTap?: (surahId: number, ayahNumber: number) => void;
}

/**
 * "Modern" Mushaf page renderer. Renders every ayah of a single page as a
 * continuous Uthmani block grouped by surah, with a decorative surah header
 * (and Bismillah) at each surah boundary on the page. This is intentionally
 * a vertical flow rather than the printed Mushaf's line-by-line reflow: it
 * is mobile-friendly, requires no per-line layout database, and keeps the
 * existing AyahCard's typographic vocabulary so the page mode and ayah mode
 * feel like one product.
 *
 * The ayah-number marker uses a fully transparent fill (only a thin outline)
 * so the previous ayah's last word stays visible underneath instead of
 * being masked by a 15%-opacity green diamond. The optional Tafsir chip
 * sits inline next to the marker so each ayah has an in-app Tafsir opener
 * without forcing the reader into the continuous-flow screen.
 */
const MushafModernView: React.FC<MushafModernViewProps> = ({ page, ayahs, tajweed, onAyahTap }) => {
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

                const tafsirChip = onAyahTap ? (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onAyahTap(ayah.surahId, ayah.number); }}
                        className="inline-flex items-center justify-center gap-1 align-middle mx-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-primary-700 dark:text-primary-300 bg-primary-50/70 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-800/40 border border-primary-200/60 dark:border-primary-700/50 transition-colors select-none"
                        aria-label={`التفسير - سورة ${surah?.name ?? ayah.surahId} آية ${arabicNumber}`}
                        title="التفسير"
                    >
                        <BookOpenIcon className="w-3.5 h-3.5" aria-hidden />
                        <span>التفسير</span>
                    </button>
                ) : null;

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
                                {/* Outline-only diamond; fill is transparent so it
                                    doesn't mask the previous ayah's last word. */}
                                <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full text-primary-600/70 dark:text-primary-400/70" aria-hidden>
                                    <path d="M20 2 L24.7 15.3 L38 20 L24.7 24.7 L20 38 L15.3 24.7 L2 20 L15.3 15.3 Z" fill="transparent" />
                                    <path d="M20 2 L24.7 15.3 L38 20 L24.7 24.7 L20 38 L15.3 24.7 L2 20 L15.3 15.3 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                                </svg>
                                <span className="relative text-[11px] font-bold text-primary-700 dark:text-primary-300 tabular-nums">{arabicNumber}</span>
                            </span>
                        </span>
                        {tafsirChip}
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
