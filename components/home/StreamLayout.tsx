
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ShareIcon, HeartIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { shareText, copyText } from '../../utils/share';

const getRandomZikrList = (allAzkar: any[], count: number) => {
    const shuffled = [...allAzkar].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

interface StreamLayoutProps {
    allAzkar: any[];
}

const StreamLayout: React.FC<StreamLayoutProps> = ({ allAzkar }) => {
    const { fontSize, favorites, toggleFavorite } = useAppContext();
    const [streamData, setStreamData] = useState<any[]>([]);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const handleCopy = async (zikr: any) => {
        if (await copyText(zikr.arabic)) {
            setCopiedId(zikr.id);
            setTimeout(() => setCopiedId((cur) => (cur === zikr.id ? null : cur)), 1500);
        }
    };

    useEffect(() => {
        setStreamData(getRandomZikrList(allAzkar, 20));
    }, [allAzkar]);

    const getArabicClass = (level: number) => {
        const sizes = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'];
        return sizes[level - 1] || 'text-2xl';
    };
    const arabicClass = getArabicClass(fontSize);

    return (
        <div className="space-y-4 pb-20">
            {streamData.map((zikr, idx) => {
                const isFavorite = favorites.includes(zikr.id);
                return (
                    <div key={`${zikr.id}-${idx}`} className="bg-white dark:bg-[#1A3129] rounded-xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm dark:shadow-none transition-colors duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-bold">
                                    {zikr.categoryName.charAt(0)}
                                </div>
                                <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{zikr.categoryName}</span>
                            </div>
                            <button onClick={() => toggleFavorite(zikr.id)} aria-label={isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}>
                                {isFavorite ? <HeartSolid className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-gray-600" />}
                            </button>
                        </div>
                        <p className={`${arabicClass} font-serif text-right text-gray-900 dark:text-white leading-relaxed mb-3`}>
                            {zikr.arabic}
                        </p>
                        <div className="flex justify-between items-center text-gray-500 dark:text-gray-500 text-xs mt-4">
                            <span>{zikr.reference ? zikr.reference : ''}</span>
                            <div className="flex space-x-4 rtl:space-x-reverse text-gray-400 dark:text-gray-500">
                                <button onClick={() => shareText(zikr.categoryName || 'أذكار', zikr.arabic)} aria-label="مشاركة" className="hover:text-primary-500"><ShareIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleCopy(zikr)} aria-label="نسخ" className="hover:text-primary-500">
                                    {copiedId === zikr.id ? <CheckIcon className="w-4 h-4 text-primary-500" /> : <ClipboardIcon className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div className="text-center text-gray-500 text-sm py-4">انتهت القائمة</div>
        </div>
    );
};

export default StreamLayout;
