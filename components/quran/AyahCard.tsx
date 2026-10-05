import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    PlayIcon, BookmarkIcon, BookOpenIcon, ClipboardIcon, ShareIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid, PlayIcon as PlaySolid } from '@heroicons/react/24/solid';
import type { QuranAyah } from '../../services/QuranService';
import { copyText, shareText } from '../../utils/share';

interface AyahCardProps {
    ayah: QuranAyah;
    isBookmarked: boolean;
    /** Currently playing ayah per the audio queue, regardless of timing
     *  bundle availability. Driven by the SurahReader's IO + audio position.
     */
    isCurrentAudio?: boolean;
    /** Currently playing ayah per QUL timing data. Independent source: when
     *  timings are loaded, this is more precise than isCurrentAudio. The
     *  card highlights whenever either flag is true.
     */
    isHighlighted?: boolean;
    onPlay: () => void;
    /** Tap-to-seek: jump audio playback to this ayah's start. Used by the
     *  timing-highlighted path (the player seeks instead of restarting).
     */
    onSeek?: () => void;
    /** Long-press to open the VerseActionModalContainer (M3-T1). The card
     *  itself only flips a boolean; the modal lives at the screen level so
     *  it can share audio/tafsir contexts. */
    onLongPress?: () => void;
    onToggleBookmark: () => void;
    onShowTafsir: () => void;
    sajdaLabel?: string;
}

/**
 * Renders a single ayah as a centered reading block with:
 *   - a ۝ end-marker that contains the Arabic-Indic ayah number
 *   - a horizontal action row that reveals on tap (play / bookmark / tafsir / copy / share)
 *   - sajda chip when applicable
 *
 * Font size is inherited from the parent container's --quran-fs custom property
 * so the screen-level font-size slider scales only the Quran content, not the
 * surrounding chrome.
 */
