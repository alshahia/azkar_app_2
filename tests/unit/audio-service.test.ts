/**
 * Unit tests for services/AudioService.ts (Gemini TTS zikr playback).
 *
 * Every external boundary is mocked:
 *   - window.AudioContext     -> MockAudioContext (Web Audio graph)
 *   - @google/genai           -> GoogleGenAI + Modality (TTS SDK)
 *   - ../../data/storage      -> getStorage() (preferences + audio cache)
 *   - ../../utils/mediaSession -> lock-screen control helpers
 *   - fetch                   -> stubbed guard; TTS audio is fetched through
 *                                 the GoogleGenAI SDK, so the service must
 *                                 never call fetch directly
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { audioService } from '../../services/AudioService';

// ---------------------------------------------------------------------------
// Fake TTS payload
// ---------------------------------------------------------------------------

/**
 * Base64-encoded PCM silence, `seconds` long. The service decodes base64 into
 * a Uint8Array and reinterprets it as an Int16Array, so the payload must hold
 * an even number of bytes.
 */
function makeAudioBase64(seconds: number, sampleRate = 24000): string {
    const totalBytes = seconds * sampleRate * 2; // 16-bit mono
    const bytes = new Uint8Array(totalBytes);
    let binary = '';
    const CHUNK = 0x8000; // keep String.fromCharCode's argument list small
    for (let i = 0; i < totalBytes; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
}

const FAKE_AUDIO_BASE64 = makeAudioBase64(10);

// ---------------------------------------------------------------------------
// Mock window.AudioContext
// ---------------------------------------------------------------------------

class MockAudioBufferSourceNode {
    buffer: unknown = null;
    playbackRate = { value: 1 };
    onended: (() => void) | null = null;
    startCalls: Array<[number, number]> = [];
    stopCalls = 0;
    connect = vi.fn();
    start = vi.fn((when: number, offset: number) => {
        this.startCalls.push([when, offset]);
    });
    stop = vi.fn(() => {
        this.stopCalls += 1;
        // Browsers fire onended when stop() is called; AudioService relies on
        // this (it nulls onended first when the event must be suppressed).
        if (this.onended) this.onended();
    });
}

class MockAudioBuffer {
    readonly duration: number;
    private readonly frameCount: number;

    constructor(
        readonly numberOfChannels: number,
        frameCount: number,
        readonly sampleRate: number,
    ) {
        this.frameCount = frameCount;
        this.duration = frameCount / sampleRate;
    }

    getChannelData(_channel: number): Float32Array {
        return new Float32Array(this.frameCount);
    }
}

class MockAudioContext {
    static readonly instances: MockAudioContext[] = [];

    state: 'running' | 'suspended' = 'running';
    currentTime = 0;
    readonly destination = {};
    sources: MockAudioBufferSourceNode[] = [];

    resume = vi.fn(async () => {
        this.state = 'running';
    });
    createBufferSource = vi.fn((): MockAudioBufferSourceNode => {
        const source = new MockAudioBufferSourceNode();
        this.sources.push(source);
        return source;
    });
    createBuffer = vi.fn((channels: number, frameCount: number, sampleRate: number) =>
        new MockAudioBuffer(channels, frameCount, sampleRate),
    );

    constructor() {
        MockAudioContext.instances.push(this);
    }
}

/** The context instance the service is currently using (it caches one). */
function currentContext(): MockAudioContext {
    return MockAudioContext.instances[MockAudioContext.instances.length - 1];
}

(window as unknown as { AudioContext: unknown }).AudioContext = MockAudioContext;

// ---------------------------------------------------------------------------
// Hoisted mock registry — vi.mock factories may only reference vi.hoisted data
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
    storage: {
        getPreferences: vi.fn(),
        getAudio: vi.fn(),
        saveAudio: vi.fn(),
    },
    mediaSession: {
        setMediaSessionHandlers: vi.fn(),
        setMediaSessionPlaybackState: vi.fn(),
        updateMediaSessionMetadata: vi.fn(),
    },
    generateContent: vi.fn(),
    GoogleGenAI: vi.fn(),
    fetch: vi.fn(),
}));

vi.mock('@google/genai', () => ({
    Modality: { AUDIO: 'AUDIO' },
    GoogleGenAI: mocks.GoogleGenAI,
}));

vi.mock('../../data/storage', () => ({
    getStorage: () => mocks.storage,
}));

