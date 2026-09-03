import React, { useState } from 'react';
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
    isCurrentAudio?: boolean;
    onPlay: () => void;
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
    ayah, isBookmarked, isCurrentAudio = false,
    onPlay, onToggleBookmark, onShowTafsir, sajdaLabel,
}) => {
    const [actionsOpen, setActionsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (await copyText(ayah.text)) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };
    const handleShare = () => shareText('سورة ' + ayah.surahId + ' - آية ' + ayah.number, ayah.text);

    const arabicNumber = ayah.number.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);

    return (
        <div
            id={`ayah-${ayah.surahId}-${ayah.number}`}
            className={`group relative rounded-2xl px-4 py-5 transition-colors duration-300 ${isCurrentAudio ? 'bg-primary-50 dark:bg-primary-900/15 ring-1 ring-primary-300/40 dark:ring-primary-500/30' : 'hover:bg-gray-50/60 dark:hover:bg-[#1A3129]/40'}`}
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
                    aria-hidden
                    className="inline-flex items-center justify-center align-middle mx-2 select-none"
                >
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
                    onClick={() => setActionsOpen(o => !o)}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700"
                    aria-expanded={actionsOpen}
                >
                    {actionsOpen ? 'إخفاء' : 'خيارات'}
                </button>
                <div className="flex items-center gap-3 rtl:gap-reverse">
                    <button onClick={onPlay} aria-label="تشغيل الآية" className="hover:text-primary-500">
                        {isCurrentAudio ? <PlaySolid className="w-5 h-5 text-primary-500" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={onToggleBookmark} aria-label="حفظ" className="hover:text-primary-500">
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
                        <div className="flex justify-around mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs">
                            <button onClick={onShowTafsir} className="flex flex-col items-center gap-1 hover:text-primary-500 px-3 py-1">
                                <BookOpenIcon className="w-5 h-5" />
                                <span>التفسير</span>
                            </button>
                            <button onClick={handleCopy} className="flex flex-col items-center gap-1 hover:text-primary-500 px-3 py-1">
                                <ClipboardIcon className="w-5 h-5" />
                                <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
                            </button>
                            <button onClick={handleShare} className="flex flex-col items-center gap-1 hover:text-primary-500 px-3 py-1">
                                <ShareIcon className="w-5 h-5" />
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
