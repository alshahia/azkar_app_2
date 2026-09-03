import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { RECITERS } from '../../services/QuranService';

interface ReciterPickerProps {
    open: boolean;
    currentId: string;
    onPick: (id: string) => void;
    onClose: () => void;
}

/**
 * Bottom-sheet style reciter picker. Slides up from the bottom and traps focus.
 */
const ReciterPicker: React.FC<ReciterPickerProps> = ({ open, currentId, onPick, onClose }) => {
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
                            {RECITERS.map(r => (
                                <button
                                    key={r.id}
                                    onClick={() => { onPick(r.id); onClose(); }}
                                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A3129] active:bg-gray-100 dark:active:bg-[#24433A] transition-colors"
                                >
                                    <div className="text-right rtl:text-right">
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{r.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{r.style}</p>
                                    </div>
                                    {r.id === currentId && <CheckIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
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
