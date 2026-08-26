
import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowPathIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

interface DashboardLayoutProps {
    allAzkar: any[];
    onRefresh: () => void;
    currentZikr: any;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onRefresh, currentZikr }) => {
    const { navigate, fontSize, categories } = useAppContext();
    const { t } = useTranslation();
    
    const timeOfDay = new Date().getHours();
    const isMorning = timeOfDay >= 4 && timeOfDay < 17;
    
    // Pick a random category for the "Discover" tile
    const randomCategory = useMemo(() => {
        const cats = categories.filter(c => c.id !== 'morning' && c.id !== 'evening');
        return cats[Math.floor(Math.random() * cats.length)];
    }, [categories]);

    const getArabicClass = (level: number) => {
        // Slightly smaller for dashboard card
        const sizes = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'];
        return sizes[level - 1] || 'text-2xl';
    };
    const arabicClass = getArabicClass(fontSize);

    return (
        <div className="h-full flex flex-col gap-4 pb-4">
            {/* Top Section: Featured Zikr (60%) */}
            <div className="flex-grow-[3] bg-white dark:bg-[#1A3129] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm border border-gray-100 dark:border-none transition-colors duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-primary-300"></div>
                <div className="flex justify-between items-start">
                    <span className="bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        مميز لك
                    </span>
                    <button onClick={onRefresh}>
                        <ArrowPathIcon className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white transition-colors" />
                    </button>
                </div>
                
                <div className="flex-grow flex items-center justify-center py-4">
                    <p className={`${arabicClass} font-serif text-center text-gray-800 dark:text-white leading-loose transition-colors duration-300`}>
                        {currentZikr.arabic}
                    </p>
                </div>
                
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 truncate">{currentZikr.categoryName}</p>
            </div>

            {/* Bottom Section: 2 Tiles (40%) */}
            <div className="flex-grow-[2] grid grid-cols-2 gap-4 h-40">
                {/* Time Based Tile */}
                <button 
                    onClick={() => navigate('azkarList', { categoryId: isMorning ? 'morning' : 'evening' })}
                    className={`rounded-2xl p-4 flex flex-col justify-between items-start transition-transform active:scale-95 shadow-sm ${
                        isMorning 
                            ? 'bg-amber-50 dark:bg-gradient-to-br dark:from-amber-500/20 dark:to-orange-600/20 border border-amber-100 dark:border-orange-500/30' 
                            : 'bg-indigo-50 dark:bg-gradient-to-br dark:from-indigo-500/20 dark:to-purple-600/20 border border-indigo-100 dark:border-indigo-500/30'
                    }`}
                >
                    <div className={`p-2 rounded-full ${isMorning ? 'bg-orange-500 text-white' : 'bg-indigo-500 text-white'}`}>
                        {isMorning ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
                    </div>
                    <div className="text-right rtl:text-left w-full">
                        <p className="text-gray-500 dark:text-gray-300 text-xs font-medium uppercase">{isMorning ? 'ابدأ يومك' : 'اختم يومك'}</p>
                        <p className="text-gray-900 dark:text-white font-bold text-lg">{isMorning ? t('home_dashboard_morning') : t('home_dashboard_evening')}</p>
                    </div>
                </button>

                {/* Random Category Tile */}
                {randomCategory && (
                    <button 
                        onClick={() => navigate('azkarList', { categoryId: randomCategory.id })}
                        className="bg-white dark:bg-[#1A3129] rounded-2xl p-4 flex flex-col justify-between items-start border border-gray-100 dark:border-primary-500/10 hover:border-primary-200 dark:hover:border-primary-500/30 shadow-sm transition-colors"
                    >
                        <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400">
                            <randomCategory.icon className="w-6 h-6" />
                        </div>
                        <div className="text-right rtl:text-left w-full">
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase">{t('home_dashboard_random_cat')}</p>
                            <p className="text-gray-900 dark:text-white font-bold text-lg truncate w-full">{randomCategory.title}</p>
                        </div>
                    </button>
                )}
            </div>
        </div>
    );
};

export default DashboardLayout;
