import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { loadTafsir } from '../../services/QuranService';

interface TafsirSheetProps {
    open: boolean;
    surahId: number;
    ayahNumber: number;
    onClose: () => void;
}

/**
 * Bottom sheet that loads and renders the Tafsir Muyassar entry for a single
 * ayah. Memoises the surah-level payload so subsequent opens are instant.
 */
const TafsirSheet: React.FC<TafsirSheetProps> = ({ open, surahId, ayahNumber, onClose }) => {
    const [tafsir, setTafsir] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        loadTafsir(surahId)
            .then(arr => {
                if (cancelled) return;
                const text = arr[ayahNumber - 1];
                setTafsir(text || null);
            })
            .catch(e => { if (!cancelled) setError(String(e?.message || e)); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, surahId, ayahNumber]);

    const arabicAyah = ayahNumber.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);

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
                        className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#12241C] rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto"
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        role="dialog"
                        aria-label="التفسير"
                    >
                        <div className="sticky top-0 bg-white dark:bg-[#12241C] px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookOpenIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100">التفسير الميسر</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">سورة {surahId} - آية {arabicAyah}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="إغلاق">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            {loading && (
                                <div className="flex justify-center items-center py-10">
                                    <div className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" aria-label="جاري التحميل"></div>
                                </div>
                            )}
                            {error && (
                                <p className="text-red-600 dark:text-red-400 text-sm" role="alert">{error}</p>
                            )}
                            {tafsir && !loading && (
                                <p className="font-serif text-lg leading-loose text-gray-800 dark:text-gray-100 text-justify" dir="rtl">
                                    {tafsir}
                                </p>
                            )}
                            {!tafsir && !loading && !error && (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">لا يوجد تفسير لهذه الآية.</p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default TafsirSheet;
