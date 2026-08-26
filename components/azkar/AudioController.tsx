
import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, StopIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { audioService } from '../../services/AudioService';

interface AudioControllerProps {
    isVisible: boolean;
    isPlaying: boolean; // This implies "Active" track
    isLoopMode: boolean;
    onToggleLoop: () => void;
    onStop: () => void;
    onClose?: () => void; // Optional close handler
}

const AudioController: React.FC<AudioControllerProps> = ({ 
    isVisible, 
    isPlaying, 
    isLoopMode, 
    onToggleLoop, 
    onStop,
    onClose
}) => {
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [speed, setSpeed] = useState(1.0);
    const [isPaused, setIsPaused] = useState(false);
    
    // Animation frame reference
    const rafRef = useRef<number | null>(null);

    // Speed options
    const speeds = [0.75, 1.0, 1.5, 2.0];

    // Detect changes in service state
    useEffect(() => {
        // We want to update state even if not visible, if it is playing, 
        // so that when opened it shows correct info.
        if (!isPlaying) {
            setProgress(0);
            setDuration(0);
            return;
        }

        const updateState = () => {
            const curr = audioService.getCurrentTime();
            const dur = audioService.getDuration();
            const paused = audioService.isPausedState();
            
            setProgress(curr);
            setDuration(dur);
            setIsPaused(paused);
            
            if (!paused) {
                rafRef.current = requestAnimationFrame(updateState);
            }
        };

        rafRef.current = requestAnimationFrame(updateState);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlaying, isPaused]); 

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setProgress(time); // Optimistic update
        audioService.seek(time);
    };

    const togglePlayPause = () => {
        if (isPaused) {
            audioService.resume();
            setIsPaused(false);
        } else {
            audioService.pause();
            setIsPaused(true);
        }
    };

    const cycleSpeed = () => {
        const currentIndex = speeds.indexOf(speed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        const newSpeed = speeds[nextIndex];
        setSpeed(newSpeed);
        audioService.setSpeed(newSpeed);
    };

    return (
        <div 
            className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                isVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
        >
            <div className="overflow-hidden">
                <div className="mx-1 mt-2 mb-4 bg-white dark:bg-[#1A3129] rounded-xl border border-gray-100 dark:border-primary-500/20 shadow-sm p-4 relative">
                    
                    {/* Close Button (Optional) */}
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="absolute top-2 left-2 rtl:right-auto rtl:left-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    )}

                    {/* Progress Bar Row */}
                    <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4 pt-1">
                        <span className="text-[10px] text-gray-500 font-mono w-8 text-center">{formatTime(progress)}</span>
                        <div className="flex-grow relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                             <div 
                                className="absolute top-0 left-0 rtl:right-0 rtl:left-auto h-full bg-primary-500 rounded-full pointer-events-none" 
                                style={{ width: `${(progress / (duration || 1)) * 100}%` }}
                            ></div>
                            <input 
                                type="range" 
                                min="0" 
                                max={duration || 100} 
                                step="0.1"
                                value={progress} 
                                onChange={handleSeek}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono w-8 text-center">{formatTime(duration)}</span>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between px-2">
                        
                        {/* Speed (Left) */}
                        <button 
                            onClick={cycleSpeed}
                            className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors text-primary-600 dark:text-primary-400"
                        >
                            <span className="text-xs font-bold">{speed}x</span>
                        </button>

                        {/* Main Controls (Center) */}
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            <button 
                                onClick={onStop}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 dark:bg-gray-800 rounded-full"
                                title="إيقاف"
                            >
                                <StopIcon className="w-5 h-5" />
                            </button>

                            <button 
                                onClick={togglePlayPause}
                                className="w-12 h-12 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg shadow-primary-500/30 flex items-center justify-center transition-transform active:scale-95"
                            >
                                {isPaused ? <PlayIcon className="w-6 h-6 ml-0.5 rtl:mr-0.5 rtl:ml-0" /> : <PauseIcon className="w-6 h-6" />}
                            </button>
                        </div>

                        {/* Loop (Right) */}
                        <button 
                            onClick={onToggleLoop}
                            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                                isLoopMode 
                                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800' 
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-600'
                            }`}
                            title="تكرار تلقائي"
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${isLoopMode ? '' : ''}`} />
                        </button>
                    </div>
                    
                    {/* Labels under buttons */}
                    <div className="flex justify-between px-2 mt-1 text-[9px] text-gray-400">
                        <span className="w-10 text-center">سرعة</span>
                        <div className="w-24 text-center opacity-0"></div> 
                        <span className="w-10 text-center">تكرار</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AudioController;
