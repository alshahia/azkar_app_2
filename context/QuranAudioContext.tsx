/**
 * React binding around the audioQueue singleton. Mounted once at app level
 * so Quran recitation survives screen navigation (M1-T6) and the Home
 * "continue listening" card can start exact-resume playback (M1-T5).
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { audioQueue, type AudioQueueState, type PlaySource } from '../services/audioQueue';
import { getStorage } from '../data/storage';

export interface QuranAudioApi extends AudioQueueState {
    play: (surahId: number, ayahNumber: number, opts?: { resumePositionMs?: number; source?: PlaySource }) => void;
    stop: () => void;
    advance: () => void;
    prev: () => void;
    setReciter: (id: string) => void;
    /** Live position report from the player (no re-render, throttled persist). */
    reportPosition: (positionMs: number) => void;
    /** Forces the listen state to disk (pause / background / stop). */
    flushPosition: () => void;
}

const QuranAudioContext = createContext<QuranAudioApi | null>(null);

/**
 * Safe no-op default used by the per-provider error boundary in App.tsx.
 * If QuranAudioProvider crashes, the boundary re-supplies this value so
 * consumers keep working: every method is a no-op, every state field is
 * a safe empty value (no playback, no resume target, empty reciter id).
 * The audio mini player and other UI continue to render instead of
 * unmounting — they just show a stopped / idle state.
 *
 * `play` accepts the same shape the real API expects but does nothing,
 * so callers that ignore the return value (e.g. `<button onClick={() =>
 * play(1, 1)}>`) keep working without conditional checks.
 */
export const NOOP_QURAN_AUDIO: QuranAudioApi = {
    playback: null,
    reciterId: '',
    listen: null,
    play: () => {},
    stop: () => {},
    advance: () => {},
    prev: () => {},
    setReciter: () => {},
    reportPosition: () => {},
    flushPosition: () => {},
};

export { QuranAudioContext };

export const QuranAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AudioQueueState>(() => audioQueue.getState());

    useEffect(() => {
        const unsubscribe = audioQueue.subscribe(setState);
        const storage = getStorage();
        audioQueue.configure({ getKv: key => storage.getKv(key), setKv: (key, value) => storage.setKv(key, value) });
        void audioQueue.hydrate();
        return unsubscribe;
    }, []);

    const play = useCallback(
        (surahId: number, ayahNumber: number, opts?: { resumePositionMs?: number; source?: PlaySource }) => {
            audioQueue.start(surahId, ayahNumber, opts);
        },
        [],
    );
    const stop = useCallback(() => { audioQueue.stop(); }, []);
    const advance = useCallback(() => { audioQueue.advance(); }, []);
    const prev = useCallback(() => { audioQueue.prev(); }, []);
    const setReciter = useCallback((id: string) => { audioQueue.setReciter(id); }, []);
    const reportPosition = useCallback((positionMs: number) => { audioQueue.notifyPosition(positionMs); }, []);
    const flushPosition = useCallback(() => { audioQueue.flushPersist(); }, []);

    const api = useMemo<QuranAudioApi>(
        () => ({ ...state, play, stop, advance, prev, setReciter, reportPosition, flushPosition }),
        [state, play, stop, advance, prev, setReciter, reportPosition, flushPosition],
    );

    return <QuranAudioContext.Provider value={api}>{children}</QuranAudioContext.Provider>;
};

export function useQuranAudio(): QuranAudioApi {
    const ctx = useContext(QuranAudioContext);
    if (!ctx) throw new Error('useQuranAudio must be used within QuranAudioProvider');
    return ctx;
}
