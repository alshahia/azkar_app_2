import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { DEFAULT_TAFSIR_ID, listTafsirs, type TafsirDescriptor } from '../../services/tafsirRegistry';

interface TafsirSheetProps {
    open: boolean;
    surahId: number;
    ayahNumber: number;
    onClose: () => void;
    tafsirId?: string;
    onTafsirChange?: (id: string) => void;
}

/**
 * Bottom sheet that loads and renders the Tafsir Muyassar entry for a single
 * ayah. Memoises the surah-level payload so subsequent opens are instant.
 */
const TafsirSheet: React.FC<TafsirSheetProps> = ({ open, surahId, ayahNumber, onClose, tafsirId, onTafsirChange }) => {
    const [tafsir, setTafsir] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeId = tafsirId ?? DEFAULT_TAFSIR_ID;

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        // Defer the reset setState calls past the effect boundary
        // (react-hooks/set-state-in-effect); the load itself starts now.
        // The microtask is queued before descriptor.load() below, so it
        // always runs before the promise callbacks regardless of how fast
        // the load settles.
        queueMicrotask(() => {
            if (cancelled) return;
            setLoading(true);
            setError(null);
        });
        const descriptor = listTafsirs().find((t) => t.id === activeId) ?? listTafsirs()[0];
        descriptor.load(surahId)
            .then((arr: string[]) => {
                if (cancelled) return;
                const text = arr[ayahNumber - 1];
                setTafsir(text || null);
            })
            .catch((e: unknown) => { if (!cancelled) setError(String((e as { message?: string })?.message ?? e)); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [open, surahId, ayahNumber, activeId]);

    const arabicAyah = ayahNumber.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
    const arabicSurah = surahId.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);

    // Escape closes the sheet, focus lands inside it on open, and focus returns
    // to whatever opened it on close. The backdrop click already closes it.
    const sheetRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        const previous = document.activeElement as HTMLElement | null;
        sheetRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            previous?.focus?.();
        };
    }, [open, onClose]);

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
                        ref={sheetRef}
                        tabIndex={-1}
                        className="fixed bottom-0 inset-x-0 z-50 mx-auto w-full max-w-md bg-surface-card dark:bg-surface rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto outline-none"
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="التفسير"
                    >
                        <div className="sticky top-0 bg-surface-card dark:bg-surface px-5 pt-4 pb-3 border-b border-surface-card-2 dark:border-midnight-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BookOpenIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                <div>
                                    <TafsirPicker activeId={activeId} onChange={onTafsirChange} />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">سورة {arabicSurah} - آية {arabicAyah}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-card-2 dark:hover:bg-midnight-800" aria-label="إغلاق">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            {loading && (
                                <div className="flex justify-center items-center py-10">
                                    <div role="status" aria-label="جاري التحميل" className="w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                            {error && (
                                <p className="text-red-600 dark:text-red-400 text-sm" role="alert">{error}</p>
                            )}
                            {tafsir && !loading && (
                                <p className="font-quran text-lg leading-loose text-gray-800 dark:text-gray-100 text-justify" dir="rtl">
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
interface TafsirPickerProps {
    activeId: string;
    onChange?: (id: string) => void;
}
const TafsirPicker: React.FC<TafsirPickerProps> = ({ activeId, onChange }) => {
    const items = listTafsirs();
    return (
        <div className="flex flex-wrap gap-1.5 mb-2">
            {items.map((t: TafsirDescriptor) => {
                const isActive = t.id === activeId;
                return (
                    <button
                        key={t.id}
                        onClick={() => onChange && onChange(t.id)}
                        disabled={!onChange}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${isActive ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface-card dark:bg-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-400'}`}
                        aria-pressed={isActive}
                        title={t.label + ' - ' + t.license}
                    >
                        {t.labelAr}
                    </button>
                );
            })}
        </div>
    );
};

export default TafsirSheet;