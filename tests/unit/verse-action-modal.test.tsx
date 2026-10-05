import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import React, { useEffect } from 'react';
import VerseActionModalContainer, { useVerseAction, type VerseActionTarget } from '../../components/quran/VerseActionModalContainer';
import type { VerseActionApi } from '../../components/quran/VerseActionModalContainer';
import { QuranAudioProvider, useQuranAudio } from '../../context/QuranAudioContext';
import { RepeatSettingsProvider, useRepeatSettings } from '../../context/RepeatSettingsContext';

// VerseActionModalContainer (M3-T1) - single verse-actions surface.
// Pure unit tests: modal API and rendering are verified here.
// The cards (long-press / tafsir / seek) are exercised in integration.

// Mock the Zustand stores
const mocks = vi.hoisted(() => {
    return {
        quranBookmarks: [] as Array<{ surah: number; ayah: number; createdAt: number }>,
        addBookmark: vi.fn().mockResolvedValue(undefined),
        removeBookmark: vi.fn().mockResolvedValue(undefined),
        navigate: vi.fn(),
        darkMode: false,
        theme: 'emerald' as const,
        darkStyle: 'cosmic' as const,
        tafsirId: 'muyassar',
        mushafMode: 'modern' as const,
        mushafTajweed: false,
        wakeLockEnabled: true,
        votdEnabled: true,
        votdTime: '06:00 AM',
        fontSize: 18,
        language: 'ar' as const,
        homeLayout: 'dashboard' as const,
        notifications: false,
        morningReminderEnabled: false,
        morningReminderTime: '06:00 AM',
        eveningReminderEnabled: false,
        eveningReminderTime: '06:00 PM',
        customReminders: [] as Array<{ id: number; categoryId: string; categoryTitle: string; time: string; enabled: boolean }>,
        location: null as { latitude: number; longitude: number } | null,
        prayerNotificationsEnabled: false,
        stats: { streak: 0, totalReads: 0, lastActiveDate: '', timezone: null },
        incrementStreak: vi.fn().mockReturnValue({ kind: 'same-day', streak: 0 }),
        incrementTotalReads: vi.fn(),
        progress: {} as Record<string, number>,
        updateProgress: vi.fn(),
        incrementProgress: vi.fn(),
        categories: [] as Array<{ id: string; title: string; count: number; icon: React.ComponentType<{ className?: string }>; azkar: Array<{ id: number; arabic: string; transliteration: string | null; translation: string | null; benefit: string | null; reference: string | null; count: number }>; isUserCreated?: boolean }>,
        refreshData: vi.fn(),
        editZikr: vi.fn(),
        deleteZikr: vi.fn(),
        apiKey: '',
        voiceName: '',
        audioAutoSave: false,
        audioLoopDefault: false,
        hapticsEnabled: false,
        favorites: [] as number[],
        toggleFavorite: vi.fn(),
        addCustomReminder: vi.fn(),
        removeCustomReminder: vi.fn(),
        setDarkStyle: vi.fn(),
        setTheme: vi.fn(),
        toggleNotifications: vi.fn(),
        setMorningReminderEnabled: vi.fn(),
        setMorningReminderTime: vi.fn(),
        setEveningReminderEnabled: vi.fn(),
        setEveningReminderTime: vi.fn(),
        setFontSize: vi.fn(),
        setLanguage: vi.fn(),
        setHomeLayout: vi.fn(),
        setApiKey: vi.fn(),
        setVoiceName: vi.fn(),
        setAudioAutoSave: vi.fn(),
        setAudioLoopDefault: vi.fn(),
        toggleHaptics: vi.fn(),
        setLocation: vi.fn(),
        setPrayerNotifications: vi.fn(),
        setMushafMode: vi.fn().mockResolvedValue(undefined),
        setMushafTajweed: vi.fn().mockResolvedValue(undefined),
        setTafsirId: vi.fn().mockResolvedValue(undefined),
        setWakeLockEnabled: vi.fn(),
        setVotdEnabled: vi.fn(),
        setVotdTime: vi.fn(),
        setLastSeenVersion: vi.fn(),
        setWhatsNewOpen: vi.fn(),
        setShareEditorOpen: vi.fn(),
        showToast: vi.fn(),
        setGlobalLoading: vi.fn(),
    };
});

