import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import React from 'react';
import VerseActionModalContainer, { useVerseAction, type VerseActionTarget } from '../../components/quran/VerseActionModalContainer';
import type { VerseActionApi } from '../../components/quran/VerseActionModalContainer';
import { AppContext } from '../../context/AppContext';
import { QuranAudioProvider, useQuranAudio } from '../../context/QuranAudioContext';
import { RepeatSettingsProvider, useRepeatSettings } from '../../context/RepeatSettingsContext';
import type { AppContextType } from '../../types';

// VerseActionModalContainer (M3-T1) - single verse-actions surface.
// Pure unit tests: modal API and rendering are verified here.
// The cards (long-press / tafsir / seek) are exercised in integration.

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
        setEveningReminderTime: vi.fn(),
        eveningReminderTime: '06:00 PM',
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

function makeTarget(surah: number, ayah: number, text = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ'): VerseActionTarget {
    return { surah, ayah, text };
}

function Tree({ children, ctx }: { children: React.ReactNode; ctx: AppContextType }) {
    return (
        <AppContext.Provider value={ctx}>
            <QuranAudioProvider>
                <RepeatSettingsProvider>
                    {children}
                </RepeatSettingsProvider>
            </QuranAudioProvider>
        </AppContext.Provider>
    );
}

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('VerseActionModalContainer', () => {
    it('throws a descriptive Error when called outside the provider', () => {
        // Capture the throw synchronously by running the hook directly via a
        // minimal harness; this avoids the React error-boundary dance.
        let caught: unknown = null;
        function Probe() {
            try { useVerseAction(); } catch (e) { caught = e; }
            return null;
        }
        render(<Tree ctx={makeContext()}><Probe /></Tree>);
        expect(caught).toBeInstanceOf(Error);
        expect((caught as Error).message).toMatch(/VerseActionModalContainer/);
    });

    it('renders nothing when closed (null target)', () => {
        const { container } = render(
            <Tree ctx={makeContext()}>
                <VerseActionModalContainer
                    ayahLookup={() => undefined}
                    openTafsir={() => {}}
                    jumpToMushaf={() => {}}
                    openRepeatRange={() => {}}
                    labels={stubLabels()}
                >
                    <span data-testid="child">child</span>
                </VerseActionModalContainer>
            </Tree>,
        );
        expect(container.querySelector('[role="dialog"]')).toBeNull();
        expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
    });

    it('reveals all action labels once a verse is selected', () => {
        function Selector() {
            const api = useVerseAction();
            return (
                <button data-testid="open" onClick={() => api.open(makeTarget(112, 1))}>
                    open
                </button>
            );
        }
        const { container, getByTestId } = render(
            <Tree ctx={makeContext()}>
                <VerseActionModalContainer
                    ayahLookup={() => undefined}
                    openTafsir={() => {}}
                    jumpToMushaf={() => {}}
                    openRepeatRange={() => {}}
                    labels={stubLabels()}
                >
                    <Selector />
                </VerseActionModalContainer>
            </Tree>,
        );
        act(() => { getByTestId('open').click(); });
        expect(container.querySelector('[role="dialog"]')).not.toBeNull();
        for (const label of ['تشغيل', 'حفظ', 'التفسير', 'نسخ', 'مشاركة', 'نسخ الرابط', 'افتح المصحف', 'تكرار']) {
            expect(container.textContent).toContain(label);
        }
    });

    it('toggleBookmark adds a bookmark when none exists', () => {
        const add = vi.fn().mockResolvedValue(undefined);
        const remove = vi.fn().mockResolvedValue(undefined);
        let apiRef!: VerseActionApi;
        function Ref() { apiRef = useVerseAction() as VerseActionApi; return null; }
        const { getByTestId } = render(
            <Tree ctx={makeContext({ addQuranBookmark: add, removeQuranBookmark: remove, quranBookmarks: [] })}>
                <VerseActionModalContainer
                    ayahLookup={() => undefined}
                    openTafsir={() => {}}
                    jumpToMushaf={() => {}}
                    openRepeatRange={() => {}}
                    labels={stubLabels()}
                >
                    <button data-testid="open" onClick={() => apiRef.open(makeTarget(112, 1))}>open</button>
                    <Ref />
                </VerseActionModalContainer>
            </Tree>,
        );
        act(() => { getByTestId('open').click(); });
        act(() => { apiRef.toggleBookmark(); });
        expect(apiRef.isOpen).toBe(false);
        expect(add).toHaveBeenCalled();
    });

    it('close() clears the isOpen flag returned by useVerseAction', () => {
        let apiRef!: VerseActionApi;
        function Ref() { apiRef = useVerseAction() as VerseActionApi; return null; }
        const { getByTestId } = render(
            <Tree ctx={makeContext()}>
                <VerseActionModalContainer
                    ayahLookup={() => undefined}
                    openTafsir={() => {}}
                    jumpToMushaf={() => {}}
                    openRepeatRange={() => {}}
                    labels={stubLabels()}
                >
                    <button data-testid="open" onClick={() => apiRef.open(makeTarget(2, 5))}>open</button>
                    <button data-testid="close" onClick={() => apiRef.close()}>close</button>
                    <Ref />
                </VerseActionModalContainer>
            </Tree>,
        );
        act(() => { getByTestId('open').click(); });
        expect(apiRef.isOpen).toBe(true);
        act(() => { getByTestId('close').click(); });
        expect(apiRef.isOpen).toBe(false);
        expect(apiRef.target).toBeNull();
    });
});

function Probe() {
    useVerseAction();
    return null;
}

function stubLabels() {
    return {
        title: 'إجراءات الآية',
        play: 'تشغيل',
        bookmark: 'حفظ',
        bookmarkRemove: 'إزالة الحفظ',
        tafsir: 'التفسير',
        copy: 'نسخ',
        copyLink: 'نسخ الرابط',
        share: 'مشاركة',
        mushaf: 'افتح المصحف',
        repeat: 'تكرار',
        close: 'إغلاق',
    };
}

describe('VerseActionModalContainer - context hook smoke', () => {
    it('useQuranAudio and useRepeatSettings work inside the provider tree', () => {
        function Smoke() {
            useQuranAudio();
            useRepeatSettings();
            return null;
        }
        expect(() => render(
            <Tree ctx={makeContext()}><Smoke /></Tree>,
        )).not.toThrow();
    });
});
