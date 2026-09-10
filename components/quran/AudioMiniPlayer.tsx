import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    PauseIcon, PlayIcon, XMarkIcon, ForwardIcon, BackwardIcon,
    SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import { getSurah, globalAyahNumber, toArabicDigits } from '../../services/QuranService';
import { getAudioSourceUrl } from '../../services/audioCache';
import { getReciter } from '../../services/reciterCatalog';
import {
    setMediaSessionHandlers, setMediaSessionPlaybackState,
    updateMediaSessionMetadata, updateMediaSessionPositionState,
} from '../../utils/mediaSession';
import { useQuranAudio } from '../../context/QuranAudioContext';
import { useRepeatSettings } from '../../context/RepeatSettingsContext';
import ReciterPicker from './ReciterPicker';

/**
 * App-level bottom player for Quran recitation (M1-T1/T5/T6). Mounted once
 * in App.tsx - NOT inside a screen - so playback continues while the user
 * navigates. All intent (which ayah, advance/stop, reciter) lives in
 * audioQueue; this component resolves the URL for the current command,
 * drives the <audio> element, and publishes lock-screen controls through
 * the shared Media Session helpers.
 */
const AudioMiniPlayer: React.FC = () => {
    const { playback, reciterId, stop, advance, prev, reportPosition, flushPosition } = useQuranAudio();
    const repeat = useRepeatSettings();
    // Tracks how many iterations of the *current* ayah remain; reset to
    // count on ayah change. -1 == unlimited.
    const repeatRemainingRef = useRef<number>(0);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [errorAt, setErrorAt] = useState<{ seq: number; message: string } | null>(null);
    const [loaded, setLoaded] = useState<{ seq: number; url: string } | null>(null);
    const lastBlobRef = useRef<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);

    // Latest command for the (re)bind effect without re-binding on every
    // context re-render.
    const playbackRef = useRef(playback);
    useEffect(() => { playbackRef.current = playback; }, [playback]);

    const surah = playback ? getSurah(playback.surahId) : undefined;
    const reciter = getReciter(reciterId);
    const seq = playback?.seq ?? 0;
    const active = playback != null;

    // Prime the per-ayah repeat budget whenever the command changes. We hold
    // it in a ref (not state) because the player never re-renders from it -
    // the value is consumed only from within the onEnded closure below.
    useEffect(() => {
        if (!playback) {
            repeatRemainingRef.current = 0;
            return;
        }
        repeatRemainingRef.current = repeat.count;
    }, [playback, repeat.count]);

    // Everything else derives from the loaded/seq pair, so effects never
    // call setState synchronously (react-hooks/set-state-in-effect).
    const loading = active && (loaded === null || loaded.seq !== seq);
    const error = errorAt && errorAt.seq === seq ? errorAt.message : null;
    const url = loaded && loaded.seq === seq ? loaded.url : null;
    const globalNumber = useMemo(() => {
        if (!playback) return null;
        try {
            return globalAyahNumber(playback.surahId, playback.ayahNumber);
        } catch {
            return null;
        }
    }, [playback]);

    // Resolve the cache URL whenever the command or reciter changes.
    useEffect(() => {
        if (!active || globalNumber == null) return;
        let cancelled = false;
        getAudioSourceUrl(reciterId, globalNumber)
            .then(src => {
                if (cancelled) return;
                setLoaded({ seq, url: src.url });
            })
            .catch(() => {
                if (!cancelled) setErrorAt({ seq, message: 'تعذر تشغيل التلاوة. تحقق من الاتصال.' });
            });
        return () => { cancelled = true; };
    }, [active, globalNumber, reciterId, seq]);

    // (Re)bind the audio element whenever a FRESH URL for the current
    // command arrives. A stale loaded.seq yields null here, so a new ayah
    // never plays the previous file; a same-URL restart (prev at ayah 1,
    // reciter switch) rebinds because seq changed. When the command goes
    // away the cleanup pauses and releases the element.
    useEffect(() => {
        if (!active || !url) return;
        const command = playbackRef.current;
        const resumeMs = command?.resumePositionMs ?? 0;
        const audio = new Audio(url);
        audio.preload = 'auto';
        // No crossOrigin attribute: cdn.islamic.network does not send
        // Access-Control-Allow-Origin, and the <audio> element only needs
        // CORS when callers want to read the audio data (WebAudio, analyser
        // nodes, etc.) - we just play it. Keeping it off lets the page fall
        // back to the remote URL cleanly when the cache miss hits CORS.
        audioRef.current = audio;

        const onCanPlay = () => {
            if (resumeMs > 0) {
                try { audio.currentTime = resumeMs / 1000; } catch { /* out of range */ }
            }
            audio.play().catch(() => { /* user gesture needed */ });
        };
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onTimeUpdate = () => {
            reportPosition(audio.currentTime * 1000);
            updateMediaSessionPositionState({
                duration: Number.isFinite(audio.duration) ? audio.duration : 0,
                position: audio.currentTime,
                rate: audio.playbackRate,
            });
        };
        // Decide what happens when this ayah finishes. If the active
        // command is inside the repeat range, restart the SAME ayah after
        // delayMs (with infinite support via -1); otherwise let the queue
        // advance to the next ayah / next surah.
        const scheduleRepeat = () => {
            const remaining = repeatRemainingRef.current;
            // 0 or NaN means "no repeat". -1 means infinite.
            if (remaining === 0) return false;
            const next = remaining === -1 ? -1 : remaining - 1;
            repeatRemainingRef.current = next;
            const cmd = playbackRef.current;
            if (!cmd) return false;
            // restart from the beginning of the same ayah; resumePositionMs
            // stays 0 so we replay from the start, not where we paused.
            const restart = () => {
                if (playbackRef.current && playbackRef.current.surahId === cmd.surahId && playbackRef.current.ayahNumber === cmd.ayahNumber) {
                    audio.currentTime = 0;
                    audio.play().catch(() => undefined);
                } else {
                    // command moved (reciter change, user tap) - hand off
                    // to the queue's advance path.
                    advance();
                }
            };
            if (repeat.delayMs > 0) {
                window.setTimeout(restart, repeat.delayMs);
            } else {
                restart();
            }
            return true;
        };
        const onEnded = () => {
            flushPosition();
            const cmd = playbackRef.current;
            if (cmd && repeat.isActive && repeat.isInRange(cmd.surahId, cmd.ayahNumber) && scheduleRepeat()) {
                return;
            }
            advance();
        };
        const onError = () => setErrorAt({ seq: command?.seq ?? seq, message: 'تعذر تشغيل التلاوة. تحقق من الاتصال.' });

        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        return () => {
            audio.pause();
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            audio.src = '';
        };
    }, [active, url, seq, advance, flushPosition, reportPosition]);

    // Free blob: URLs the cache issued when we no longer need them.
    useEffect(() => {
        const previous = lastBlobRef.current;
        if (previous && previous !== url && previous.startsWith('blob:')) {
            URL.revokeObjectURL(previous);
        }
        lastBlobRef.current = url && url.startsWith('blob:') ? url : null;
    }, [url]);

    const toggle = useCallback(() => {
        const a = audioRef.current;
        if (!a) return;
        if (a.paused) a.play().catch(() => undefined);
        else a.pause();
    }, []);

    const seekTo = useCallback((timeSeconds: number) => {
        const a = audioRef.current;
        if (a) {
            try { a.currentTime = timeSeconds; } catch { /* out of range */ }
        }
    }, []);

    const stopPlayback = useCallback(() => {
        const a = audioRef.current;
        if (a) { a.pause(); a.currentTime = 0; }
        flushPosition();
        stop();
    }, [stop, flushPosition]);

    // Lock-screen / notification controls (M1-T1). Claimed per command and
    // released on stop so the TTS surface (AudioService) can own the global
    // session while Quran playback is idle.
    useEffect(() => {
        if (!playback) {
            setMediaSessionHandlers(null);
            updateMediaSessionMetadata(null);
            setMediaSessionPlaybackState('none');
            return;
        }
        const s = getSurah(playback.surahId);
        updateMediaSessionMetadata({
            title: s ? s.name : 'سورة ' + playback.surahId,
            artist: reciter?.name ?? reciterId,
            album: 'القرآن الكريم',
        });
        setMediaSessionHandlers({
            play: toggle,
            pause: toggle,
            stop: stopPlayback,
            seekto: seekTo,
            nexttrack: advance,
            previoustrack: prev,
        });
    }, [seq, reciterId, playback, toggle, stopPlayback, seekTo, advance, prev, reciter?.name]);

    // playbackState mirrors the element; position state is fed by timeupdate.
    useEffect(() => {
        setMediaSessionPlaybackState(playback ? (isPlaying ? 'playing' : 'paused') : 'none');
    }, [isPlaying, playback]);

    // Flush the exact position when the app goes to background or dies.
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState !== 'hidden') return;
            const a = audioRef.current;
            if (a) reportPosition(a.currentTime * 1000);
            flushPosition();
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [reportPosition, flushPosition]);

    if (!playback) return null;

    const arabicAyah = toArabicDigits(playback.ayahNumber);

    return (
        <>
            <AnimatePresence>
                <motion.div
                    key="player"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                    className="fixed bottom-20 inset-x-0 z-30 px-3"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <div className="max-w-md mx-auto bg-white/95 dark:bg-[#1A3129]/95 backdrop-blur-xl border border-primary-200 dark:border-primary-500/30 shadow-2xl rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggle}
                                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                                className="w-11 h-11 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md active:scale-95 transition"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : isPlaying ? (
                                    <PauseIcon className="w-5 h-5" />
                                ) : (
                                    <PlayIcon className="w-5 h-5" />
                                )}
                            </button>
                            <button
                                onClick={prev}
                                aria-label="الآية السابقة"
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500"
                            >
                                <BackwardIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={advance}
                                aria-label="الآية التالية"
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500"
                            >
                                <ForwardIcon className="w-5 h-5" />
                            </button>
                            <div className="flex-1 min-w-0 text-right rtl:text-right">
                                <p className="font-quran text-base text-gray-800 dark:text-gray-100 truncate">
                                    {surah ? surah.name : ('سورة ' + playback.surahId)}
                                </p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                    آية {arabicAyah} • {reciter?.name ?? reciterId}{error ? ' • ' + error : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => setPickerOpen(true)}
                                aria-label="اختر القارئ"
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500"
                                title={reciter?.name ?? reciterId}
                            >
                                <SpeakerWaveIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={stopPlayback}
                                aria-label="إيقاف التشغيل"
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
            <ReciterPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
        </>
    );
};

export default AudioMiniPlayer;