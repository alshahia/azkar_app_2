
import React, { useState, useEffect, useRef } from 'react';
import { Zikr } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import { ShareIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HapticService } from '../../services/HapticService';

interface FocusModeViewProps {
    azkar: Zikr[];
    sessionProgress: {[key: number]: number};
    onUpdateSession: (id: number, count: number) => void;
    onGlobalAccumulate: (id: number, amount: number) => void;
    playingZikrId: number | null;
    isAudioLoading: boolean;
    onPlay: (zikr: Zikr) => void;
    onStop: () => void;
}

const FocusModeView: React.FC<FocusModeViewProps> = ({
    azkar,
    sessionProgress,
    onUpdateSession,
    onGlobalAccumulate,
    playingZikrId,
    isAudioLoading,
    onPlay,
    onStop
}) => {
    const { favorites, toggleFavorite, fontSize, incrementProgress } = useAppContext();
    
    // Find the first incomplete zikr to start with, or defaults to 0
    const firstIncompleteIndex = azkar.findIndex(z => (sessionProgress[z.id] || 0) < z.count);
    const [currentIndex, setCurrentIndex] = useState(firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0);

    const currentZikr = azkar[currentIndex];

    // Crash guard: clamp/reset the index whenever the azkar array shrinks below it
    useEffect(() => {
        if (azkar.length > 0 && currentIndex >= azkar.length) {
            const resetIndex = azkar.findIndex(z => (sessionProgress[z.id] || 0) < z.count);
            setCurrentIndex(resetIndex >= 0 ? resetIndex : 0);
        }
    }, [azkar, currentIndex, sessionProgress]);

    // Sync with audio: If external audio engine moves to a new ID, switch to it
    useEffect(() => {
        if (playingZikrId) {
            const index = azkar.findIndex(z => z.id === playingZikrId);
            if (index !== -1 && index !== currentIndex) {
                setCurrentIndex(index);
            }
        }
    }, [playingZikrId, azkar]);

    // Defensive early-return: never dereference an out-of-range current zikr
    if (!currentZikr) {
        return null;
    }

    const sessionCount = sessionProgress[currentZikr.id] || 0;
    const remaining = Math.max(0, currentZikr.count - sessionCount);
    const isCompleted = sessionCount >= currentZikr.count;
    const isFavorite = favorites.includes(currentZikr.id);
    const isPlaying = playingZikrId === currentZikr.id;

    const handleNext = () => {
        HapticService.light();
        if (currentIndex < azkar.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        HapticService.light();
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleTap = () => {
        if (isCompleted) return;
        
        // Haptic feedback
        HapticService.light();

        onUpdateSession(currentZikr.id, sessionCount + 1);
        // Atomic accumulate: computed absolute writes drop rapid taps within one commit
        incrementProgress(currentZikr.id, 1);
    };

    const handlePlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlaying) onStop();
        else onPlay(currentZikr);
    };

    // Font sizing
    const getArabicClass = (level: number) => {
        const sizes = ['text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl'];
        return sizes[level - 1] || 'text-4xl';
    };
    const arabicClass = getArabicClass(fontSize);

    return (
        <div className="flex flex-col h-full relative">
            {/* Progress Header */}
            <div className="flex justify-between items-center px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{currentIndex + 1} / {azkar.length}</span>
                <div className="flex space-x-1 rtl:space-x-reverse">
                    {azkar.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                idx === currentIndex ? 'bg-primary-500' : 
                                idx < currentIndex ? 'bg-primary-200 dark:bg-primary-900' : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Main Card Area */}
            <div className="flex-grow flex items-center justify-center p-4 relative">
                {/* Navigation Buttons (Absolute for layout cleanliness) */}
                <button 
                    onClick={handlePrev} 
                    disabled={currentIndex === 0}
                    className="absolute left-0 p-2 text-gray-400 disabled:opacity-20 hover:text-primary-500 transition-colors z-10"
                >
                    <ChevronLeftIcon className="w-8 h-8 rtl:rotate-180" />
                </button>

                <button 
                    onClick={handleNext} 
                    disabled={currentIndex === azkar.length - 1}
                    className="absolute right-0 p-2 text-gray-400 disabled:opacity-20 hover:text-primary-500 transition-colors z-10"
                >
                    <ChevronRightIcon className="w-8 h-8 rtl:rotate-180" />
                </button>

                <AnimatePresence mode='wait'>
                    <motion.div 
                        key={currentZikr.id}
                        {...{
                            initial: { opacity: 0, scale: 0.9, y: 20 },
                            animate: { opacity: 1, scale: 1, y: 0 },
                            exit: { opacity: 0, scale: 0.95, y: -20 },
                            transition: { duration: 0.3 }
                        } as any}
                        onClick={handleTap}
                        className={`
                            w-full max-w-sm bg-white dark:bg-[#1A3129] 
                            rounded-[2.5rem] shadow-xl dark:shadow-none border border-gray-100 dark:border-primary-900/30
                            p-6 flex flex-col justify-between items-center text-center
                            min-h-[60vh] relative overflow-hidden cursor-pointer
                            ${isCompleted ? 'ring-2 ring-primary-500 dark:ring-primary-400' : ''}
                        `}
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gray-100 dark:bg-gray-800">
                            <motion.div 
                                className="h-full bg-primary-500"
                                {...{
                                    initial: { width: 0 },
                                    animate: { width: `${(sessionCount / currentZikr.count) * 100}%` },
                                    transition: { duration: 0.3 }
                                } as any}
                            />
                        </div>

                        {/* Top Controls */}
                        <div className="w-full flex justify-between items-start mt-2 mb-4">
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(currentZikr.id); }}>
                                {isFavorite ? <HeartSolid className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6 text-gray-400" />}
                            </button>
                            <button onClick={handlePlayClick} disabled={isAudioLoading} className={`${isPlaying ? 'text-primary-500' : 'text-gray-400'}`}>
                                {isAudioLoading ? (
                                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : isPlaying ? (
                                    <StopIcon className="w-6 h-6" />
                                ) : (
                                    <PlayIcon className="w-6 h-6" />
                                )}
                            </button>
                        </div>

                        {/* Text Content */}
                        <div className="flex-grow flex flex-col justify-center items-center my-4 overflow-y-auto w-full no-scrollbar">
                            <p className={`${arabicClass} font-quran leading-loose text-gray-800 dark:text-gray-100 mb-6`}>
                                {currentZikr.arabic}
                            </p>
                            
                            {currentZikr.translation && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-sans leading-relaxed px-2">
                                    {currentZikr.translation}
                                </p>
                            )}
                        </div>

                        {/* Counter (Big) */}
                        <div className="mt-6 mb-2">
                            <div className={`
                                w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold font-mono transition-all duration-300
                                ${isCompleted 
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-110' 
                                    : 'bg-gray-50 dark:bg-gray-800 text-primary-600 dark:text-primary-400'
                                }
                            `}>
                                {isCompleted ? <span className="text-2xl">✓</span> : remaining}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                {isCompleted ? 'مكتمل' : 'اضغط للعد'}
                            </p>
                        </div>

                        {/* Source */}
                        {currentZikr.reference && (
                            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-2">{currentZikr.reference}</p>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FocusModeView;