vi.mock('../../stores/usePreferencesStore', () => ({
    usePreferencesStore: (selector: (state: any) => any) => {
        const state = {
            darkMode: mocks.darkMode,
            theme: mocks.theme,
            darkStyle: mocks.darkStyle,
            tafsirId: mocks.tafsirId,
            mushafMode: mocks.mushafMode,
            mushafTajweed: mocks.mushafTajweed,
            wakeLockEnabled: mocks.wakeLockEnabled,
            votdEnabled: mocks.votdEnabled,
            votdTime: mocks.votdTime,
            fontSize: mocks.fontSize,
            language: mocks.language,
            homeLayout: mocks.homeLayout,
            notifications: mocks.notifications,
            morningReminderEnabled: mocks.morningReminderEnabled,
            morningReminderTime: mocks.morningReminderTime,
            eveningReminderEnabled: mocks.eveningReminderEnabled,
            eveningReminderTime: mocks.eveningReminderTime,
            customReminders: mocks.customReminders,
            location: mocks.location,
            prayerNotificationsEnabled: mocks.prayerNotificationsEnabled,
            categories: mocks.categories,
            refreshData: mocks.refreshData,
            editZikr: mocks.editZikr,
            deleteZikr: mocks.deleteZikr,
            apiKey: mocks.apiKey,
            voiceName: mocks.voiceName,
            audioAutoSave: mocks.audioAutoSave,
            audioLoopDefault: mocks.audioLoopDefault,
            hapticsEnabled: mocks.hapticsEnabled,
            favorites: mocks.favorites,
            toggleFavorite: mocks.toggleFavorite,
            addCustomReminder: mocks.addCustomReminder,
            removeCustomReminder: mocks.removeCustomReminder,
            setDarkStyle: mocks.setDarkStyle,
            setTheme: mocks.setTheme,
            toggleNotifications: mocks.toggleNotifications,
            setMorningReminderEnabled: mocks.setMorningReminderEnabled,
            setMorningReminderTime: mocks.setMorningReminderTime,
            setEveningReminderEnabled: mocks.setEveningReminderEnabled,
            setEveningReminderTime: mocks.setEveningReminderTime,
            setFontSize: mocks.setFontSize,
            setLanguage: mocks.setLanguage,
            setHomeLayout: mocks.setHomeLayout,
            setApiKey: mocks.setApiKey,
            setVoiceName: mocks.setVoiceName,
            setAudioAutoSave: mocks.setAudioAutoSave,
            setAudioLoopDefault: mocks.setAudioLoopDefault,
            toggleHaptics: mocks.toggleHaptics,
            setLocation: mocks.setLocation,
            setPrayerNotifications: mocks.setPrayerNotifications,
            setMushafMode: mocks.setMushafMode,
            setMushafTajweed: mocks.setMushafTajweed,
            setTafsirId: mocks.setTafsirId,
            setWakeLockEnabled: mocks.setWakeLockEnabled,
            setVotdEnabled: mocks.setVotdEnabled,
            setVotdTime: mocks.setVotdTime,
            setLastSeenVersion: mocks.setLastSeenVersion,
        };
        return selector(state);
    },
}));

vi.mock('../../stores/useProgressStore', () => ({
    useProgressStore: (selector: (state: any) => any) => {
        const state = {
            stats: mocks.stats,
            incrementStreak: mocks.incrementStreak,
            incrementTotalReads: mocks.incrementTotalReads,
            progress: mocks.progress,
            updateProgress: mocks.updateProgress,
            incrementProgress: mocks.incrementProgress,
        };
        return selector(state);
    },
}));

vi.mock('../../stores/useNavigationStore', () => ({
    useNavigationStore: (selector: (state: any) => any) => {
        const state = {
            navigate: mocks.navigate,
        };
        return selector(state);
    },
}));

vi.mock('../../stores/useQuranStore', () => ({
    useQuranStore: (selector: (state: any) => any) => {
        const state = {
            bookmarks: mocks.quranBookmarks,
            addBookmark: mocks.addBookmark,
            removeBookmark: mocks.removeBookmark,
        };
        return selector(state);
    },
}));

