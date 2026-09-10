import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    APP_ARTWORK,
    hasMediaSession,
    setMediaSessionHandlers,
    setMediaSessionPlaybackState,
    updateMediaSessionMetadata,
    updateMediaSessionPositionState,
} from '../../utils/mediaSession';

// jsdom ships no navigator.mediaSession. Install a capture-style fake so the
// production code path runs untouched, like the IntersectionObserver fake in
// surah-reader-resume.test.tsx.
interface FakeMediaSession {
    metadata: unknown;
    playbackState: string;
    handlers: Record<string, unknown>;
    positionState: unknown;
    setActionHandler: (action: string, handler: unknown) => void;
    setPositionState: (state: unknown) => void;
}

let fake: FakeMediaSession;

// jsdom also lacks the MediaMetadata constructor.
class FakeMediaMetadata {
    title: string;
    artist?: string;
    album?: string;
    artwork?: unknown[];
    constructor(init: { title?: string; artist?: string; album?: string; artwork?: unknown[] } | undefined) {
        this.title = init?.title ?? '';
        this.artist = init?.artist;
        this.album = init?.album;
        this.artwork = init?.artwork;
    }
}
(globalThis as unknown as { MediaMetadata: unknown }).MediaMetadata = FakeMediaMetadata;

function installFake(): void {
    fake = {
        metadata: null,
        playbackState: 'none',
        handlers: {},
        positionState: null,
        setActionHandler(action, handler) { fake.handlers[action] = handler; },
        setPositionState(state) { fake.positionState = state; },
    };
    Object.defineProperty(window.navigator, 'mediaSession', {
        configurable: true,
        value: fake,
    });
}

function removeFake(): void {
    delete (window.navigator as unknown as { mediaSession?: unknown }).mediaSession;
}

beforeEach(installFake);
afterEach(() => {
    removeFake();
    vi.restoreAllMocks();
});

describe('hasMediaSession', () => {
    it('detects the API presence and absence', () => {
        expect(hasMediaSession()).toBe(true);
        removeFake();
        expect(hasMediaSession()).toBe(false);
    });
});

describe('updateMediaSessionMetadata', () => {
    it('publishes title/artist/album and defaults artwork to the app icons', () => {
        updateMediaSessionMetadata({ title: 'البقرة', artist: 'العفاسي', album: 'القرآن الكريم' });
        const meta = fake.metadata as { title: string; artist: string; album?: string; artwork: unknown[] };
        expect(meta.title).toBe('البقرة');
        expect(meta.artist).toBe('العفاسي');
        expect(meta.album).toBe('القرآن الكريم');
        expect(meta.artwork).toEqual(APP_ARTWORK);
    });

    it('clears metadata with null', () => {
        updateMediaSessionMetadata({ title: 'الفاتحة' });
        updateMediaSessionMetadata(null);
        expect(fake.metadata).toBeNull();
    });

    it('is a silent no-op when the API is absent', () => {
        removeFake();
        expect(() => updateMediaSessionMetadata({ title: 'x' })).not.toThrow();
        expect(() => updateMediaSessionMetadata(null)).not.toThrow();
    });
});

describe('setMediaSessionHandlers', () => {
    it('installs all six actions and forwards seekto seekTime', () => {
        const play = vi.fn();
        const seek = vi.fn();
        const next = vi.fn();
        setMediaSessionHandlers({ play, pause: undefined, stop: undefined, seekto: seek, previoustrack: undefined, nexttrack: next });
        expect(Object.keys(fake.handlers).sort()).toEqual(['nexttrack', 'pause', 'play', 'previoustrack', 'seekto', 'stop']);
        expect(fake.handlers.play).toBeTypeOf('function');

        // The installed wrapper forwards seekTime to the caller's fn.
        (fake.handlers.seekto as (d: { seekTime: number }) => void)({ seekTime: 12.5 });
        expect(seek).toHaveBeenCalledWith(12.5);

        (fake.handlers.play as () => void)();
        expect(play).toHaveBeenCalledTimes(1);
        (fake.handlers.nexttrack as () => void)();
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('clears every handler when called with null', () => {
        setMediaSessionHandlers({ play: vi.fn() });
        setMediaSessionHandlers(null);
        for (const key of ['play', 'pause', 'stop', 'seekto', 'previoustrack', 'nexttrack']) {
            expect(fake.handlers[key]).toBeNull();
        }
    });

    it('is a silent no-op when the API is absent', () => {
        removeFake();
        expect(() => setMediaSessionHandlers({ play: vi.fn() })).not.toThrow();
        expect(() => setMediaSessionHandlers(null)).not.toThrow();
    });
});

describe('setMediaSessionPlaybackState', () => {
    it('mirrors the state and survives a missing API', () => {
        setMediaSessionPlaybackState('playing');
        expect(fake.playbackState).toBe('playing');
        setMediaSessionPlaybackState('paused');
        expect(fake.playbackState).toBe('paused');
        removeFake();
        expect(() => setMediaSessionPlaybackState('none')).not.toThrow();
    });
});

describe('updateMediaSessionPositionState', () => {
    it('publishes a clamped position state', () => {
        updateMediaSessionPositionState({ duration: 100, position: 250, rate: 1.5 });
        const state = fake.positionState as { duration: number; position: number; playbackRate: number };
        expect(state.duration).toBe(100);
        expect(state.position).toBe(100);
        expect(state.playbackRate).toBe(1.5);
    });

    it('ignores invalid durations and a missing API', () => {
        updateMediaSessionPositionState({ duration: 0, position: 5 });
        expect(fake.positionState).toBeNull();
        updateMediaSessionPositionState({ duration: Number.NaN, position: 5 });
        expect(fake.positionState).toBeNull();
        removeFake();
        expect(() => updateMediaSessionPositionState({ duration: 10, position: 1 })).not.toThrow();
    });
});
