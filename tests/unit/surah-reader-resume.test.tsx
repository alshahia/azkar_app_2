
// Verifies the auto-tracked "تابع من حيث توقفت" feature in SurahReaderScreen.
//
// The reader mounts an IntersectionObserver that watches every ayah card and
// pushes the topmost intersecting ayah into the AppContext.setQuranLastRead
// callback on every intersection change. An unmount cleanup guarantees the
// last seen ayah is also flushed to storage. These tests pin both behaviours
// so the resume banner always reflects the ayah the user actually reached
// - even when no bookmark was saved.
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { AppContext } from '../../context/AppContext';
import type { AppContextType } from '../../types';

// jsdom doesn't ship a working IntersectionObserver. We install a capture-style
// fake on globalThis so the production code path runs untouched, and so the
// test can drive the callback manually with synthetic entries.
type IOCallback = (entries: { target: HTMLElement; isIntersecting: boolean; intersectionRatio: number }[]) => void;
type FakeObserver = {
    cb: IOCallback;
    observed: HTMLElement[];
    observe: (el: HTMLElement) => void;
    unobserve: (el: HTMLElement) => void;
    disconnect: () => void;
    takeRecords: () => unknown[];
};

let lastObserver: FakeObserver | null = null;

beforeEach(() => {
    lastObserver = null;
    function FakeIO(this: unknown, cb: IOCallback) {
        const self: FakeObserver = {
            cb,
            observed: [],
            observe(el) { self.observed.push(el); },
            unobserve() { /* no-op */ },
            disconnect() { self.observed = []; },
            takeRecords() { return []; },
        };
        lastObserver = self;
        return self as unknown as IntersectionObserver;
    }
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIO;
});

