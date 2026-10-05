import { useEffect, useMemo, useState } from 'react';
import type { LocationCoordinates, PrayerTimes, WatchedPrayer } from '../types';
import { PrayerTimesService } from '../services/PrayerTimesService';
import { findUpcomingPrayerWithinWindow } from '../data/prayerWatch';

const PRAYER_WATCH_INTERVAL = 15000; // 15 seconds

export interface PrayerTimesState {
  prayerTimes: PrayerTimes | null;
  upcomingPrayer: WatchedPrayer | null;
  error: Error | null;
}

/**
 * Today's prayer times plus the upcoming prayer the pre-prayer overlay watches
 * for, derived during render from the stored location and a clock reading that
 * advances every 15s so the overlay keeps pace with the wall clock.
 */
export function usePrayerTimes(location: LocationCoordinates | null): PrayerTimesState {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!location) return;

    const interval = setInterval(() => setNow(new Date()), PRAYER_WATCH_INTERVAL);
    return () => clearInterval(interval);
  }, [location]);

  return useMemo(() => {
    if (!location) {
      return { prayerTimes: null, upcomingPrayer: null, error: null };
    }

    try {
      const times = PrayerTimesService.getPrayerTimes(now, location);

      return {
        prayerTimes: times,
        upcomingPrayer: findUpcomingPrayerWithinWindow(times, now),
        error: null,
      };
    } catch (err) {
      return {
        prayerTimes: null,
        upcomingPrayer: null,
        error: err instanceof Error ? err : new Error('Failed to get prayer times'),
      };
    }
  }, [location, now]);
}