const AyahCard: React.FC<AyahCardProps> = ({
    ayah, isBookmarked, isCurrentAudio = false, isHighlighted = false,
    onPlay, onSeek, onLongPress, onToggleBookmark, onShowTafsir, sajdaLabel,
}) => {
    const [actionsOpen, setActionsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const copyTimerRef = useRef<number | null>(null);
    const longPressTimerRef = useRef<number | null>(null);

    // Both timers outlive a tap; drop them on unmount so a late copy-reset or
    // long-press never touches state (or opens the modal) after the card is gone.
    useEffect(() => () => {
        if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
        if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    }, []);

    const handleCopy = async () => {
        if (await copyText(ayah.text)) {
            setCopied(true);
            if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
            copyTimerRef.current = window.setTimeout(() => {
                copyTimerRef.current = null;
                setCopied(false);
            }, 1500);
        }
    };
    const handleShare = () => shareText('سورة ' + ayah.surahId + ' - آية ' + ayah.number, ayah.text);

    const arabicNumber = ayah.number.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);

    return (
        <div
            id={`ayah-${ayah.surahId}-${ayah.number}`}
            onClick={onSeek}
            onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => { if (onLongPress) { e.preventDefault(); onLongPress(); } }}
            onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
                if (!onLongPress) return;
                // ~500ms touch-and-hold feel without bringing in a lib. The
                // browser/UDT does not always emit a synthetic mouseup, so we
                // clear via timer state stored on the element.
                const el = e.currentTarget as HTMLElement;
                const prev = el.dataset.longPressTimer;
                if (prev) window.clearTimeout(Number(prev));
                const id = window.setTimeout(() => {
                    delete el.dataset.longPressTimer;
                    longPressTimerRef.current = null;
                    onLongPress();
                }, 550);
                el.dataset.longPressTimer = String(id);
                longPressTimerRef.current = id;
            }}
            onTouchEnd={(e: React.TouchEvent<HTMLDivElement>) => {
                const el = e.currentTarget as HTMLElement;
                const prev = el.dataset.longPressTimer;
                if (prev) {
                    window.clearTimeout(Number(prev));
                    delete el.dataset.longPressTimer;
                }
                longPressTimerRef.current = null;
            }}
            onKeyDown={onSeek ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSeek(); } } : undefined}
            tabIndex={onSeek ? 0 : undefined}
            role={onSeek ? 'button' : undefined}
            aria-current={(isCurrentAudio || isHighlighted) ? 'true' : undefined}
            className={`group relative rounded-2xl px-4 py-5 transition-colors duration-300 ${onSeek ? 'cursor-pointer' : 'cursor-default'} ${(isCurrentAudio || isHighlighted) ? 'bg-primary-50 dark:bg-primary-900/15 ring-1 ring-primary-300/40 dark:ring-primary-500/30' : 'hover:bg-surface-card-2/60 dark:hover:bg-surface-card/40'}`}
        >
            {/* Sajda chip */}
            {ayah.sajda > 0 && (
                <div className="absolute top-2 left-2 rtl:left-auto rtl:right-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    سجدة {sajdaLabel || ''}
                </div>
            )}

            {/* Arabic text */}
            <p
                dir="rtl"
                className="font-quran text-right text-gray-900 dark:text-gray-100 leading-[2.2] tracking-wide"
                style={{ fontSize: 'var(--quran-fs, 1.75rem)' }}
            >
                {ayah.text}
                <span
                    className="inline-flex items-center justify-center align-middle mx-2 select-none"
                >
                    <span className="sr-only">{'آية ' + arabicNumber}</span>
                    <span className="relative inline-flex items-center justify-center w-9 h-9">
                        <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full text-primary-600/70 dark:text-primary-400/70" aria-hidden>
                            <path d="M20 2 L24.7 15.3 L38 20 L24.7 24.7 L20 38 L15.3 24.7 L2 20 L15.3 15.3 Z" fill="currentColor" opacity="0.15" />
                            <path d="M20 2 L24.7 15.3 L38 20 L24.7 24.7 L20 38 L15.3 24.7 L2 20 L15.3 15.3 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                        </svg>
                        <span className="relative text-xs font-bold text-primary-700 dark:text-primary-300 tabular-nums">{arabicNumber}</span>
                    </span>
                </span>
            </p>

            {/* Action toggle (always visible) + expandable row */}
            <div className="mt-3 flex items-center justify-between text-gray-400 dark:text-gray-500">
                <button
                    onClick={(e) => { e.stopPropagation(); setActionsOpen(o => !o); }}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700"
                    aria-expanded={actionsOpen}
                >
                    {actionsOpen ? 'إخفاء' : 'خيارات'}
                </button>
                <div className="flex items-center gap-3 rtl:gap-reverse">
                    {/* stopPropagation: the card itself is a seek target, so a
                        tap on an action button must not also jump the audio. */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onPlay(); }}
                        aria-label="تشغيل الآية"
                        className="p-1.5 -m-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center hover:text-primary-500"
                    >
                        {isCurrentAudio ? <PlaySolid className="w-5 h-5 text-primary-500" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
                        aria-label={isBookmarked ? 'إزالة الحفظ' : 'حفظ'}
                        aria-pressed={isBookmarked}
                        className="p-1.5 -m-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center hover:text-primary-500"
                    >
                        {isBookmarked ? <BookmarkSolid className="w-5 h-5 text-primary-500" /> : <BookmarkIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {actionsOpen && (
                    <motion.div
                        key="actions"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                    >
                        <div className="flex justify-around mt-3 pt-3 border-t border-surface-card-2 dark:border-midnight-800 text-gray-500 dark:text-gray-400 text-xs">
                            <button onClick={(e) => { e.stopPropagation(); onShowTafsir(); }} className="flex flex-col items-center gap-1 hover:text-primary-500 px-3 py-2 min-h-[44px]">
                                <BookOpenIcon aria-hidden="true" className="w-5 h-5" />
                                <span>التفسير</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="flex flex-col items-center gap-1 hover:text-primary-500 px-3 py-2 min-h-[44px]">
                                <ClipboardIcon aria-hidden="true" className="w-5 h-5" />
                                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="flex flex-col items-center gap-1 hover:text-primary-500 px-3 py-2 min-h-[44px]">
                                <ShareIcon aria-hidden="true" className="w-5 h-5" />
                                <span>مشاركة</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AyahCard;