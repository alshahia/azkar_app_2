import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useThemeCustomization } from '../../hooks/useThemeCustomization';
import type { ThemePreset } from '../../utils/themePresets';

const ThemeCustomizer: React.FC = () => {
    const { themeId, currentTheme, setTheme, setAutoTheme, presets } = useThemeCustomization();

    return (
        <div className="space-y-6">
            {/* Auto Theme */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">الوضع التلقائي</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">يتغير حسب وقت اليوم</p>
                    </div>
                    <button
                        onClick={setAutoTheme}
                        className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        تفعيل
                    </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                        <SunIcon className="w-4 h-4" />
                        <span>نهار: زمردي</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MoonIcon className="w-4 h-4" />
                        <span>ليل: منتصف الليل</span>
                    </div>
                </div>
            </div>

            {/* Theme Presets */}
            <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">السمات</h3>
                <div className="grid grid-cols-2 gap-3">
                    {presets.map((preset) => (
                        <ThemeCard
                            key={preset.id}
                            preset={preset}
                            isSelected={themeId === preset.id}
                            onSelect={() => setTheme(preset.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Current Theme Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">السمة الحالية</h3>
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-xl"
                        style={{ backgroundColor: currentTheme.primary }}
                    />
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{currentTheme.nameAr}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{currentTheme.name}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ThemeCardProps {
    preset: ThemePreset;
    isSelected: boolean;
    onSelect: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ preset, isSelected, onSelect }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onSelect}
            className={`relative p-4 rounded-2xl border-2 transition-colors ${
                isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
        >
            {isSelected && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-4 h-4 text-white" />
                </div>
            )}
            <div className="flex gap-2 mb-3">
                <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: preset.primary }}
                />
                <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: preset.secondary }}
                />
                <div
                    className="w-8 h-8 rounded-lg"
                    style={{ backgroundColor: preset.accent }}
                />
            </div>
            <p className="font-medium text-gray-900 dark:text-white text-right">{preset.nameAr}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right">{preset.name}</p>
        </motion.button>
    );
};

export default ThemeCustomizer;
