
import type { UserPreferences, UserStats } from '../../types';

/** Arabic default preferences. The locale resolver in `./locale.ts`
 *  re-exports these as the fallback for every supported locale today;
 *  future locales can override individual fields without touching
 *  every call-site. */
export const defaultPreferences: UserPreferences = {
    darkMode: true,
    // Default dark surface identity (see DarkStyle in types.ts). The user
    // can swap to any of the five from Settings → المظهر; 'cosmic' is the
    // Cosmic Indigo · Deep Space · Gold identity from the prototypes.
    darkStyle: 'cosmic',
    theme: 'emerald',
    notifications: true,
    morningReminderEnabled: true,
    morningReminderTime: '05:00 AM',
    eveningReminderEnabled: true,
    eveningReminderTime: '05:00 PM',
    fontSize: 2,
    favorites: [],
    language: 'ar',
    // Default to 'dashboard' — the full 5-widget Explore surface
    // (Welcome, Smart Suggestion, Prayer Times, Quranic Verse, Asma ul
    // Husna, …). The other layouts (focus, stream, simple) remain
    // available via Settings for users who want a narrower surface.
    homeLayout: 'dashboard',
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