vi.mock('../../stores/useUIStore', () => ({
    useUIStore: (selector: (state: any) => any) => {
        const state = {
            setWhatsNewOpen: mocks.setWhatsNewOpen,
            setShareEditorOpen: mocks.setShareEditorOpen,
            showToast: mocks.showToast,
            setGlobalLoading: mocks.setGlobalLoading,
        };
        return selector(state);
    },
}));

function makeTarget(surah: number, ayah: number, text = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ'): VerseActionTarget {
    return { surah, ayah, text };
}

function Tree({ children }: { children: React.ReactNode }) {
    return (
        <QuranAudioProvider>
            <RepeatSettingsProvider>
                {children}
            </RepeatSettingsProvider>
        </QuranAudioProvider>
    );
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

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('VerseActionModalContainer', () => {
    it('returns a noop API instead of throwing when called outside the provider', () => {
        let captured: VerseActionApi | null = null;
        function Probe() {
            const api = useVerseAction();
            useEffect(() => {
                captured = api;
            }, [api]);
            return null;
        }
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() => render(<Tree><Probe /></Tree>)).not.toThrow();
        expect(captured).not.toBeNull();
        expect(() => {
            captured!.open({ surah: 1, ayah: 1, text: 'x' });
            captured!.close();
            captured!.openTafsir();
            captured!.toggleBookmark();
        }).not.toThrow();
        expect(captured!.isOpen).toBe(false);
        expect(captured!.target).toBeNull();
        expect(warnSpy).toHaveBeenCalled();
        const messages = warnSpy.mock.calls.map(c => String(c[0]));
        expect(messages.join('\n')).toMatch(/VerseActionModalContainer/);
    });

    it('renders nothing when closed (null target)', () => {
        const { container } = render(
            <Tree>
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
            <Tree>
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
        mocks.addBookmark = add;
        mocks.removeBookmark = remove;
        mocks.quranBookmarks = [];
        const apiRef = { current: null as VerseActionApi | null };
        function Ref() {
            const api = useVerseAction();
            useEffect(() => {
                apiRef.current = api;
            }, [api]);
            return null;
        }
        const { getByTestId } = render(
            <Tree>
                <VerseActionModalContainer
                    ayahLookup={() => undefined}
                    openTafsir={() => {}}
                    jumpToMushaf={() => {}}
                    openRepeatRange={() => {}}
                    labels={stubLabels()}
                >
                    <button data-testid="open" onClick={() => apiRef.current?.open(makeTarget(112, 1))}>open</button>
                    <Ref />
                </VerseActionModalContainer>
            </Tree>,
        );
        act(() => { getByTestId('open').click(); });
        act(() => { apiRef.current?.toggleBookmark(); });
        expect(apiRef.current?.isOpen).toBe(false);
        expect(add).toHaveBeenCalled();
    });

    it('close() clears the isOpen flag returned by useVerseAction', () => {
        const apiRef = { current: null as VerseActionApi | null };
        function Ref() {
            const api = useVerseAction();
            useEffect(() => {
                apiRef.current = api;
            }, [api]);
            return null;
        }
        const { getByTestId } = render(
            <Tree>
                <VerseActionModalContainer
                    ayahLookup={() => undefined}
                    openTafsir={() => {}}
                    jumpToMushaf={() => {}}
                    openRepeatRange={() => {}}
                    labels={stubLabels()}
                >
                    <button data-testid="open" onClick={() => apiRef.current?.open(makeTarget(2, 5))}>open</button>
                    <button data-testid="close" onClick={() => apiRef.current?.close()}>close</button>
                    <Ref />
                </VerseActionModalContainer>
            </Tree>,
        );
        act(() => { getByTestId('open').click(); });
        expect(apiRef.current?.isOpen).toBe(true);
        act(() => { getByTestId('close').click(); });
        expect(apiRef.current?.isOpen).toBe(false);
        expect(apiRef.current?.target).toBeNull();
    });
});

describe('VerseActionModalContainer - context hook smoke', () => {
    it('useQuranAudio and useRepeatSettings work inside the provider tree', () => {
        function Smoke() {
            useQuranAudio();
            useRepeatSettings();
            return null;
        }
        expect(() => render(
            <Tree><Smoke /></Tree>,
        )).not.toThrow();
    });
});
