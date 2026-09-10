
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon, MagnifyingGlassIcon, ChevronRightIcon, DocumentTextIcon, FolderIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import { azkarRepository } from '../../data/azkarRepository';
import { Category, UserZikr } from '../../types';
import { SURAHS, getSurah, loadSurah } from '../../services/QuranService';
import { stripClitic, normalizeWord as _normalizeWordForSearch, CLOSED_FORMS } from '../../workers/quranSearchTokens';

type Tab = 'all' | 'quran' | 'categories' | 'azkar';

interface QuranHit {
    surah: number;
    ayah: number;
    /** Raw ayah text + char-offset spans in that text that match query tokens. */
    rawText: string;
    highlights: Array<[number, number]>;
}

interface QuranSearchResponse {
    id: number;
    type: 'result';
    results: Array<{ s: number; a: number; h: number[] }>;
    queryTokens: string[];
}

/** Render a raw ayah text with <mark> spans for the given char ranges. */
const renderWithHighlights = (raw: string, ranges: Array<[number, number]>) => {
    if (ranges.length === 0) return raw;
    const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
    const merged: Array<[number, number]> = [];
    for (const [s, e] of sorted) {
        const last = merged[merged.length - 1];
        if (last && s <= last[1]) last[1] = Math.max(last[1], e);
        else merged.push([s, e]);
    }
    const out: React.ReactNode[] = [];
    let cursor = 0;
    merged.forEach(([s, e], i) => {
        if (s > cursor) out.push(raw.slice(cursor, s));
        out.push(<mark key={i} className="bg-primary-200 dark:bg-primary-700/60 text-inherit rounded px-0.5">{raw.slice(s, e)}</mark>);
        cursor = e;
    });
    if (cursor < raw.length) out.push(raw.slice(cursor));
    return out;
};

/**
 * Scan the raw ayah text for query-token matches and return char-offset spans.
 * Uses the SAME tokenize rules as workers/quranSearchTokens.ts so the
 * worker's index and the on-screen highlights agree byte-for-byte.
 *
 * Exported (with underscore prefix) so the test can verify the highlights
 * without spinning up a worker.
 */
