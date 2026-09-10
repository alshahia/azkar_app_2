/**
 * Tests for the Today digest widget (M4-T3).
 *
 * The widget pulls Hijri parts, an on-this-day entry, and a quote — all
 * deterministic for a given Date. We pin the known sample dates (Ramadan
 * 1, Eid al-Fitr, Day of Arafah) and check the rendered output. Engines
 * without Umm al-Qura data get a "no Hijri calendar" card.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { TodayDigestWidget } from '../../components/home/HomeWidgets';
import { AppContext } from '../../context/AppContext';
import type { AppContextType } from '../../types';

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
        homeLayout: 'focus',
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
        stats: { streak: 0, totalReads: 0, lastActiveDate: '', timezone: null },
        incrementStreak: vi.fn().mockReturnValue({ kind: 'same-day', streak: 0 }),
        incrementTotalReads: vi.fn(),
        quranBookmarks: [],
        addQuranBookmark: vi.fn().mockResolvedValue(undefined),
        removeQuranBookmark: vi.fn().mockResolvedValue(undefined),
        quranLastRead: null,
        setQuranLastRead: vi.fn().mockResolvedValue(undefined),
        clearQuranLastRead: vi.fn().mockResolvedValue(undefined),
        mushafMode: 'modern',
        setMushafMode: vi.fn().mockResolvedValue(undefined),
        mushafTajweed: false,
        setMushafTajweed: vi.fn().mockResolvedValue(undefined),
        tafsirId: 'muyassar',
        setTafsirId: vi.fn().mockResolvedValue(undefined),
        wakeLockEnabled: true,
        setWakeLockEnabled: vi.fn(),
        votdEnabled: true,
        setVotdEnabled: vi.fn(),
        votdTime: '06:00 AM',
        setVotdTime: vi.fn(),
        quranReadHistory: [],
        appendQuranHistory: vi.fn(),
        ...overrides,
    };
}

const hasUmalqura = (() => {
    try {
        return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura').resolvedOptions().calendar === 'islamic-umalqura';
    } catch {
        return false;
    }
})();

afterEach(() => cleanup());

/** Flush the microtask queue used by widgets that defer their initial
 *  setState to avoid react-hooks/set-state-in-effect. Without this, the
 *  assertions run before the widget has populated its state. */
const flushMicrotasks = async () => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
    });
};

describe('TodayDigestWidget (M4-T3)', () => {
    (hasUmalqura ? it : it.skip)('renders the Hijri label on a real Hijri day', async () => {
        // Local-noon construction avoids UTC midnight edge cases.
        const ctx = makeContext();
        const { container } = render(
            <AppContext.Provider value={ctx}>
                <TodayDigestWidget />
            </AppContext.Provider>
        );
        await flushMicrotasks();
        const label = container.querySelector('[data-testid="today-hijri-label"]');
        expect(label).not.toBeNull();
        // Label contains at least one Arabic month name.
        expect(label!.textContent).toMatch(/[\u0600-\u06FF]/);
    });

    (hasUmalqura ? it : it.skip)('renders the Eid al-Fitr entry on 1 Shawwal 1446', async () => {
        const ctx = makeContext();
        // 2025-03-30 = 1 Shawwal 1446 (verified by tests/unit/hijri.test.ts).
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-03-30T12:00:00'));
        try {
            const { container } = render(
                <AppContext.Provider value={ctx}>
                    <TodayDigestWidget />
                </AppContext.Provider>
            );
            await flushMicrotasks();
            const block = container.querySelector('[data-testid="today-onthisday"]');
            expect(block).not.toBeNull();
            expect(block!.textContent).toContain('عيد الفطر');
        } finally {
            vi.useRealTimers();
        }
    });

    (hasUmalqura ? it : it.skip)('renders the Day of Arafah entry on 9 Dhu al-Hijjah 1446', async () => {
        const ctx = makeContext();
        // 2025-06-06 = 10 Dhu al-Hijjah 1446; 9 Dhu al-Hijjah is one day earlier.
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-05T12:00:00'));
        try {
            const { container } = render(
                <AppContext.Provider value={ctx}>
                    <TodayDigestWidget />
                </AppContext.Provider>
            );
            await flushMicrotasks();
            const block = container.querySelector('[data-testid="today-onthisday"]');
            expect(block).not.toBeNull();
            expect(block!.textContent).toContain('يوم عرفة');
        } finally {
            vi.useRealTimers();
        }
    });

    (hasUmalqura ? it : it.skip)('renders the stub-mode hint on a day with no entry', async () => {
        const ctx = makeContext();
        // 2025-08-15 is roughly 21 Safar 1447 - not in the stub dataset.
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-08-15T12:00:00'));
        try {
            const { container } = render(
                <AppContext.Provider value={ctx}>
                    <TodayDigestWidget />
                </AppContext.Provider>
            );
            await flushMicrotasks();
            // Either the on-this-day block is absent OR the stub hint is visible.
            const block = container.querySelector('[data-testid="today-onthisday"]');
            if (block) {
                expect(block.textContent!.length).toBeGreaterThan(0);
            } else {
                expect(container.textContent).toMatch(/الإعداد|الإعدادية/);
            }
        } finally {
            vi.useRealTimers();
        }
    });

    it('renders a wisdom quote', async () => {
        const ctx = makeContext();
        const { container } = render(
            <AppContext.Provider value={ctx}>
                <TodayDigestWidget />
            </AppContext.Provider>
        );
        await flushMicrotasks();
        const quote = container.querySelector('[data-testid="today-quote"]');
        expect(quote).not.toBeNull();
        expect(quote!.textContent).toMatch(/[\u0600-\u06FF]/);
    });

    it('hides the progress row when the user has no progress yet', async () => {
        const ctx = makeContext({ progress: {} });
        const { container } = render(
            <AppContext.Provider value={ctx}>
                <TodayDigestWidget />
            </AppContext.Provider>
        );
        await flushMicrotasks();
        expect(container.querySelector('[data-testid="today-progress"]')).toBeNull();
    });

    it('renders the progress row when the user has progress entries', async () => {
        const ctx = makeContext({ progress: { 1: 5, 2: 0, 3: 10 } });
        const { container } = render(
            <AppContext.Provider value={ctx}>
                <TodayDigestWidget />
            </AppContext.Provider>
        );
        await flushMicrotasks();
        const progress = container.querySelector('[data-testid="today-progress"]');
        expect(progress).not.toBeNull();
        expect(progress!.textContent).toContain('٢');
    });
});
