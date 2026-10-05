import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon, BookOpenIcon, BookmarkIcon, XMarkIcon, Squares2X2Icon } from '@heroicons/react/24/outline';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useQuranStore } from '../../stores/useQuranStore';
import { useTranslation } from '../../hooks/useTranslation';
import { searchSurahs, getSurah, prefetchSurahData } from '../../services/QuranService';
import SurahRow from '../quran/SurahRow';
import JuzChips from '../quran/JuzChips';

/**
 * Surah index: resume banner, juz shortcuts, search, list.
 * 
 * OPTIMIZED: Now prefetches first few surahs in background for faster
 * initial page loads when user opens Mushaf mode.
 */
const QuranScreen: React.FC = () => {
    const navigate = useNavigationStore((state) => state.navigate);
    const lastRead = useQuranStore((state) => state.lastRead);
    const bookmarks = useQuranStore((state) => state.bookmarks);
    const clearLastRead = useQuranStore((state) => state.clearLastRead);
    const readHistory = useQuranStore((state) => state.readHistory);
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [prefetching, setPrefetching] = useState(true);

    const results = useMemo(() => searchSurahs(query), [query]);

    const lastSurah = lastRead ? getSurah(lastRead.surah) : null;
    const bookmarkCountBySurah = useMemo(() => {
        const map = new Map<number, number>();
        for (const b of bookmarks) map.set(b.surah, (map.get(b.surah) || 0) + 1);
        return map;
    }, [bookmarks]);

    // Prefetch first 10 surahs in background for faster Mushaf loading.
    // `prefetching` starts true so the first paint already shows the
    // indicator; only the settle callback clears it, which keeps the effect
    // body free of synchronous setState. The cancelled flag stops the
    // callback from touching state after the screen unmounts.
    useEffect(() => {
        let cancelled = false;
        prefetchSurahData([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
            .finally(() => {
                if (!cancelled) setPrefetching(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div className="min-h-full bg-surface dark:bg-surface pb-10">
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
                    <button
                        onClick={() => navigate('khatma')}
                        className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                        aria-label="ختم القرآن"
                        title="ختم القرآن"
                    >
                        <BookmarkIcon className="w-5 h-5" />
                    </button>
                </header>

                {/* Resume banner — auto-tracked from the last ayah the user reached,
                    independent of bookmarks. Tap to continue reading; tap the X to
                    dismiss the saved position (e.g. after finishing a surah). */}
                {lastSurah && (
                    <div className="w-full bg-white/15 hover:bg-white/20 transition-colors rounded-2xl p-4 text-right rtl:text-right backdrop-blur-sm relative">
                        <button
                            onClick={() => navigate('surahReader', { surahId: lastRead!.surah, ayah: lastRead!.ayah })}
                            className="w-full text-right rtl:text-right"
                        >
                            <p className="text-[11px] text-white/80 uppercase tracking-widest mb-1">{t('quran_resume_title')}</p>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-quran text-xl text-white truncate">{lastSurah.name}</p>
                                    <p className="text-xs text-white/80 truncate">{lastSurah.transliteration} • آية {lastRead!.ayah}</p>
                                </div>
                                <span className="text-xs font-bold text-primary-700 bg-white px-3 py-1.5 rounded-full flex-shrink-0">
                                    {t('quran_resume_continue')}
                                </span>
                            </div>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); clearLastRead(); }}
                            aria-label={t('quran_resume_clear')}
                            className="absolute top-2 left-2 rtl:left-auto rtl:right-2 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white/80"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            <div className="px-4 -mt-6 relative z-20">
                {/* Read history (M3-T5): recent surahs the user opened in a
                 * SurahReader session. Tap to jump back to that reading
                 * spot. The resume banner above stays first in priority -
                 * this list augments it for sessions older than the most
                 * recent. */}
                {readHistory.length > 0 && (
                    <div className="bg-surface-card dark:bg-surface-card rounded-2xl border border-gray-100 dark:border-primary-500/10 shadow-sm dark:shadow-none px-4 py-3 mb-5">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-2">آخر القراءة</h3>
                        <ul className="space-y-1.5">
                            {readHistory.slice(0, 5).map((h, i) => {
                                const s = getSurah(h.surah);
                                const arabicAyah = h.ayah.toString().replace(/d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
                                return (
                                    <li key={i + ':' + h.surah + ':' + h.ayah + ':' + h.ts}>
                                        <button
                                            onClick={() => navigate('surahReader', { surahId: h.surah, ayah: h.ayah })}
                                            className="w-full flex items-center justify-between gap-3 px-2 py-2 rounded-xl hover:bg-surface-card-2 dark:hover:bg-surface active:scale-[0.99] transition-transform text-right rtl:text-right"
                                        >
                                            <span className="font-quran text-base text-gray-800 dark:text-gray-100 truncate">{s ? s.name : ('سورة ' + h.surah)}</span>
                                            <span className="text-[11px] text-gray-500 dark:text-gray-400">آية {arabicAyah}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* Search */}
                <div className="bg-surface-card dark:bg-surface-card rounded-2xl shadow-md dark:shadow-none border border-gray-100 dark:border-primary-500/10 flex items-center gap-3 px-4 py-3 mb-5">
                    <MagnifyingGlassIcon aria-hidden="true" className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t('quran_search_placeholder')}
                        aria-label={t('quran_search_placeholder')}
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
                    <div className="bg-surface-card dark:bg-surface-card rounded-2xl border border-gray-100 dark:border-primary-500/10 p-4 mb-5 shadow-sm dark:shadow-none">
                        <JuzChips />
                    </div>
                )}

                {/* Bookmarks shortcut */}
                {!query && bookmarks.length > 0 && (
                    <button
                        onClick={() => navigate('surahReader', { bookmarksOnly: true })}
                        className="w-full mb-5 bg-surface-card dark:bg-surface-card rounded-2xl border border-gray-100 dark:border-primary-500/10 shadow-sm dark:shadow-none px-4 py-3 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <BookmarkIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{t('quran_bookmarks')}</span>
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{bookmarks.length}</span>
                    </button>
                )}

                {/* Mushaf page-mode entry. Opens the screen at the first page;
                    the user can navigate from there. Hidden during search to
                    keep the results list uncluttered. */}
                {!query && (
                    <button
                        onClick={() => navigate('mushafPage', { page: 1 })}
                        className="w-full mb-5 bg-surface-card dark:bg-surface-card rounded-2xl border border-gray-100 dark:border-primary-500/10 shadow-sm dark:shadow-none px-4 py-3 flex items-center justify-between gap-3 active:scale-[0.99] transition-transform"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <Squares2X2Icon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                            <div className="text-right rtl:text-right min-w-0">
                                <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{t('quran_mushaf_open')}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{t('quran_mushaf_open_desc')}</p>
                            </div>
                        </div>
                        <ArrowLeftIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 rtl:rotate-180 flex-shrink-0" />
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

                {/* Prefetch indicator */}
                {prefetching && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 text-[10px]">
                        <div className="w-3 h-3 border border-gray-300 dark:border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>تحميل البيانات للاستخدام دون اتصال...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuranScreen;
