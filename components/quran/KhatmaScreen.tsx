import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftIcon, PlusIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useKhatma } from '../../hooks/useKhatma';
import { useNavigationStore } from '../../stores/useNavigationStore';
import KhatmaCard from './KhatmaCard';
import type { KhatmaPreset } from '../../types';

const KhatmaScreen: React.FC = () => {
    const navigate = useNavigationStore((state) => state.navigate);
    const { khatmas, presets, createKhatma, deleteKhatma, toggleKhatmaStatus } = useKhatma();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<KhatmaPreset | null>(null);
    const [customName, setCustomName] = useState('');

    const handleCreateKhatma = () => {
        if (!selectedPreset) return;
        createKhatma(selectedPreset, customName || undefined);
        setShowCreateModal(false);
        setSelectedPreset(null);
        setCustomName('');
    };

    const handleSelectKhatma = (id: string) => {
        navigate('mushafPage', { khatmaId: id });
    };

    // Escape closes the create dialog and focus returns to whatever opened it.
    const dialogRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!showCreateModal) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowCreateModal(false);
        };
        document.addEventListener('keydown', onKey);
        const previous = document.activeElement as HTMLElement | null;
        dialogRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            previous?.focus?.();
        };
    }, [showCreateModal]);

    return (
        <div className="h-full flex flex-col bg-surface dark:bg-surface">
            {/* Header */}
            <div className="bg-surface-card dark:bg-surface-card shadow-sm dark:shadow-none sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => navigate('quran')}
                        aria-label="العودة"
                        className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-surface-card-2 dark:hover:bg-midnight-800"
                    >
                        <ArrowLeftIcon aria-hidden="true" className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                        ختم القرآن
                    </h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        aria-label="إنشاء ختمة جديدة"
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-primary-600 dark:text-primary-400 hover:bg-surface-card-2 dark:hover:bg-midnight-800"
                    >
                        <PlusIcon aria-hidden="true" className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Content — own scroll container: AppRouter renders non-main
                routes under an overflow-hidden ancestor with no scrollable
                parent, so min-h-full content used to clip. */}
            <div className="max-w-md mx-auto px-4 py-6 flex-grow overflow-y-auto">
                {khatmas.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpenIcon aria-hidden="true" className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            ابدأ ختمة جديدة
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            تتبع تقدمك في قراءة القرآن الكريم
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 min-h-[44px] bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
                        >
                            إنشاء ختمة
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {khatmas.map((khatma) => (
                            <KhatmaCard
                                key={khatma.id}
                                khatma={khatma}
                                onToggleStatus={toggleKhatmaStatus}
                                onDelete={deleteKhatma}
                                onSelect={handleSelectKhatma}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            ref={dialogRef}
                            tabIndex={-1}
                            role="dialog"
                            aria-modal="true"
                            aria-label="إنشاء ختمة جديدة"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-surface-card dark:bg-surface-card rounded-2xl p-6 w-full max-w-md outline-none"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                إنشاء ختمة جديدة
                            </h2>

                            {/* Presets */}
                            <div className="space-y-2 mb-4">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => setSelectedPreset(preset)}
                                        aria-pressed={selectedPreset?.id === preset.id}
                                        className={`w-full p-4 rounded-xl border-2 text-right transition-colors ${
                                            selectedPreset?.id === preset.id
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-surface-card-2 dark:border-midnight-800 hover:border-primary-300 dark:hover:border-primary-500/40'
                                        }`}
                                    >
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {preset.nameAr}
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {preset.description}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Custom Name */}
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="اسم مخصص (اختياري)"
                                aria-label="اسم مخصص (اختياري)"
                                className="w-full px-4 py-3 rounded-xl border border-surface-card-2 dark:border-midnight-800 bg-surface-card dark:bg-surface-card text-gray-900 dark:text-white mb-4"
                            />

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 min-h-[44px] border border-surface-card-2 dark:border-midnight-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-surface-card-2 dark:hover:bg-midnight-800 transition-colors"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleCreateKhatma}
                                    disabled={!selectedPreset}
                                    className="flex-1 px-4 py-3 min-h-[44px] bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-midnight-800 text-white rounded-xl font-medium transition-colors"
                                >
                                    إنشاء
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KhatmaScreen;
