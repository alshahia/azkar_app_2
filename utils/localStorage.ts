/**
 * @deprecated
 * This file is deprecated. Please use 'data/storage' instead which supports both Web (LocalStorage) and Mobile (SQLite).
 * The functions here are left for reference but should not be used in new code.
 */

import { getStorage } from '../data/storage';
import { UserPreferences, ProgressState } from '../types';

export const loadPreferences = (): UserPreferences => {
    console.warn("loadPreferences is synchronous and deprecated. Use storage.getPreferences() instead.");
    // Fallback attempt for sync access (web only), though not recommended
    try {
        const stored = localStorage.getItem('azkarAppPreferences');
        if (stored) return JSON.parse(stored);
    } catch(e) {}
    return {} as any;
};

export const savePreferences = (preferences: UserPreferences): void => {
    getStorage().savePreferences(preferences);
};

export const loadProgress = (): ProgressState => {
    console.warn("loadProgress is synchronous and deprecated. Use storage.getProgress() instead.");
    try {
        const stored = localStorage.getItem('azkarAppProgress');
        return stored ? JSON.parse(stored) : {};
    } catch(e) {}
    return {};
};

export const saveProgress = (progress: ProgressState): void => {
    getStorage().saveProgress(progress);
};

export const isOnboardingComplete = (): boolean => {
    return localStorage.getItem('azkarAppOnboardingComplete') === 'true';
};

export const setOnboardingComplete = (): void => {
    getStorage().setOnboardingComplete();
};