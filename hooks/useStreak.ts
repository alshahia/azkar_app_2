import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import type { UserStats, StreakOutcome } from '../types';
import { defaultStats } from '../data/storage/defaults';
import { computeStreakOutcome, resolveTimezone } from '../data/streak';

const getLocalDateKey = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

export function useStreak() {
  const [stats, setStats] = useState<UserStats>(defaultStats);

  const incrementStreak = useCallback((): StreakOutcome => {
    const today = getLocalDateKey();
    let outcome: StreakOutcome = { kind: 'same-day', streak: 0 };

    flushSync(() => {
      setStats(current => {
        const tz = current.timezone || resolveTimezone(current);
        const computed = computeStreakOutcome(
          { ...current, timezone: tz },
          today,
        );
        outcome = computed;

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

  const incrementTotalReads = useCallback((count: number) => {
    setStats(prev => ({ ...prev, totalReads: prev.totalReads + count }));
  }, []);

  const setStatsManually = useCallback((newStats: UserStats) => {
    setStats(newStats);
  }, []);

  return { stats, incrementStreak, incrementTotalReads, setStatsManually };
}
