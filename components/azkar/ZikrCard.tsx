
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppContext } from '../../context/AppContext';
import type { Zikr, UserZikr } from '../../types';
import { PlayIcon, ShareIcon, HeartIcon, PencilIcon, CheckIcon, StopIcon, PhotoIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import EditZikrModal from './EditZikrModal';
import ExplainZikrModal from './ExplainZikrModal';
import { HapticService } from '../../services/HapticService';

interface ZikrCardProps {
    zikr: Zikr;
    index: number;
    total: number;
    sessionCount: number;
    onUpdateSession: (id: number, count: number) => void;
    onGlobalAccumulate: (id: number, amount: number) => void;
    onHide: (id: number) => void;
    
    // Audio Props
    isPlaying: boolean;
    isAudioLoading: boolean;
    onPlayRequest: (zikr: Zikr) => void;
    onStopRequest: () => void;
}

const ZikrCard: React.FC<ZikrCardProps> = ({ 
    zikr, 
    index, 
    total, 
    sessionCount, 
    onUpdateSession, 
    onGlobalAccumulate, 
    onHide,
    isPlaying,
    isAudioLoading,
    onPlayRequest,
    onStopRequest
}) => {
    const { favorites, toggleFavorite, fontSize, editZikr, deleteZikr, navigate } = useAppContext();
    const { t } = useTranslation();
    
    const [isCompleting, setIsCompleting] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isExplainModalOpen, setExplainModalOpen] = useState(false);

    const isFavorite = favorites.includes(zikr.id);
    const remainingCount = Math.max(0, zikr.count - sessionCount);
    
    // Reactive Completion Logic
    useEffect(() => {
        if (sessionCount >= zikr.count && !isCompleting) {
            setIsCompleting(true);
            
            // Haptic Feedback for completion
            HapticService.success();
            
            // Delay hiding to allow animation to play
            const timer = setTimeout(() => {
                onHide(zikr.id);
            }, 800);
            
            return () => clearTimeout(timer);
        }
    }, [sessionCount, zikr.count, zikr.id, onHide, isCompleting]);

    // Main interaction handler (Manual Tap)
    const handleCardClick = () => {
        if (sessionCount >= zikr.count) return;

        // Light Haptic Feedback for tap
        HapticService.light();

        const newCount = sessionCount + 1;
        onUpdateSession(zikr.id, newCount);
        onGlobalAccumulate(zikr.id, 1);
    };

    const handlePlayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        HapticService.light();
        if (isPlaying) {
            onStopRequest();
        } else {
            onPlayRequest(zikr);
        }
    };

    const handleShareImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate('shareEditor', { text: zikr.arabic, source: zikr.reference });
    };

    const handleExplain = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExplainModalOpen(true);
    };

    // Dynamic font size classes
    const getArabicClass = (level: number) => {
        const sizes = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'];
        return sizes[level - 1] || 'text-3xl';
    };
    const getTranslationClass = (level: number) => {
        const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
        return sizes[level - 1] || 'text-base';
    };
    const arabicTextClass = getArabicClass(fontSize);
    const translationTextClass = getTranslationClass(fontSize);

    return (
        <>
            <div 
                id={`zikr-card-${zikr.id}`}
                className={`transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] transform origin-center ${
                    isCompleting ? 'opacity-0 translate-y-12 scale-90 blur-sm mb-0 max-h-0 overflow-hidden' : 'opacity-100 mb-6'
                }`}
            >
                <div 
                    onClick={handleCardClick}
                    className={`
                        bg-white dark:bg-midnight-900 
                        rounded-3xl p-6 
                        shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-none
                        border transition-all duration-300 cursor-pointer active:scale-[0.98] 
                        relative overflow-hidden group
                        ${isPlaying ? 'border-primary-500 ring-1 ring-primary-500' : 'border-white dark:border-midnight-800'}
                    `}
                >
                    {/* Progress Bar Background Effect - Subtle and Smooth */}
                    <div 
                        className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500 ease-out opacity-40" 
                        style={{ width: `${(sessionCount / zikr.count) * 100}%` }}
                    />

                    {/* Card Header */}
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 bg-sand-100 dark:bg-midnight-800 px-3 py-1 rounded-full tracking-wider">
                            {index + 1} / {total}
                        </span>
                        
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <button 
                                onClick={handlePlayClick} 
                                className={`transition-all p-2 rounded-full ${
                                    isPlaying || isAudioLoading 
                                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' 
                                    : 'text-gray-400 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-midnight-800'
                                }`}
                                disabled={isAudioLoading}
                            >
                                {isAudioLoading ? (
                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : isPlaying ? (
                                    <StopIcon className="w-5 h-5" />
                                ) : (
                                    <PlayIcon className="w-5 h-5" />
                                )}
                            </button>

                            <button onClick={handleShareImage} className="text-gray-400 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-midnight-800 p-2 rounded-full transition-colors" title="مشاركة كصورة">
                                <PhotoIcon className="w-5 h-5" />
                            </button>

                            <button onClick={handleExplain} className="text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 p-2 rounded-full transition-colors" title="شرح الذكر (AI)">
                                <SparklesIcon className="w-5 h-5" />
                            </button>
                            
                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(zikr.id); }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 p-2 rounded-full transition-colors">
                                <HeartIcon className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : ''}`} />
                            </button>
                            
                            <button onClick={(e) => { e.stopPropagation(); setEditModalOpen(true); }} className="text-gray-400 hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-midnight-800 p-2 rounded-full transition-colors">
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="text-center px-2 py-2">
                        <p className={`${arabicTextClass} font-quran text-center mb-6 text-gray-800 dark:text-gray-100 leading-[2.2] transition-all duration-300 pointer-events-none drop-shadow-sm`}>
                            {zikr.arabic}
                        </p>
                        
                        {zikr.translation && (
                            <p className={`${translationTextClass} text-gray-500 dark:text-gray-400 mb-4 text-center leading-relaxed transition-all duration-300 pointer-events-none font-sans`}>
                                {zikr.translation}
                            </p>
                        )}
                        
                        {zikr.reference && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center pointer-events-none mt-4 font-bold tracking-wide uppercase">
                                {zikr.reference}
                            </p>
                        )}
                    </div>

                    {/* Counter Button Area */}
                    <div className="mt-8 flex justify-center">
                        <div 
                            className={`
                                w-full py-3 rounded-2xl transition-all duration-300 flex items-center justify-center 
                                border-2 cursor-pointer
                                ${sessionCount >= zikr.count 
                                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30' 
                                    : 'bg-transparent border-sand-200 dark:border-midnight-800 text-primary-600 dark:text-primary-400 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-midnight-800'
                                }
                            `}
                        >
                            {sessionCount >= zikr.count ? (
                                <div className="flex items-center space-x-2 rtl:space-x-reverse animate-bounce-short">
                                    <CheckIcon className="w-6 h-6 stroke-2" />
                                    <span className="font-bold text-lg">{t('azkar_list_completed_button')}</span>
                                </div>
                            ) : (
                                <span className="text-3xl font-bold font-mono tracking-widest tabular-nums">
                                    {remainingCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <EditZikrModal 
                isOpen={isEditModalOpen} 
                onClose={() => setEditModalOpen(false)} 
                zikr={zikr as UserZikr} 
                onSave={editZikr}
                onDelete={deleteZikr}
            />

            <ExplainZikrModal
                isOpen={isExplainModalOpen}
                onClose={() => setExplainModalOpen(false)}
                zikrText={zikr.arabic}
            />
        </>
    );
};

export default ZikrCard;
