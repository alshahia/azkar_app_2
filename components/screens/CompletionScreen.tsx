
import React, { useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { CheckIcon, HomeIcon, ChartBarIcon, SparklesIcon, FireIcon } from '@heroicons/react/24/solid';

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

    // Trigger streak update and total reads update on mount
    useEffect(() => {
        if (statsUpdatedRef.current) return;
        statsUpdatedRef.current = true;
        if (sessionReads > 0) {
            incrementStreak();
            incrementTotalReads(sessionReads);
        }
    }, []); // Run once on mount

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
        </div>
    );
};

export default CompletionScreen;