vi.mock('../../utils/mediaSession', () => ({
    setMediaSessionHandlers: mocks.mediaSession.setMediaSessionHandlers,
    setMediaSessionPlaybackState: mocks.mediaSession.setMediaSessionPlaybackState,
    updateMediaSessionMetadata: mocks.mediaSession.updateMediaSessionMetadata,
}));

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

interface TtsRequest {
    model: string;
    contents: Array<{ parts: Array<{ text: string }> }>;
    config: {
        responseModalities: string[];
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } };
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mocks.fetch);

    // Default mock behaviour; individual tests override what they need.
    // A regular function (not an arrow) so the service can call it with `new`.
    mocks.GoogleGenAI.mockImplementation(function () {
        return { models: { generateContent: mocks.generateContent } };
    });
    mocks.generateContent.mockResolvedValue({
        candidates: [{ content: { parts: [{ inlineData: { data: FAKE_AUDIO_BASE64 } }] } }],
    });
    mocks.storage.getPreferences.mockResolvedValue({ audioAutoSave: false });
    mocks.storage.getAudio.mockResolvedValue(null); // cache miss by default
    mocks.storage.saveAudio.mockResolvedValue(undefined);
    mocks.fetch.mockResolvedValue(
        new Response(
            JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: FAKE_AUDIO_BASE64 } }] } }] }),
            { status: 200 },
        ),
    );

    // Fresh Web Audio state (the service caches one context for its lifetime).
    for (const ctx of MockAudioContext.instances) {
        ctx.currentTime = 0;
        ctx.state = 'running';
        ctx.sources = [];
    }

    // Fresh service state.
    audioService.stop();
});

afterEach(() => {
    audioService.stop();
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// playZikrAudio
// ---------------------------------------------------------------------------

describe('AudioService - playZikrAudio', () => {
    it('playZikrAudio starts playback and returns a promise', async () => {
        const promise = audioService.playZikrAudio('أذكار الصباح', 'Kore', 'test-api-key');

        expect(promise).toBeInstanceOf(Promise);
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        const ctx = currentContext();
        expect(ctx.sources).toHaveLength(1);
        expect(ctx.sources[0].startCalls[0]).toEqual([0, 0]);

        // The TTS request goes through the GoogleGenAI SDK, never raw fetch.
        expect(mocks.GoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
        expect(mocks.generateContent).toHaveBeenCalledTimes(1);
        const request = mocks.generateContent.mock.calls[0][0] as TtsRequest;
        expect(request.model).toBe('gemini-2.5-flash-preview-tts');
        expect(request.contents[0].parts[0].text).toBe('أذكار الصباح');
        expect(request.config.responseModalities).toEqual(['AUDIO']);
        expect(request.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe('Kore');
        expect(mocks.fetch).not.toHaveBeenCalled();

        // The lock screen is claimed for the track.
        expect(mocks.mediaSession.updateMediaSessionMetadata).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'أذكار الصباح' }),
        );
        expect(mocks.mediaSession.setMediaSessionHandlers).toHaveBeenCalled();
        expect(mocks.mediaSession.setMediaSessionPlaybackState).toHaveBeenCalledWith('playing');

        audioService.stop();
    });

    it('plays from the local cache without calling the TTS API', async () => {
        mocks.storage.getAudio.mockResolvedValue(FAKE_AUDIO_BASE64);

        audioService.playZikrAudio('cached zikr', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        expect(mocks.storage.getAudio).toHaveBeenCalledTimes(1);
        expect(mocks.GoogleGenAI).not.toHaveBeenCalled();
        expect(mocks.generateContent).not.toHaveBeenCalled();
        expect(mocks.storage.saveAudio).not.toHaveBeenCalled();

        audioService.stop();
    });

    it('saves fetched audio to the cache when audioAutoSave is enabled', async () => {
        mocks.storage.getPreferences.mockResolvedValue({ audioAutoSave: true });

        audioService.playZikrAudio('save me', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        expect(mocks.storage.saveAudio).toHaveBeenCalledTimes(1);
        const [key, data] = mocks.storage.saveAudio.mock.calls[0];
        expect(key).toMatch(/_Kore$/); // cache key is `${hash(text)}${voiceName}`
        expect(data).toBe(FAKE_AUDIO_BASE64);

        audioService.stop();
    });

    it('throws when no API key is provided for an uncached track', async () => {
        await expect(audioService.playZikrAudio('uncached zikr', 'Kore')).rejects.toThrow('API_KEY_MISSING');
        expect(audioService.isPlayingState()).toBe(false);
    });

    it('throws when offline and the track is not cached', async () => {
        const originalOnLine = navigator.onLine;
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true, writable: true });
        try {
            await expect(audioService.playZikrAudio('offline zikr', 'Kore', 'test-api-key'))
                .rejects.toThrow('OFFLINE_AND_NOT_CACHED');
        } finally {
            Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true, writable: true });
        }
    });

    it('resolves false when the TTS API returns no audio data', async () => {
        mocks.generateContent.mockResolvedValue({
            candidates: [{ content: { parts: [{ inlineData: { data: '' } }] } }],
        });

        await expect(audioService.playZikrAudio('silent zikr', 'Kore', 'test-api-key')).resolves.toBe(false);
        expect(audioService.isPlayingState()).toBe(false);
    });

    it('resolves true when the track finishes naturally', async () => {
        const promise = audioService.playZikrAudio('short zikr', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        const ctx = currentContext();
        ctx.sources[0].onended?.();

        await expect(promise).resolves.toBe(true);
        expect(audioService.isPlayingState()).toBe(false);
        expect(audioService.getDuration()).toBe(0);
        expect(mocks.mediaSession.setMediaSessionPlaybackState).toHaveBeenCalledWith('none');
    });
});

