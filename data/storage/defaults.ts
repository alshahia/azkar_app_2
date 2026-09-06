
import type { UserPreferences, UserStats } from '../../types';

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
    prayerNotificationsEnabled: true
};

export const defaultStats: UserStats = {
    streak: 0,
    lastActiveDate: null,
    totalReads: 0,
    timezone: null
};
