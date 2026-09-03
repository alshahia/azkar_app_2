import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon, BookmarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { QuranBookmark } from '../../types';
import { getSurah, SURAHS } from '../../services/QuranService';

interface BookmarkSheetProps {
    open: boolean;
    bookmarks: QuranBookmark[];
    onClose: () => void;
    onJump: (surah: number, ayah: number) => void;
    onRemove: (surah: number, ayah: number) => void;
}

/**
 * Lists saved bookmarks so the user can jump back to any ayah from anywhere.
 * Bookmarks are sorted most-recent-first. Empty state shows a friendly hint.
 */
const BookmarkSheet: React.FC<BookmarkSheetProps> = ({ open, bookmarks, onClose, onJump, onRemove }) => {
    const sorted = [...bookmarks].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/40 z-40"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#12241C] rounded-t-3xl shadow-2xl max-h-[75vh] overflow-y-auto"
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        <div className="sticky top-0 bg-white dark:bg-[#12241C] px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookmarkIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <h3 className="font-bold text-gray-800 dark:text-gray-100">علاماتي المرجعية</h3>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="إغلاق">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-3">
                            {sorted.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                                    لا توجد علامات مرجعية بعد. اضغط على أيقونة الإشارة في أي آية لحفظها.
                                </p>
                            ) : sorted.map(b => {
                                const s = getSurah(b.surah);
                                const arabicAyah = b.ayah.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
                                return (
                                    <div key={b.surah + '-' + b.ayah} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A3129]">
                                        <button
                                            onClick={() => { onJump(b.surah, b.ayah); onClose(); }}
                                            className="flex-1 text-right rtl:text-right"
                                        >
                                            <p className="font-quran text-lg text-gray-800 dark:text-gray-100">
                                                {s ? s.name : ('سورة ' + b.surah)}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">آية {arabicAyah}</p>
                                        </button>
                                        <button
                                            onClick={() => onRemove(b.surah, b.ayah)}
                                            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                                            aria-label="حذف العلامة"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BookmarkSheet;
