/**
 * AudioQueue - the single owner of "what should be playing" for Quran
 * recitation. A framework-free singleton so playback intent survives screen
 * unmounts (the player UI lives at app level and only mirrors this state)
 * and so the Home "continue listening" card can offer exact-resume after a
 * relaunch.
 *
 * Responsibilities:
 *  - current command: (surahId, ayahNumber, source) - re-issued with a new
 *    seq whenever playback must re-bind (ayah change, reciter change,
 *    restart); consumers key their effects on seq.
 *  - cross-surah auto-advance: end of a surah flows into surah+1 ayah 1,
 *    same reciter; the very last ayah of surah 114 ends the session.
 *  - listen state: (surahId, reciterId, ayahNumber, positionMs) persisted
 *    through the storage adapter kv (throttled while playing, flushed on
 *    stop/pause) - stopping playback keeps the listen state so the card can
 *    still offer resume.
 *
 * The <audio> element itself stays in the player component: this module
 * only tracks intent and position reports.
 */

import { getSurah } from './QuranService';

export interface QuranListenState {
    surahId: number;
    ayahNumber: number;
    reciterId: string;
    positionMs: number;
    updatedAt: number;
}

/** Why the current command exists - the reader uses it to decide scrolling. */
export type PlaySource = 'tap' | 'auto' | 'user';

export interface PlaybackCommand {
    surahId: number;
    ayahNumber: number;
    source: PlaySource;
    /** Resume target for the FIRST bind of this command (exact resume). */
    resumePositionMs: number;
    /** Live position report from the player (updated in place, no notify). */
    positionMs: number;
    /** Monotonic counter - re-binding the same ayah still bumps it. */
    seq: number;
}

export interface AudioQueueState {
    playback: PlaybackCommand | null;
    reciterId: string;
    listen: QuranListenState | null;
}

export interface QueueDeps {
    getKv: <T>(key: string) => Promise<T | null>;
    setKv: (key: string, value: unknown) => Promise<void>;
    now?: () => number;
    persistThrottleMs?: number;
    /** Injectable ayah-count lookup (tests); defaults to the bundled meta. */
    surahCountOf?: (surahId: number) => number | undefined;
}

export const LAST_SURAH_ID = 114;
export const DEFAULT_RECITER_ID = 'ar.alafasy';

const PERSIST_KEY = 'quran_audio_state';
const DEFAULT_THROTTLE_MS = 5000;

interface PersistShape {
    reciterId: string;
    listen: Omit<QuranListenState, 'reciterId'> | null;
}

class AudioQueue {
    private deps: QueueDeps | null = null;
    private state: AudioQueueState = { playback: null, reciterId: DEFAULT_RECITER_ID, listen: null };
    private listeners = new Set<(s: AudioQueueState) => void>();
    private seq = 0;
    private hydrated = false;
    private persistTimer: ReturnType<typeof setTimeout> | null = null;
    private persistInFlight = false;

    // --- wiring ---

    /** Installs deps (storage kv + test seams). Does not read storage. */
    configure(deps: QueueDeps): void {
        this.deps = deps;
    }

    /** Loads persisted state once. Safe to call repeatedly / without deps. */
    async hydrate(): Promise<void> {
        if (this.hydrated || !this.deps) {
            this.hydrated = true;
            return;
        }
        this.hydrated = true;
        try {
            const saved = await this.deps.getKv<PersistShape>(PERSIST_KEY);
            if (!saved) return;
            if (typeof saved.reciterId === 'string' && saved.reciterId) {
                this.state.reciterId = saved.reciterId;
            }
            const listen = saved.listen;
            if (
                listen &&
                Number.isFinite(listen.surahId) && listen.surahId >= 1 && listen.surahId <= LAST_SURAH_ID &&
                Number.isFinite(listen.ayahNumber) && listen.ayahNumber >= 1
            ) {
                this.state.listen = {
                    surahId: listen.surahId,
                    ayahNumber: listen.ayahNumber,
                    reciterId: this.state.reciterId,
                    positionMs: Number.isFinite(listen.positionMs) ? Math.max(0, listen.positionMs) : 0,
                    updatedAt: Number.isFinite(listen.updatedAt) ? listen.updatedAt : 0,
                };
                this.notify();
            }
        } catch {
            // Corrupt kv simply falls back to defaults.
        }
    }

    subscribe(fn: (s: AudioQueueState) => void): () => void {
        this.listeners.add(fn);
        fn(this.state);
        return () => { this.listeners.delete(fn); };
    }

    getState(): AudioQueueState {
        return this.state;
    }

    getListenState(): QuranListenState | null {
        return this.state.listen;
    }

    // --- commands ---

