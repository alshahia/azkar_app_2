import { useState, useCallback } from 'react';
import type { ProgressState } from '../types';

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>({});

  const updateProgress = useCallback((zikrId: number, count: number) => {
    setProgress(prev => ({ ...prev, [zikrId]: count }));
  }, []);

  const incrementProgress = useCallback((zikrId: number, by: number = 1) => {
    setProgress(prev => ({ ...prev, [zikrId]: (prev[zikrId] || 0) + by }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({});
  }, []);

  const setProgressManually = useCallback((newProgress: ProgressState) => {
    setProgress(newProgress);
  }, []);

  return { progress, updateProgress, incrementProgress, resetProgress, setProgressManually };
}
