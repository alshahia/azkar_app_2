import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { audioQueue, DEFAULT_RECITER_ID, type QueueDeps } from '../../services/audioQueue';

// --- Fake kv storage -------------------------------------------------------

function createFakeKv() {
    const map = new Map<string, unknown>();
    return {
        map,
        getKv: async <T,>(key: string): Promise<T | null> => (map.has(key) ? (map.get(key) as T) : null),
        setKv: async (key: string, value: unknown): Promise<void> => { map.set(key, value); },
    };
}

const kv = createFakeKv();

// Deterministic surah lengths for boundary tests (real Al-Baqarah/Fatiha counts).
const COUNTS: Record<number, number> = { 1: 7, 2: 286, 3: 200, 113: 5, 114: 6 };

function deps(overrides: Partial<QueueDeps> = {}): QueueDeps {
    return {
        getKv: kv.getKv,
        setKv: kv.setKv,
        now: () => 1_000,
        persistThrottleMs: 5,
        surahCountOf: (id: number) => COUNTS[id],
        ...overrides,
    };
}

beforeEach(() => {
    kv.map.clear();
    audioQueue._reset(deps());
});

afterEach(() => {
    audioQueue._reset();
});

async function flushed(): Promise<unknown> {
    await vi.waitFor(() => expect(kv.map.has('quran_audio_state')).toBe(true));
    return kv.map.get('quran_audio_state');
}

describe('audioQueue - commands', () => {
    it('subscribe receives the current state immediately', () => {
        const seen: unknown[] = [];
        const unsub = audioQueue.subscribe(s => seen.push(s));
        expect(seen).toHaveLength(1);
        expect(seen[0]).toMatchObject({ playback: null, reciterId: DEFAULT_RECITER_ID });
        unsub();
    });

    it('start issues a tap command and seeds the listen state', () => {
        audioQueue.start(2, 5);
        const state = audioQueue.getState();
        expect(state.playback).toMatchObject({ surahId: 2, ayahNumber: 5, source: 'tap', resumePositionMs: 0, seq: 1 });
        expect(state.listen).toMatchObject({ surahId: 2, ayahNumber: 5, reciterId: DEFAULT_RECITER_ID });
    });

    it('rejects out-of-range commands without changing state', () => {
        audioQueue.start(2, 5);
        const before = audioQueue.getState();
        audioQueue.start(0, 1);
        audioQueue.start(115, 1);
        audioQueue.start(2, 0);
        audioQueue.start(2, 999);
        expect(audioQueue.getState()).toBe(before);
    });

    it('resume position is carried on the command and the listen state', () => {
        audioQueue.start(2, 255, { resumePositionMs: 1500, source: 'user' });
        expect(audioQueue.getState().playback).toMatchObject({ resumePositionMs: 1500, positionMs: 1500 });
        expect(audioQueue.getListenState()).toMatchObject({ positionMs: 1500 });
    });
});

describe('audioQueue - auto-advance across surahs (M1-T6)', () => {
    it('advances within a surah with source auto', () => {
        audioQueue.start(2, 5);
        audioQueue.advance();
        expect(audioQueue.getState().playback).toMatchObject({ surahId: 2, ayahNumber: 6, source: 'auto', seq: 2 });
    });

    it('flows from the last ayah of a surah into the next surah', () => {
        audioQueue.start(2, 286);
        audioQueue.advance();
        expect(audioQueue.getState().playback).toMatchObject({ surahId: 3, ayahNumber: 1, source: 'auto' });
    });

    it('ends the session after the last ayah of the Mushaf but keeps listen state', () => {
        audioQueue.start(114, 5);
        audioQueue.advance(); // -> 114:6
        expect(audioQueue.getState().playback).toMatchObject({ ayahNumber: 6 });
        audioQueue.advance(); // -> end
        expect(audioQueue.getState().playback).toBeNull();
        expect(audioQueue.getListenState()).not.toBeNull();
    });

    it('prev steps back; prev at the first ayah restarts the current one', () => {
        audioQueue.start(2, 3);
        audioQueue.prev();
        expect(audioQueue.getState().playback).toMatchObject({ surahId: 2, ayahNumber: 2, source: 'user' });
        audioQueue.start(2, 1);
        const seqBefore = audioQueue.getState().playback?.seq;
        audioQueue.prev();
        expect(audioQueue.getState().playback).toMatchObject({ surahId: 2, ayahNumber: 1, source: 'user' });
        expect(audioQueue.getState().playback?.seq).toBeGreaterThan(seqBefore ?? 0);
    });

    it('prev without playback is a no-op', () => {
        audioQueue.prev();
        expect(audioQueue.getState().playback).toBeNull();
    });
});

