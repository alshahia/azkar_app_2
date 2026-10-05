import { PrayerTimes, WatchedPrayer } from '../types';
import { PrayerTimesService } from '../services/PrayerTimesService';
import { findUpcomingPrayerWithinWindow } from '../data/prayerWatch';
import type { PrayerTimes as AdhanPrayerTimes } from 'adhan';

/**
 * Prayer Times Repository
 * Encapsulates all prayer times data access.
 */
export const prayerTimesRepository = {
    /**
     * Get prayer times for a specific date and location.
     */
    getPrayerTimes: async (date: Date, latitude: number, longitude: number): Promise<PrayerTimes> => {
        return PrayerTimesService.getPrayerTimes(date, { latitude, longitude });
    },

    /**
     * Get the next upcoming prayer.
     */
    getUpcomingPrayer: async (latitude: number, longitude: number): Promise<WatchedPrayer | null> => {
        const now = new Date();
        const times = await prayerTimesRepository.getPrayerTimes(now, latitude, longitude);
        return findUpcomingPrayerWithinWindow(times as unknown as AdhanPrayerTimes, now);
    },

    /**
     * Get all prayer times for a specific date.
     */
    getAllPrayerTimes: async (date: Date, latitude: number, longitude: number): Promise<PrayerTimes> => {
        return PrayerTimesService.getPrayerTimes(date, { latitude, longitude });
    }
};
