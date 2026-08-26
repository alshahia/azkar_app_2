
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ICONS } from '../../constants';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { StopIcon, SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useTranslation } from '../../hooks/useTranslation';
import { audioService } from '../../services/AudioService';

interface AzkarDayScreenProps {
    isEmbedded?: boolean;
}

const AzkarDayScreen: React.FC<AzkarDayScreenProps> = ({ isEmbedded = false }) => {
    const { navigate, favorites, toggleFavorite, fontSize, categories, apiKey, voiceName } = useAppContext();
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    // Tracks whether TTS playback started this mount; isPlaying state goes stale inside cleanup closures
    const playbackStartedRef = useRef(false);
    
    // Determine time of day (Morning: 4am - 5pm, Evening: 5pm - 4am)
    const isMorning = useMemo(() => {
        const hour = new Date().getHours();
        return hour >= 4 && hour < 17;
    }, []);

    // Select category based on time
    const targetCategoryId = isMorning ? 'morning' : 'evening';
    const activeCategory = categories.find(c => c.id === targetCategoryId);
    const dailyAzkar = activeCategory?.azkar || [];
    const currentZikr = dailyAzkar[currentIndex];

    useEffect(() => {
        // Stop audio if navigating between azkar or unmounting
        return () => {
            if (isPlaying) {
                audioService.stop();
                setIsPlaying(false);
            }
        };
    }, [currentIndex]);

    // Unmount safety: the cleanup above can read a stale isPlaying closure,
    // so always stop here once playback actually started
    useEffect(() => {
        return () => {
            if (playbackStartedRef.current) {
                audioService.stop();
            }
        };
    }, []);

    // Dynamic font size classes based on level 1-8
    const getArabicClass = (level: number) => {
        // slightly larger than list view
        const sizes = ['text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'];
        return sizes[level - 1] || 'text-4xl';
    };

    const getTranslationClass = (level: number) => {
        const sizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'];
        return sizes[level - 1] || 'text-lg';
    };

    const arabicTextClass = getArabicClass(fontSize);
    const translationTextClass = getTranslationClass(fontSize);

    const handlePlayAudio = async () => {
        if (isPlaying || isAudioLoading) {
            audioService.stop();
            setIsPlaying(false);
            setIsAudioLoading(false);
            return;
        }

        if (!currentZikr) return;

        setIsAudioLoading(true);
        try {
            const playbackPromise = audioService.playZikrAudio(currentZikr.arabic, voiceName, apiKey);
            setIsAudioLoading(false);
            setIsPlaying(true);
            playbackStartedRef.current = true;
            
            await playbackPromise;
            
            setIsPlaying(false);
        } catch (error) {
            console.error("Audio failed", error);
            setIsAudioLoading(false);
            setIsPlaying(false);
            
            if ((error as any).message === 'API_KEY_MISSING') {
                const confirm = window.confirm("لتشغيل الصوت، يرجى إضافة مفتاح API في الإعدادات. هل تريد الذهاب للإعدادات الآن؟");
                if (confirm) navigate('settings');
            } else {
                alert("تعذر تشغيل الصوت. تأكد من صحة مفتاح الـ API واتصالك بالإنترنت.");
            }
        }
    };

    // If no data exists, show a placeholder state
    if (!currentZikr) {
        return (
            <div className={`flex flex-col ${isEmbedded ? 'h-auto' : 'h-full justify-center p-4 text-center'}`}>
                <div className="bg-[#1A3129] p-6 rounded-lg">
                    <h2 className="text-xl font-bold text-white mb-2">{t('azkar_day_title')}</h2>
                    <p className="text-gray-400">No Azkar loaded for today.</p>
                </div>
            </div>
        );
    }

    const handleNext = () => {
        audioService.stop();
        setIsPlaying(false);
        if (currentIndex < dailyAzkar.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
             if(!isEmbedded) navigate('home');
        }
    };

    const handleBack = () => {
        audioService.stop();
        setIsPlaying(false);
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        } else {
            if(!isEmbedded) navigate('home');
        }
    };
    
    const progressPercentage = ((currentIndex + 1) / dailyAzkar.length) * 100;
    const isFavorite = favorites.includes(currentZikr.id);

    return (
        <div className={`flex flex-col ${isEmbedded ? 'h-auto' : 'h-full justify-between p-4'}`}>
            <div>
                 <header className="mb-4 flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                            {isMorning ? <SunIcon className="w-5 h-5 text-orange-400" /> : <MoonIcon className="w-5 h-5 text-indigo-400" />}
                            <span className="text-sm text-gray-400 font-medium">{activeCategory?.title}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-white">{t('azkar_day_title')}</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-primary-500">{currentIndex + 1}</span>
                        <span className="text-gray-500 text-sm">/{dailyAzkar.length}</span>
                    </div>
                </header>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mb-8">
                    <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                </div>

                <div className="bg-[#1A3129] p-6 rounded-lg text-center shadow-lg transition-all duration-300 relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary-500/5 rounded-bl-full -mr-4 -mt-4"></div>
                    
                    <p className={`${arabicTextClass} font-serif text-white mb-6 leading-loose transition-all duration-300`}>{currentZikr.arabic}</p>
                    
                    {currentZikr.transliteration && <p className="text-gray-300 italic mb-4">{currentZikr.transliteration}</p>}
                    
                    {currentZikr.translation && (
                        <p className={`${translationTextClass} text-gray-400 mb-6 transition-all duration-300 border-t border-gray-700 pt-4`}>
                            {currentZikr.translation}
                        </p>
                    )}
                    
                    {(currentZikr.benefit || currentZikr.reference) && (
                        <div className="text-xs text-primary-500/80 bg-primary-900/20 p-3 rounded-lg inline-block">
                            {currentZikr.benefit && <p className="mb-1">{currentZikr.benefit}</p>}
                            {currentZikr.reference && <p className="italic opacity-70">{currentZikr.reference}</p>}
                        </div>
                    )}
                </div>

                <div className="flex justify-around items-center mt-6 border-t border-gray-700 pt-4">
                    <button 
                        onClick={handlePlayAudio} 
                        className={`flex-1 py-4 transition-colors ${isPlaying || isAudioLoading ? 'text-primary-500' : 'text-gray-400 hover:text-white'}`}
                        disabled={isAudioLoading}
                    >
                        {isAudioLoading ? (
                            <div className="w-6 h-6 mx-auto border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : isPlaying ? (
                            <StopIcon className="w-6 h-6 mx-auto" />
                        ) : (
                            <ICONS.PlayIcon className="w-6 h-6 mx-auto" />
                        )}
                    </button>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <button className="flex-1 py-4 text-gray-400 hover:text-white transition-colors">
                        <ICONS.ShareIcon className="w-6 h-6 mx-auto" />
                    </button>
                    <div className="w-px h-8 bg-gray-700"></div>
                    <button onClick={() => toggleFavorite(currentZikr.id)} className="flex-1 py-4 text-gray-400 hover:text-white transition-colors">
                        <ICONS.HeartIcon className={`w-6 h-6 mx-auto ${isFavorite ? 'text-red-500 fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            <div className={`flex items-center justify-between mt-8 ${isEmbedded ? 'pb-16' : ''}`}>
                <button onClick={handleBack} className="p-4 rounded-full bg-[#1A3129] text-white hover:bg-[#203c31] transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 rtl:rotate-180" />
                </button>
                <button 
                    onClick={handleNext} 
                    className="px-12 py-4 rounded-full bg-primary-500 text-white font-bold text-lg hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
                >
                    {t('azkar_day_next_button')}
                </button>
            </div>
        </div>
    );
};

export default AzkarDayScreen;
