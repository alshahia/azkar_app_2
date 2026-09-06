
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { HomeIcon, ArrowRightIcon, TrophyIcon, FireIcon, HandThumbUpIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import Confetti from '../common/Confetti';

interface SessionStats {
    readCount: number;
    categoryTitle: string;
    totalAvailable: number;
}

interface SessionSummaryScreenProps {
    sessionStats: SessionStats;
}

const SessionSummaryScreen: React.FC<SessionSummaryScreenProps> = ({ sessionStats }) => {
    const { navigate } = useAppContext();
    
    const percentage = sessionStats.totalAvailable > 0 
        ? Math.round((sessionStats.readCount / sessionStats.totalAvailable) * 100)
        : 0;
    
    // Motivational messages based on percentage
    const getMessage = () => {
        if (percentage >= 100) return "ما شاء الله! إنجاز كامل";
        if (percentage >= 75) return "عمل رائع! اقتربت من الختم";
        if (percentage >= 50) return "أحسنت! تجاوزت المنتصف";
        return "بداية موفقة، تقبل الله";
    };

    return (
        <div className="h-full flex flex-col p-6 bg-gray-50 dark:bg-[#12241C] overflow-y-auto animate-fade-in relative">
            {/* Confetti Celebration for high achievement */}
            {percentage >= 50 && <Confetti />}

            <header className="mb-8 flex items-center justify-between relative z-10">
                <div className="w-8"></div> {/* Spacer for center alignment */}
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">ملخص الجلسة</h1>
                <button onClick={() => navigate('categories')} aria-label="رجوع" className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                    <ArrowRightIcon className="w-5 h-5 rtl:rotate-180" />
                </button>
            </header>

            <div className="flex-grow flex flex-col items-center justify-center space-y-8 relative z-10">
                
                {/* Score Circle with Animation */}
                <div className="relative w-56 h-56 flex items-center justify-center">
                    {/* Outer Glow */}
                    <div className="absolute inset-0 bg-primary-500/20 dark:bg-primary-500/10 rounded-full blur-2xl"></div>
                    
                    <svg className="w-full h-full transform -rotate-90 relative z-10">
                        <circle
                            cx="112" cy="112" r="100"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            className="text-gray-200 dark:text-gray-800"
                        />
                        <circle
                            cx="112" cy="112" r="100"
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 100}
                            strokeDashoffset={2 * Math.PI * 100 - (percentage / 100) * 2 * Math.PI * 100}
                            strokeLinecap="round"
                            className="text-primary-500 transition-all duration-[1500ms] ease-out drop-shadow-md"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <span className="text-6xl font-extrabold text-gray-900 dark:text-white tracking-tighter">{sessionStats.readCount}</span>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">ذكر تم قراءته</span>
                    </div>
                </div>

                <div className="text-center space-y-3 max-w-xs mx-auto">
                    <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">{getMessage()}</h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        لقد أنجزت <span className="font-bold text-gray-900 dark:text-white">{percentage}%</span> من <span className="font-bold text-gray-900 dark:text-white">{sessionStats.categoryTitle}</span> في هذه الجلسة.
                    </p>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                    <div className="bg-white dark:bg-[#1A3129] p-5 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-none flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                        <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-3 text-orange-500">
                            <FireIcon className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{percentage}%</span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">نسبة الإنجاز</span>
                    </div>

                    <div className="bg-white dark:bg-[#1A3129] p-5 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-none flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3 text-blue-500">
                            <ChartBarIcon className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{sessionStats.totalAvailable - sessionStats.readCount}</span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">المتبقي</span>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => navigate('categories')}
                className="mt-8 w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-95 flex items-center justify-center space-x-2 rtl:space-x-reverse relative z-10"
            >
                <HomeIcon className="w-5 h-5" />
                <span>العودة للقائمة الرئيسية</span>
            </button>
        </div>
    );
};

export default SessionSummaryScreen;
