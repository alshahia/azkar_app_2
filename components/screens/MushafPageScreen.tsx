import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon,
    MinusIcon, PlusIcon, Squares2X2Icon, PaintBrushIcon, BookOpenIcon,
} from '@heroicons/react/24/outline';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { useKhatma } from '../../hooks/useKhatma';
import { useTranslation } from '../../hooks/useTranslation';
import {
    getPageAyahs, getPageSurahIds, getSurah, TOTAL_MUSHAF_PAGES,
    prefetchPageRange,
    type QuranAyah, type MushafMode,
} from '../../services/QuranService';
import PageFooter from '../quran/PageFooter';
import MushafModernView from '../quran/MushafModernView';
import TafsirSheet from '../quran/TafsirSheet';
import ProviderBoundary from '../common/ProviderBoundary';
import { preloadUthmaniFonts } from '../../utils/fontReady';

const MushafPixelView = lazy(() => import('../quran/MushafPixelView'));

const FONT_MIN = 18;
const FONT_MAX = 36;
const FONT_STEP = 2;
const FONT_DEFAULT = 24;
const FONT_LOAD_TIMEOUT_MS = 800;

interface MushafPageScreenProps {
    params?: { page?: number; surahId?: number; ayah?: number; khatmaId?: string };
}

/**
 * Mushaf page-mode reader. Renders one Madinah Mushaf page (1..604) at a time
 * with prev/next navigation, a font-size slider, and two render modes:
 *   - 'modern' : vertical flow of the page's ayahs grouped by surah, with
 *                the ornament surah header and page footer shown in image 1
 *   - 'pixel'  : the printed-Mushaf look from @tarekeldeeb/quran-madina-react
 *
 * Optional Tajweed coloring (Amiri Quran Colored) paints the rules via
 * OpenType color glyphs - no per-character markup required.
 *
 * Font-readiness: the Uthmani font uses font-display:block (see index.css),
 * which keeps text invisible until the file loads. We pre-warm it via
 * utils/fontReady before mounting the body so the reader does not flash
 * wrong-glyph shapes on first paint.
 *
 * OPTIMIZED: Now uses getPageAyahs() which only loads surahs for the current
 * page, and prefetches adjacent pages for smoother navigation.
 */
