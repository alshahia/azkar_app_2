
import type { UserPreferences, UserStats } from '../../types';

/** Arabic default preferences. The locale resolver in `./locale.ts`
 *  re-exports these as the fallback for every supported locale today;
 *  future locales can override individual fields without touching
 *  every call-site. */
export const defaultPreferences: UserPreferences = {
    darkMode: true,
    theme: 'emerald',
    notifications: true,
    morningReminderEnabled: true,
    morningReminderTime: '05:00 AM',
    eveningReminderEnabled: true,
    eveningReminderTime: '05:00 PM',
    fontSize: 2,
    favorites: [],
    language: 'ar',
    // Default to 'focus' — a single zikr with three actions, not the
    // 5-widget dashboard. The dashboard remains available via Settings
    // for users who want the richer Explore surface, but no longer
    // competes for attention with the primary task on first open.
    homeLayout: 'focus',
    apiKey: '',
    voiceName: 'Charon',
    audioAutoSave: true,
    audioLoopDefault: false,
    hapticsEnabled: true,
    customReminders: [],
    location: null,
    calculationMethod: 'MuslimWorldLeague',
    prayerNotificationsEnabled: true,
    mushafMode: 'modern',
    mushafTajweed: false,
    tafsirId: 'muyassar',
    wakeLockEnabled: true,
    votdEnabled: true,
    votdTime: '06:00 AM',
    currentLocale: 'ar'
};

export const defaultStats: UserStats = {
    streak: 0,
    lastActiveDate: null,
    totalReads: 0,
    timezone: null
};