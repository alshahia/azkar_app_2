import { useState, useCallback } from 'react';
import { THEME_PRESETS, getThemeById } from '../utils/themePresets';

const THEME_STORAGE_KEY = 'azkar-theme';

function loadTheme(): string {
    try {
        const data = localStorage.getItem(THEME_STORAGE_KEY);
        return data || 'emerald';
    } catch {
        return 'emerald';
    }
}

function saveTheme(themeId: string): void {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

export function useThemeCustomization() {
    const [themeId, setThemeId] = useState<string>(loadTheme);
    const [customAccent, setCustomAccent] = useState<string | null>(null);

    const currentTheme = getThemeById(themeId) || THEME_PRESETS[0];

    const setTheme = useCallback((id: string) => {
        setThemeId(id);
        saveTheme(id);
    }, []);

    const applyCustomAccent = useCallback((color: string) => {
        setCustomAccent(color);
    }, []);

    const resetCustomAccent = useCallback(() => {
        setCustomAccent(null);
    }, []);

    // Auto theme based on time
    const getAutoTheme = useCallback((): string => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 18) {
            return 'emerald'; // Day theme
        }
        return 'midnight'; // Night theme
    }, []);

    const setAutoTheme = useCallback(() => {
        const autoTheme = getAutoTheme();
        setTheme(autoTheme);
    }, [getAutoTheme, setTheme]);

    return {
        themeId,
        currentTheme,
        customAccent,
        setTheme,
        applyCustomAccent,
        resetCustomAccent,
        getAutoTheme,
        setAutoTheme,
        presets: THEME_PRESETS,
    };
}