export const _computeHighlightsForTest = (
    rawAyahText: string,
    queryTokens: string[],
): Array<[number, number]> => {
    if (!rawAyahText || queryTokens.length === 0) return [];
    const SPLIT = /[\s\u060C\u061B\u061F.,;:!?()\[\]{}"`]+/;
    const out: Array<[number, number]> = [];
    let i = 0;
    const len = rawAyahText.length;
    while (i < len) {
        const ch = rawAyahText[i];
        if (SPLIT.test(ch)) { i++; continue; }
        let j = i;
        while (j < len && !SPLIT.test(rawAyahText[j])) j++;
        const word = rawAyahText.slice(i, j);
        const stem = stripClitic(_normalizeWordForSearch(word));
        if (stem) {
            for (const qt of queryTokens) {
                if (stem === qt || stem.startsWith(qt)) { out.push([i, j]); break; }
            }
        }
        i = j;
    }
    return out;
};
// Reference CLOSED_FORMS so the import isn't tree-shaken - the test suite
// imports CLOSED_FORMS via this module's transitive dependency.
void CLOSED_FORMS;

const SearchScreen: React.FC = () => {
    const { navigate } = useAppContext();
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{ categories: Category[], azkar: UserZikr[] }>({ categories: [], azkar: [] });
    const [activeTab, setActiveTab] = useState<Tab>('all');
    const [quranHits, setQuranHits] = useState<QuranHit[]>([]);
    const [quranReady, setQuranReady] = useState(false);

    const requestSeqRef = useRef(0);
    const quranSeqRef = useRef(0);
    const workerRef = useRef<Worker | null>(null);
    const inflightRef = useRef<Map<number, (msg: QuranSearchResponse) => void>>(new Map());

    const ensureWorker = useCallback((): Worker | null => {
        if (typeof Worker === 'undefined') return null;
        if (workerRef.current) return workerRef.current;
        try {
            const w = new Worker(new URL('../../workers/search.worker.ts', import.meta.url), { type: 'module' });
            w.onmessage = (e: MessageEvent<any>) => {
                const msg = e.data;
                if (msg && msg.type === 'ready') { setQuranReady(true); return; }
                if (msg && msg.type === 'result') {
                    const cb = inflightRef.current.get(msg.id);
                    if (cb) { inflightRef.current.delete(msg.id); cb(msg as QuranSearchResponse); }
                }
            };
            workerRef.current = w;
            w.postMessage({ id: 0, type: 'load' });
            return w;
        } catch {
            return null;
        }
    }, []);

    const surahsById = useMemo(() => {
        const m = new Map<number, typeof SURAHS[number]>();
        for (const s of SURAHS) m.set(s.id, s);
        return m;
    }, []);

    useEffect(() => {
        if (activeTab !== 'quran' && activeTab !== 'all') {
            setQuranHits([]);
            return;
        }
        if (!query.trim()) {
            setQuranHits([]);
            return;
        }
        const seq = ++quranSeqRef.current;
        const handle = setTimeout(async () => {
            const w = ensureWorker();
            if (!w) return;
            inflightRef.current.set(seq, async (msg) => {
                if (seq !== quranSeqRef.current) return;
                const hits: QuranHit[] = [];
                const surahGroups = new Map<number, typeof msg.results>();
                for (const r of msg.results) {
                    const arr = surahGroups.get(r.s);
                    if (arr) arr.push(r); else surahGroups.set(r.s, [r]);
                }
                for (const [surah, list] of surahGroups) {
                    let ayahs;
                    try { ayahs = await loadSurah(surah); } catch { continue; }
                    const ayahByNum = new Map<number, typeof ayahs[number]>();
                    for (const a of ayahs) ayahByNum.set(a.number, a);
                    for (const r of list) {
                        const a = ayahByNum.get(r.a);
                        if (!a) continue;
                        hits.push({
                            surah: r.s,
                            ayah: r.a,
                            rawText: a.text,
                            highlights: _computeHighlightsForTest(a.text, msg.queryTokens),
                        });
                    }
                }
                if (seq === quranSeqRef.current) setQuranHits(hits);
            });
            w.postMessage({ id: seq, type: 'search', query: query.trim(), mode: 'and' });
        }, 300);
        return () => clearTimeout(handle);
    }, [query, activeTab, ensureWorker]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.trim().length > 1) {
                const seq = ++requestSeqRef.current;
                try {
                    const res = await azkarRepository.search(query);
                    if (seq === requestSeqRef.current) {
                        setResults(res);
                    }
                } catch (error) {
                    console.error('Search failed:', error);
                }
            } else {
                requestSeqRef.current++;
                setResults({ categories: [], azkar: [] });
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleCategoryClick = (id: string) => {
        navigate('azkarList', { categoryId: id });
    };

    const handleZikrClick = (zikr: UserZikr) => {
        navigate('azkarList', { categoryId: zikr.categoryId, initialScrollToId: zikr.id });
    };

    const handleQuranHitClick = (surah: number, ayah: number) => {
        navigate('surahReader', { surahId: surah, ayah });
    };

    const hasResults = results.categories.length > 0 || results.azkar.length > 0 || quranHits.length > 0;

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-transparent">
            <div className="p-4 bg-white dark:bg-[#1A3129] shadow-sm dark:shadow-none z-10">
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                    <button onClick={() => navigate('home')} aria-label="رجوع" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white rtl:rotate-180" />
                    </button>
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('search_placeholder_quran_azkar')}
                            className="w-full bg-gray-100 dark:bg-[#12241C] text-gray-900 dark:text-white rounded-xl py-3 pl-4 pr-10 rtl:pr-10 rtl:pl-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex space-x-2 rtl:space-x-reverse overflow-x-auto">
                    {(['all', 'quran', 'categories', 'azkar'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${

                                activeTab === tab
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 dark:bg-[#12241C] text-gray-600 dark:text-gray-400'

                            }`}
                        >
                            {tab === 'all' ? t('search_tab_all') :
                                tab === 'quran' ? t('search_tab_quran') :
                                tab === 'categories' ? t('search_tab_categories') :
                                t('search_tab_azkar')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-6">
                {!query && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <MagnifyingGlassIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p>{t('search_empty_hint')}</p>
                    </div>
                )}

                {query && !hasResults && (
                    <div className="text-center text-gray-500 mt-10">
                        {String.fromCharCode(34) + query + String.fromCharCode(34) + ' ' + t('search_empty_results')}
                    </div>
                )}

                {/* Quran Results */}
                {(activeTab === 'all' || activeTab === 'quran') && quranHits.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 px-1">{t('search_tab_quran')}</h3>
                        <div className="space-y-3">
                            {quranHits.map(hit => {
                                const surah = surahsById.get(hit.surah) ?? getSurah(hit.surah);
                                return (
                                    <button
                                        key={hit.surah + ':' + hit.ayah}
                                        onClick={() => handleQuranHitClick(hit.surah, hit.ayah)}
                                        className="w-full bg-white dark:bg-[#1A3129] p-4 rounded-xl text-right border border-gray-100 dark:border-none shadow-sm dark:shadow-none hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md">
                                                {surah?.name ?? 'سورة ' + hit.surah} • {t('home_ayah_word')} {hit.ayah}
                                            </span>
                                            <BookOpenIcon className="w-4 h-4 text-gray-300" />
                                        </div>
                                        <p className="font-serif text-lg text-gray-800 dark:text-gray-100 leading-relaxed" dir="rtl">
                                            {renderWithHighlights(hit.rawText, hit.highlights)}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Categories Results */}
                {(activeTab === 'all' || activeTab === 'categories') && results.categories.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 px-1">{t('search_tab_categories')}</h3>
                        <div className="space-y-2">
                            {results.categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat.id)}
                                    className="w-full bg-white dark:bg-[#1A3129] p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-none shadow-sm dark:shadow-none hover:shadow-md transition-all"
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
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 px-1">{t('search_tab_azkar')}</h3>
                        <div className="space-y-3">
                            {results.azkar.map((zikr, idx) => (
                                <button
                                    key={`${zikr.id}_${idx}`}
                                    onClick={() => handleZikrClick(zikr)}
                                    className="w-full bg-white dark:bg-[#1A3129] p-4 rounded-xl text-right border border-gray-100 dark:border-none shadow-sm dark:shadow-none hover:shadow-md transition-all group"
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

                {(activeTab === 'quran' || activeTab === 'all') && query && !quranReady && quranHits.length === 0 && (
                    <p className="text-center text-gray-400 text-xs">{t('search_quran_loading')}</p>
                )}
            </div>
        </div>
    );
};

export default SearchScreen;
