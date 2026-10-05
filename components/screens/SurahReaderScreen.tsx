import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeftIcon, MinusIcon, PlusIcon, BookmarkIcon, AdjustmentsHorizontalIcon, CloudArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { useQuranStore } from '../../stores/useQuranStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../common/Toast';
import {
    loadSurah, getSurah, showsBismillahHeader, type QuranAyah,
} from '../../services/QuranService';
import BismillahHeader from '../quran/BismillahHeader';
import AyahCard from '../quran/AyahCard';
import TafsirSheet from '../quran/TafsirSheet';
import BookmarkSheet from '../quran/BookmarkSheet';
import AudioDownloadSheet from '../quran/AudioDownloadSheet';
import { useQuranAudio } from '../../context/QuranAudioContext';
import { useRepeatSettings } from '../../context/RepeatSettingsContext';
import VerseActionModalContainer, { useVerseAction } from '../quran/VerseActionModalContainer';
import { getReciter } from '../../services/reciterCatalog';
import { preloadUthmaniFonts } from '../../utils/fontReady';
import { loadTimings, hasTimings, getCurrentAyah, type QuranTimingsFile } from '../../services/quranTimings';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useAutoScrollOnHighlight } from '../../hooks/useAutoScrollOnHighlight';
import type { PlaybackCommand } from '../../services/audioQueue';

const FONT_LOAD_TIMEOUT_MS = 800;

const FONT_MIN = 18;
const FONT_MAX = 36;
const FONT_STEP = 2;
const FONT_DEFAULT = 26;

/**
 * Mushaf reader: continuous Uthmani scroll, decorative ayah markers,
 * adjustable font size, audio recitation, bookmarks, and inline Tafsir.
 */
