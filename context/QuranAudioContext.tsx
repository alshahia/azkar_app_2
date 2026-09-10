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
