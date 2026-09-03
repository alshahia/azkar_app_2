import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeftIcon, MinusIcon, PlusIcon, BookmarkIcon, AdjustmentsHorizontalIcon, CloudArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import {
    loadSurah, getSurah, showsBismillahHeader, type QuranAyah,
} from '../../services/QuranService';
import BismillahHeader from '../quran/BismillahHeader';
import AyahCard from '../quran/AyahCard';
import TafsirSheet from '../quran/TafsirSheet';
import BookmarkSheet from '../quran/BookmarkSheet';
import ReciterPicker from '../quran/ReciterPicker';
import AudioMiniPlayer, { type AudioPlaybackState } from '../quran/AudioMiniPlayer';
import AudioDownloadSheet from '../quran/AudioDownloadSheet';
import { RECITERS } from '../../services/QuranService';

const FONT_MIN = 18;
const FONT_MAX = 36;
const FONT_STEP = 2;
const FONT_DEFAULT = 26;

/**
 * Mushaf reader: continuous Uthmani scroll, decorative ayah markers,
 * adjustable font size, audio recitation, bookmarks, and inline Tafsir.
 */
const SurahReaderScreen: React.FC<{ params?: { surahId: number; ayah?: number; bookmarksOnly?: boolean } }> = ({ params }) => {
    const { navigate, quranBookmarks, addQuranBookmark, removeQuranBookmark, setQuranLastRead } = useAppContext();
    const { t } = useTranslation();

    const surahId = params?.surahId ?? 1;
    const surah = getSurah(surahId);
    const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [fontSize, setFontSize] = useState(FONT_DEFAULT);
    const [reciterId, setReciterId] = useState('ar.alafasy');
    const [reciterOpen, setReciterOpen] = useState(false);
    const [fontPanelOpen, setFontPanelOpen] = useState(false);
    const [downloadOpen, setDownloadOpen] = useState(false);

    const [tafsirFor, setTafsirFor] = useState<number | null>(null);
    const [bookmarksOpen, setBookmarksOpen] = useState(Boolean(params?.bookmarksOnly));
    const [playback, setPlayback] = useState<AudioPlaybackState | null>(null);

    const [currentAyah, setCurrentAyah] = useState<number>(params?.ayah ?? 1);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Stable refs so the IO + unmount-save effects don't churn on every App re-render.
    // setQuranLastRead is defined inline in App.tsx and is a fresh reference each render;
    // the ref is synced inside an effect (matching AzkarListScreen's pattern) so the
    // IO + unmount-save effects can read the latest value without listing the inline
    // function as a dep.
    const setQuranLastReadRef = useRef(setQuranLastRead);
    const surahIdRef = useRef(surahId);
    const currentAyahRef = useRef(currentAyah);
    useEffect(() => { setQuranLastReadRef.current = setQuranLastRead; }, [setQuranLastRead]);
    useEffect(() => { surahIdRef.current = surahId; }, [surahId]);
    useEffect(() => { currentAyahRef.current = currentAyah; }, [currentAyah]);

    // Load surah text
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        loadSurah(surahId)
            .then(arr => { if (!cancelled) setAyahs(arr); })
            .catch(e => { if (!cancelled) setError(String(e?.message || e)); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [surahId]);

    // Scroll to initial ayah
    useEffect(() => {
        if (loading || !params?.ayah || !containerRef.current) return;
        const el = containerRef.current.querySelector('#ayah-' + surahId + '-' + params.ayah);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [loading, params?.ayah, surahId]);

    // Track current ayah via IntersectionObserver for the sticky header + last-read.
    // Uses refs for setQuranLastRead / surahId so the effect only tears down when the
    // ayah list actually changes, not on every App re-render.
    useEffect(() => {
        if (ayahs.length === 0) return;
        observerRef.current?.disconnect();
        const visible = new Map<number, number>();
        const obs = new IntersectionObserver(
            entries => {
                for (const e of entries) {
                    const id = (e.target as HTMLElement).id;
                    if (!id.startsWith('ayah-')) continue;
                    const [, , numStr] = id.split('-');
                    const n = Number(numStr);
                    if (e.isIntersecting) visible.set(n, e.intersectionRatio);
                    else visible.delete(n);
                }
                if (visible.size === 0) return;
                // pick the ayah closest to the top that is intersecting
                const top = Math.min(...Array.from(visible.keys()));
                setCurrentAyah(top);
                setQuranLastReadRef.current({ surah: surahIdRef.current, ayah: top }).catch(() => undefined);
            },
            { root: containerRef.current, rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
        );
        containerRef.current?.querySelectorAll('[id^="ayah-"]').forEach(el => obs.observe(el));
        observerRef.current = obs;
        return () => obs.disconnect();
    }, [ayahs]);

    // Flush the latest position to storage when the reader unmounts. The IO callback
    // saves on every intersection change, but if the user scrolls then immediately
    // exits (or the tab goes to background) the very last IO callback can be missed
    // because the cleanup runs first. This guarantees the resume banner always
    // points to the deepest ayah the user reached in this session.
    useEffect(() => {
        return () => {
            const ayah = currentAyahRef.current;
            if (ayah > 0) {
                setQuranLastReadRef.current({ surah: surahIdRef.current, ayah }).catch(() => undefined);
            }
        };
    }, []);

    const isBookmarked = useCallback(
        (ayah: number) => quranBookmarks.some(b => b.surah === surahId && b.ayah === ayah),
        [quranBookmarks, surahId]
    );

    const toggleBookmark = useCallback(async (ayah: number) => {
        if (isBookmarked(ayah)) {
            await removeQuranBookmark(surahId, ayah);
        } else {
            await addQuranBookmark({ surah: surahId, ayah, createdAt: Date.now() });
        }
    }, [isBookmarked, surahId, addQuranBookmark, removeQuranBookmark]);

    const playAyah = useCallback((ayah: QuranAyah) => {
        setPlayback({ surahId, ayah });
    }, [surahId]);

    const handleAdvance = useCallback(({ surahId: sid, ayahNumber }: { surahId: number; ayahNumber: number }) => {
        const arr = ayahs.length ? ayahs : null;
        if (!arr) return;
        const idx = arr.findIndex(a => a.number === ayahNumber);
        if (idx >= 0) {
            setPlayback({ surahId: sid, ayah: arr[idx] });
            const el = containerRef.current?.querySelector('#ayah-' + sid + '-' + ayahNumber);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        // End of surah: stop.
        setPlayback(null);
    }, [ayahs]);

    const handlePrev = useCallback(() => {
        if (!playback) return;
        const prev = playback.ayah.number - 1;
        if (prev >= 1) handleAdvance({ surahId: playback.surahId, ayahNumber: prev });
    }, [playback, handleAdvance]);

    const cssVars = useMemo(() => ({
        ['--quran-fs' as never]: fontSize + 'px',
    }), [fontSize]);

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#12241C]" dir="rtl">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" aria-hidden></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('quran_loading')}</p>
            </div>
        );
    }

    if (error || !surah) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-[#12241C] px-6 text-center" dir="rtl">
                <p className="text-red-600 dark:text-red-400 mb-3">{error || 'تعذر تحميل السورة.'}</p>
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
                    <button onClick={() => navigate('quran')} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors" aria-label="العودة">
                        <ArrowLeftIcon className="w-5 h-5 rtl:rotate-180" />
                    </button>
                    <div className="text-center min-w-0 flex-1 px-3">
                        <p className="font-quran text-lg text-white truncate">{surah.name}</p>
                        <p className="text-[10px] text-white/70 uppercase tracking-widest">{surah.transliteration} • {surah.revelation} • {surah.ayahCount} {t('quran_ayahs_count')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setBookmarksOpen(true)} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30" aria-label={t('quran_bookmarks')}>
                            <BookmarkIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setDownloadOpen(true)} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30" aria-label={t('quran_audio_offline_title')}>
                            <CloudArrowDownIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setFontPanelOpen(o => !o)} className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30" aria-label={t('quran_reader_settings')}>
                            <AdjustmentsHorizontalIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Sticky current ayah indicator */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentAyah}
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="text-center text-white/90 text-xs font-bold"
                    >
                        آية {currentAyah} / {surah.ayahCount} • صفحة {ayahs[currentAyah - 1]?.page} • جزء {ayahs[currentAyah - 1]?.juz}
                    </motion.div>
                </AnimatePresence>

                {/* Font panel */}
                <AnimatePresence>
                    {fontPanelOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-3 bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                                <span className="text-white text-xs">{t('quran_font_size')}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setFontSize(s => Math.max(FONT_MIN, s - FONT_STEP))}
                                        disabled={fontSize <= FONT_MIN}
                                        className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center disabled:opacity-40"
                                        aria-label="تصغير الخط"
                                    >
                                        <MinusIcon className="w-4 h-4" />
                                    </button>
                                    <span className="font-quran text-white min-w-[2.5rem] text-center" style={{ fontSize: fontSize / 1.6 + 'px' }}>{fontSize}</span>
                                    <button
                                        onClick={() => setFontSize(s => Math.min(FONT_MAX, s + FONT_STEP))}
                                        disabled={fontSize >= FONT_MAX}
                                        className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center disabled:opacity-40"
                                        aria-label="تكبير الخط"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Body */}
            <div ref={containerRef} className="flex-1 overflow-y-auto pb-32" style={cssVars as React.CSSProperties} dir="rtl">
                {showsBismillahHeader(surahId) && <BismillahHeader />}
                {ayahs.map(ayah => (
                    <AyahCard
                        key={ayah.number}
                        ayah={ayah}
                        isBookmarked={isBookmarked(ayah.number)}
                        isCurrentAudio={playback?.ayah.number === ayah.number}
                        onPlay={() => playAyah(ayah)}
                        onToggleBookmark={() => toggleBookmark(ayah.number)}
                        onShowTafsir={() => setTafsirFor(ayah.number)}
                        sajdaLabel={ayah.sajda === 2 ? t('quran_sajda_obligatory') : t('quran_sajda_recommended')}
                    />
                ))}
            </div>

            {/* Sheets + player */}
            <TafsirSheet open={tafsirFor !== null} surahId={surahId} ayahNumber={tafsirFor ?? 1} onClose={() => setTafsirFor(null)} />
            <BookmarkSheet
                open={bookmarksOpen}
                bookmarks={quranBookmarks.filter(b => b.surah === surahId || params?.bookmarksOnly)}
                onClose={() => { setBookmarksOpen(false); if (params?.bookmarksOnly) navigate('quran'); }}
                onJump={(s, a) => navigate('surahReader', { surahId: s, ayah: a })}
                onRemove={(s, a) => removeQuranBookmark(s, a)}
            />
            <ReciterPicker
                open={reciterOpen}
                currentId={reciterId}
                onPick={setReciterId}
                onClose={() => setReciterOpen(false)}
            />
            <AudioMiniPlayer
                playback={playback}
                reciterId={reciterId}
                onReciterTap={() => setReciterOpen(true)}
                onStop={() => setPlayback(null)}
                onAdvance={handleAdvance}
                onPrev={handlePrev}
            />
            {ayahs.length > 0 && (
                <AudioDownloadSheet
                    open={downloadOpen}
                    reciterId={reciterId}
                    reciterName={(RECITERS.find(r => r.id === reciterId)?.name) || reciterId}
                    surahAyat={ayahs.map(a => ({ number: a.number, globalNumber: a.globalNumber }))}
                    onClose={() => setDownloadOpen(false)}
                />
            )}
        </div>
    );
};

export default SurahReaderScreen;
