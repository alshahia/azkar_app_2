import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon,
    MinusIcon, PlusIcon, Squares2X2Icon, PaintBrushIcon, BookOpenIcon,
} from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import {
    getPageAyahs, getPageSurahIds, getSurah, TOTAL_MUSHAF_PAGES,
    type QuranAyah, type MushafMode,
} from '../../services/QuranService';
import PageFooter from '../quran/PageFooter';
import MushafModernView from '../quran/MushafModernView';
import { preloadUthmaniFonts } from '../../utils/fontReady';

const MushafPixelView = lazy(() => import('../quran/MushafPixelView'));

const FONT_MIN = 18;
const FONT_MAX = 36;
const FONT_STEP = 2;
const FONT_DEFAULT = 24;
const FONT_LOAD_TIMEOUT_MS = 800;

interface MushafPageScreenProps {
    params?: { page?: number; surahId?: number; ayah?: number };
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
 */
const MushafPageScreen: React.FC<MushafPageScreenProps> = ({ params }) => {
    const { navigate, mushafMode, setMushafMode, mushafTajweed, setMushafTajweed } = useAppContext();
    const { t } = useTranslation();

    const [page, setPage] = useState<number>(
        Math.min(TOTAL_MUSHAF_PAGES, Math.max(1, params?.page ?? 1))
    );
    const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fontSize, setFontSize] = useState(FONT_DEFAULT);
    const [fontPanelOpen, setFontPanelOpen] = useState(false);
    const [fontReady, setFontReady] = useState(false);

    // Load ayahs for the active page.
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        getPageAyahs(page)
            .then(arr => { if (!cancelled) setAyahs(arr); })
            .catch(e => { if (!cancelled) setError(String(e?.message || e)); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [page]);

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
        setMushafMode(m).catch(() => undefined);
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
        setMushafTajweed(!mushafTajweed).catch(() => undefined);
    }, [mushafTajweed, setMushafTajweed]);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#12241C]" dir="rtl">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" aria-hidden></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('quran_loading')}</p>
            </div>
        );
    }
    if (!fontReady) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#12241C]" dir="rtl">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" aria-hidden></div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">جارٍ تحضير الخط...</p>
            </div>
        );
    }
    if (error || ayahs.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#12241C] px-6 text-center" dir="rtl">
                <p className="text-red-600 dark:text-red-400 mb-3">{error || 'تعذر تحميل الصفحة.'}</p>
                <button onClick={() => navigate('quran')} className="text-primary-600 dark:text-primary-400 font-bold">
                    العودة لفهرس السور
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-[#12241C]">
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
                        <p className="text-[10px] text-white/70 uppercase tracking-widest">
                            صفحة {page} / {TOTAL_MUSHAF_PAGES}
                        </p>
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
                        <MushafModernView page={page} ayahs={ayahs} tajweed={mushafTajweed} />
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
                        <MushafPixelView page={page} tajweed={mushafTajweed} />
                    </Suspense>
                )}
            </div>
        </div>
    );
};

export default MushafPageScreen;