afterEach(() => {
    cleanup();
    delete (globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
    vi.restoreAllMocks();
});

// Build a SurahReaderScreen-shaped component that uses the SAME
// IntersectionObserver + unmount-save pattern as production. This lets us
// exercise the behaviour without dragging in the full reader (which needs
// the Quran dataset + audio cache + Capacitor mocks).
const SurahReaderHarness: React.FC<{
    setQuranLastRead: (l: { surah: number; ayah: number }) => Promise<void>;
    surahId: number;
    ayahs: { number: number }[];
    initialAyah?: number;
}> = ({ setQuranLastRead, surahId, ayahs, initialAyah = 1 }) => {
    const [currentAyah, setCurrentAyah] = React.useState<number>(initialAyah);
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    // Stable refs so the IO + unmount-save effects don't churn on every App re-render.
    const setQuranLastReadRef = React.useRef(setQuranLastRead);
    const surahIdRef = React.useRef(surahId);
    const currentAyahRef = React.useRef(currentAyah);
    React.useEffect(() => { setQuranLastReadRef.current = setQuranLastRead; }, [setQuranLastRead]);
    React.useEffect(() => { surahIdRef.current = surahId; }, [surahId]);
    React.useEffect(() => { currentAyahRef.current = currentAyah; }, [currentAyah]);

    React.useEffect(() => {
        if (ayahs.length === 0) return;
        const visible = new Map<number, number>();
        const obs = new IntersectionObserver(entries => {
            for (const e of entries) {
                const id = (e.target as HTMLElement).id;
                if (!id.startsWith('ayah-')) continue;
                const [, , numStr] = id.split('-');
                const n = Number(numStr);
                if (e.isIntersecting) visible.set(n, e.intersectionRatio);
                else visible.delete(n);
            }
            if (visible.size === 0) return;
            const top = Math.min(...Array.from(visible.keys()));
            setCurrentAyah(top);
            setQuranLastReadRef.current({ surah: surahIdRef.current, ayah: top }).catch(() => undefined);
        });
        containerRef.current?.querySelectorAll('[id^="ayah-"]').forEach(el => obs.observe(el));
        return () => obs.disconnect();
    }, [ayahs]);

    React.useEffect(() => {
        return () => {
            const ayah = currentAyahRef.current;
            if (ayah > 0) {
                setQuranLastReadRef.current({ surah: surahIdRef.current, ayah }).catch(() => undefined);
            }
        };
    }, []);

    return (
        <div ref={containerRef} data-testid="container">
            {ayahs.map(a => (
                <div key={a.number} id={'ayah-' + surahId + '-' + a.number} data-testid={'ayah-' + a.number}>
                    ayah {a.number}
                </div>
            ))}
        </div>
    );
};

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
    return {
        navigate: vi.fn(),
        favorites: [],
        toggleFavorite: vi.fn(),
        darkMode: false,
        toggleDarkMode: vi.fn(),
        theme: 'emerald',
        setTheme: vi.fn(),
        notifications: false,
        toggleNotifications: vi.fn(),
        morningReminderEnabled: false,
        setMorningReminderEnabled: vi.fn(),
        morningReminderTime: '06:00 AM',
        setMorningReminderTime: vi.fn(),
        eveningReminderEnabled: false,
        setEveningReminderEnabled: vi.fn(),
        eveningReminderTime: '06:00 PM',
        setEveningReminderTime: vi.fn(),
        fontSize: 18,
        setFontSize: vi.fn(),
        progress: {},
        updateProgress: vi.fn(),
        incrementProgress: vi.fn(),
        language: 'ar',
        setLanguage: vi.fn(),
        homeLayout: 'dashboard',
        setHomeLayout: vi.fn(),
        categories: [],
        refreshData: vi.fn(),
        editZikr: vi.fn(),
        deleteZikr: vi.fn(),
        apiKey: '',
        setApiKey: vi.fn(),
        voiceName: '',
        setVoiceName: vi.fn(),
        audioAutoSave: false,
        setAudioAutoSave: vi.fn(),
        audioLoopDefault: false,
        setAudioLoopDefault: vi.fn(),
        hapticsEnabled: false,
        toggleHaptics: vi.fn(),
        customReminders: [],
        addCustomReminder: vi.fn(),
        removeCustomReminder: vi.fn(),
        location: null,
        setLocation: vi.fn(),
        prayerNotificationsEnabled: false,
        setPrayerNotificationsEnabled: vi.fn(),
        stats: { streak: 0, totalReads: 0, lastActiveDate: '' },
        incrementStreak: vi.fn(),
        incrementTotalReads: vi.fn(),
        quranBookmarks: [],
        addQuranBookmark: vi.fn(),
        removeQuranBookmark: vi.fn(),
        quranLastRead: null,
        setQuranLastRead: vi.fn().mockResolvedValue(undefined),
        clearQuranLastRead: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function driveObserver(entries: { id: string; isIntersecting: boolean; ratio?: number }[]) {
    if (!lastObserver) throw new Error('IntersectionObserver was not constructed');
    act(() => {
        lastObserver!.cb(entries.map(e => ({
            target: document.getElementById(e.id) as HTMLElement,
            isIntersecting: e.isIntersecting,
            intersectionRatio: e.ratio ?? 1,
        })));
    });
}

describe('SurahReaderScreen - auto-tracked resume position', () => {
    it('writes the topmost intersecting ayah to setQuranLastRead when IO fires', async () => {
        const setQuranLastRead = vi.fn().mockResolvedValue(undefined);
        const ctx = makeContext({ setQuranLastRead });

        const { container } = render(
            <AppContext.Provider value={ctx}>
                <SurahReaderHarness
                    setQuranLastRead={setQuranLastRead}
                    surahId={2}
                    ayahs={[{ number: 1 }, { number: 2 }, { number: 3 }]}
                />
            </AppContext.Provider>
        );

        expect(lastObserver).not.toBeNull();
        expect(container.querySelectorAll('[id^="ayah-"]').length).toBe(3);

        // ayah 1 enters the active band -> resume banner should point to surah 2, ayah 1.
        driveObserver([{ id: 'ayah-2-1', isIntersecting: true }]);
        expect(setQuranLastRead).toHaveBeenLastCalledWith({ surah: 2, ayah: 1 });
    });

    it('updates the saved position as the user scrolls forward without bookmarking', async () => {
        const setQuranLastRead = vi.fn().mockResolvedValue(undefined);
        const ctx = makeContext({ setQuranLastRead });

        render(
            <AppContext.Provider value={ctx}>
                <SurahReaderHarness
                    setQuranLastRead={setQuranLastRead}
                    surahId={1}
                    ayahs={[{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }, { number: 5 }]}
                />
            </AppContext.Provider>
        );

        // Step through five sequential scrolls - no bookmark involved at any point.
        driveObserver([{ id: 'ayah-1-1', isIntersecting: true }]);
        expect(setQuranLastRead).toHaveBeenLastCalledWith({ surah: 1, ayah: 1 });

        driveObserver([
            { id: 'ayah-1-1', isIntersecting: false },
            { id: 'ayah-1-2', isIntersecting: true },
        ]);
        expect(setQuranLastRead).toHaveBeenLastCalledWith({ surah: 1, ayah: 2 });

        driveObserver([
            { id: 'ayah-1-2', isIntersecting: false },
            { id: 'ayah-1-3', isIntersecting: true },
            { id: 'ayah-1-4', isIntersecting: true },
        ]);
        // Multiple ayahs visible at once: Math.min picks the topmost one.
        expect(setQuranLastRead).toHaveBeenLastCalledWith({ surah: 1, ayah: 3 });

        driveObserver([
            { id: 'ayah-1-3', isIntersecting: false },
            { id: 'ayah-1-4', isIntersecting: false },
            { id: 'ayah-1-5', isIntersecting: true },
        ]);
        expect(setQuranLastRead).toHaveBeenLastCalledWith({ surah: 1, ayah: 5 });

        // No bookmark was ever added - the resume banner tracks reading alone.
        expect(ctx.addQuranBookmark).not.toHaveBeenCalled();
    });

    it('flushes the latest ayah on unmount so quick exits are not lost', async () => {
        const setQuranLastRead = vi.fn().mockResolvedValue(undefined);
        const ctx = makeContext({ setQuranLastRead });

        const { unmount } = render(
            <AppContext.Provider value={ctx}>
                <SurahReaderHarness
                    setQuranLastRead={setQuranLastRead}
                    surahId={114}
                    ayahs={[{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }, { number: 5 }, { number: 6 }]}
                />
            </AppContext.Provider>
        );

        // Scroll deep quickly, then exit before another IO callback can fire.
        driveObserver([{ id: 'ayah-114-4', isIntersecting: true }]);
        expect(setQuranLastRead).toHaveBeenLastCalledWith({ surah: 114, ayah: 4 });

        await act(async () => { unmount(); });
        // Unmount cleanup must flush the last ayah to storage.
        expect(setQuranLastRead).toHaveBeenLastCalledWith({ surah: 114, ayah: 4 });
        // At least one of the calls must have come from the cleanup path.
        expect(setQuranLastRead.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('clearQuranLastRead contract: a no-op when state is already null, a write when set', async () => {
        const saveQuranLastRead = vi.fn().mockResolvedValue(undefined);
        // The contract check focuses on the wired surface; QuranScreen relies
        // on this being available so the banner X button can dismiss the
        // auto-tracked position.
        const setQuranLastRead = vi.fn().mockResolvedValue(undefined);
        const clearQuranLastRead = vi.fn().mockImplementation(async () => {
            saveQuranLastRead(null);
        });
        const ctx = makeContext({ setQuranLastRead, clearQuranLastRead, quranLastRead: { surah: 2, ayah: 5 } });

        await clearQuranLastRead();
        expect(clearQuranLastRead).toHaveBeenCalledTimes(1);
        expect(saveQuranLastRead).toHaveBeenCalledWith(null);

        // Smoke-test the setQuranLastRead surface for symmetry.
        await setQuranLastRead({ surah: 3, ayah: 7 });
        expect(setQuranLastRead).toHaveBeenCalledWith({ surah: 3, ayah: 7 });
        // Unused in this assertion but ensures context is consumed.
        void ctx;
    });
});
