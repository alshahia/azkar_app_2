/**
 * Screen Wake Lock — M4-T5
 *
 * Keeps the device's screen on while the reader is open, so the user can
 * hold the phone and read without touching it. Auto-released when the
 * tab is hidden, the hook unmounts, or the API is unavailable.
 *
 * Browser API: `navigator.wakeLock.request('screen')`. Capacitor Android
 * WebView inherits Chrome's behaviour; iOS PWA on iOS 16.4+ supports it
 * via Safari. When the API is missing the hook is a silent no-op (the
 * reading session simply behaves like every browser did pre-2020).
 *
 * `enabled` lets callers wire a settings toggle without unmounting the
 * hook (the parent will keep it mounted and just flip the prop). When
 * the prop flips off mid-session the active sentinel is released.
 */
import { useEffect, useState } from 'react';

/** Minimal subset of the Wake Lock API we consume; declared so tests can
 *  inject a fake without re-typing `any`. */
export interface WakeLockSentinelLike {
    released: boolean;
    release(): Promise<void>;
    addEventListener(type: 'release', listener: () => void): void;
}

export interface WakeLockRequesterLike {
    request(type: 'screen'): Promise<WakeLockSentinelLike>;
}

/** Read `navigator.wakeLock` if present. Test seams inject a fake
 *  requester on the `window` so jsdom (no native API) can drive the
 *  full acquire/release lifecycle. */
function resolveRequester(): WakeLockRequesterLike | null {
    if (typeof navigator === 'undefined') return null;
    const req = (navigator as Navigator & { wakeLock?: WakeLockRequesterLike }).wakeLock;
    return req ?? null;
}

export interface UseWakeLockResult {
    /** True when `navigator.wakeLock` is present on this browser. */
    isSupported: boolean;
    /** True while the sentinel is held. False at startup, on release, or
     *  when the API is unsupported. */
    isActive: boolean;
    /** Last release/visibility error, surfaced for debugging only — the
     *  hook swallows it from a UX perspective. */
    error: Error | null;
}

export interface UseWakeLockOptions {
    /** When false, any active sentinel is released and no new request is
     *  made (until the prop flips back on). Defaults to true. */
    enabled?: boolean;
}

/**
 * Acquire a screen wake lock on mount, release on unmount. Re-acquires
 * automatically after the page returns to the foreground so a user who
 * briefly switched to the notification shade doesn't end up with a dim
 * screen mid-ayah.
 */
export function useWakeLock(options: UseWakeLockOptions = {}): UseWakeLockResult {
    const enabled = options.enabled !== false;
    const [isSupported] = useState<boolean>(() => resolveRequester() !== null);
    const [isActive, setIsActive] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!enabled) {
            // Schedule the deactivation so we don't setState synchronously
            // inside the effect body (react-hooks v7 set-state-in-effect).
            queueMicrotask(() => setIsActive(false));
            return;
        }
        const requester = resolveRequester();
        if (!requester) {
            return;
        }

        let sentinel: WakeLockSentinelLike | null = null;
        let cancelled = false;

        const acquire = async () => {
            if (cancelled) return;
            try {
                sentinel = await requester.request('screen');
                setIsActive(true);
                setError(null);
                sentinel.addEventListener('release', () => {
                    setIsActive(false);
                    // Drop the closure ref so the visibilitychange listener
                    // can re-acquire a fresh sentinel on the next foreground.
                    if (sentinel && sentinel.released) sentinel = null;
                });
            } catch (e) {
                // Acquire can fail (permission denied, low battery, hidden
                // tab). Treat as a non-fatal condition: the reader still
                // works, the screen just dims on the OS timer.
                setError(e instanceof Error ? e : new Error(String(e)));
                setIsActive(false);
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && !sentinel) {
                acquire();
            }
        };

        acquire();
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', handleVisibility);
            if (sentinel && !sentinel.released) {
                sentinel.release().catch(() => {
                    // release() rejects only when the sentinel was already
                    // released; harmless to swallow.
                });
                sentinel = null;
            }
            setIsActive(false);
        };
    }, [enabled]);

    return { isSupported, isActive, error };
}
