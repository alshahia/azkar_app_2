/**
 * Shared Media Session helpers.
 *
 * Both audio surfaces of the app (Gemini TTS zikr playback in AudioService
 * and Quran recitation in AudioMiniPlayer) publish lock-screen/notification
 * controls through these helpers. The global navigator.mediaSession object
 * is single-tenant: the surface that installs handlers LAST owns them, so
 * each surface must install handlers when ITS playback starts and clear
 * them when it stops (setMediaSessionHandlers(null)).
 */

export interface MediaSessionArtwork {
    src: string;
    sizes: string;
    type: string;
}

export interface MediaSessionMeta {
    title: string;
    artist?: string;
    album?: string;
    /** Defaults to the app icon set when omitted. */
    artwork?: MediaSessionArtwork[];
}

/** App icon artwork reused by every audio surface. */
export const APP_ARTWORK: MediaSessionArtwork[] = [
    { src: '/images/icon-192.png', sizes: '96x96', type: 'image/png' },
    { src: '/images/icon-192.png', sizes: '128x128', type: 'image/png' },
    { src: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png' },
];

export type MediaSessionPlaybackState = 'playing' | 'paused' | 'none';

export interface MediaSessionHandlers {
    play?: () => void;
    pause?: () => void;
    stop?: () => void;
    /** Receives the requested position in seconds. */
    seekto?: (seekTime: number) => void;
    previoustrack?: () => void;
    nexttrack?: () => void;
}

const HANDLER_KEYS = ['play', 'pause', 'stop', 'seekto', 'previoustrack', 'nexttrack'] as const;

export function hasMediaSession(): boolean {
    return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export function updateMediaSessionMetadata(meta: MediaSessionMeta | null): void {
    if (!hasMediaSession()) return;
    if (!meta) {
        navigator.mediaSession.metadata = null;
        return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        artwork: (meta.artwork ?? APP_ARTWORK) as unknown as MediaImage[],
    });
}

/**
 * Installs (or, with null, clears) the action handlers. Unknown actions on
 * a given platform throw NotSupportedError - swallowed, they are optional.
 */
export function setMediaSessionHandlers(handlers: MediaSessionHandlers | null): void {
    if (!hasMediaSession()) return;
    const safe = (action: MediaSessionAction, handler: MediaSessionActionHandler | null): void => {
        try {
            navigator.mediaSession.setActionHandler(action, handler);
        } catch {
            // Action unsupported on this platform - skip it.
        }
    };
    const wrap = (fn: (() => void) | undefined): MediaSessionActionHandler | null =>
        fn ? () => fn() : null;
    if (!handlers) {
        for (const action of HANDLER_KEYS) safe(action, null);
        return;
    }
    safe('play', wrap(handlers.play));
    safe('pause', wrap(handlers.pause));
    safe('stop', wrap(handlers.stop));
    safe('previoustrack', wrap(handlers.previoustrack));
    safe('nexttrack', wrap(handlers.nexttrack));
    const seek = handlers.seekto;
    safe('seekto', seek
        ? (details: MediaSessionActionDetails) => { seek(details?.seekTime ?? 0); }
        : null);
}

export function setMediaSessionPlaybackState(state: MediaSessionPlaybackState): void {
    if (!hasMediaSession()) return;
    navigator.mediaSession.playbackState = state;
}

/** Lock-screen scrubber position; silently ignored where unsupported. */
export function updateMediaSessionPositionState(input: {
    duration: number;
    position: number;
    rate?: number;
}): void {
    if (!hasMediaSession()) return;
    if (!Number.isFinite(input.duration) || input.duration <= 0) return;
    try {
        navigator.mediaSession.setPositionState({
            duration: input.duration,
            position: Math.min(Math.max(input.position, 0), input.duration),
            playbackRate: input.rate && input.rate > 0 ? input.rate : 1,
        });
    } catch {
        // setPositionState unsupported or the state was invalid.
    }
}
