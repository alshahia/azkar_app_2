
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { flushSync } from 'react-dom';
import type { Screen, ProgressState, AppLanguage, HomeLayout, UserPreferences, Category, UserZikr, CustomReminder, LocationCoordinates, UserStats, AppTheme, QuranBookmark, QuranLastRead } from './types';
import { AppContext } from './context/AppContext';
import MainLayout from './components/layout/MainLayout';
import OfflineIndicator from './components/common/OfflineIndicator';
import PrePrayerOverlay from './components/azkar/PrePrayerOverlay';
import { findUpcomingPrayerWithinWindow, type WatchedPrayer } from './data/prayerWatch';
import { getStorage } from './data/storage';
import { runStorageMigrations } from './data/migrations';
import { azkarRepository } from './data/azkarRepository';
import { defaultPreferences, defaultStats } from './data/storage/defaults';
import { computeStreakOutcome, resolveTimezone, type StreakOutcome } from './data/streak';
import { NotificationService } from './services/NotificationService';
import { PrayerTimesService } from './services/PrayerTimesService';
import { HapticService } from './services/HapticService';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import ScreenErrorBoundary from './components/common/ScreenErrorBoundary';
import { ToastProvider } from './components/common/Toast';
import { secureKeyStore } from './services/secureKey';

// Lazy Load Screens
const WelcomeScreen = React.lazy(() => import('./components/onboarding/WelcomeScreen'));
const NotificationsScreen = React.lazy(() => import('./components/onboarding/NotificationsScreen'));
const PersonalizationScreen = React.lazy(() => import('./components/onboarding/PersonalizationScreen'));
const HomeScreen = React.lazy(() => import('./components/screens/HomeScreen'));
const CategoriesScreen = React.lazy(() => import('./components/screens/CategoriesScreen'));
const FavoritesScreen = React.lazy(() => import('./components/screens/FavoritesScreen'));
const SettingsScreen = React.lazy(() => import('./components/screens/SettingsScreen'));
const AudioSettingsScreen = React.lazy(() => import('./components/screens/AudioSettingsScreen'));
const NotificationSettingsScreen = React.lazy(() => import('./components/screens/NotificationSettingsScreen'));
const AzkarListScreen = React.lazy(() => import('./components/screens/AzkarListScreen'));
const AzkarDayScreen = React.lazy(() => import('./components/screens/AzkarDayScreen'));
const TasbeehScreen = React.lazy(() => import('./components/screens/TasbeehScreen'));
const ReportBugScreen = React.lazy(() => import('./components/screens/ReportBugScreen'));
const AboutUsScreen = React.lazy(() => import('./components/screens/AboutUsScreen'));
const AddZikrScreen = React.lazy(() => import('./components/screens/AddZikrScreen'));
const CompletionScreen = React.lazy(() => import('./components/screens/CompletionScreen'));
const SessionSummaryScreen = React.lazy(() => import('./components/screens/SessionSummaryScreen'));
const SearchScreen = React.lazy(() => import('./components/screens/SearchScreen'));
const PrayerTimesScreen = React.lazy(() => import('./components/screens/PrayerTimesScreen'));
const QiblaCompassScreen = React.lazy(() => import('./components/screens/QiblaCompassScreen'));
const HijriCalendarScreen = React.lazy(() => import('./components/screens/HijriCalendarScreen')); 
const ShareEditorScreen = React.lazy(() => import('./components/screens/ShareEditorScreen')); 
const QuranScreen = React.lazy(() => import('./components/screens/QuranScreen'));
const SurahReaderScreen = React.lazy(() => import('./components/screens/SurahReaderScreen'));

