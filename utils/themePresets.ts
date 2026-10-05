export interface ThemePreset {
    id: string;
    name: string;
    nameAr: string;
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    isDark: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
    {
        id: 'emerald',
        name: 'Emerald',
        nameAr: 'زمردي',
        primary: '#10b981',
        secondary: '#059669',
        accent: '#34d399',
        background: '#f9fafb',
        surface: '#ffffff',
        text: '#111827',
        isDark: false,
    },
    {
        id: 'ocean',
        name: 'Ocean',
        nameAr: 'محيطي',
        primary: '#3b82f6',
        secondary: '#2563eb',
        accent: '#60a5fa',
        background: '#f0f9ff',
        surface: '#ffffff',
        text: '#1e3a8a',
        isDark: false,
    },
    {
        id: 'sunset',
        name: 'Sunset',
        nameAr: 'غروب',
        primary: '#f97316',
        secondary: '#ea580c',
        accent: '#fb923c',
        background: '#fff7ed',
        surface: '#ffffff',
        text: '#9a3412',
        isDark: false,
    },
    {
        id: 'midnight',
        name: 'Midnight',
        nameAr: 'منتصف الليل',
        primary: '#8b5cf6',
        secondary: '#7c3aed',
        accent: '#a78bfa',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        isDark: true,
    },
    {
        id: 'forest',
        name: 'Forest',
        nameAr: 'غابة',
        primary: '#22c55e',
        secondary: '#16a34a',
        accent: '#4ade80',
        background: '#f0fdf4',
        surface: '#ffffff',
        text: '#14532d',
        isDark: false,
    },
];

export function getThemeById(id: string): ThemePreset | undefined {
    return THEME_PRESETS.find(t => t.id === id);
}