const SurahReaderScreen: React.FC<{ params?: { surahId: number; ayah?: number; bookmarksOnly?: boolean } }> = ({ params }) => {
    const navigate = useNavigationStore((state) => state.navigate);
    const bookmarks = useQuranStore((state) => state.bookmarks);
    const addBookmark = useQuranStore((state) => state.addBookmark);
    const removeBookmark = useQuranStore((state) => state.removeBookmark);
    const setLastRead = useQuranStore((state) => state.setLastRead);
    const tafsirId = usePreferencesStore((state) => state.tafsirId);
    const setTafsirId = usePreferencesStore((state) => state.setTafsirId);
    const addReadHistory = useQuranStore((state) => state.addReadHistory);
    const wakeLockEnabled = usePreferencesStore((state) => state.wakeLockEnabled);
    const { setRange: setRepeatRange } = useRepeatSettings();
    const { t } = useTranslation();
    // Playback lives at app level (QuranAudioContext) so recitation
    // continues across navigation; the reader only starts it and follows.
    const { playback, reciterId, play } = useQuranAudio();
    // Feedback for the repeat-range picker. This used to write to a state
    // value nothing rendered, so the confirmation never reached the user.
    const toast = useToast();
    const onRepeatRangeToast = () => toast.show('تم إعداد نطاق التكرار');

    const surahId = params?.surahId ?? 1;
    const surah = getSurah(surahId);
    const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [fontSize, setFontSize] = useState(FONT_DEFAULT);
    const [fontPanelOpen, setFontPanelOpen] = useState(false);
    const [downloadOpen, setDownloadOpen] = useState(false);

    const [tafsirFor, setTafsirFor] = useState<number | null>(null);
    const [bookmarksOpen, setBookmarksOpen] = useState(Boolean(params?.bookmarksOnly));

    // M4-T5: keep the screen awake while the reader is open. Silently
    // no-ops on browsers without navigator.wakeLock (older PWA builds).
    useWakeLock({ enabled: wakeLockEnabled !== false });

    const [currentAyah, setCurrentAyah] = useState<number>(params?.ayah ?? 1);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Stable refs so the IO + unmount-save effects keep minimal deps. The store
    // actions are stable, but the refs let the effects read the latest value
    // without listing the action as a dep.
    const setLastReadRef = useRef(setLastRead);
    const surahIdRef = useRef(surahId);
    const currentAyahRef = useRef(currentAyah);
    const addReadHistoryRef = useRef(addReadHistory);
    useEffect(() => { setLastReadRef.current = setLastRead; }, [setLastRead]);
    useEffect(() => { surahIdRef.current = surahId; }, [surahId]);
    useEffect(() => { currentAyahRef.current = currentAyah; }, [currentAyah]);
    useEffect(() => { addReadHistoryRef.current = addReadHistory; }, [addReadHistory]);

    // Load surah text
    useEffect(() => {
        let cancelled = false;
        const loadingTimer = window.setTimeout(() => {
            setLoading(true);
            setError(null);
        }, 0);
        loadSurah(surahId)
            .then(arr => { if (!cancelled) setAyahs(arr); })
            .catch(e => { if (!cancelled) setError(String(e?.message || e)); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => {
            cancelled = true;
            window.clearTimeout(loadingTimer);
        };
    }, [surahId]);

    // Scroll to initial ayah
    useEffect(() => {
        if (loading || !params?.ayah || !containerRef.current) return;
        const el = containerRef.current.querySelector('#ayah-' + surahId + '-' + params.ayah);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [loading, params?.ayah, surahId]);

    // Track current ayah via IntersectionObserver for the sticky header + last-read.
    // Uses refs for setLastRead / surahId so the effect only tears down when the
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
                setLastReadRef.current({ surah: surahIdRef.current, ayah: top });
            },
            { root: containerRef.current, rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
        );
        containerRef.current?.querySelectorAll('[id^="ayah-"]').forEach(el => obs.observe(el));
        observerRef.current = obs;
        return () => obs.disconnect();
    }, [ayahs]);

    // When timing data is available for the current reciter, derive the
    // highlighted ayah from the audio position; otherwise fall back to
    // the IntersectionObserver's topmost visible ayah (already tracked
    // via IO into currentAyah). The setState happens only on change and
    // only when timings are loaded and position has crossed an ayah
    // boundary, so re-renders stay rare.
    const [timings, setTimings] = useState<QuranTimingsFile | null>(null);
    const [timingAyah, setTimingAyah] = useState<{ surah: number; ayah: number } | null>(null);
    useEffect(() => {
        let cancelled = false;
        hasTimings(reciterId).then((ok) => {
            if (cancelled) return;
            // Resolve the full timings if available; otherwise resolve to null.
            const next = ok ? loadTimings(reciterId).catch(() => null) : Promise.resolve(null);
            next.then((t) => { if (!cancelled) setTimings(t ?? null); });
        });
        return () => { cancelled = true; };
    }, [reciterId]);
    // Heartbeat every 1s: ask the queue for the latest position and look
    // up the highlighted ayah. We use playback.positionMs (the live value
    // the player reports through timeupdate -> notifyPosition). When no
    // timings are loaded, the heartbeat short-circuits and timingAyah keeps
    // its previous value (rendered as null-or-stale; the IO/audio path is
    // the always-on fallback).
    useEffect(() => {
        if (!timings) return;
        const tick = () => {
            const live = playback && typeof playback.positionMs === 'number' ? playback.positionMs : 0;
            const result = getCurrentAyah(timings, live);
            setTimingAyah(result);
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timings, playback?.seq, playback?.positionMs]);

    // Flush the latest position to storage when the reader unmounts. The IO callback
    // saves on every intersection change, but if the user scrolls then immediately
    // exits (or the tab goes to background) the very last IO callback can be missed
    // because the cleanup runs first. This guarantees the resume banner always
    // points to the deepest ayah the user reached in this session.
    useEffect(() => {
        return () => {
            const ayah = currentAyahRef.current;
            const surah = surahIdRef.current;
            if (ayah > 0) {
                setLastReadRef.current({ surah, ayah });
                // M3-T5: append the deepest ayah reached this session to the
                // read history ring buffer so the index screen can render
                // recent reading sessions.
                addReadHistoryRef.current({ surah, ayah, ts: Date.now() });
            }
        };
        // Empty deps: unmount cleanup only. addReadHistory is captured
        // via the ref below so this effect does not need to re-bind when
        // the inline function re-creates.
    }, []);

    const isBookmarked = useCallback(
        (ayah: number) => bookmarks.some(b => b.surah === surahId && b.ayah === ayah),
        [bookmarks, surahId]
    );

    // Tap-to-seek: when the user taps an ayah, restart playback exactly at
    // that ayah. Source marks this as 'user' so the IO effect doesn't try
    // to scroll (the tapped card is already visible).
    const seekToAyah = useCallback((ayahNumber: number) => {
        play(surahId, ayahNumber, { source: 'user' });
    }, [play, surahId]);

    const toggleBookmark = useCallback(async (ayah: number) => {
        if (isBookmarked(ayah)) {
            removeBookmark(surahId, ayah);
        } else {
            addBookmark({ surah: surahId, ayah, createdAt: Date.now() });
        }
    }, [isBookmarked, surahId, addBookmark, removeBookmark]);

    const playAyah = useCallback((ayah: QuranAyah) => {
        play(surahId, ayah.number);
    }, [play, surahId]);

    // Follow auto-advance / the player's next-prev buttons with a centered
    // scroll. Tap playback doesn't scroll - the tapped card is already
    // visible. Playback for another surah (cross-surah auto-advance) is
    // ignored here; entering the reader scrolls to the playing ayah.
    useEffect(() => {
        if (!playback || playback.source === 'tap') return;
        if (playback.surahId !== surahId) return;
        const el = containerRef.current?.querySelector('#ayah-' + surahId + '-' + playback.ayahNumber);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // seq identifies each new command; the guards run inside the effect.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playback?.seq]);

    // M5-T8a: follow the per-reciter timings highlight without forcing
    // a scroll when the user has already moved on. The hook checks
    // visibility against the scroll container and skips the scroll
    // when the ayah is already in view (the common case during
    // recitation) or when it has scrolled off the top (manual
    // scroll / compare). The hook's internal key-ref skips the very
    // first mount so the reader doesn't yank on open.
    useAutoScrollOnHighlight({
        elementId: timingAyah && timingAyah.surah === surahId ? 'ayah-' + surahId + '-' + timingAyah.ayah : '',
        containerRef,
        key: timingAyah && timingAyah.surah === surahId ? timingAyah.ayah : null,
    });

    // Pre-warm the Uthmani font before the ayahs paint. Same 800ms
    // safety cap as MushafPageScreen: never pin the reader on a spinner
    // when the font is already cached elsewhere (e.g. from the Mushaf
    // page opened earlier in the session).
    const [fontReady, setFontReady] = useState(false);
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

    const cssVars = useMemo(() => ({
        ['--quran-fs' as never]: fontSize + 'px',
    }), [fontSize]);

    // Stable identity for the download sheet: it memoises on this array, so a
    // fresh map on every render would needlessly restart its effects.
    const surahAyat = useMemo(
        () => ayahs.map(a => ({ number: a.number, globalNumber: a.globalNumber })),
        [ayahs],
    );

    if (loading || !fontReady) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-surface dark:bg-surface" dir="rtl">
                <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" aria-hidden></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{loading ? t('quran_loading') : 'جارٍ تحضير الخط...'}</p>
            </div>
        );
    }

    if (error || !surah) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-surface dark:bg-surface px-6 text-center" dir="rtl">
                <p className="text-red-600 dark:text-red-400 mb-3">{error || 'تعذر تحميل السورة.'}</p>
                <button onClick={() => navigate('quran')} className="text-primary-600 dark:text-primary-400 font-bold">
                    العودة لفهرس السور
                </button>
            </div>
        );
    }

    return (
        <VerseActionModalContainer
            openTafsir={(surah, ayah) => {
                navigate('surahReader', { surahId: surah, ayah });
                setTafsirFor(ayah);
            }}
            jumpToMushaf={(surah) => navigate('mushafPage', { surahId: surah })}
            openRepeatRange={(surah, ayah) => {
                // Open a 5-ayah range starting at the tapped ayah. The user
                // can adjust later from the AudioMiniPlayer HUD; the modal
                // is the entry point.
                const to = Math.min(ayah + 4, 9999);
                setRepeatRange({ from: { surah, ayah }, to: { surah, ayah: to } });
                onRepeatRangeToast();
            }}
            labels={{
                title: 'إجراءات الآية',
                play: 'تشغيل',
                bookmark: 'حفظ',
                bookmarkRemove: 'إزالة الحفظ',
                tafsir: 'التفسير',
                copy: 'نسخ',
                copyLink: 'نسخ الرابط',
                share: 'مشاركة',
                mushaf: 'افتح المصحف',
                repeat: 'تكرار',
                close: 'إغلاق',
            }}
        >
        <div className="h-full flex flex-col bg-surface dark:bg-surface">
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
                <SurahAyahListWithAction
                    ayahs={ayahs}
                    surahId={surahId}
                    timingAyah={timingAyah}
                    playback={playback}
                    playAyah={playAyah}
                    seekToAyah={seekToAyah}
                    toggleBookmark={toggleBookmark}
                    isBookmarked={isBookmarked}
                    setTafsirFor={setTafsirFor}
                    t={t}
                />
            </div>

            {/* Sheets + player */}
            <TafsirSheet
                open={tafsirFor !== null}
                surahId={surahId}
                ayahNumber={tafsirFor ?? 1}
                onClose={() => setTafsirFor(null)}
                tafsirId={tafsirId}
                onTafsirChange={(id) => setTafsirId(id)}
            />
            <BookmarkSheet
                open={bookmarksOpen}
                bookmarks={bookmarks.filter(b => b.surah === surahId || params?.bookmarksOnly)}
                onClose={() => { setBookmarksOpen(false); if (params?.bookmarksOnly) navigate('quran'); }}
                onJump={(s, a) => navigate('surahReader', { surahId: s, ayah: a })}
                onRemove={(s, a) => removeBookmark(s, a)}
            />
            {ayahs.length > 0 && (
                <AudioDownloadSheet
                    open={downloadOpen}
                    reciterId={reciterId}
                    reciterName={getReciter(reciterId)?.name || reciterId}
                    surahAyat={surahAyat}
                    onClose={() => setDownloadOpen(false)}
                />
            )}
        </div>
        </VerseActionModalContainer>
    );
};