// ---------------------------------------------------------------------------
// pause / resume
// ---------------------------------------------------------------------------

describe('AudioService - pause / resume', () => {
    it('pause() pauses the audio', async () => {
        audioService.playZikrAudio('pause me', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        const ctx = currentContext();
        ctx.currentTime = 5; // simulate 5s of playback
        const source = ctx.sources[0];

        audioService.pause();

        expect(audioService.isPausedState()).toBe(true);
        expect(audioService.isPlayingState()).toBe(false);
        expect(source.stopCalls).toBe(1);
        expect(mocks.mediaSession.setMediaSessionPlaybackState).toHaveBeenCalledWith('paused');

        audioService.stop();
    });

    it('resume() resumes from the paused position', async () => {
        audioService.playZikrAudio('resume me', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        const ctx = currentContext();
        ctx.currentTime = 5;
        audioService.pause();
        expect(audioService.isPausedState()).toBe(true);

        audioService.resume();

        expect(audioService.isPlayingState()).toBe(true);
        expect(audioService.isPausedState()).toBe(false);
        // A new source was created and started at the paused offset (5s),
        // not from the beginning of the track.
        expect(ctx.sources).toHaveLength(2);
        expect(ctx.sources[1].startCalls[0]).toEqual([0, 5]);
        expect(mocks.mediaSession.setMediaSessionPlaybackState).toHaveBeenCalledWith('playing');

        audioService.stop();
    });

    it('pause() and resume() are no-ops when nothing is playing', () => {
        expect(audioService.isPlayingState()).toBe(false);
        expect(audioService.isPausedState()).toBe(false);
        expect(() => {
            audioService.pause();
            audioService.resume();
        }).not.toThrow();
        expect(audioService.isPlayingState()).toBe(false);
        expect(audioService.isPausedState()).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// stop
// ---------------------------------------------------------------------------

describe('AudioService - stop', () => {
    it('stop() stops playback and resets state', async () => {
        const promise = audioService.playZikrAudio('stop me', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        const ctx = currentContext();
        const source = ctx.sources[0];

        audioService.stop();

        expect(audioService.isPlayingState()).toBe(false);
        expect(audioService.isPausedState()).toBe(false);
        expect(source.stopCalls).toBe(1);
        expect(audioService.getDuration()).toBe(0);
        // A manual stop resolves the playZikrAudio promise with false.
        await expect(promise).resolves.toBe(false);
        expect(mocks.mediaSession.setMediaSessionPlaybackState).toHaveBeenCalledWith('none');
    });
});

// ---------------------------------------------------------------------------
// seek
// ---------------------------------------------------------------------------

describe('AudioService - seek', () => {
    it('seek() changes the playback position', async () => {
        audioService.playZikrAudio('seek me', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        const ctx = currentContext();

        audioService.seek(7);

        // While playing, seek stops the current source and starts a new one
        // at the requested offset.
        expect(ctx.sources).toHaveLength(2);
        expect(ctx.sources[1].startCalls[0]).toEqual([0, 7]);
        expect(audioService.getCurrentTime()).toBe(7);

        audioService.stop();
    });

    it('seek() while paused updates the paused position without restarting', async () => {
        audioService.playZikrAudio('seek paused', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        const ctx = currentContext();
        ctx.currentTime = 4;
        audioService.pause();
        expect(audioService.isPausedState()).toBe(true);

        audioService.seek(3);

        expect(audioService.isPausedState()).toBe(true);
        expect(audioService.isPlayingState()).toBe(false);
        expect(audioService.getCurrentTime()).toBe(3);
        // No new source was created while paused.
        expect(ctx.sources).toHaveLength(1);

        audioService.stop();
    });

    it('seek() is a no-op when no buffer is loaded', () => {
        expect(() => audioService.seek(5)).not.toThrow();
        expect(audioService.getCurrentTime()).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// state getters
// ---------------------------------------------------------------------------

describe('AudioService - state getters', () => {
    it('isPlaying() returns true during playback', async () => {
        expect(audioService.isPlayingState()).toBe(false);

        audioService.playZikrAudio('playing state', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        audioService.pause();
        expect(audioService.isPlayingState()).toBe(false);

        audioService.resume();
        expect(audioService.isPlayingState()).toBe(true);

        audioService.stop();
        expect(audioService.isPlayingState()).toBe(false);
    });

    it('isPaused() returns true when paused', async () => {
        expect(audioService.isPausedState()).toBe(false);

        audioService.playZikrAudio('paused state', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));
        expect(audioService.isPausedState()).toBe(false);

        audioService.pause();
        expect(audioService.isPausedState()).toBe(true);

        audioService.resume();
        expect(audioService.isPausedState()).toBe(false);

        audioService.stop();
        expect(audioService.isPausedState()).toBe(false);
    });

    it('exposes the duration of the loaded buffer', async () => {
        expect(audioService.getDuration()).toBe(0);

        audioService.playZikrAudio('duration', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));
        expect(audioService.getDuration()).toBe(10);

        audioService.stop();
        expect(audioService.getDuration()).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// track switching
// ---------------------------------------------------------------------------

describe('AudioService - track switching', () => {
    it('resumes instead of restarting when the same text is played while paused', async () => {
        const text = 'same zikr text';
        audioService.playZikrAudio(text, 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        const ctx = currentContext();
        ctx.currentTime = 4;
        audioService.pause();
        expect(audioService.isPausedState()).toBe(true);

        const sourcesBefore = ctx.sources.length;
        const ttsCallsBefore = mocks.generateContent.mock.calls.length;
        const cacheLookupsBefore = mocks.storage.getAudio.mock.calls.length;

        const secondPromise = audioService.playZikrAudio(text, 'Kore', 'test-api-key');
        expect(secondPromise).toBeInstanceOf(Promise);

        // The paused buffer is reused: no new TTS request, no cache lookup.
        expect(mocks.generateContent).toHaveBeenCalledTimes(ttsCallsBefore);
        expect(mocks.storage.getAudio).toHaveBeenCalledTimes(cacheLookupsBefore);

        // Playback resumed from the paused position (4s), not from the start.
        expect(audioService.isPlayingState()).toBe(true);
        expect(audioService.isPausedState()).toBe(false);
        expect(ctx.sources).toHaveLength(sourcesBefore + 1);
        expect(ctx.sources[sourcesBefore].startCalls[0]).toEqual([0, 4]);

        audioService.stop();
    });

    it('stops the current track and starts a new one when the text differs', async () => {
        const firstPromise = audioService.playZikrAudio('first zikr', 'Kore', 'test-api-key');
        await vi.waitFor(() => expect(audioService.isPlayingState()).toBe(true));

        const ctx = currentContext();
        const firstSource = ctx.sources[0];

        audioService.playZikrAudio('second zikr', 'Kore', 'test-api-key');
        await vi.waitFor(() => {
            expect(mocks.generateContent).toHaveBeenCalledTimes(2);
            expect(audioService.isPlayingState()).toBe(true);
        });

        // The first track was stopped: its source halted and its promise
        // resolved false (manual stop, not natural completion).
        expect(firstSource.stopCalls).toBe(1);
        await expect(firstPromise).resolves.toBe(false);

        // The second track started from the beginning.
        const secondSource = ctx.sources[ctx.sources.length - 1];
        expect(secondSource.startCalls[0]).toEqual([0, 0]);

        audioService.stop();
    });
});
