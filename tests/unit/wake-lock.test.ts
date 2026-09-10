/**
 * Tests for hooks/useWakeLock (M4-T5).
 *
 * We can't call the real navigator.wakeLock in jsdom, so each test
 * injects a fake requester on `window` and asserts the hook's acquire /
 * release / re-acquire / visibility behaviour. The hook looks at
 * `navigator.wakeLock`, which jsdom happily accepts when we mutate the
 * real `navigator` object.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWakeLock, type WakeLockSentinelLike, type WakeLockRequesterLike } from '../../hooks/useWakeLock';

interface FakeSentinel extends WakeLockSentinelLike {
    emitRelease(): void;
}

interface FakeRequester extends WakeLockRequesterLike {
    calls: number;
    next: FakeSentinel | { error: Error };
}

function makeSentinel(): FakeSentinel {
    const listeners: Array<() => void> = [];
    const sentinel: FakeSentinel = {
        released: false,
        release: vi.fn(async () => {
            sentinel.released = true;
            listeners.forEach((l) => l());
        }),
        addEventListener: (type, listener) => {
            if (type === 'release') listeners.push(listener);
        },
        emitRelease: () => {
            sentinel.released = true;
            listeners.forEach((l) => l());
        },
    };
    return sentinel;
}

function makeRequester(next: FakeSentinel | { error: Error }): FakeRequester {
    const req: FakeRequester = {
        calls: 0,
        next,
        request: vi.fn(async (_type) => {
            req.calls++;
            if ('error' in req.next) throw req.next.error;
            return req.next;
        }) as WakeLockRequesterLike['request'],
    };
    return req;
}

/** Replace `navigator.wakeLock` with a fake requester for the test. */
function installRequester(req: FakeRequester | null): void {
    Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        get: () => req,
    });
}

describe('useWakeLock', () => {
    beforeEach(() => {
        // Start each test with the hook disabled (no API installed).
        installRequester(null);
    });

    afterEach(() => {
        installRequester(null);
    });

    it('reports unsupported when navigator.wakeLock is missing', () => {
        installRequester(null);
        const { result } = renderHook(() => useWakeLock());
        expect(result.current.isSupported).toBe(false);
        expect(result.current.isActive).toBe(false);
    });

    it('acquires a sentinel on mount when the API is available', async () => {
        const sentinel = makeSentinel();
        const req = makeRequester(sentinel);
        installRequester(req);

        const { result } = renderHook(() => useWakeLock());

        // Allow the microtask inside acquire() to flush.
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(req.calls).toBe(1);
        expect(result.current.isSupported).toBe(true);
        expect(result.current.isActive).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('releases the sentinel on unmount', async () => {
        const sentinel = makeSentinel();
        const req = makeRequester(sentinel);
        installRequester(req);

        const { unmount } = renderHook(() => useWakeLock());

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(sentinel.released).toBe(false);
        unmount();
        expect(sentinel.release).toHaveBeenCalledTimes(1);
    });

    it('does not double-call release() when the OS has already released the sentinel', async () => {
        const sentinel = makeSentinel();
        const req = makeRequester(sentinel);
        installRequester(req);

        const { unmount } = renderHook(() => useWakeLock());
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        // Simulate the OS releasing the sentinel (low-battery, tab switch).
        sentinel.emitRelease();

        // Now unmount; release() should NOT throw or be called twice.
        unmount();
        // First release was the OS-initiated one we faked via emitRelease.
        // Our unmount should skip it because sentinel.released is already true.
        expect((sentinel.release as unknown as { mock?: { calls: unknown[] } }).mock?.calls?.length ?? 0).toBe(0);
    });

    it('re-acquires on visibilitychange when the page becomes visible again', async () => {
        const sentinelA = makeSentinel();
        const sentinelB = makeSentinel();
        const req = makeRequester(sentinelA);
        installRequester(req);

        const { result } = renderHook(() => useWakeLock());
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(req.calls).toBe(1);
        expect(result.current.isActive).toBe(true);

        // OS releases sentinel (user switched tabs).
        act(() => {
            sentinelA.emitRelease();
        });
        expect(result.current.isActive).toBe(false);

        // Switch the fake to return a fresh sentinel for the next request,
        // simulate the page becoming visible again.
        req.next = sentinelB;
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'visible',
        });

        await act(async () => {
            document.dispatchEvent(new Event('visibilitychange'));
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(req.calls).toBe(2);
        expect(result.current.isActive).toBe(true);
    });

    it('does not re-acquire while the page is still hidden', async () => {
        const sentinel = makeSentinel();
        const req = makeRequester(sentinel);
        installRequester(req);

        renderHook(() => useWakeLock());
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(req.calls).toBe(1);

        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            get: () => 'hidden',
        });
        await act(async () => {
            document.dispatchEvent(new Event('visibilitychange'));
            await Promise.resolve();
        });
        expect(req.calls).toBe(1);
    });

    it('records an error when request() rejects', async () => {
        const req = makeRequester({ error: new Error('denied') });
        installRequester(req);

        const { result } = renderHook(() => useWakeLock());
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(result.current.isActive).toBe(false);
        expect(result.current.error?.message).toBe('denied');
    });

    it('releases and stays inactive when the enabled prop flips false', async () => {
        const sentinel = makeSentinel();
        const req = makeRequester(sentinel);
        installRequester(req);

        const { result, rerender } = renderHook(
            ({ enabled }: { enabled: boolean }) => useWakeLock({ enabled }),
            { initialProps: { enabled: true } },
        );

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(result.current.isActive).toBe(true);

        rerender({ enabled: false });
        expect(sentinel.release).toHaveBeenCalledTimes(1);
        expect(result.current.isActive).toBe(false);
    });
});
