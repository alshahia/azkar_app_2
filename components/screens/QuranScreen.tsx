import React, { useMemo, useState } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon, BookOpenIcon, BookmarkIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { searchSurahs, getSurah } from '../../services/QuranService';
import SurahRow from '../quran/SurahRow';
import JuzChips from '../quran/JuzChips';

/**
 * Surah index: resume banner, juz shortcuts, search, list.
 */
const QuranScreen: React.FC = () => {
    const { navigate, quranLastRead, quranBookmarks, clearQuranLastRead } = useAppContext();
    const { t } = useTranslation();
    const [query, setQuery] = useState('');

    const results = useMemo(() => searchSurahs(query), [query]);

    const lastSurah = quranLastRead ? getSurah(quranLastRead.surah) : null;
    const bookmarkCountBySurah = useMemo(() => {
        const map = new Map<number, number>();
        for (const b of quranBookmarks) map.set(b.surah, (map.get(b.surah) || 0) + 1);
        return map;
    }, [quranBookmarks]);

    return (
        <div className="min-h-full bg-gray-50 dark:bg-[#12241C] pb-10">
            {/* Header */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 pb-8 pt-4 px-4 rounded-b-[2.5rem] shadow-lg relative z-10">
                <header className="flex items-center justify-between mb-5">
                    <button
                        onClick={() => navigate('home')}
                        className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                        aria-label="العودة"
                    >
                        <ArrowLeftIcon className="w-6 h-6 rtl:rotate-180" />
                    </button>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <BookOpenIcon className="w-6 h-6" />
                        {t('quran_title')}
                    </h1>
                    <div className="w-10" />
                </header>

                {/* Resume banner — auto-tracked from the last ayah the user reached,
                    independent of bookmarks. Tap to continue reading; tap the X to
                    dismiss the saved position (e.g. after finishing a surah). */}
                {lastSurah && (
                    <div className="w-full bg-white/15 hover:bg-white/20 transition-colors rounded-2xl p-4 text-right rtl:text-right backdrop-blur-sm relative">
                        <button
                            onClick={() => navigate('surahReader', { surahId: quranLastRead!.surah, ayah: quranLastRead!.ayah })}
                            className="w-full text-right rtl:text-right"
                        >
                            <p className="text-[11px] text-white/80 uppercase tracking-widest mb-1">{t('quran_resume_title')}</p>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-quran text-xl text-white truncate">{lastSurah.name}</p>
                                    <p className="text-xs text-white/80 truncate">{lastSurah.transliteration} • آية {quranLastRead!.ayah}</p>
                                </div>
                                <span className="text-xs font-bold text-primary-700 bg-white px-3 py-1.5 rounded-full flex-shrink-0">
                                    {t('quran_resume_continue')}
                                </span>
                            </div>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); clearQuranLastRead(); }}
                            aria-label={t('quran_resume_clear')}
                            className="absolute top-2 left-2 rtl:left-auto rtl:right-2 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white/80"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="px-4 -mt-6 relative z-20">
                {/* Search */}
                <div className="bg-white dark:bg-[#1A3129] rounded-2xl shadow-md dark:shadow-none border border-gray-100 dark:border-primary-500/10 flex items-center gap-3 px-4 py-3 mb-5">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t('quran_search_placeholder')}
                        className="flex-1 bg-transparent border-none outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm"
                        dir="rtl"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="text-xs text-gray-400 hover:text-gray-600">
                            مسح
                        </button>
                    )}
                </div>

                {/* Juz chips - only show when not searching */}
                {!query && (
                    <div className="bg-white dark:bg-[#1A3129] rounded-2xl border border-gray-100 dark:border-primary-500/10 p-4 mb-5 shadow-sm dark:shadow-none">
                        <JuzChips onPick={(s, a) => navigate('surahReader', { surahId: s, ayah: a })} />
                    </div>
                )}

                {/* Bookmarks shortcut */}
                {!query && quranBookmarks.length > 0 && (
                    <button
                        onClick={() => navigate('surahReader', { bookmarksOnly: true })}
                        className="w-full mb-5 bg-white dark:bg-[#1A3129] rounded-2xl border border-gray-100 dark:border-primary-500/10 shadow-sm dark:shadow-none px-4 py-3 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <BookmarkIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{t('quran_bookmarks')}</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{quranBookmarks.length}</span>
                    </button>
                )}

                {/* List */}
                <div className="space-y-2">
                    {results.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">{t('quran_no_results')}</p>
                    ) : (
                        results.map(s => (
                            <SurahRow
                                key={s.id}
                                surah={s}
                                bookmarkCount={bookmarkCountBySurah.get(s.id) || 0}
                                onOpen={() => navigate('surahReader', { surahId: s.id })}
                            />
                        ))
                    )}
                </div>

                {/* Offline note */}
                {!query && (
                    <p className="mt-6 text-center text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed px-4">
                        {t('quran_offline_banner')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default QuranScreen;
