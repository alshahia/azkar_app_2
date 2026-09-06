
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon, ArrowPathIcon, SpeakerWaveIcon, SpeakerXMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';
import { useTranslation } from '../../hooks/useTranslation';
import { HapticService } from '../../services/HapticService';
import { playTick } from '../../utils/tickSound';
import { useToast } from '../common/Toast';

const TasbeehScreen: React.FC = () => {
    const { navigate, categories, incrementProgress } = useAppContext();
    const { t } = useTranslation();
    const toast = useToast();
    
    // Get Tasbeeh Category Items
    const tasbeehCategory = categories.find(c => c.id === 'tasbeeh');
    const azkar = tasbeehCategory ? tasbeehCategory.azkar : [];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [count, setCount] = useState(0);
    const [target, setTarget] = useState(33); // 33, 100, 0 (infinity)
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [lastTap, setLastTap] = useState(0);

    const currentZikr = azkar[currentIndex];

    useEffect(() => {
        setCount(0);
    }, [currentIndex]);

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

        // Target Reached Haptic
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

    const nextZikr = () => {
        HapticService.light();
        if (currentIndex < azkar.length - 1) setCurrentIndex(prev => prev + 1);
        else setCurrentIndex(0); // Loop
    };

    const prevZikr = () => {
        HapticService.light();
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
        <div className="h-full flex flex-col bg-gray-50 dark:bg-[#12241C] relative overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between p-4 z-10">
                <button onClick={() => navigate('home')} aria-label="رجوع" className="p-2 bg-white/50 dark:bg-black/20 rounded-full backdrop-blur-sm">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-900 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">المسبحة الإلكترونية</h1>
                <div className="w-10"></div> {/* Spacer */}
            </header>

            {/* Zikr Display (Carousel) */}
            <div className="flex-none px-6 py-4 z-10">
                <div className="bg-white dark:bg-[#1A3129] rounded-2xl p-6 shadow-sm dark:shadow-none border border-gray-100 dark:border-none min-h-[160px] flex flex-col justify-center items-center relative transition-all">
                    
                    {/* Nav Arrows */}
                    <button onClick={prevZikr} aria-label="الذكر السابق" className="absolute left-2 p-2 text-gray-400 hover:text-primary-500">
                        <ChevronLeftIcon className="w-6 h-6 rtl:rotate-180" />
                    </button>
                    <button onClick={nextZikr} aria-label="الذكر التالي" className="absolute right-2 p-2 text-gray-400 hover:text-primary-500">
                        <ChevronRightIcon className="w-6 h-6 rtl:rotate-180" />
                    </button>

                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center font-serif leading-relaxed mb-2">
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
                {/* Background Ripple Effect Elements */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <div className={`w-64 h-64 rounded-full border-4 border-primary-500 transition-transform duration-200 ${lastTap ? 'scale-110' : 'scale-100'}`}></div>
                    <div className={`absolute w-80 h-80 rounded-full border-2 border-primary-500/50 transition-transform duration-300 ${lastTap ? 'scale-105' : 'scale-100'}`}></div>
                </div>

                <button 
                    onClick={handleTap}
                    className="w-64 h-64 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-full shadow-[0_0_50px_rgba(var(--color-primary-500),0.3)] flex flex-col items-center justify-center text-white transition-all transform active:scale-95 relative overflow-hidden"
                >
                    {/* Fill Effect */}
                    <div 
                        className="absolute bottom-0 left-0 w-full bg-black/10 transition-all duration-300 ease-out"
                        style={{ height: `${percentage}%` }}
                    ></div>

                    <span className="text-7xl font-bold font-mono z-10 drop-shadow-md">{count}</span>
                    {target > 0 && (
                        <span className="text-sm font-medium opacity-80 mt-2 z-10">
                            الدورة: {completedCycles + 1}
                        </span>
                    )}
                </button>
            </div>

            {/* Controls */}
            <div className="flex-none p-6 pb-10 z-10">
                <div className="bg-white dark:bg-[#1A3129] rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-gray-100/50 dark:shadow-none">
                    
                    <button 
                        onClick={handleReset}
                        className="flex flex-col items-center space-y-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <ArrowPathIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold">تصفير</span>
                    </button>

                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

                    <button 
                        onClick={cycleTarget}
                        className="flex flex-col items-center space-y-1 text-primary-600 dark:text-primary-400"
                    >
                        <div className="border-2 border-current rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                            {target === 0 ? '∞' : target}
                        </div>
                        <span className="text-[10px] font-bold">الهدف</span>
                    </button>

                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>

                    <button 
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`flex flex-col items-center space-y-1 transition-colors ${soundEnabled ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}
                    >
                        {soundEnabled ? <SpeakerWaveIcon className="w-6 h-6" /> : <SpeakerXMarkIcon className="w-6 h-6" />}
                        <span className="text-[10px] font-bold">الصوت</span>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default TasbeehScreen;
