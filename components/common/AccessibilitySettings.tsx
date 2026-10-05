import React from 'react';
import { motion } from 'framer-motion';
import { EyeIcon, CursorArrowRaysIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

interface AccessibilitySettingsProps {
    highContrast: boolean;
    onHighContrastChange: (value: boolean) => void;
    largeText: boolean;
    onLargeTextChange: (value: boolean) => void;
    reduceMotion: boolean;
    onReduceMotionChange: (value: boolean) => void;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
    highContrast,
    onHighContrastChange,
    largeText,
    onLargeTextChange,
    reduceMotion,
    onReduceMotionChange,
}) => {
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white">إمكانية الوصول</h3>
            
            {/* High Contrast */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <EyeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">تباين عالي</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">تحسين وضوح النصوص</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onHighContrastChange(!highContrast)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                            highContrast ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={highContrast}
                    >
                        <motion.div
                            animate={{ x: highContrast ? 24 : 0 }}
                            className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow"
                        />
                    </button>
                </div>
            </div>

            {/* Large Text */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <CursorArrowRaysIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">نص كبير</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">تكبير حجم الخط</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onLargeTextChange(!largeText)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                            largeText ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={largeText}
                    >
                        <motion.div
                            animate={{ x: largeText ? 24 : 0 }}
                            className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow"
                        />
                    </button>
                </div>
            </div>

            {/* Reduce Motion */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <SpeakerWaveIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">تقليل الحركة</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">تقليل الحركات والانتقالات</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onReduceMotionChange(!reduceMotion)}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                            reduceMotion ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={reduceMotion}
                    >
                        <motion.div
                            animate={{ x: reduceMotion ? 24 : 0 }}
                            className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow"
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessibilitySettings;
