import React, { useEffect, useState } from 'react';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useUIStore } from '../../stores/useUIStore';
import { getStorage } from '../../data/storage';
import { runStorageMigrations } from '../../data/migrations';
import { HapticService } from '../../services/HapticService';
import { compareSemver } from '../../utils/changelog';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const APP_VERSION = '1.0.0';

export function AppInitializer({ children }: AppInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const setPreferences = usePreferencesStore((state) => state.setPreferences);
  const setProgress = useProgressStore((state) => state.setProgress);
  const setStats = useProgressStore((state) => state.setStats);
  const navigate = useNavigationStore((state) => state.navigate);
  const refreshData = usePreferencesStore((state) => state.refreshData);
  const setWhatsNewOpen = useUIStore((state) => state.setWhatsNewOpen);

  useEffect(() => {
    const initialize = async () => {
      try {
        const storage = getStorage();
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

        // Set preferences
        setPreferences({
          darkMode: prefs.darkMode,
          theme: prefs.theme,
          darkStyle: prefs.darkStyle,
          language: prefs.language,
          homeLayout: prefs.homeLayout,
          fontSize: prefs.fontSize,
          voiceName: prefs.voiceName,
          audioAutoSave: prefs.audioAutoSave,
          audioLoopDefault: prefs.audioLoopDefault,
          hapticsEnabled: prefs.hapticsEnabled,
          notifications: prefs.notifications,
          morningReminderEnabled: prefs.morningReminderEnabled,
          morningReminderTime: prefs.morningReminderTime,
          eveningReminderEnabled: prefs.eveningReminderEnabled,
          eveningReminderTime: prefs.eveningReminderTime,
          prayerNotificationsEnabled: prefs.prayerNotificationsEnabled,
          location: prefs.location,
          mushafMode: prefs.mushafMode,
          mushafTajweed: prefs.mushafTajweed,
          tafsirId: prefs.tafsirId,
          wakeLockEnabled: prefs.wakeLockEnabled,
          votdEnabled: prefs.votdEnabled,
          votdTime: prefs.votdTime,
          lastSeenVersion: prefs.lastSeenVersion,
          isLoading: false,
        });

        // Set progress
        setProgress(prog);
        setStats(userStats);

        // Categories power the Categories screen and the azkarList route
        // lookup; load them at boot like the pre-refactor App did.
        await refreshData();

        // Initialize Haptic Service
        HapticService.setEnabled(prefs.hapticsEnabled);

        // Navigate based on onboarding status
        if (onboardingDone) {
          navigate('home');

          // What's-new modal (M4-T4): surface once when the running
          // version exceeds the highest version the user has dismissed.
          if (compareSemver(APP_VERSION, prefs.lastSeenVersion ?? '0.0.0') > 0) {
            setWhatsNewOpen(true);
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, [setPreferences, setProgress, setStats, navigate, refreshData, setWhatsNewOpen]);

  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
}
