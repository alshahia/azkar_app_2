
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ShareIcon, HeartIcon, ClipboardIcon, PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useTranslation } from '../../hooks/useTranslation';

interface FocusLayoutProps {
    allAzkar: any[];
    onRefresh: () => void;
    currentZikr: any;
}

const FocusLayout: React.FC<FocusLayoutProps> = ({ onRefresh, currentZikr }) => {
    const { favorites, toggleFavorite, fontSize } = useAppContext();
    const { t } = useTranslation();
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 500);
        return () => clearTimeout(timer);
    }, [currentZikr]);

    const isFavorite = favorites.includes(currentZikr.id);

    // Dynamic Font Sizes
    const getArabicClass = (level: number) => {
        const sizes = ['text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl'];
        return sizes[level - 1] || 'text-4xl';
    };
    const arabicClass = getArabicClass(fontSize);

    return (
        <div className="h-full flex flex-col justify-center relative px-2">
            <div className={`transition-all duration-500 transform ${animate ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                <div className="bg-white dark:bg-[#1A3129] rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-primary-500/10 relative overflow-hidden transition-colors duration-300">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100/50 dark:bg-primary-500/5 rounded-bl-full -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100/50 dark:bg-primary-500/5 rounded-tr-full -ml-8 -mb-8"></div>

                    <div className="flex justify-between items-center mb-6">
                        <span className="text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-500/10 px-3 py-1 rounded-full">
                            {currentZikr.categoryName}
                        </span>
                        <div className="flex space-x-2 rtl:space-x-reverse">
                            <button onClick={() => toggleFavorite(currentZikr.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                {isFavorite ? <HeartSolid className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    <div className="min-h-[200px] flex items-center justify-center mb-8">
                        <p className={`${arabicClass} font-serif text-center text-gray-900 dark:text-white leading-loose`}>
                            {currentZikr.arabic}
                        </p>
                    </div>

                    {currentZikr.translation && (
                        <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-6 border-t border-gray-100 dark:border-gray-700/50 pt-4 italic">
                            {currentZikr.translation}
                        </p>
                    )}

                    <div className="flex justify-around items-center pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button className="flex flex-col items-center text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            <ShareIcon className="w-5 h-5 mb-1" />
                            <span className="text-[10px]">Share</span>
                        </button>
                        <button className="flex flex-col items-center text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            <ClipboardIcon className="w-5 h-5 mb-1" />
                            <span className="text-[10px]">Copy</span>
                        </button>
                        <button className="flex flex-col items-center text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                            <PlayIcon className="w-5 h-5 mb-1" />
                            <span className="text-[10px]">Play</span>
                        </button>
                    </div>
                </div>
            </div>

            <button 
                onClick={onRefresh}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-primary-500 hover:bg-primary-600 text-white rounded-full px-8 py-3 shadow-lg shadow-primary-500/20 flex items-center space-x-2 rtl:space-x-reverse transition-all active:scale-95"
            >
                <ArrowPathIcon className="w-5 h-5" />
                <span className="font-bold">{t('home_refresh')}</span>
            </button>
        </div>
    );
};

export default FocusLayout;
