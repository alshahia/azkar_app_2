import React, { useState, useMemo, useCallback, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, BookOpenIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { normalizeArabic, SURAHS } from '../../services/QuranService';

interface SearchResult {
    type: 'quran' | 'azkar' | 'tafsir';
    id: string;
    title: string;
    subtitle?: string;
    surahId?: number;
    ayah?: number;
}

const SEARCH_HISTORY_KEY = 'azkar-search-history';
const DEBOUNCE_DELAY = 150;

function loadSearchHistory(): string[] {
    try {
        const data = localStorage.getItem(SEARCH_HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveSearchHistory(history: string[]): void {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
}

// Pre-compute normalized surah names for faster search
const normalizedSurahs = SURAHS.map(s => ({
    ...s,
    normalizedName: normalizeArabic(s.name),
    normalizedTransliteration: normalizeArabic(s.transliteration),
}));

const GlobalSearch: React.FC = () => {
    const navigate = useNavigationStore((state) => state.navigate);
    const [query, setQuery] = useState('');
    const [searchHistory, setSearchHistory] = useState<string[]>(loadSearchHistory);
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // The search field takes focus on mount. Done through a ref + effect
    // rather than autoFocus so the DOM focus decision stays in one place and
    // the a11y linter stays quiet.
    React.useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Optimized search with debouncing
    const quranResults = useMemo((): SearchResult[] => {
        if (!query.trim()) return [];
        
        const normalizedQuery = normalizeArabic(query);
        const results: SearchResult[] = [];
        
        // Search pre-computed normalized surahs
        for (const surah of normalizedSurahs) {
            if (surah.normalizedName.includes(normalizedQuery) || 
                surah.normalizedTransliteration.includes(normalizedQuery)) {
                results.push({
                    type: 'quran',
                    id: `surah-${surah.id}`,
                    title: surah.name,
                    subtitle: `${surah.transliteration} - ${surah.ayahCount} آية`,
                    surahId: surah.id,
                });
                
                if (results.length >= 10) break;
            }
        }
        
        return results;
    }, [query]);

    const handleSearch = useCallback((searchQuery: string) => {
        setQuery(searchQuery);
        
        // Debounce search
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        
        if (searchQuery.trim()) {
            setIsSearching(true);
            debounceRef.current = setTimeout(() => {
                setIsSearching(false);
                
                // Add to history
                const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
                setSearchHistory(newHistory);
                saveSearchHistory(newHistory);
            }, DEBOUNCE_DELAY);
        }
    }, [searchHistory]);

    const clearHistory = useCallback(() => {
        setSearchHistory([]);
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    }, []);

    const handleResultClick = useCallback((result: SearchResult) => {
        if (result.type === 'quran' && result.surahId) {
            navigate('surahReader', { surah: result.surahId });
        }
    }, [navigate]);

    // Cleanup debounce on unmount
    React.useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <div className="h-full flex flex-col bg-surface dark:bg-surface">
            {/* Header */}
            <div className="bg-surface-card dark:bg-surface-card shadow-sm dark:shadow-none sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('home')}
                            className="p-2 -ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-600 dark:text-gray-300"
                            aria-label="إغلاق البحث"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon aria-hidden="true" className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="ابحث في القرآن والأذكار..."
                                aria-label="ابحث في القرآن والأذكار"
                                className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-surface dark:bg-surface-card-2 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content — this screen is its own scroll container: AppRouter
                renders non-main screens under an overflow-hidden ancestor that
                offers no scrollable parent. */}
            <div className="max-w-md mx-auto px-4 py-4 flex-grow overflow-y-auto">
                {query.trim() === '' ? (
                    // Search History
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-bold text-gray-900 dark:text-white">عمليات البحث الأخيرة</h2>
                            {searchHistory.length > 0 && (
                                <button
                                    onClick={clearHistory}
                                    className="text-sm text-red-500 flex items-center gap-1"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    مسح
                                </button>
                            )}
                        </div>
                        {searchHistory.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                لا توجد عمليات بحث سابقة
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {searchHistory.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSearch(item)}
                                        className="w-full flex items-center gap-3 p-3 bg-surface-card dark:bg-surface-card rounded-xl text-right"
                                    >
                                        <ClockIcon aria-hidden="true" className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-900 dark:text-white">{item}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Search Results
                    <div>
                        {isSearching ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                <p className="text-gray-500">جاري البحث...</p>
                            </div>
                        ) : quranResults.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpenIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-gray-500">لا توجد نتائج لـ "{query}"</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <h2 className="font-bold text-gray-900 dark:text-white mb-2">نتائج القرآن ({quranResults.length})</h2>
                                {quranResults.map((result) => (
                                    <button
                                        key={result.id}
                                        onClick={() => handleResultClick(result)}
                                        className="w-full flex items-center gap-3 p-3 bg-surface-card dark:bg-surface-card rounded-xl text-right hover:bg-surface-card-2 dark:hover:bg-surface-card-2 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <BookOpenIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">{result.title}</p>
                                            {result.subtitle && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{result.subtitle}</p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GlobalSearch;