    start(
        surahId: number,
        ayahNumber: number,
        opts: { source?: PlaySource; resumePositionMs?: number } = {},
    ): void {
        if (!Number.isFinite(surahId) || surahId < 1 || surahId > LAST_SURAH_ID) return;
        if (!Number.isFinite(ayahNumber) || ayahNumber < 1) return;
        const count = this.surahCountOf(surahId);
        if (count !== undefined && ayahNumber > count) return;
        this.seq += 1;
        const resume = Math.max(0, opts.resumePositionMs ?? 0);
        this.state = {
            ...this.state,
            playback: {
                surahId,
                ayahNumber,
                source: opts.source ?? 'tap',
                resumePositionMs: resume,
                positionMs: resume,
                seq: this.seq,
            },
        };
        this.state.listen = {
            surahId,
            ayahNumber,
            reciterId: this.state.reciterId,
            positionMs: resume,
            updatedAt: this.now(),
        };
        this.schedulePersist();
        this.notify();
    }

    /** Next ayah, flowing into the next surah at a surah boundary. */
    advance(): void {
        const p = this.state.playback;
        if (!p) return;
        const count = this.surahCountOf(p.surahId);
        if (count !== undefined && p.ayahNumber < count) {
            this.start(p.surahId, p.ayahNumber + 1, { source: 'auto' });
            return;
        }
        if (p.surahId < LAST_SURAH_ID) {
            this.start(p.surahId + 1, 1, { source: 'auto' });
            return;
        }
        // Finished the last ayah of the Mushaf.
        this.stop();
    }

    /** Previous ayah; at the first ayah it restarts the current one. */
    prev(): void {
        const p = this.state.playback;
        if (!p) return;
        if (p.ayahNumber > 1) {
            this.start(p.surahId, p.ayahNumber - 1, { source: 'user' });
        } else {
            this.start(p.surahId, 1, { source: 'user' });
        }
    }

    stop(opts: { clearListen?: boolean } = {}): void {
        if (opts.clearListen) {
            this.state = { ...this.state, playback: null, listen: null };
        } else {
            // Keep the listen state: "continue listening" should still offer
            // the position the user stopped at.
            this.state = { ...this.state, playback: null };
            if (this.state.listen) {
                this.state.listen = { ...this.state.listen, updatedAt: this.now() };
            }
        }
        this.flushPersist();
        this.notify();
    }

    /** Switching reciter re-issues the current ayah from its start. */
    setReciter(id: string): void {
        if (!id || id === this.state.reciterId) return;
        this.state = { ...this.state, reciterId: id };
        if (this.state.listen) {
            this.state.listen = { ...this.state.listen, reciterId: id, updatedAt: this.now() };
        }
        const p = this.state.playback;
        if (p) {
            this.start(p.surahId, p.ayahNumber, { source: 'user' });
        } else {
            this.flushPersist();
            this.notify();
        }
    }

    /**
     * Position report from the player. Updates the live command + listen
     * state WITHOUT notifying (timeupdate cadence must not re-render React),
     * and persists on the throttle cadence.
     */
    notifyPosition(positionMs: number): void {
        const p = this.state.playback;
        if (!p || !Number.isFinite(positionMs) || positionMs < 0) return;
        p.positionMs = positionMs;
        if (this.state.listen) {
            this.state.listen = {
                ...this.state.listen,
                positionMs,
                updatedAt: this.now(),
            };
        }
        this.schedulePersist();
    }

    // --- persistence ---

    private now(): number {
        return this.deps?.now ? this.deps.now() : Date.now();
    }

    private surahCountOf(surahId: number): number | undefined {
        return this.deps?.surahCountOf ? this.deps.surahCountOf(surahId) : getSurah(surahId)?.ayahCount;
    }

    private schedulePersist(): void {
        if (!this.deps) return;
        if (this.persistTimer) return;
        const throttle = this.deps.persistThrottleMs ?? DEFAULT_THROTTLE_MS;
        this.persistTimer = setTimeout(() => {
            this.persistTimer = null;
            this.flushPersist();
        }, throttle);
    }

    /** Writes immediately (coalescing concurrent flushes). */
    flushPersist(): void {
        if (!this.deps || this.persistInFlight) return;
        const payload: PersistShape = {
            reciterId: this.state.reciterId,
            listen: this.state.listen
                ? {
                    surahId: this.state.listen.surahId,
                    ayahNumber: this.state.listen.ayahNumber,
                    positionMs: this.state.listen.positionMs,
                    updatedAt: this.state.listen.updatedAt,
                }
                : null,
        };
        this.persistInFlight = true;
        this.deps.setKv(PERSIST_KEY, payload)
            .catch(() => undefined)
            .finally(() => { this.persistInFlight = false; });
    }

    // --- test seam ---

    _reset(deps?: QueueDeps): void {
        if (this.persistTimer) clearTimeout(this.persistTimer);
        this.deps = deps ?? null;
        this.state = { playback: null, reciterId: DEFAULT_RECITER_ID, listen: null };
        this.listeners.clear();
        this.seq = 0;
        this.hydrated = false;
        this.persistTimer = null;
        this.persistInFlight = false;
    }

    private notify(): void {
        for (const fn of Array.from(this.listeners)) {
            try { fn(this.state); } catch { /* listener errors never break the queue */ }
        }
    }
}

export const audioQueue = new AudioQueue();