interface SurahAyahListWithActionProps {
    ayahs: QuranAyah[];
    surahId: number;
    timingAyah: { surah: number; ayah: number } | null;
    playback: PlaybackCommand | null;
    playAyah: (ayah: QuranAyah) => void;
    seekToAyah: (ayahNumber: number) => void;
    toggleBookmark: (ayah: number) => Promise<void>;
    isBookmarked: (ayah: number) => boolean;
    setTafsirFor: (ayah: number) => void;
    t: (key: 'quran_sajda_obligatory' | 'quran_sajda_recommended') => string;
}

/**
 * Inner component rendered as a child of <VerseActionModalContainer>. It
 * owns the only useVerseAction() consumer on this screen so the hook can
 * resolve the provider that the parent renders. Calling the hook from
 * SurahReaderScreen itself was the original bug: a hook looks *up* the
 * tree for its context provider, but SurahReaderScreen was rendering
 * <VerseActionModalContainer> as part of its own output, so the hook
 * always saw a missing provider and threw.
 */
const SurahAyahListWithAction: React.FC<SurahAyahListWithActionProps> = ({
    ayahs,
    surahId,
    timingAyah,
    playback,
    playAyah,
    seekToAyah,
    toggleBookmark,
    isBookmarked,
    setTafsirFor,
    t,
}) => {
    const verseAction = useVerseAction();
    return (
        <>
            {ayahs.map(ayah => {
                // Highlight sources: timingAyah (QUL) wins when the
                // bundle is loaded; otherwise the audio queue's
                // current ayah is the always-on fallback.
                const isHighlighted = !!timingAyah && timingAyah.surah === surahId && timingAyah.ayah === ayah.number;
                return (
                    <AyahCard
                        key={ayah.number}
                        ayah={ayah}
                        isBookmarked={isBookmarked(ayah.number)}
                        isCurrentAudio={playback?.surahId === surahId && playback?.ayahNumber === ayah.number}
                        isHighlighted={isHighlighted}
                        onPlay={() => playAyah(ayah)}
                        onSeek={() => seekToAyah(ayah.number)}
                        onLongPress={() => {
                            verseAction.open({
                                surah: surahId,
                                ayah: ayah.number,
                                text: ayah.text,
                            });
                        }}
                        onToggleBookmark={() => toggleBookmark(ayah.number)}
                        onShowTafsir={() => setTafsirFor(ayah.number)}
                        sajdaLabel={ayah.sajda === 2 ? t('quran_sajda_obligatory') : t('quran_sajda_recommended')}
                    />
                );
            })}
        </>
    );
};

export default SurahReaderScreen;