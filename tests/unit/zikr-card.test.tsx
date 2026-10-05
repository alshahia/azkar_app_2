/**
 * Unit tests for the ZikrCard component (azkar list / focus mode).
 *
 * ZikrCard is the primary counting surface: tap to increment, play/stop
 * audio, favorite, edit/delete, and a completion animation that hides the
 * card once the target count is reached. The component reads favorites,
 * fontSize, navigation and progress mutations from the Zustand stores and
 * fires haptics through HapticService, so the stores are seeded with spies
 * and HapticService is mocked — these tests exercise the component's own
 * rendering and event logic.
 */
import { render, screen, fireEvent, act, cleanup, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import ZikrCard from '../../components/azkar/ZikrCard';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { HapticService } from '../../services/HapticService';
import type { Zikr, AppContextType } from '../../types';

// useTranslation now reads `language` from usePreferencesStore; ZikrCard
// reads its state from the Zustand stores.

vi.mock('../../services/HapticService', () => ({
    HapticService: {
        enabled: true,
        setEnabled: vi.fn(),
        light: vi.fn(),
        medium: vi.fn(),
        heavy: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        pattern: vi.fn(),
    },
}));

/** Real diacritized Arabic fixture, per the testing strategy. */
function makeZikr(overrides: Partial<Zikr> = {}): Zikr {
    return {
        id: 1,
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'Subḥān Allāh',
        translation: 'Glory be to Allah',
        benefit: 'A dhikr of praise',
        reference: 'Sahih Muslim',
        count: 10,
        ...overrides,
    };
}

/** Full AppContextType stand-in — every function a vi.fn() no-op. */
function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
    return {
        navigate: vi.fn(),
        favorites: [],
        toggleFavorite: vi.fn(),
        darkMode: false,
        toggleDarkMode: vi.fn(),
        darkStyle: 'cosmic',
        setDarkStyle: vi.fn(),
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
        fontSize: 3,
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
        editZikr: vi.fn().mockResolvedValue(undefined),
        deleteZikr: vi.fn().mockResolvedValue(undefined),
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

interface RenderCardOptions {
    zikr?: Zikr;
    sessionCount?: number;
    isPlaying?: boolean;
    isAudioLoading?: boolean;
    favorites?: number[];
}

function renderCard(options: RenderCardOptions = {}) {
    const zikr = options.zikr ?? makeZikr();
    const context = makeContext({ favorites: options.favorites ?? [] });
    // Seed the real stores with the spy-backed actions the assertions use.
    usePreferencesStore.setState({
        favorites: context.favorites,
        toggleFavorite: context.toggleFavorite,
        fontSize: context.fontSize,
        editZikr: context.editZikr,
        deleteZikr: context.deleteZikr,
        darkMode: context.darkMode,
        apiKey: context.apiKey,
    });
    useProgressStore.setState({ incrementProgress: context.incrementProgress });
    useNavigationStore.setState({ navigate: context.navigate });

    const onUpdateSession = vi.fn();
    const onHide = vi.fn();
    const onPlayRequest = vi.fn();
    const onStopRequest = vi.fn();

    const view = render(
        <ZikrCard
            zikr={zikr}
            index={0}
            total={5}
            sessionCount={options.sessionCount ?? 0}
            onUpdateSession={onUpdateSession}
            onHide={onHide}
            isPlaying={options.isPlaying ?? false}
            isAudioLoading={options.isAudioLoading ?? false}
            onPlayRequest={onPlayRequest}
            onStopRequest={onStopRequest}
        />
    );

    return {
        zikr,
        context,
        onUpdateSession,
        onHide,
        onPlayRequest,
        onStopRequest,
        ...view,
    };
}

/** The clickable card surface — the inner div of #zikr-card-<id>. */
function getCard(container: HTMLElement, zikrId: number): HTMLElement {
    const card = container.querySelector(`#zikr-card-${zikrId} > div`);
    if (!card) {
        throw new Error(`ZikrCard #${zikrId} was not rendered`);
    }
    return card as HTMLElement;
}

beforeEach(() => {
    vi.clearAllMocks();
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe('ZikrCard', () => {
    describe('rendering', () => {
        it('renders the Arabic text', () => {
            const zikr = makeZikr({ arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ' });
            renderCard({ zikr });
            expect(screen.getByText('سُبْحَانَ اللَّهِ وَبِحَمْدِهِ')).toBeInTheDocument();
        });

        it('renders the translation when provided', () => {
            const zikr = makeZikr({ translation: 'Glory be to Allah and His is the praise' });
            renderCard({ zikr });
            expect(screen.getByText('Glory be to Allah and His is the praise')).toBeInTheDocument();
        });

        it('omits the translation block when no translation is provided', () => {
            const zikr = makeZikr({ translation: null });
            const { container } = renderCard({ zikr });
            expect(container.textContent).not.toContain('Glory be to Allah');
        });
    });

    describe('counter', () => {
        it('increments the counter when the card is tapped', () => {
            const { container, context, onUpdateSession } = renderCard({ sessionCount: 0 });
            fireEvent.click(getCard(container, 1));
            expect(onUpdateSession).toHaveBeenCalledTimes(1);
            expect(onUpdateSession).toHaveBeenCalledWith(1, 1);
            expect(context.incrementProgress).toHaveBeenCalledTimes(1);
            expect(context.incrementProgress).toHaveBeenCalledWith(1, 1);
            // Tap haptic feedback goes through the mocked HapticService.
            expect(HapticService.light).toHaveBeenCalled();
        });

        it('does not increment when the target is already reached', () => {
            const { container, onUpdateSession } = renderCard({ sessionCount: 10 });
            fireEvent.click(getCard(container, 1));
            expect(onUpdateSession).not.toHaveBeenCalled();
        });

        it('displays the remaining count toward the target', () => {
            // The counter chip shows what is left (target - session), i.e. the
            // count/target relationship from the user's point of view.
            renderCard({ sessionCount: 3 });
            expect(screen.getByText('7')).toBeInTheDocument();
        });

        it('shows the completed state once the target is reached', () => {
            renderCard({ sessionCount: 10 });
            expect(screen.getByText('مكتمل')).toBeInTheDocument();
        });
    });

    describe('audio', () => {
        it('triggers onPlayRequest when the play button is tapped', () => {
            const { zikr, onPlayRequest } = renderCard({ isPlaying: false });
            fireEvent.click(screen.getByRole('button', { name: 'تشغيل' }));
            expect(onPlayRequest).toHaveBeenCalledTimes(1);
            expect(onPlayRequest).toHaveBeenCalledWith(zikr);
        });

        it('triggers onStopRequest when the stop button is tapped', () => {
            const { onStopRequest } = renderCard({ isPlaying: true });
            fireEvent.click(screen.getByRole('button', { name: 'إيقاف' }));
            expect(onStopRequest).toHaveBeenCalledTimes(1);
        });

        it('disables the play button while audio is loading', () => {
            renderCard({ isAudioLoading: true });
            expect(screen.getByRole('button', { name: 'تشغيل' })).toBeDisabled();
        });
    });

    describe('actions sheet', () => {
        it('calls toggleFavorite when the favorite action is tapped', () => {
            const { context } = renderCard({ favorites: [] });
            fireEvent.click(screen.getByRole('button', { name: 'المزيد من الخيارات' }));
            fireEvent.click(screen.getByText('إضافة إلى المفضلة'));
            expect(context.toggleFavorite).toHaveBeenCalledTimes(1);
            expect(context.toggleFavorite).toHaveBeenCalledWith(1);
        });

        it('offers the remove-from-favorites action when the zikr is already a favorite', () => {
            const { context } = renderCard({ favorites: [1] });
            fireEvent.click(screen.getByRole('button', { name: 'المزيد من الخيارات' }));
            fireEvent.click(screen.getByText('إزالة من المفضلة'));
            expect(context.toggleFavorite).toHaveBeenCalledTimes(1);
            expect(context.toggleFavorite).toHaveBeenCalledWith(1);
        });

        it('opens the edit modal when the edit action is tapped', async () => {
            renderCard();
            fireEvent.click(screen.getByRole('button', { name: 'المزيد من الخيارات' }));
            fireEvent.click(screen.getByText('تعديل الذكر'));
            // EditZikrModal gates its content on a post-mount setTimeout(0)
            // ('mounted' state), so wait for the dialog to appear.
            expect(await screen.findByRole('dialog', { name: 'تعديل الذكر' })).toBeInTheDocument();
            expect(screen.getByText('حفظ')).toBeInTheDocument();
        });

        it('calls deleteZikr when the delete action is confirmed in the edit modal', async () => {
            const { context } = renderCard();
            fireEvent.click(screen.getByRole('button', { name: 'المزيد من الخيارات' }));
            fireEvent.click(screen.getByText('تعديل الذكر'));
            await screen.findByRole('dialog', { name: 'تعديل الذكر' });
            fireEvent.click(screen.getByText('حذف'));
            fireEvent.click(screen.getByText('حذف نهائي'));
            expect(context.deleteZikr).toHaveBeenCalledTimes(1);
            expect(context.deleteZikr).toHaveBeenCalledWith(1);
        });
    });

    describe('progress and completion', () => {
        it('reflects the completion percentage in the progress bar width', () => {
            const { container } = renderCard({ sessionCount: 5 }); // 5 of 10 → 50%
            const bar = container.querySelector('.from-primary-400');
            if (!bar) {
                throw new Error('Progress bar not found in ZikrCard');
            }
            expect((bar as HTMLElement).style.width).toBe('50%');
        });

        it('does not call onHide before the target is reached', () => {
            vi.useFakeTimers();
            try {
                const { onHide } = renderCard({ sessionCount: 5 });
                act(() => {
                    vi.advanceTimersByTime(5000);
                });
                expect(onHide).not.toHaveBeenCalled();
            } finally {
                vi.useRealTimers();
            }
        });

        it('calls onHide after the completion animation when the count reaches the target', async () => {
            // Contract per the component's own comment ("Delay hiding to
            // allow animation to play"): once sessionCount reaches zikr.count,
            // the card plays its completion animation and onHide fires 800ms
            // later with the zikr id. Real timers are used (not faked) so the
            // test observes the same scheduler/timer ordering the component
            // has in production.
            const { onHide } = renderCard({ sessionCount: 10 });
            await waitFor(() => expect(onHide).toHaveBeenCalledWith(1), { timeout: 2000 });
        });
    });
});