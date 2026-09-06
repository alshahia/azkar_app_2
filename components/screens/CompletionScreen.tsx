
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { CheckIcon, HomeIcon, ChartBarIcon, SparklesIcon, FireIcon } from '@heroicons/react/24/solid';
import type { StreakOutcome } from '../../types';

interface CompletionScreenProps {
    categoryId: string;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ categoryId }) => {
    const { navigate, progress, categories, stats, incrementStreak, incrementTotalReads } = useAppContext();
    const { t } = useTranslation();

    const category = categories.find(c => c.id === categoryId);

    // Calculate reads just for this category in the last session (estimate based on category count)
    const sessionReads = category ? category.azkar.reduce((acc, z) => acc + z.count, 0) : 0;

    // Ref guard so StrictMode double-invocation never double-counts stats
    const statsUpdatedRef = useRef(false);

    // Streak UX state — set once after the increment, drives the toast/banner.
    // The toast auto-dismisses after 3s; the banner stays until the next navigation.
    const [streakOutcome, setStreakOutcome] = useState<StreakOutcome | null>(null);
    const [showStreakToast, setShowStreakToast] = useState(false);

    // Trigger streak update and total reads update on mount
    useEffect(() => {
        if (statsUpdatedRef.current) return;
        statsUpdatedRef.current = true;
        if (sessionReads > 0) {
            const outcome = incrementStreak();
            setStreakOutcome(outcome);
            incrementTotalReads(sessionReads);

            // Preserved = a small celebratory toast; Reset = persistent banner; First-time = subtle inline note.
            if (outcome.kind === 'preserved' || outcome.kind === 'first-time') {
                setShowStreakToast(true);
                const timer = setTimeout(() => setShowStreakToast(false), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, []); // Run once on mount

    const showResetBanner = streakOutcome?.kind === 'reset';
    const toastLabel = useMemo(() => {
        if (streakOutcome?.kind === 'preserved') return 'بسم الله — استمر';
        if (streakOutcome?.kind === 'first-time') return 'بدأ العد — اليوم الأول';
        return null;
    }, [streakOutcome]);

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#1A3129] to-[#12241C] -z-10"></div>
            <div className="absolute top-10 right-10 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="bg-[#1A3129] border border-primary-500/20 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl transform transition-all scale-100">

                <div className="mx-auto w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-primary-500/30 animate-bounce-short">
                    <CheckIcon className="w-12 h-12 text-white" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">{t('completion_title')}</h1>
                <p className="text-gray-400 mb-8">{t('completion_subtitle')}</p>

                {/* Streak reset banner — shown only when the user missed at least one
                    full calendar day and is restarting from 1. Sits above the stat
                    tiles so it isn't lost in the celebration. */}
                {showResetBanner && (
                    <div
                        role="status"
                        aria-live="polite"
                        className="mb-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-right"
                        dir="rtl"
                    >
                        <div className="text-accent font-bold text-sm mb-1">سلسلة جديدة</div>
                        <div className="text-gray-200 text-sm leading-relaxed">
                            اليوم تبدأ من جديد — تقبل الله طاعتك
                        </div>
                    </div>
                )}

                <div className="space-y-3 mb-8">
                    {/* Session Stat */}
                    <div className="bg-[#12241C] rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <SparklesIcon className="w-6 h-6 text-primary-400" />
                            <span className="text-sm text-gray-300">{t('completion_stat_session')}</span>
                        </div>
                        <span className="text-xl font-bold text-white">+{sessionReads}</span>
                    </div>

                    {/* Streak Stat */}
                    <div className="bg-[#12241C] rounded-xl p-4 flex items-center justify-between">
                         <div className="flex items-center space-x-3 rtl:space-x-reverse">
                             <FireIcon className="w-6 h-6 text-orange-500" />
                             <span className="text-sm text-gray-300">أيام متتالية</span>
                         </div>
                         <span className="text-xl font-bold text-orange-400">{stats.streak}</span>
                     </div>

                     {/* Total Reads */}
                    <div className="bg-[#12241C] rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <ChartBarIcon className="w-6 h-6 text-primary-400" />
                            <span className="text-sm text-gray-300">{t('completion_stat_total')}</span>
                        </div>
                        <span className="text-xl font-bold text-white">{stats.totalReads + sessionReads}</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('categories')}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center space-x-2 rtl:space-x-reverse shadow-lg shadow-primary-500/20"
                >
                    <HomeIcon className="w-5 h-5" />
                    <span>{t('completion_button_home')}</span>
                </button>

            </div>

            {/* Floating toast — "بسم الله" / "بدأ العد". aria-live=polite so screen
                readers announce it without interrupting current speech. Positioned
                bottom-center so it doesn't compete with the centerpiece. */}
            {showStreakToast && toastLabel && (
                <div
                    role="status"
                    aria-live="polite"
                    dir="rtl"
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-5 py-3 rounded-full shadow-2xl font-bold text-sm z-50 transition-opacity duration-300"
                >
                    {toastLabel}
                </div>
            )}
        </div>
    );
};

export default CompletionScreen;
