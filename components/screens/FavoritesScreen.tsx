
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MagnifyingGlassIcon, ArrowLeftIcon, HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

const FavoritesScreen: React.FC = () => {
    const { navigate, favorites, toggleFavorite, categories } = useAppContext();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');

    const allAzkar = categories.flatMap(cat => cat.azkar);
    const favoriteAzkar = allAzkar.filter(zikr => favorites.includes(zikr.id));

    const filteredFavorites = favoriteAzkar.filter(zikr => 
        zikr.arabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (zikr.translation && zikr.translation.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex items-center mb-6">
                <button onClick={() => navigate('home')} aria-label="رجوع" className="p-2 -ml-2 rtl:-mr-2 rtl:ml-0">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mx-auto">{t('favorites_title')}</h1>
                <div className="w-6"></div>
            </header>
            
            <div className="relative mb-6">
                <MagnifyingGlassIcon className="absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                    type="text"
                    placeholder={t('favorites_search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-[#1A3129] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-none rounded-full py-3 pl-12 pr-4 rtl:pr-12 rtl:pl-4 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm dark:shadow-none transition-colors"
                />
            </div>

            <div className="flex-grow overflow-y-auto">
                {filteredFavorites.length > 0 ? (
                    filteredFavorites.map(zikr => (
                        <div key={zikr.id} className="flex items-start justify-between p-4 mb-3 bg-white dark:bg-[#1A3129] rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-none transition-colors">
                            <div className="flex-grow pr-4 rtl:pr-0 rtl:pl-4">
                                <p className="text-lg font-serif text-right mb-2 text-gray-900 dark:text-white">{zikr.arabic}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 text-left rtl:text-right">{zikr.translation}</p>
                            </div>
                            <button onClick={() => toggleFavorite(zikr.id)} aria-label="إزالة من المفضلة" className="p-2 shrink-0">
                                <HeartSolid className="w-6 h-6 text-red-500" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                            <HeartOutline className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">{t('favorites_empty_title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{t('favorites_empty_desc')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FavoritesScreen;