describe('audioQueue - stop / reciter', () => {
    it('stop clears playback but keeps the listen state for the continue card', () => {
        audioQueue.start(2, 10);
        audioQueue.notifyPosition(4000);
        audioQueue.stop();
        const state = audioQueue.getState();
        expect(state.playback).toBeNull();
        expect(state.listen).toMatchObject({ surahId: 2, ayahNumber: 10, positionMs: 4000 });
    });

    it('stop({ clearListen }) forgets the session entirely', () => {
        audioQueue.start(2, 10);
        audioQueue.stop({ clearListen: true });
        expect(audioQueue.getState().listen).toBeNull();
    });

    it('switching reciter re-issues the current ayah from its start', () => {
        audioQueue.start(2, 10);
        audioQueue.notifyPosition(8000);
        audioQueue.setReciter('ar.husary');
        const state = audioQueue.getState();
        expect(state.reciterId).toBe('ar.husary');
        expect(state.playback).toMatchObject({ surahId: 2, ayahNumber: 10, source: 'user', resumePositionMs: 0, seq: 2 });
        expect(state.listen).toMatchObject({ reciterId: 'ar.husary' });
    });

    it('switching reciter while idle persists the choice', async () => {
        audioQueue.setReciter('ar.husary');
        const saved = await flushed();
        expect(saved).toMatchObject({ reciterId: 'ar.husary' });
    });
});

describe('audioQueue - position reporting + persistence (M1-T5)', () => {
    it('notifyPosition updates the live command without notifying subscribers', () => {
        let notified = 0;
        audioQueue.subscribe(() => { notified += 1; });
        audioQueue.start(2, 10);
        const afterStart = notified;
        audioQueue.notifyPosition(2500);
        expect(notified).toBe(afterStart);
        expect(audioQueue.getState().playback).toMatchObject({ positionMs: 2500 });
        expect(audioQueue.getListenState()).toMatchObject({ positionMs: 2500 });
    });

    it('persists the listen state on the throttle cadence', async () => {
        audioQueue.start(2, 255);
        audioQueue.notifyPosition(4200);
        const saved = await flushed();
        expect(saved).toMatchObject({
            reciterId: DEFAULT_RECITER_ID,
            listen: { surahId: 2, ayahNumber: 255, positionMs: 4200 },
        });
    });

    it('ignores invalid position reports', () => {
        audioQueue.start(2, 10);
        expect(() => audioQueue.notifyPosition(Number.NaN)).not.toThrow();
        expect(() => audioQueue.notifyPosition(-5)).not.toThrow();
        expect(audioQueue.getState().playback).toMatchObject({ positionMs: 0 });
    });
});

describe('audioQueue - hydrate from persisted state', () => {
    it('restores reciter + listen state from the kv on init', async () => {
        kv.map.set('quran_audio_state', {
            reciterId: 'ar.husary',
            listen: { surahId: 2, ayahNumber: 255, positionMs: 4200, updatedAt: 1 },
        });
        audioQueue._reset(deps());
        await audioQueue.hydrate();
        expect(audioQueue.getState().reciterId).toBe('ar.husary');
        expect(audioQueue.getListenState()).toMatchObject({ surahId: 2, ayahNumber: 255, positionMs: 4200 });
    });

    it('ignores corrupt or out-of-range persisted values', async () => {
        kv.map.set('quran_audio_state', {
            reciterId: 'ar.husary',
            listen: { surahId: 999, ayahNumber: 1, positionMs: -5, updatedAt: 1 },
        });
        audioQueue._reset(deps());
        await audioQueue.hydrate();
        expect(audioQueue.getState().reciterId).toBe('ar.husary'); // reciter survives
        expect(audioQueue.getListenState()).toBeNull();            // listen does not
    });

    it('hydrate without deps or repeated calls are safe', async () => {
        audioQueue._reset();
        await audioQueue.hydrate();
        await audioQueue.hydrate();
        expect(audioQueue.getListenState()).toBeNull();
    });
});