const MushafPageScreen: React.FC<MushafPageScreenProps> = ({ params }) => {
    const navigate = useNavigationStore((state) => state.navigate);
    const mushafMode = usePreferencesStore((state) => state.mushafMode);
    const setMushafMode = usePreferencesStore((state) => state.setMushafMode);
    const mushafTajweed = usePreferencesStore((state) => state.mushafTajweed);
    const setMushafTajweed = usePreferencesStore((state) => state.setMushafTajweed);
    const tafsirId = usePreferencesStore((state) => state.tafsirId);
    const setTafsirId = usePreferencesStore((state) => state.setTafsirId);
    const { markPageRead, getActiveKhatma } = useKhatma();
    // useKhatma re-creates markPageRead whenever the khatma/progress arrays
    // change. Keeping the latest callback in a ref lets the page-load effect
    // depend only on the page, so a khatma write can never re-trigger the load
    // (and re-mark) of the page that is already on screen.
    const markPageReadRef = useRef(markPageRead);
    useEffect(() => {
        markPageReadRef.current = markPageRead;
    }, [markPageRead]);
    const khatmaId = params?.khatmaId as string | undefined;
    const activeKhatma = getActiveKhatma();
    const { t } = useTranslation();

    const [page, setPage] = useState<number>(
        Math.min(TOTAL_MUSHAF_PAGES, Math.max(1, params?.page ?? 1))
    );
    const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
    // The page whose ayahs currently sit in `ayahs` (null until the first
    // load settles) plus the last failure tagged with the page it belongs to.
    // Deriving loading/error from these keeps the load effect body free of
    // synchronous setState while still showing the spinner immediately.
    const [loadedPage, setLoadedPage] = useState<number | null>(null);
    const [error, setError] = useState<{ page: number; message: string } | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [fontSize, setFontSize] = useState(FONT_DEFAULT);
    const [fontPanelOpen, setFontPanelOpen] = useState(false);
    const [fontReady, setFontReady] = useState(false);
    const [prefetching, setPrefetching] = useState(false);

    // Page-jump panel: lets the user type any page 1..TOTAL_MUSHAF_PAGES and
    // jump there. Toggled by tapping the centered page indicator in the
    // header. Lives in the screen header so it is available in both modern
    // and pixel mushaf modes (and persists if the user toggles mode while
    // it is open).
    const [pageJumpOpen, setPageJumpOpen] = useState(false);
    const [pageJumpInput, setPageJumpInput] = useState<string>('');
    const pageJumpInputRef = useRef<HTMLInputElement | null>(null);

    // In-app Tafsir opener. Set by tapping the per-ayah "التفسير" chip in
    // MushafModernView. Null when no sheet should be visible. The Tafsir
    // registry defaults to 'muyassar' (al-Muyassar, bundled locally), and
    // the user can swap to another registered tafsir from the sheet's picker.
    const [tafsirFor, setTafsirFor] = useState<{ surahId: number; ayah: number } | null>(null);

    // Load ayahs for the active page. `retryCount` is a dependency so the
    // error screen's retry button re-runs the load (re-setting the same page
    // value used to be a no-op that left the user stuck on the error).
    useEffect(() => {
        let cancelled = false;

        // requestAnimationFrame keeps the spinner painted before the load
        // starts and keeps this effect body free of synchronous setState.
        const rafId = requestAnimationFrame(() => {
            getPageAyahs(page)
                .then(arr => {
                    if (cancelled) return;
                    setAyahs(arr);
                    setLoadedPage(page);

                    // Track khatma progress if active
                    if (khatmaId) {
                        markPageReadRef.current(khatmaId, page, arr.length);
                    }

                    // Prefetch adjacent pages in background
                    setPrefetching(true);
                    prefetchPageRange(
                        Math.max(1, page - 2),
                        Math.min(TOTAL_MUSHAF_PAGES, page + 2)
                    ).finally(() => {
                        if (!cancelled) setPrefetching(false);
                    });
                })
                .catch(e => {
                    if (cancelled) return;
                    setError({ page, message: String(e?.message || e) });
                    setLoadedPage(page);
                });
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(rafId);
        };
    }, [page, khatmaId, retryCount]);

    // Warm the Uthmani font before the body mounts. The 800ms hard cap is a
    // safety valve: a flaky cache shouldn't pin the reader on a spinner
    // when the rest of the app already has the font in memory.
    useEffect(() => {
        let cancelled = false;
        const hardCap = window.setTimeout(
            () => { if (!cancelled) setFontReady(true); },
            FONT_LOAD_TIMEOUT_MS,
        );
        preloadUthmaniFonts()
            .then(() => { if (!cancelled) setFontReady(true); })
            .catch(() => { if (!cancelled) setFontReady(true); });
        return () => { cancelled = true; window.clearTimeout(hardCap); };
    }, []);

    const surahIds = useMemo(() => getPageSurahIds(ayahs), [ayahs]);
    const startingSurahId = surahIds[0];
    const endingSurahId = surahIds[surahIds.length - 1];
    const startingSurah = startingSurahId ? getSurah(startingSurahId) : null;

    const goPrev = useCallback(() => {
        setPage(p => Math.max(1, p - 1));
    }, []);
    const goNext = useCallback(() => {
        setPage(p => Math.min(TOTAL_MUSHAF_PAGES, p + 1));
    }, []);

    // M5-T8b: preserve the user's vertical scroll position when they
    // toggle between modern and pixel mushaf views. The new view mounts
    // a fresh DOM tree (different layout, different scroll height), so
    // we snapshot scrollTop before the switch and restore it after the
    // new view reports a non-zero scrollHeight (i.e., content is laid
    // out). The snapshot lives in a ref (NOT in render-time state) so
    // mutating it inside an event handler doesn't trip
    // react-hooks/immutability.
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const scrollSnapshotRef = useRef<{ value: number | null }>({ value: null });

    const setMode = useCallback((m: MushafMode) => {
        const current = bodyRef.current?.scrollTop ?? 0;
        scrollSnapshotRef.current.value = current > 0 ? current : null;
        setMushafMode(m);
    }, [setMushafMode]);

    // After the active view re-renders (ayahs are loaded or pixel lib
    // is ready), try to restore the captured scrollTop so the reader
    // stays on the same ayah within the page. tryRestoreScroll is a
    // pure helper that returns false when the content hasn't laid out
    // enough yet; the effect re-runs on every render and will pick up
    // the restored scrollTop on the next pass.
    useEffect(() => {
        const snap = scrollSnapshotRef.current;
        if (snap.value === null) return;
        if (!bodyRef.current) return;
        if (bodyRef.current.scrollHeight <= snap.value) return;
        bodyRef.current.scrollTop = snap.value;
        snap.value = null;
    });

    const cssVars = useMemo(() => ({
        ['--quran-fs' as never]: fontSize + 'px',
    }), [fontSize]);

    const toggleTajweed = useCallback(() => {
        setMushafTajweed(!mushafTajweed);
    }, [mushafTajweed, setMushafTajweed]);

    // Page-jump helpers. The clamp keeps out-of-range numbers (e.g. "0",
    // "700") inside the valid 1..TOTAL_MUSHAF_PAGES window. The panel is
    // mounted inside the screen header so it is available in both modern
    // and pixel modes; opening it also closes the Tafsir sheet to avoid
    // stacking modals. Focus is moved to the numeric input on open so the
    // soft keyboard appears immediately on mobile / the cursor lands on
    // the input on desktop.
    const openPageJump = useCallback(() => {
        setPageJumpInput(String(page));
        setPageJumpOpen(true);
        setTafsirFor(null);
    }, [page]);

    const closePageJump = useCallback(() => {
        setPageJumpOpen(false);
        setPageJumpInput('');
    }, []);

    const submitPageJump = useCallback(() => {
        const raw = parseInt(pageJumpInput, 10);
        if (Number.isFinite(raw)) {
            const clamped = Math.max(1, Math.min(TOTAL_MUSHAF_PAGES, raw));
            setPage(clamped);
        }
        setPageJumpOpen(false);
        setPageJumpInput('');
    }, [pageJumpInput]);

    const adjustPageJump = useCallback((delta: number) => {
        setPageJumpInput(prev => {
            const cur = parseInt(prev, 10);
            // Empty / NaN input falls back to the current page rather than
            // snapping to the start/end of the Mushaf, so a stray tap on a
            // +/- button while the field is empty nudges from where the
            // reader already is.
            const base = Number.isFinite(cur) ? cur : page;
            const next = base + delta;
            return String(Math.max(1, Math.min(TOTAL_MUSHAF_PAGES, next)));
        });
    }, [page]);

    const onPageJumpKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitPageJump();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closePageJump();
        }
    }, [submitPageJump, closePageJump]);

    // Focus the input whenever the panel opens. The input element itself is
    // remounted on every open (its parent is conditional), so an autoFocus
    // attribute would also work; the explicit ref keeps the behaviour
    // stable across browsers that delay autoFocus until after layout, and
    // also gives us a select() call so the existing number is pre-selected.
    useEffect(() => {
        if (pageJumpOpen && pageJumpInputRef.current) {
            pageJumpInputRef.current.focus();
            pageJumpInputRef.current.select();
        }
    }, [pageJumpOpen]);

    // `ayahs` only belong to the page that loaded them, so "not loaded yet"
    // is exactly "loadedPage is not the current page".
    const loading = loadedPage !== page;
    const errorMessage = error && error.page === page ? error.message : null;

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-surface dark:bg-surface" dir="rtl">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" aria-hidden></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-primary-600 text-lg font-quran">﷽</span>
                    </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">{t('quran_loading')}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">صفحة {page}</p>
            </div>
        );
    }
    if (!fontReady) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-surface dark:bg-surface" dir="rtl">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" aria-hidden></div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">جارٍ تحضير الخط...</p>
            </div>
        );
    }
    if (errorMessage || ayahs.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-surface dark:bg-surface px-6 text-center" dir="rtl">
                <div className="w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <p className="text-red-600 dark:text-red-400 mb-3 font-bold">{errorMessage || 'تعذر تحميل الصفحة.'}</p>
                <button 
                    onClick={() => {
                        setError(null);
                        setLoadedPage(null);
                        setRetryCount(c => c + 1);
                    }}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-bold text-sm transition-colors mb-2"
                >
                    إعادة المحاولة
                </button>
                <button 
                    onClick={() => navigate('quran')} 
                    className="text-primary-600 dark:text-primary-400 font-bold text-sm"
                >
                    العودة لفهرس السور
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-surface dark:bg-surface">
            {/* Header */}
            <div className="bg-primary-600 dark:bg-primary-700 pb-3 pt-4 px-4 shadow-md relative z-30">
                <header className="flex items-center justify-between mb-2">
                    <button onClick={() => navigate('quran')} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30" aria-label="العودة">
                        <ArrowLeftIcon className="w-5 h-5 rtl:rotate-180" />
                    </button>
                    <div className="text-center min-w-0 flex-1 px-3">
                        <p className="font-quran text-lg text-white truncate">
                            {startingSurah ? startingSurah.name : 'المصحف'}
                        </p>
                        {/* Centered page indicator. Doubles as the trigger for
                            the page-jump panel so the existing affordance
                            ("page X / 604") gains direct navigation without
                            adding a new button to the action row. */}
                        <button
                            type="button"
                            onClick={openPageJump}
                            className="text-[10px] text-white/80 uppercase tracking-widest hover:text-white transition-colors underline-offset-4 hover:underline cursor-pointer"
                            aria-label="اذهب إلى صفحة"
                            title="اذهب إلى صفحة"
                        >
                            صفحة {page} / {TOTAL_MUSHAF_PAGES}
                        </button>
                        {khatmaId && activeKhatma && (
                            <div className="mt-1">
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-[10px] text-white/70">الختمة:</span>
                                    <span className="text-[10px] text-white font-medium">{activeKhatma.name}</span>
                                </div>
                                <div className="w-24 h-1 bg-white/20 rounded-full mx-auto mt-1">
                                    <div
                                        className="h-full bg-white rounded-full transition-all"
                                        style={{ width: `${Math.round((activeKhatma.pagesRead.length / TOTAL_MUSHAF_PAGES) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setMode(mushafMode === 'modern' ? 'pixel' : 'modern')}
                            className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
                            aria-label="تبديل نمط العرض"
                            title={mushafMode === 'modern' ? 'عرض المصحف المطبوع' : 'العرض الحديث'}
                        >
                            {mushafMode === 'modern'
                                ? <BookOpenIcon className="w-5 h-5" />
                                : <Squares2X2Icon className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={toggleTajweed}
                            className={`p-2 rounded-full text-white transition-colors ${mushafTajweed ? 'bg-amber-400/90 text-amber-950' : 'bg-white/20 hover:bg-white/30'}`}
                            aria-label="تلوين التجويد"
                            title="تلوين التجويد"
                        >
                            <PaintBrushIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setFontPanelOpen(o => !o)} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30" aria-label="حجم الخط">
                            <span className="font-quran text-sm font-bold">Aa</span>
                        </button>
                    </div>
                </header>

                {/* Page nav + font size */}
                <div className="flex items-center justify-between gap-2 mt-1">
                    <button
                        onClick={goPrev}
                        disabled={page <= 1}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold disabled:opacity-30 transition-colors"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                        <span>السابقة</span>
                    </button>
                    <div className="px-3 py-1 rounded-full bg-white/15 text-white text-sm font-quran font-bold tabular-nums">
                        {page}
                    </div>
                    <button
                        onClick={goNext}
                        disabled={page >= TOTAL_MUSHAF_PAGES}
                        className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold disabled:opacity-30 transition-colors"
                    >
                        <span>التالية</span>
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Prefetch indicator */}
                {prefetching && (
                    <div className="mt-2 flex items-center justify-center gap-2 text-white/60 text-[10px]">
                        <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin"></div>
                        <span>تحميل الصفحات المجاورة...</span>
                    </div>
                )}

                {/* Page-jump panel. Direct numeric entry plus ±1 / ±10 quick
                    buttons. Available in both modern and pixel modes since it
                    lives in the screen header (not inside a view). Closing
                    resets the input so the next open starts clean. */}
                {pageJumpOpen && (
                    <div className="mt-3 bg-white/10 rounded-2xl px-4 py-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-white text-xs font-bold">اذهب إلى صفحة</span>
                            <span className="text-white/60 text-[10px] tabular-nums" dir="ltr">1 - {TOTAL_MUSHAF_PAGES}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                ref={pageJumpInputRef}
                                type="number"
                                inputMode="numeric"
                                min={1}
                                max={TOTAL_MUSHAF_PAGES}
                                value={pageJumpInput}
                                onChange={(e) => setPageJumpInput(e.target.value)}
                                onKeyDown={onPageJumpKeyDown}
                                className="flex-1 min-w-0 bg-white/20 text-white placeholder-white/50 rounded-xl px-3 py-2 text-center font-quran font-bold text-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-white/40"
                                placeholder={`1 - ${TOTAL_MUSHAF_PAGES}`}
                                aria-label="رقم الصفحة"
                            />
                            <button
                                type="button"
                                onClick={submitPageJump}
                                className="px-4 py-2 bg-white text-primary-700 rounded-xl font-bold text-sm hover:bg-white/90 active:bg-white/80 transition-colors"
                            >
                                اذهب
                            </button>
                            <button
                                type="button"
                                onClick={closePageJump}
                                className="px-3 py-2 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 active:bg-white/30 transition-colors"
                                aria-label="إلغاء"
                            >
                                إلغاء
                            </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-white/60 text-[10px]">تعديل سريع</span>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => adjustPageJump(-10)}
                                    disabled={(parseInt(pageJumpInput, 10) || page) <= 1}
                                    className="px-2 py-1 bg-white/10 text-white/90 rounded-lg text-[11px] font-bold tabular-nums hover:bg-white/20 disabled:opacity-40 transition-colors"
                                    aria-label="قبل 10 صفحات"
                                >
                                    −١٠
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustPageJump(-1)}
                                    disabled={(parseInt(pageJumpInput, 10) || page) <= 1}
                                    className="px-2 py-1 bg-white/10 text-white/90 rounded-lg text-[11px] font-bold tabular-nums hover:bg-white/20 disabled:opacity-40 transition-colors"
                                    aria-label="قبل صفحة"
                                >
                                    −١
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustPageJump(1)}
                                    disabled={(parseInt(pageJumpInput, 10) || page) >= TOTAL_MUSHAF_PAGES}
                                    className="px-2 py-1 bg-white/10 text-white/90 rounded-lg text-[11px] font-bold tabular-nums hover:bg-white/20 disabled:opacity-40 transition-colors"
                                    aria-label="بعد صفحة"
                                >
                                    +١
                                </button>
                                <button
                                    type="button"
                                    onClick={() => adjustPageJump(10)}
                                    disabled={(parseInt(pageJumpInput, 10) || page) >= TOTAL_MUSHAF_PAGES}
                                    className="px-2 py-1 bg-white/10 text-white/90 rounded-lg text-[11px] font-bold tabular-nums hover:bg-white/20 disabled:opacity-40 transition-colors"
                                    aria-label="بعد 10 صفحات"
                                >
                                    +١٠
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Font size slider */}
                {fontPanelOpen && (
                    <div className="mt-3 bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                        <span className="text-white text-xs">حجم الخط</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setFontSize(s => Math.max(FONT_MIN, s - FONT_STEP))}
                                disabled={fontSize <= FONT_MIN}
                                className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center disabled:opacity-40"
                                aria-label="تصغير"
                            >
                                <MinusIcon className="w-4 h-4" />
                            </button>
                            <span className="font-quran text-white min-w-[2.5rem] text-center" style={{ fontSize: fontSize / 1.6 + 'px' }}>{fontSize}</span>
                            <button
                                onClick={() => setFontSize(s => Math.min(FONT_MAX, s + FONT_STEP))}
                                disabled={fontSize >= FONT_MAX}
                                className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center disabled:opacity-40"
                                aria-label="تكبير"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Body */}
            <div ref={bodyRef} className="flex-1 overflow-y-auto pb-6" style={cssVars as React.CSSProperties} dir="rtl">
                {mushafMode === 'modern' ? (
                    <>
                        <MushafModernView
                            page={page}
                            ayahs={ayahs}
                            tajweed={mushafTajweed}
                            onAyahTap={(surahId, ayah) => setTafsirFor({ surahId, ayah })}
                        />
                        <PageFooter
                            page={page}
                            startingSurahId={startingSurahId}
                            endingSurahId={endingSurahId}
                        />
                    </>
                ) : (
                    <Suspense fallback={
                        <div className="p-10 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" aria-hidden></div>
                            <p className="text-sm">جارٍ تحميل المصحف المطبوع...</p>
                        </div>
                    }>
                        {(() => {
                            // Pixel mode wraps the third-party web component in
                            // a ProviderBoundary so a "Bad arguments: Not
                            // rendering!" (or any other) failure falls back to
                            // the modern view AND flips the persisted mode to
                            // 'modern' so the user does not get bounced back to
                            // a broken pixel view on the next navigation.
                            const modernFallback = (
                                <MushafModernView
                                    page={page}
                                    ayahs={ayahs}
                                    tajweed={mushafTajweed}
                                    onAyahTap={(surahId, ayah) => setTafsirFor({ surahId, ayah })}
                                />
                            );
                            return (
                                <ProviderBoundary
                                    name="MushafPixelView"
                                    fallback={modernFallback}
                                    onError={() => {
                                        setMushafMode('modern');
                                    }}
                                >
                                    <MushafPixelView page={page} tajweed={mushafTajweed} />
                                </ProviderBoundary>
                            );
                        })()}
                    </Suspense>
                )}
            </div>

            {/* In-app Tafsir sheet for the currently selected ayah. Driven by
                tafsirFor (set from MushafModernView's per-ayah "التفسير" chip);
                uses the user's persisted tafsirId preference and pipes any
                change back through setTafsirId so the choice sticks across
                screens. The sheet is mounted unconditionally so its open/close
                transition can animate; the prop `open` controls visibility. */}
            <TafsirSheet
                open={tafsirFor !== null}
                surahId={tafsirFor?.surahId ?? 1}
                ayahNumber={tafsirFor?.ayah ?? 1}
                onClose={() => setTafsirFor(null)}
                tafsirId={tafsirId}
                onTafsirChange={(id) => { setTafsirId(id); }}
            />
        </div>
    );
};

export default MushafPageScreen;
