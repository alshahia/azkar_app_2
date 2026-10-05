import React, { Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { useUIStore } from '../../stores/useUIStore';
import { APP_VERSION } from './AppInitializer';
import MainLayout from '../layout/MainLayout';
import OfflineIndicator from '../common/OfflineIndicator';
import PrePrayerOverlay from '../azkar/PrePrayerOverlay';
import AudioMiniPlayer from '../quran/AudioMiniPlayer';
import WhatsNewModal from '../common/WhatsNewModal';
import ErrorBoundary from '../common/ErrorBoundary';
import { LoadingFallback } from '../common/LoadingFallback';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import type { WatchedPrayer } from '../../types';

// Lazy Load Screens
const WelcomeScreen = React.lazy(() => import('../onboarding/WelcomeScreen'));
const NotificationsScreen = React.lazy(() => import('../onboarding/NotificationsScreen'));
const PersonalizationScreen = React.lazy(() => import('../onboarding/PersonalizationScreen'));
const HomeScreen = React.lazy(() => import('../screens/HomeScreen'));
const CategoriesScreen = React.lazy(() => import('../screens/CategoriesScreen'));
const FavoritesScreen = React.lazy(() => import('../screens/FavoritesScreen'));
const SettingsScreen = React.lazy(() => import('../screens/SettingsScreen'));
const AudioSettingsScreen = React.lazy(() => import('../screens/AudioSettingsScreen'));
const NotificationSettingsScreen = React.lazy(() => import('../screens/NotificationSettingsScreen'));
const AzkarListScreen = React.lazy(() => import('../screens/AzkarListScreen'));
const AzkarDayScreen = React.lazy(() => import('../screens/AzkarDayScreen'));
const TasbeehScreen = React.lazy(() => import('../screens/TasbeehScreen'));
const ReportBugScreen = React.lazy(() => import('../screens/ReportBugScreen'));
const AboutUsScreen = React.lazy(() => import('../screens/AboutUsScreen'));
const AddZikrScreen = React.lazy(() => import('../screens/AddZikrScreen'));
const CompletionScreen = React.lazy(() => import('../screens/CompletionScreen'));
const SessionSummaryScreen = React.lazy(() => import('../screens/SessionSummaryScreen'));
const SearchScreen = React.lazy(() => import('../screens/SearchScreen'));
const PrayerTimesScreen = React.lazy(() => import('../screens/PrayerTimesScreen'));
const QiblaCompassScreen = React.lazy(() => import('../screens/QiblaCompassScreen'));
const HijriCalendarScreen = React.lazy(() => import('../screens/HijriCalendarScreen'));
const ShareEditorScreen = React.lazy(() => import('../screens/ShareEditorScreen'));
const QuranScreen = React.lazy(() => import('../screens/QuranScreen'));
const SurahReaderScreen = React.lazy(() => import('../screens/SurahReaderScreen'));
const MushafPageScreen = React.lazy(() => import('../screens/MushafPageScreen'));
const KhatmaScreen = React.lazy(() => import('../quran/KhatmaScreen'));
const GlobalSearch = React.lazy(() => import('../search/GlobalSearch'));
const AsmaUlHusnaScreen = React.lazy(() => import('../screens/AsmaUlHusnaScreen'));
const HadithScreen = React.lazy(() => import('../screens/HadithScreen'));
const ZakatScreen = React.lazy(() => import('../screens/ZakatScreen'));
const DuasScreen = React.lazy(() => import('../screens/DuasScreen'));
const WordByWordScreen = React.lazy(() => import('../screens/WordByWordScreen'));
const MoonSightingScreen = React.lazy(() => import('../screens/MoonSightingScreen'));
const ReadingStatsScreen = React.lazy(() => import('../screens/ReadingStatsScreen'));
const IslamicLibraryScreen = React.lazy(() => import('../screens/IslamicLibraryScreen'));
const MemorizationScreen = React.lazy(() => import('../screens/MemorizationScreen'));

const MAIN_SCREENS = ['home', 'categories', 'favorites', 'settings', 'quran'];

export function AppRouter() {
  const screen = useNavigationStore((state) => state.screen);
  const params = useNavigationStore((state) => state.params);
  const navigate = useNavigationStore((state) => state.navigate);
  const darkMode = usePreferencesStore((state) => state.darkMode);
  const theme = usePreferencesStore((state) => state.theme);
  const darkStyle = usePreferencesStore((state) => state.darkStyle);
  const categories = usePreferencesStore((state) => state.categories);
  const lastSeenVersion = usePreferencesStore((state) => state.lastSeenVersion);
  const setLastSeenVersion = usePreferencesStore((state) => state.setLastSeenVersion);
  const prayerNotificationsEnabled = usePreferencesStore((state) => state.prayerNotificationsEnabled);
  const whatsNewOpen = useUIStore((state) => state.whatsNewOpen);
  const setWhatsNewOpen = useUIStore((state) => state.setWhatsNewOpen);
  const location = usePreferencesStore((state) => state.location);

  const { upcomingPrayer } = usePrayerTimes(location);

  const isMainScreen = MAIN_SCREENS.includes(screen);

  const handleOpenAdhkar = (_prayer: WatchedPrayer) => {
    navigate('azkarDay');
  };

  const handleDismissPrayer = (_prayer: WatchedPrayer) => {
    // Dismiss is handled internally by PrePrayerOverlay
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
      case 'shareEditor': return <ShareEditorScreen data={params} />;
      case 'quran': return <QuranScreen />;
      case 'surahReader': return <SurahReaderScreen params={params as { surahId: number; ayah?: number; bookmarksOnly?: boolean }} />;
      case 'mushafPage': return <MushafPageScreen params={params as { page?: number; surahId?: number; ayah?: number; khatmaId?: string }} />;
      case 'khatma': return <KhatmaScreen />;
      case 'globalSearch': return <GlobalSearch />;
      case 'asmaUlHusna': return <AsmaUlHusnaScreen onBack={() => navigate('home')} />;
      case 'hadith': return <HadithScreen onBack={() => navigate('home')} />;
      case 'zakat': return <ZakatScreen onBack={() => navigate('home')} />;
      case 'duas': return <DuasScreen onBack={() => navigate('home')} />;
      case 'wordByWord': return <WordByWordScreen onBack={() => navigate('home')} />;
      case 'moonSighting': return <MoonSightingScreen onBack={() => navigate('home')} />;
      case 'readingStats': return <ReadingStatsScreen onBack={() => navigate('home')} />;
      case 'islamicLibrary': return <IslamicLibraryScreen onBack={() => navigate('home')} />;
      case 'memorization': return <MemorizationScreen onBack={() => navigate('home')} />;
      case 'azkarList': {
        const categoryId = params?.categoryId as string;
        const category = categories.find(c => c.id === categoryId);
        if (!category) return <HomeScreen />;
        return <AzkarListScreen category={category} initialScrollToId={params?.initialScrollToId as number} initialViewMode={params?.initialViewMode as 'list' | 'focus'} />;
      }
      case 'azkarDay': return <AzkarDayScreen />;
      case 'tasbeeh': return <TasbeehScreen />;
      case 'reportBug': return <ReportBugScreen />;
      case 'aboutUs': return <AboutUsScreen />;
      case 'addZikr': return <AddZikrScreen />;
      case 'completion': {
        const categoryId = params?.categoryId as string;
        return <CompletionScreen categoryId={categoryId} />;
      }
      case 'sessionSummary': {
        const stats = params as { readCount: number; categoryTitle: string; totalAvailable: number };
        return <SessionSummaryScreen sessionStats={stats} />;
      }
      default: return <HomeScreen />;
    }
  };

  return (
    <div className={(darkMode ? 'dark' : '') + ' h-screen w-screen'} dir="rtl" data-theme={theme} data-dark-style={darkStyle}>
      <a href="#main-content" className="skip-link">تخطَّ إلى المحتوى</a>
      <div className="bg-surface text-gray-900 dark:bg-surface dark:text-gray-100 h-full w-full font-sans antialiased overflow-hidden transition-colors duration-300 relative">
        <OfflineIndicator />
        <PrePrayerOverlay
          prayer={upcomingPrayer}
          onOpenAdhkar={handleOpenAdhkar}
          onDismiss={handleDismissPrayer}
          audioEnabled={prayerNotificationsEnabled}
        />
        <div className="max-w-md mx-auto h-full flex flex-col relative">
          <ErrorBoundary variant="screen" onReset={() => navigate('home')}>
            <Suspense fallback={<LoadingFallback />}>
              {isMainScreen ? (
                <MainLayout activeScreen={screen}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={screen}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
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
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="h-full"
                  >
                    {renderScreen()}
                  </motion.div>
                </AnimatePresence>
              )}
            </Suspense>
          </ErrorBoundary>
        </div>
        <AudioMiniPlayer />
        <WhatsNewModal
          isOpen={whatsNewOpen}
          lastSeenVersion={lastSeenVersion}
          currentVersion={APP_VERSION}
          onDismiss={(newLastSeenVersion) => {
            setLastSeenVersion(newLastSeenVersion);
            setWhatsNewOpen(false);
          }}
        />
      </div>
    </div>
  );
}
