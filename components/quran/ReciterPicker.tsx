import React, { useEffect, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
    getReciters, subscribe as subscribeReciters, refreshRecitersIfWifi, type Reciter,
} from '../../services/reciterCatalog';
import { useQuranAudio } from '../../context/QuranAudioContext';

/** Live snapshot of the merged (bundled + refreshed) reciter catalog. */
function useReciters(): Reciter[] {
    return useSyncExternalStore(subscribeReciters, getReciters, getReciters);
}

interface ReciterPickerProps {
    open: boolean;
    onClose: () => void;
}

/**
 * Bottom-sheet style reciter picker, opened from the app-level player.
 * Self-contained: reads the current reciter from the audio context and
 * triggers a Wi-Fi-gated catalog refresh on open so newly added reciters
 * appear without an app release (M1-T4).
 */
const ReciterPicker: React.FC<ReciterPickerProps> = ({ open, onClose }) => {
    const { reciterId, setReciter } = useQuranAudio();
    const reciters = useReciters();

    useEffect(() => {
        if (!open) return;
        void refreshRecitersIfWifi();
    }, [open]);

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
                        className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#12241C] rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto"
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        <div className="sticky top-0 bg-white dark:bg-[#12241C] px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">اختر القارئ</h3>
                            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="إغلاق">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-2">
                            {reciters.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => { setReciter(r.id); onClose(); }}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A3129] active:bg-gray-100 dark:active:bg-[#24433A] transition-colors"
                                >
                                    <div className="text-right rtl:text-right">
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{r.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.style}</p>
                                    </div>
                                    {r.id === reciterId && <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReciterPicker;
