import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpenIcon, CheckCircleIcon, PlayIcon, PauseIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Khatma } from '../../types';
import { TOTAL_MUSHAF_PAGES } from '../../services/QuranService';

interface KhatmaCardProps {
    khatma: Khatma;
    onToggleStatus: (id: string) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
}

const KhatmaCard: React.FC<KhatmaCardProps> = ({ khatma, onToggleStatus, onDelete, onSelect }) => {
    const progress = Math.round((khatma.pagesRead.length / TOTAL_MUSHAF_PAGES) * 100);
    // The clock is read from a timer, never during render: Date.now() in a
    // render body is impure and would desync concurrent renders. The first
    // tick is deferred by a timeout so the effect body never sets state
    // synchronously, and the minute interval keeps the count honest across
    // midnight without re-rendering the list every second.
    const [now, setNow] = useState<number | null>(null);
    useEffect(() => {
        const tick = () => setNow(Date.now());
        const first = window.setTimeout(tick, 0);
        const id = window.setInterval(tick, 60_000);
        return () => {
            window.clearTimeout(first);
            window.clearInterval(id);
        };
    }, []);
    const daysRemaining = now === null
        ? null
        : Math.max(0, Math.ceil((new Date(khatma.endDate).getTime() - now) / (1000 * 60 * 60 * 24)));
    const isCompleted = khatma.status === 'completed';
    const isActive = khatma.status === 'active';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-surface-card dark:bg-surface-card rounded-2xl p-4 shadow-sm dark:shadow-none border ${
                isCompleted
                    ? 'border-emerald-200 dark:border-emerald-800'
                    : isActive
                    ? 'border-blue-200 dark:border-blue-800'
                    : 'border-gray-200 dark:border-gray-700'
            }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        {khatma.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(khatma.startDate).toLocaleDateString('ar-SA')} - {new Date(khatma.endDate).toLocaleDateString('ar-SA')}
                    </p>
                </div>
                {isCompleted && (
                    <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                )}
            </div>

            <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300">التقدم</span>
                    <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-2.5 rounded-full ${
                            isCompleted
                                ? 'bg-emerald-500'
                                : isActive
                                ? 'bg-blue-500'
                                : 'bg-gray-400'
                        }`}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-surface-card-2 dark:bg-surface-card-2 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{khatma.pagesRead.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">صفحة</p>
                </div>
                <div className="text-center p-2 bg-surface-card-2 dark:bg-surface-card-2 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{daysRemaining ?? ''}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">يوم متبقي</p>
                </div>
                <div className="text-center p-2 bg-surface-card-2 dark:bg-surface-card-2 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{khatma.completedDays}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">يوم مكتمل</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onSelect(khatma.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <BookOpenIcon className="w-4 h-4" />
                    متابعة القراءة
                </button>
                {!isCompleted && (
                    <button
                        onClick={() => onToggleStatus(khatma.id)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        title={isActive ? 'إيقاف مؤقت' : 'استئناف'}
                        aria-label={isActive ? 'إيقاف مؤقت' : 'استئناف'}
                    >
                        {isActive ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                )}
                <button
                    onClick={() => onDelete(khatma.id)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    title="حذف"
                    aria-label="حذف الختمة"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </motion.div>
    );
};

export default KhatmaCard;
