
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon, MagnifyingGlassIcon, ChevronRightIcon, DocumentTextIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import { azkarRepository } from '../../data/azkarRepository';
import { Category, UserZikr } from '../../types';

const SearchScreen: React.FC = () => {
    const { navigate } = useAppContext();
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ categories: Category[], azkar: UserZikr[] }>({ categories: [], azkar: [] });
    const [activeTab, setActiveTab] = useState<'all' | 'categories' | 'azkar'>('all');

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 1) {
                const res = await azkarRepository.search(query);
                setResults(res);
            } else {
                setResults({ categories: [], azkar: [] });
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleCategoryClick = (id: string) => {
        navigate('azkarList', { categoryId: id });
    };

    const handleZikrClick = (zikr: UserZikr) => {
        // Navigate to the category list and scroll to specific ID
        navigate('azkarList', { categoryId: zikr.categoryId, initialScrollToId: zikr.id });
    };

    const hasResults = results.categories.length > 0 || results.azkar.length > 0;

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-transparent">
            {/* Header */}
            <div className="p-4 bg-white dark:bg-[#1A3129] shadow-sm z-10">
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                    <button onClick={() => navigate('home')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white rtl:rotate-180" />
                    </button>
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="ابحث عن ذكر أو فئة..."
                            className="w-full bg-gray-100 dark:bg-[#12241C] text-gray-900 dark:text-white rounded-xl py-3 pl-4 pr-10 rtl:pr-10 rtl:pl-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 rtl:space-x-reverse">
                    {['all', 'categories', 'azkar'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 dark:bg-[#12241C] text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            {tab === 'all' ? 'الكل' : tab === 'categories' ? 'الفئات' : 'الأذكار'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4 space-y-6">
                {!query && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <MagnifyingGlassIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p>ابدأ الكتابة للبحث</p>
                    </div>
                )}

                {query && !hasResults && (
                    <div className="text-center text-gray-500 mt-10">
                        لا توجد نتائج لـ "{query}"
                    </div>
                )}

                {/* Categories Results */}
                {(activeTab === 'all' || activeTab === 'categories') && results.categories.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 px-1">الفئات</h3>
                        <div className="space-y-2">
                            {results.categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className="w-full bg-white dark:bg-[#1A3129] p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-none shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full text-primary-600 dark:text-primary-400">
                                            <FolderIcon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-gray-900 dark:text-white">{cat.title}</span>
                                    </div>
                                    <ChevronRightIcon className="w-4 h-4 text-gray-400 rtl:rotate-180" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Azkar Results */}
                {(activeTab === 'all' || activeTab === 'azkar') && results.azkar.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 px-1">الأذكار</h3>
                        <div className="space-y-3">
                            {results.azkar.map((zikr, idx) => (
                                <button
                                    key={`${zikr.id}_${idx}`}
                                    onClick={() => handleZikrClick(zikr)}
                                    className="w-full bg-white dark:bg-[#1A3129] p-4 rounded-xl text-right border border-gray-100 dark:border-none shadow-sm hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-md">
                                            {(zikr as any).categoryTitle}
                                        </span>
                                        <DocumentTextIcon className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                                    </div>
                                    <p className="font-serif text-lg text-gray-800 dark:text-gray-100 line-clamp-3 leading-relaxed">
                                        {zikr.arabic}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchScreen;
