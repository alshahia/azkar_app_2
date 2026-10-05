
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { useProgressStore } from '../../stores/useProgressStore';
import { ArrowLeftIcon, ArrowPathIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import { useTranslation } from '../../hooks/useTranslation';
import { HapticService } from '../../services/HapticService';
import { playTick } from '../../utils/tickSound';
import { useToast } from '../common/Toast';

const TasbeehScreen: React.FC = () => {
    const navigate = useNavigationStore((state) => state.navigate);
    const categories = usePreferencesStore((state) => state.categories);
    const incrementProgress = useProgressStore((state) => state.incrementProgress);
    const { t } = useTranslation();
    const toast = useToast();
    
    // Get Tasbeeh Category Items
    const tasbeehCategory = categories.find(c => c.id === 'tasbeeh');
    const azkar = tasbeehCategory ? tasbeehCategory.azkar : [];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(33); // cycles 33 → 100 → 1000 → 0 (∞)
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [lastTap, setLastTap] = useState(0);

    const currentZikr = azkar[currentIndex];

    const handleTap = () => {
        // Debounce slightly to prevent accidental double taps
        const now = Date.now();
        if (now - lastTap < 100) return;
        setLastTap(now);

        // Haptic Feedback
        HapticService.medium();

        // Sound (synthesised tick, no asset needed)
        if (soundEnabled) {
            playTick();
        }

        const newCount = count + 1;
        setCount(newCount);

        // Update global progress for this zikr (atomic accumulate)
        if (currentZikr) {
            incrementProgress(currentZikr.id);
        }

        // Target reached: the amber ring below replays off completedCycles,
        // so only the haptic needs firing here.
        if (target > 0 && newCount % target === 0) {
            HapticService.success();
        }
    };

    const handleReset = async () => {
        const confirmed = await toast.confirm(t('confirm_reset_counter'));
        if (confirmed) {
            setCount(0);
            HapticService.light();
        }
    };

    // The counter resets with the zikr change, in the same update — no effect
    // firing a deferred setState.
    const nextZikr = () => {
        HapticService.light();
        setCount(0);
        if (currentIndex < azkar.length - 1) setCurrentIndex(prev => prev + 1);
        else setCurrentIndex(0); // Loop
    };

    const prevZikr = () => {
        HapticService.light();
        setCount(0);
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
        else setCurrentIndex(azkar.length - 1); // Loop
    };

    const cycleTarget = () => {
        HapticService.light();
        if (target === 33) setTarget(100);
        else if (target === 100) setTarget(1000);
        else if (target === 1000) setTarget(0); // Infinity
        else setTarget(33);
    };

    const percentage = target > 0 ? Math.min((count % target) / target * 100, 100) : 0;
    const completedCycles = target > 0 ? Math.floor(count / target) : 0;

    return (
        <div className="h-full flex flex-col bg-surface dark:bg-surface relative overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between p-4 z-10">
                <button onClick={() => navigate('home')} aria-label="رجوع" className="p-2 bg-surface-card/50 dark:bg-black/20 rounded-full backdrop-blur-sm">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-900 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-xl font-bold font-serif text-gray-900 dark:text-white">المسبحة الإلكترونية</h1>
                <div className="w-10"></div> {/* Spacer */}
            </header>

            {/* Zikr Display (Carousel) */}
            <div className="flex-none px-6 py-4 z-10">
                <div className="bg-surface-card dark:bg-surface-card rounded-2xl p-6 shadow-sm dark:shadow-none border border-gray-100 dark:border-midnight-800 min-h-[160px] flex flex-col justify-center items-center relative transition-all">
                    
                    {/* Nav Arrows */}
                    <button onClick={prevZikr} aria-label="الذكر السابق" className="absolute left-2 p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500">
                        <ChevronLeftIcon className="w-6 h-6 rtl:rotate-180" />
                    </button>
                    <button onClick={nextZikr} aria-label="الذكر التالي" className="absolute right-2 p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500">
                        <ChevronRightIcon className="w-6 h-6 rtl:rotate-180" />
                    </button>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center font-serif leading-relaxed mb-2">
                        {currentZikr ? currentZikr.arabic : 'سبحان الله'}
                    </h2>
                    {currentZikr?.translation && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            {currentZikr.translation}
                        </p>
                    )}
                </div>
            </div>

            {/* Main Counter Area */}
            <div className="flex-grow flex items-center justify-center relative z-10">
                <div className="relative">
                    {/* Celebration ring — replays once per completed cycle. Amber is
                        the celebration accent, and it is transient, not a resting halo. */}
                    {completedCycles > 0 && (
                        <motion.div
                            key={completedCycles}
                            initial={{ opacity: 0.7, scale: 1 }}
                            animate={{ opacity: 0, scale: 1.15 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            aria-hidden="true"
                            className="absolute inset-0 rounded-full border-4 border-amber-400 pointer-events-none"
                        />
                    )}

                    <button 
                        onClick={handleTap}
                        aria-label="تسبيح"
                        className="w-64 h-64 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-full flex flex-col items-center justify-center text-white transition-all transform active:scale-95 relative overflow-hidden"
                    >
                        {/* Fill Effect */}
                        <div 
                            className="absolute bottom-0 left-0 w-full bg-black/10 transition-all duration-300 ease-out"
                            style={{ height: `${percentage}%` }}
                        ></div>

                        <span className="text-7xl font-bold font-mono z-10">{count}</span>
                        {target > 0 && (
                            <span className="text-sm font-medium opacity-80 mt-2 z-10">
                                الدورة: {completedCycles + 1}
                            </span>
                        )}
                    </button>

                    {/* Announces every count change to screen readers */}
                    <span aria-live="polite" className="sr-only">{count}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex-none p-6 pb-10 z-10">
                <div className="bg-surface-card dark:bg-surface-card rounded-2xl p-4 flex justify-between items-center shadow-sm dark:shadow-none border border-gray-100 dark:border-midnight-800">
                    
                    <button 
                        onClick={handleReset}
                        className="flex flex-col items-center justify-center min-w-[44px] space-y-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        <ArrowPathIcon className="w-6 h-6" />
                        <span className="text-xs font-bold font-serif">تصفير</span>
                    </button>

                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

                    <button 
                        onClick={cycleTarget}
                        className="flex flex-col items-center justify-center min-w-[44px] space-y-1 text-primary-600 dark:text-primary-400"
                    >
                        <div className="border-2 border-current rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                            {target === 0 ? '∞' : target}
                        </div>
                        <span className="text-xs font-bold font-serif">الهدف</span>
                    </button>

                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

                    <button 
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        aria-pressed={soundEnabled}
                        className={`flex flex-col items-center justify-center min-w-[44px] space-y-1 transition-colors ${soundEnabled ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        {soundEnabled ? <SpeakerWaveIcon className="w-6 h-6" /> : <SpeakerXMarkIcon className="w-6 h-6" />}
                        <span className="text-xs font-bold font-serif">الصوت</span>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default TasbeehScreen;