const LoadingFallback = () => (
    <div className="h-full w-full flex items-center justify-center bg-sand-50 dark:bg-midnight-950">
        <div className="animate-pulse flex flex-col items-center">
            <svg 
                viewBox="0 0 512 512" 
                className="w-24 h-24 mb-6 text-primary-600 dark:text-primary-400 drop-shadow-xl transition-colors duration-300"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                <g transform="translate(256 256)">
                    <rect x="-120" y="-120" width="240" height="240" rx="40" transform="rotate(45)" className="fill-primary-100 dark:fill-[#0f2820] opacity-80" />
                    <rect x="-100" y="-100" width="200" height="200" rx="30" className="stroke-primary-200 dark:stroke-primary-800" strokeWidth="4" fill="none" transform="rotate(45)" />
                </g>
                <g className="fill-current" filter="url(#logo-glow)">
                    <path d="M 286 190 C 286 190, 210 220, 210 290 C 210 360, 286 390, 286 390 C 260 390, 180 360, 180 290 C 180 220, 260 190, 286 190 Z" />
                    <polygon points="320,240 326,258 345,258 330,270 336,288 320,278 304,288 310,270 295,258 314,258" />
                </g>
            </svg>
            <span className="text-primary-800 dark:text-primary-200 font-bold font-serif text-2xl tracking-widest">أذكار</span>
        </div>
    </div>
);

