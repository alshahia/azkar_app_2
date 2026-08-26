
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
    homeLayout: 'dashboard',
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
    totalReads: 0
};
