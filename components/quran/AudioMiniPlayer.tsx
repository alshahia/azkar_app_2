import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    PauseIcon, PlayIcon, XMarkIcon, ForwardIcon, BackwardIcon,
    SpeakerWaveIcon,
} from '@heroicons/react/24/outline';
import { getSurah } from '../../services/QuranService';
import type { QuranAyah } from '../../services/QuranService';
import { getAudioSourceUrl } from '../../services/audioCache';

export interface AudioPlaybackState {
    surahId: number;
    ayah: QuranAyah;
}

interface AudioMiniPlayerProps {
    playback: AudioPlaybackState | null;
    reciterId: string;
    onReciterTap: () => void;
    onStop: () => void;
    onAdvance: (next: { surahId: number; ayahNumber: number }) => void;
    onPrev: () => void;
}

/**
 * Persistent bottom player shown while a recitation is active. Streams
 * per-ayah MP3 from cdn.islamic.network and auto-advances to the next ayah
 * until the user pauses, stops, or the surah ends.
 */
const AudioMiniPlayer: React.FC<AudioMiniPlayerProps> = ({
    playback, reciterId, onReciterTap, onStop, onAdvance, onPrev,
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [resolvedUrl, setResolvedUrl] = useState<string>('');
    const lastBlobRef = useRef<string | null>(null);

    // Resolve the cache URL whenever the requested ayah or reciter changes.
    useEffect(() => {
        if (!playback) {
            setResolvedUrl('');
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError(null);
        getAudioSourceUrl(reciterId, playback.ayah.globalNumber)
            .then(src => {
                if (cancelled) return;
                setResolvedUrl(src.url);
            })
            .catch(() => {
                if (cancelled) return;
                setError('تعذر تشغيل التلاوة. تحقق من الاتصال.');
                setLoading(false);
            });
        return () => { cancelled = true; };
    }, [reciterId, playback]);

    // (Re)bind audio element whenever the resolved URL changes.
    useEffect(() => {
        if (!resolvedUrl) return;
        const audio = new Audio(resolvedUrl);
        audio.preload = 'auto';
        // No crossOrigin attribute: cdn.islamic.network does not send
        // Access-Control-Allow-Origin, and the <audio> element only needs
        // CORS when callers want to read the audio data (WebAudio, analyser
        // nodes, etc.) - we just play it. Keeping it off lets the page fall
        // back to the remote URL cleanly when the cache miss hits CORS.
        audioRef.current = audio;

        const onCanPlay = () => { setLoading(false); audio.play().catch(() => { /* user gesture needed */ }); };
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onEnded = () => {
            if (playback) onAdvance({ surahId: playback.surahId, ayahNumber: playback.ayah.number + 1 });
        };
        const onError = () => setError('تعذر تشغيل التلاوة. تحقق من الاتصال.');

        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        return () => {
            audio.pause();
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            audio.src = '';
        };
    }, [resolvedUrl, playback, onAdvance]);

    // Free blob: URLs the cache issued when we no longer need them.
    useEffect(() => {
        const previous = lastBlobRef.current;
        if (previous && previous !== resolvedUrl && previous.startsWith('blob:')) {
            URL.revokeObjectURL(previous);
        }
        lastBlobRef.current = resolvedUrl && resolvedUrl.startsWith('blob:') ? resolvedUrl : null;
    }, [resolvedUrl]);

    const toggle = useCallback(() => {
        const a = audioRef.current;
        if (!a) return;
        if (a.paused) a.play().catch(() => undefined);
        else a.pause();
    }, []);

    const stop = useCallback(() => {
        const a = audioRef.current;
        if (a) { a.pause(); a.currentTime = 0; }
        onStop();
    }, [onStop]);

    if (!playback) return null;

    const surah = getSurah(playback.surahId);
    const arabicAyah = playback.ayah.number.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);

    return (
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
                            onClick={onPrev}
                            aria-label="الآية السابقة"
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500"
                        >
                            <BackwardIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onAdvance({ surahId: playback.surahId, ayahNumber: playback.ayah.number + 1 })}
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
                                آية {arabicAyah}{error ? ' • ' + error : ''}
                            </p>
                        </div>
                        <button
                            onClick={onReciterTap}
                            aria-label="اختر القارئ"
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500"
                            title="القارئ"
                        >
                            <SpeakerWaveIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={stop}
                            aria-label="إيقاف التشغيل"
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AudioMiniPlayer;