const getLocalDateKey = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
};

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [screen, setScreen] = useState<Screen>('welcome');
    const [screenParams, setScreenParams] = useState<any>(null);
    
    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [favorites, setFavorites] = useState<number[]>(defaultPreferences.favorites);
    const [darkMode, setDarkMode] = useState(defaultPreferences.darkMode);
    const [theme, setTheme] = useState<AppTheme>(defaultPreferences.theme);

    // Notification State
    const [notifications, setNotifications] = useState(defaultPreferences.notifications);
    const [morningReminderEnabled, setMorningReminderEnabled] = useState(defaultPreferences.morningReminderEnabled);
    const [morningReminderTime, setMorningReminderTime] = useState(defaultPreferences.morningReminderTime);
    const [eveningReminderEnabled, setEveningReminderEnabled] = useState(defaultPreferences.eveningReminderEnabled);
    const [eveningReminderTime, setEveningReminderTime] = useState(defaultPreferences.eveningReminderTime);
    const [customReminders, setCustomReminders] = useState<CustomReminder[]>(defaultPreferences.customReminders || []);

    const [fontSize, setFontSize] = useState<number>(defaultPreferences.fontSize);
    const [language, setLanguage] = useState<AppLanguage>('ar');
    const [homeLayout, setHomeLayout] = useState<HomeLayout>(defaultPreferences.homeLayout);
    const [apiKey, setApiKey] = useState<string>(defaultPreferences.apiKey || '');
    const [voiceName, setVoiceName] = useState<string>(defaultPreferences.voiceName);
    const [audioAutoSave, setAudioAutoSave] = useState<boolean>(defaultPreferences.audioAutoSave);
    const [audioLoopDefault, setAudioLoopDefault] = useState<boolean>(defaultPreferences.audioLoopDefault);
    const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(defaultPreferences.hapticsEnabled);
    
    const [location, setLocation] = useState<LocationCoordinates | null>(defaultPreferences.location || null);
    const [prayerNotificationsEnabled, setPrayerNotificationsEnabled] = useState<boolean>(defaultPreferences.prayerNotificationsEnabled);

    const [progress, setProgress] = useState<ProgressState>({});
    
    const [stats, setStats] = useState<UserStats>(defaultStats);

    // Quran state
    const [quranBookmarks, setQuranBookmarks] = useState<QuranBookmark[]>([]);
    const [quranLastRead, setQuranLastReadState] = useState<QuranLastRead | null>(null);

    const storage = getStorage();

    const refreshData = useCallback(async () => {
        try {
            const cats = await azkarRepository.getAllCategories();
            setCategories(cats);
        } catch (error) {
            console.error("Failed to refresh categories:", error);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                await storage.initialize();

                try {
                    await runStorageMigrations(storage);
                } catch (migrationError) {
                    console.error('Storage migration failed; will retry next launch:', migrationError);
                }

                const prefs = await storage.getPreferences();
                const prog = await storage.getProgress();
                const userStats = await storage.getStats();
                const onboardingDone = await storage.isOnboardingComplete();
                const quranMarks = await storage.getQuranBookmarks();
                const quranLast = await storage.getQuranLastRead();
                
                await refreshData();

                setFavorites(prefs.favorites);
                setDarkMode(prefs.darkMode);
                setTheme(prefs.theme || 'emerald');
                setNotifications(prefs.notifications);
                setMorningReminderEnabled(prefs.morningReminderEnabled ?? defaultPreferences.morningReminderEnabled);
                setMorningReminderTime(prefs.morningReminderTime ?? defaultPreferences.morningReminderTime);
                setEveningReminderEnabled(prefs.eveningReminderEnabled ?? defaultPreferences.eveningReminderEnabled);
                setEveningReminderTime(prefs.eveningReminderTime ?? defaultPreferences.eveningReminderTime);
                setFontSize(prefs.fontSize);
                setLanguage(prefs.language);
                setHomeLayout(prefs.homeLayout);
                // apiKey is persisted in the platform secure store, not in prefs.
                setApiKey(await secureKeyStore.get());
                setVoiceName(prefs.voiceName || defaultPreferences.voiceName);
                setAudioAutoSave(prefs.audioAutoSave ?? defaultPreferences.audioAutoSave);
                setAudioLoopDefault(prefs.audioLoopDefault ?? defaultPreferences.audioLoopDefault);
                setHapticsEnabled(prefs.hapticsEnabled ?? defaultPreferences.hapticsEnabled);
                setCustomReminders(prefs.customReminders || []);
                setLocation(prefs.location || null);
                setPrayerNotificationsEnabled(prefs.prayerNotificationsEnabled ?? defaultPreferences.prayerNotificationsEnabled);
                setProgress(prog);
                setStats(userStats);
                setQuranBookmarks(quranMarks);
                setQuranLastReadState(quranLast);

                // Initialize Haptic Service
                HapticService.setEnabled(prefs.hapticsEnabled ?? defaultPreferences.hapticsEnabled);
                
                if (onboardingDone) {
                    setScreen('home');
                }
            } catch (error) {
                console.error("Failed to load app data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [refreshData]);

    useEffect(() => {
        if (!isLoading) {
            const prefs: UserPreferences = {
                darkMode,
                theme,
                notifications,
                morningReminderEnabled,
                morningReminderTime,
                eveningReminderEnabled,
                eveningReminderTime,
                fontSize,
                favorites,
                language,
                homeLayout,
                apiKey: '', // apiKey lives in the secure store; storage adapter also strips defensively.
                voiceName,
                audioAutoSave,
                audioLoopDefault,
                hapticsEnabled,
                customReminders,
                location,
                prayerNotificationsEnabled
            };
            storage.savePreferences(prefs);

            // Sync Haptic Service
            HapticService.setEnabled(hapticsEnabled);
        }
    }, [darkMode, theme, notifications, morningReminderEnabled, morningReminderTime, eveningReminderEnabled, eveningReminderTime, fontSize, favorites, language, homeLayout, voiceName, audioAutoSave, audioLoopDefault, hapticsEnabled, customReminders, location, prayerNotificationsEnabled, isLoading]);

    // apiKey is persisted in the platform secure store on every change.
    // Skipped while still loading so an empty initial state doesn't clobber
    // the freshly-read value from secureKeyStore.get().
    useEffect(() => {
        if (!isLoading) {
            secureKeyStore.set(apiKey).catch(err => {
                console.error('secureKeyStore.set failed:', err);
            });
        }
    }, [apiKey, isLoading]);

    useEffect(() => {
        if (!isLoading) {
            storage.saveProgress(progress);
        }
    }, [progress, isLoading]);
    
    useEffect(() => {
        if (!isLoading) {
            storage.saveStats(stats);
        }
    }, [stats, isLoading]);

    // Hide Splash Screen once initial loading completes
    useEffect(() => {
        if (!isLoading && Capacitor.isNativePlatform()) {
            SplashScreen.hide().catch(() => {});
        }
    }, [isLoading]);

    // Synchronize Status Bar with Dark Mode and Theme
    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            try {
                StatusBar.setStyle({ style: darkMode ? Style.Dark : Style.Light }).catch(() => {});
                StatusBar.setBackgroundColor({ color: darkMode ? '#0f2820' : '#ffffff' }).catch(() => {});
            } catch (e) {}
        }
    }, [darkMode, theme]);

    // Standalone Notification Action Listener (No Leaks)
    useEffect(() => {
        let notificationListener: PluginListenerHandle | null = null;
        if (Capacitor.isNativePlatform()) {
            LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
                const extra = notification.notification.extra;
                if (extra?.type === 'prayer') {
                    navigate('prayerTimes');
                } else if (extra?.categoryId) {
                    navigate('azkarList', { categoryId: extra.categoryId });
                } else {
                    navigate('home');
                }
            }).then(handle => {
                notificationListener = handle;
            }).catch(() => {});
        }

        return () => {
            if (notificationListener) {
                notificationListener.remove();
            }
        };
    }, []);

    // PrePrayerOverlay — surfaced 30s before each prayer and held for the
    // 10s trailing edge. The watcher polls every 15s (cheaper than 1s
    // and the threshold window is 30s, so we never miss the entry point).
    const [prePrayerTarget, setPrePrayerTarget] = useState<WatchedPrayer | null>(null);
    useEffect(() => {
        // Skip entirely when the user has disabled prayer notifications, or
        // when we don't have a location to compute times against.
        if (!prayerNotificationsEnabled || !location) {
            setPrePrayerTarget(null);
            return;
        }

        let cancelled = false;
        const tick = () => {
            if (cancelled) return;
            try {
                const times = PrayerTimesService.getPrayerTimes(new Date(), location);
                const upcoming = findUpcomingPrayerWithinWindow(times, new Date());
                setPrePrayerTarget(upcoming);
            } catch {
                // getPrayerTimes falls back to Mecca when coords are bad;
                // never let the watcher throw into the render.
                setPrePrayerTarget(null);
            }
        };

        tick();
        const interval = window.setInterval(tick, 15_000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [prayerNotificationsEnabled, location]);

    // Hardware Back Button Navigation Handler (Android)
    useEffect(() => {
        let backListener: PluginListenerHandle | null = null;
        if (Capacitor.isNativePlatform()) {
            CapApp.addListener('backButton', () => {
                if (screen !== 'home' && screen !== 'welcome') {
                    navigate('home');
                } else {
                    CapApp.exitApp();
                }
            }).then(handle => {
                backListener = handle;
            }).catch(() => {});
        }

        return () => {
            if (backListener) {
                backListener.remove();
            }
        };
    }, [screen]);

    const restoreNotifications = useCallback(async () => {
        const parseTime = (timeStr: string) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return { hours, minutes };
        };

        if (morningReminderEnabled) {
            const { hours, minutes } = parseTime(morningReminderTime);
            await NotificationService.scheduleReminder(1, hours, minutes, "أذكار الصباح", "حان موعد قراءة أذكار الصباح", "morning");
        }

        if (eveningReminderEnabled) {
            const { hours, minutes } = parseTime(eveningReminderTime);
            await NotificationService.scheduleReminder(2, hours, minutes, "أذكار المساء", "حان موعد قراءة أذكار المساء", "evening");
        }

        for (const reminder of customReminders) {
            if (reminder.enabled) {
                const { hours, minutes } = parseTime(reminder.time);
                await NotificationService.scheduleReminder(
                    reminder.id,
                    hours,
                    minutes,
                    reminder.categoryTitle,
                    `حان موعد قراءة ${reminder.categoryTitle}`,
                    reminder.categoryId
                );
            }
        }

        if (prayerNotificationsEnabled && location) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todayTimes = PrayerTimesService.getPrayerTimes(today, location);
            const tomorrowTimes = PrayerTimesService.getPrayerTimes(tomorrow, location);

            await NotificationService.schedulePrayerReminders(todayTimes, tomorrowTimes);
        } else {
            await NotificationService.cancelPrayerReminders();
        }
    }, [morningReminderEnabled, morningReminderTime, eveningReminderEnabled, eveningReminderTime, customReminders, prayerNotificationsEnabled, location]);

    // Restore and Sync Notifications when preferences change
    useEffect(() => {
        if (!isLoading) {
            restoreNotifications();
        }
    }, [isLoading, restoreNotifications]);

    // Re-sync scheduled notifications when the app returns to the foreground (fresh prayer times)
    useEffect(() => {
        let appStateListener: PluginListenerHandle | null = null;
        let cancelled = false;
        if (Capacitor.isNativePlatform()) {
            CapApp.addListener('appStateChange', (state) => {
                if (state.isActive && !isLoading) {
                    restoreNotifications();
                }
            }).then(handle => {
                if (cancelled) {
                    handle.remove();
                } else {
                    appStateListener = handle;
                }
            }).catch(() => {});
        }

        return () => {
            cancelled = true;
            if (appStateListener) {
                appStateListener.remove();
            }
        };
    }, [isLoading, restoreNotifications]);

    const updateProgress = (zikrId: number, count: number) => {
        setProgress(prev => ({ ...prev, [zikrId]: count }));
    };

    const incrementProgress = (zikrId: number, by: number = 1) => {
        setProgress(prev => ({ ...prev, [zikrId]: (prev[zikrId] || 0) + by }));
    };
    
    const incrementStreak = useCallback((): StreakOutcome => {
        // Local date key; toISOString() is UTC and mis-dates near midnight.
        // The previous implementation parsed the keys as UTC midnights and
        // compared with Math.ceil(diff / 86400000), which misclassified
        // 25h spring-forward gaps as missed days and silently reset the
        // streak. computeStreakOutcome now treats both keys as plain
        // YYYY-MM-DD local-calendar dates, which is what the streak
        // question actually means ("did you recite on consecutive local
        // calendar days?"), and is DST- and travel-safe.
        const today = getLocalDateKey();

        // React 18 functional setState updaters may run asynchronously, so
        // we use flushSync to force the updater to apply before we read
        // the outcome. This keeps the call synchronous and avoids a
        // race where the caller would receive the placeholder before
        // React commits the update.
        let outcome: StreakOutcome = { kind: 'same-day', streak: 0 };
        flushSync(() => {
            setStats(current => {
                // First-write of the timezone so a cross-timezone move later
                // doesn't change the meaning of stored lastActiveDate.
                const tz = current.timezone || resolveTimezone(current);
                const computed = computeStreakOutcome(
                    { ...current, timezone: tz },
                    today,
                );
                outcome = computed;

                // No state change on same-day — return the previous stats
                // object so React skips the re-render.
                if (computed.kind === 'same-day') return current;

                return {
                    ...current,
                    streak: computed.streak,
                    lastActiveDate: today,
                    timezone: tz,
                };
            });
        });

        return outcome;
    }, []);

    const incrementTotalReads = (count: number) => {
        setStats(prev => ({ ...prev, totalReads: prev.totalReads + count }));
    };

    const toggleFavorite = (id: number) => {
        setFavorites(prev => 
            prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
        );
    };
    
    const toggleDarkMode = () => setDarkMode(prev => !prev);
    const toggleNotifications = (enabled?: boolean) => setNotifications(prev => enabled === undefined ? !prev : enabled);
    const toggleHaptics = () => setHapticsEnabled(prev => !prev);
    
    const navigate = (newScreen: Screen, params: any = null) => {
        setScreen(newScreen);
        setScreenParams(params);
    };

    const editZikr = async (zikr: UserZikr) => {
        try {
            await azkarRepository.updateZikr(zikr);
            await refreshData();
        } catch (error) {
            console.error("Failed to update zikr", error);
        }
    };

    const deleteZikr = async (id: number) => {
        try {
            await azkarRepository.deleteZikr(id);
            await refreshData();
        } catch (error) {
            console.error("Failed to delete zikr", error);
        }
    };

    const addCustomReminder = (reminder: CustomReminder) => {
        setCustomReminders(prev => [...prev, reminder]);
    };

    const removeCustomReminder = (id: number) => {
        setCustomReminders(prev => prev.filter(r => r.id !== id));
        NotificationService.cancelReminder(id);
    };

    // Quran handlers — preserve dedupe by (surah, ayah) and write-through to storage
    const addQuranBookmark = async (b: QuranBookmark) => {
        setQuranBookmarks(prev => {
            if (prev.some(x => x.surah === b.surah && x.ayah === b.ayah)) return prev;
            const next = [...prev, b];
            storage.saveQuranBookmarks(next).catch(err => console.error('saveQuranBookmarks', err));
            return next;
        });
    };
    const removeQuranBookmark = async (surah: number, ayah: number) => {
        setQuranBookmarks(prev => {
            const next = prev.filter(x => !(x.surah === surah && x.ayah === ayah));
            storage.saveQuranBookmarks(next).catch(err => console.error('saveQuranBookmarks', err));
            return next;
        });
    };
    const setQuranLastRead = async (l: QuranLastRead) => {
        setQuranLastReadState(prev => {
            if (prev && prev.surah === l.surah && prev.ayah === l.ayah) return prev;
            storage.saveQuranLastRead(l).catch(err => console.error('saveQuranLastRead', err));
            return l;
        });
    };
    const clearQuranLastRead = async () => {
        setQuranLastReadState(prev => {
            if (prev === null) return prev;
            storage.saveQuranLastRead(null).catch(err => console.error('saveQuranLastRead', err));
            return null;
        });
    };

    const renderScreen = () => {
        switch (screen) {
            case 'welcome': return <WelcomeScreen />;
            case 'notifications': return <NotificationsScreen />;
            case 'personalize': return <PersonalizationScreen />;
            case 'home': return <HomeScreen />;
            case 'categories': return <CategoriesScreen />;
            case 'favorites': return <FavoritesScreen />;
            case 'settings': return <SettingsScreen />;
            case 'audioSettings': return <AudioSettingsScreen />;
            case 'notificationSettings': return <NotificationSettingsScreen />;
            case 'search': return <SearchScreen />;
            case 'prayerTimes': return <PrayerTimesScreen />;
            case 'qibla': return <QiblaCompassScreen />;
            case 'calendar': return <HijriCalendarScreen />;
            case 'shareEditor': return <ShareEditorScreen data={screenParams} />;
            case 'quran': return <QuranScreen />;
            case 'surahReader': return <SurahReaderScreen params={screenParams} />;
            case 'azkarList': {
                const category = categories.find(c => c.id === screenParams?.categoryId);
                return category ? <AzkarListScreen category={category} initialScrollToId={screenParams?.initialScrollToId} /> : <CategoriesScreen />;
            }
            case 'azkarDay': return <AzkarDayScreen />;
            case 'tasbeeh': return <TasbeehScreen />;
            case 'reportBug': return <ReportBugScreen />;
            case 'aboutUs': return <AboutUsScreen />;
            case 'addZikr': return <AddZikrScreen />;
            case 'completion': return <CompletionScreen categoryId={screenParams?.categoryId} />;
            case 'sessionSummary': return <SessionSummaryScreen sessionStats={screenParams} />;
            default: return <WelcomeScreen />;
        }
    };

    const isMainScreen = ['home', 'categories', 'favorites', 'settings', 'quran'].includes(screen);

    if (isLoading) {
        return <LoadingFallback />;
    }

    return (
        <AppContext.Provider value={{ 
            navigate, favorites, toggleFavorite, 
            darkMode, toggleDarkMode, 
            theme, setTheme,
            notifications, toggleNotifications,
            morningReminderEnabled, setMorningReminderEnabled,
            morningReminderTime, setMorningReminderTime,
            eveningReminderEnabled, setEveningReminderEnabled,
            eveningReminderTime, setEveningReminderTime,
            fontSize, setFontSize, 
            progress, updateProgress, incrementProgress, 
            language, setLanguage, 
            homeLayout, setHomeLayout, 
            categories, refreshData, editZikr, deleteZikr,
            apiKey, setApiKey,
            voiceName, setVoiceName,
            audioAutoSave, setAudioAutoSave,
            audioLoopDefault, setAudioLoopDefault,
            hapticsEnabled, toggleHaptics,
            customReminders, addCustomReminder, removeCustomReminder,
            location, setLocation,
            prayerNotificationsEnabled, setPrayerNotificationsEnabled,
            stats, incrementStreak, incrementTotalReads,
            quranBookmarks, addQuranBookmark, removeQuranBookmark,
            quranLastRead, setQuranLastRead, clearQuranLastRead
        }}>
            <div className={`${darkMode ? 'dark' : ''} h-screen w-screen`} dir="rtl" data-theme={theme}>
                {/* MotionConfig reducedMotion="user" propagates the OS prefers-reduced-motion
                    preference to every Framer Motion child (page transitions, sheet slides,
                    modal pops). Tailwind keyframes are handled separately by the
                    @media (prefers-reduced-motion: reduce) block in index.css. */}
                <MotionConfig reducedMotion="user">
                <ToastProvider>
                <div className="bg-sand-50 text-gray-900 dark:bg-midnight-950 dark:text-gray-100 h-full w-full font-sans antialiased overflow-hidden transition-colors duration-300 relative">
                    <OfflineIndicator />
                    <PrePrayerOverlay
                        prayer={prePrayerTarget}
                        onOpenAdhkar={(p) => {
                            // The CTA reads the prayer key but the adhan
                            // category is the right destination for any
                            // prayer (it's "adhkar upon hearing the adhan").
                            navigate('azkarList', { categoryId: 'adhan' });
                            setPrePrayerTarget(null);
                        }}
                        onDismiss={() => setPrePrayerTarget(null)}
                        audioEnabled={prayerNotificationsEnabled}
                    />
                    <div className="max-w-md mx-auto h-full flex flex-col relative">
                    <ScreenErrorBoundary onReset={() => navigate('home')}>
                        <Suspense fallback={<LoadingFallback />}>
                            {isMainScreen ? (
                                <MainLayout activeScreen={screen}>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={screen}
                                            {...{
                                                initial: { opacity: 0, y: 10 },
                                                animate: { opacity: 1, y: 0 },
                                                exit: { opacity: 0, y: -10 },
                                                transition: { duration: 0.2 }
                                            } as any}
                                            className="h-full"
                                        >
                                            {renderScreen()}
                                        </motion.div>
                                    </AnimatePresence>
                                </MainLayout>
                            ) : (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={screen}
                                        {...{
                                            initial: { opacity: 0, x: 20 },
                                            animate: { opacity: 1, x: 0 },
                                            exit: { opacity: 0, x: -20 },
                                            transition: { duration: 0.25, ease: "easeInOut" }
                                        } as any}
                                        className="h-full"
                                    >
                                        {renderScreen()}
                                    </motion.div>
                                </AnimatePresence>
                            )}
                        </Suspense>
                    </ScreenErrorBoundary>
                    </div>
                </div>
                </ToastProvider>
                </MotionConfig>
            </div>
        </AppContext.Provider>
    );
};

export default App;
