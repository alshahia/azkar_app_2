
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { useProgressStore } from '../../stores/useProgressStore';
import type { Category, Zikr } from '../../types';
import { ArrowLeftIcon, Cog6ToothIcon, ChevronUpIcon, PlayIcon, Squares2X2Icon, RectangleStackIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import ZikrCard from '../azkar/ZikrCard';
import FocusModeView from '../azkar/FocusModeView';
import AudioController from '../azkar/AudioController';
import { audioService } from '../../services/AudioService';
import { useToast } from '../common/Toast';

interface AzkarListScreenProps {
  category: Category;
  initialScrollToId?: number;
  initialViewMode?: 'list' | 'focus';
}

const AzkarListScreen: React.FC<AzkarListScreenProps> = ({ category, initialScrollToId, initialViewMode }) => {
  const navigate = useNavigationStore((state) => state.navigate);
  const incrementProgress = useProgressStore((state) => state.incrementProgress);
  const voiceName = usePreferencesStore((state) => state.voiceName);
  const apiKey = usePreferencesStore((state) => state.apiKey);
  const audioLoopDefault = usePreferencesStore((state) => state.audioLoopDefault);
  const { t } = useTranslation();
  const toast = useToast();
  
  // -- View Mode State --
  const [viewMode, setViewMode] = useState<'list' | 'focus'>(initialViewMode ?? 'list');

  // -- Session State --
  const [sessionProgress, setSessionProgress] = useState<{[key: number]: number}>({});
  const [hiddenAzkarIds, setHiddenAzkarIds] = useState<number[]>([]);
  
  // -- Audio Engine State --
  const [playingZikrId, setPlayingZikrId] = useState<number | null>(null);
  const [isLoopMode, setIsLoopMode] = useState(audioLoopDefault);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  // -- Audio Controller UI State --
  const [isControllerVisible, setIsControllerVisible] = useState(false);

  // -- Refs for Logic in Async Loops --
  const sessionProgressRef = useRef(sessionProgress);
  const isLoopModeRef = useRef(isLoopMode);
  const playingZikrIdRef = useRef(playingZikrId);
  const hiddenAzkarIdsRef = useRef(hiddenAzkarIds);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync Refs
  useEffect(() => { sessionProgressRef.current = sessionProgress; }, [sessionProgress]);
  useEffect(() => { isLoopModeRef.current = isLoopMode; }, [isLoopMode]);
  useEffect(() => { playingZikrIdRef.current = playingZikrId; }, [playingZikrId]);
  useEffect(() => { hiddenAzkarIdsRef.current = hiddenAzkarIds; }, [hiddenAzkarIds]);

  // -- Lifecycle --
  const stopAudio = () => {
      audioService.stop();
      setPlayingZikrId(null);
      setIsAudioLoading(false);
  };

  useEffect(() => {
      setTimeout(() => {
          setHiddenAzkarIds([]);
          setSessionProgress({});
          stopAudio();
          setIsLoopMode(audioLoopDefault);
          setIsControllerVisible(false);
          // Reset view to list on category change
          setViewMode('list');
      }, 0);
  }, [category.id, audioLoopDefault]);

  useEffect(() => {
      return () => {
          stopAudio();
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      };
  }, []);

  // -- Scroll to initial ID (Search Jump) --
  useEffect(() => {
      if (initialScrollToId && viewMode === 'list') {
          // Allow time for render
          setTimeout(() => {
              const el = document.getElementById(`zikr-card-${initialScrollToId}`);
              if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  // Optional: Flash effect logic could be added here
                  el.classList.add('ring-2', 'ring-primary-400', 'ring-offset-2');
                  flashTimerRef.current = setTimeout(() => el.classList.remove('ring-2', 'ring-primary-400', 'ring-offset-2'), 2000);
              }
          }, 300);
      } else if (initialScrollToId && viewMode === 'focus') {
          // If in focus mode (future enhancement), logic to set current index would go here
      }
  }, [initialScrollToId, viewMode]);

  // -- Audio Engine Methods --

  const playZikrSequence = async (startZikrId: number) => {
      let currentId = startZikrId;
      setPlayingZikrId(currentId);
      playingZikrIdRef.current = currentId;
      
      setIsControllerVisible(true);
      
      while (currentId) {
          if (playingZikrIdRef.current !== currentId) break;

          const zikr = category.azkar.find(z => z.id === currentId);
          if (!zikr) break;

          let currentSessionCount = sessionProgressRef.current[currentId] || 0;
          
          while (currentSessionCount < zikr.count) {
              if (playingZikrIdRef.current !== currentId) return;

              setIsAudioLoading(true);
              try {
                  const finishedNaturally = await audioService.playZikrAudio(zikr.arabic, voiceName, apiKey);
                  setIsAudioLoading(false);

                  if (!finishedNaturally) {
                      if (playingZikrIdRef.current === currentId) {
                          setPlayingZikrId(null);
                      }
                      return; 
                  }

                  currentSessionCount++;
                  handleUpdateSession(currentId, currentSessionCount);
                  handleGlobalAccumulate(currentId, 1);

                  if (currentSessionCount < zikr.count) {
                      await new Promise(r => setTimeout(r, 500));
                  }
              } catch (error: any) {
                  console.error(error);
                  setIsAudioLoading(false);
                  setPlayingZikrId(null);
                  if (error.message === 'API_KEY_MISSING') {
                      toast.show(t('error_api_key_missing'), { variant: 'error' });
                  } else if (error.message === 'OFFLINE_AND_NOT_CACHED') {
                      toast.show(t('error_audio_offline'), { variant: 'error' });
                  } else {
                      toast.show(t('error_audio_playback'), { variant: 'error' });
                  }
                  return;
              }
          }

          const loop = isLoopModeRef.current;

          if (loop) {
              const currentIndex = category.azkar.findIndex(z => z.id === currentId);
              let nextZikr: Zikr | undefined;
              
              for (let i = currentIndex + 1; i < category.azkar.length; i++) {
                  const candidate = category.azkar[i];
                  const candidateCount = sessionProgressRef.current[candidate.id] || 0;
                  const isHidden = hiddenAzkarIdsRef.current.includes(candidate.id);
                  
                  // In Focus Mode we don't hide items, so just check count
                  // In List Mode we respect hidden items
                  const isValidCandidate = viewMode === 'focus' 
                      ? candidateCount < candidate.count
                      : !isHidden && candidateCount < candidate.count;

                  if (isValidCandidate) {
                      nextZikr = candidate;
                      break;
                  }
              }

              if (nextZikr) {
                  currentId = nextZikr.id;
                  setPlayingZikrId(currentId);
                  playingZikrIdRef.current = currentId;
                  
                  if (viewMode === 'list') {
                      const el = document.getElementById(`zikr-card-${currentId}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }

                  await new Promise(r => setTimeout(r, 1000));
                  continue; 
              } else {
                  setPlayingZikrId(null);
                  break;
              }
          } else {
              setPlayingZikrId(null);
              break;
          }
      }
  };

  const handlePlayRequest = (zikr: Zikr) => {
      playZikrSequence(zikr.id);
  };

  const handleStopRequest = () => {
      stopAudio();
  };

  const handleHideZikr = (id: number) => {
      setHiddenAzkarIds(prev => [...prev, id]);
  };

  const handleUpdateSession = (id: number, count: number) => {
      setSessionProgress(prev => ({...prev, [id]: count}));
  };

  const handleGlobalAccumulate = (id: number, amountToAdd: number) => {
      incrementProgress(id, amountToAdd);
  };

  const handleBack = () => {
      stopAudio();
      const totalReads = (Object.values(sessionProgress) as number[]).reduce((a, b) => a + b, 0);
      
      if (totalReads > 0) {
          navigate('sessionSummary', { 
              readCount: totalReads,
              categoryTitle: category.title,
              totalAvailable: category.azkar.reduce((sum, z) => sum + z.count, 0)
          });
      } else {
          navigate('categories');
      }
  };

  // Completion Check
  useEffect(() => {
      const totalCount = category.azkar.reduce((acc, z) => acc + z.count, 0);
      const currentSessionTotal = (Object.values(sessionProgress) as number[]).reduce((a, b) => a + b, 0);
      
      if (totalCount > 0 && currentSessionTotal >= totalCount) {
          setTimeout(() => { stopAudio(); }, 0);
          const timer = setTimeout(() => {
              navigate('completion', { categoryId: category.id });
          }, 1200); 
          return () => clearTimeout(timer);
      }
  }, [sessionProgress, category.azkar, category.id, navigate]);
  
  const progressPercentage = useMemo(() => {
    const totalRequired = category.azkar.reduce((sum, zikr) => sum + zikr.count, 0);
    if (totalRequired === 0) return 0;
    const totalCompletedInSession = category.azkar.reduce((sum, zikr) => sum + (sessionProgress[zikr.id] || 0), 0);
    return Math.round((totalCompletedInSession / totalRequired) * 100);
  }, [category.azkar, sessionProgress]);

  return (
    <div className="p-4 h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between mb-2 z-20">
        <button onClick={handleBack} aria-label="رجوع" className="p-2 -ml-2 rtl:-mr-2 rtl:ml-0 bg-surface-card/50 dark:bg-black/20 rounded-full backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/40 transition-colors">
          <ArrowLeftIcon className="w-6 h-6 text-gray-900 dark:text-white rtl:rotate-180" />
        </button>
        
        <h1 className="text-xl font-bold text-gray-900 dark:text-white text-center flex-1 truncate px-2">{category.title}</h1>
        
        <div className="flex space-x-2 rtl:space-x-reverse">
            {/* View Toggle */}
            <div className="bg-surface-card-2 dark:bg-midnight-800 rounded-lg p-1 flex items-center">
                <button 
                    onClick={() => setViewMode('list')}
                    aria-label="عرض القائمة"
                    aria-pressed={viewMode === 'list'}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600 dark:text-white' : 'text-gray-400'}`}
                >
                    <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setViewMode('focus')}
                    aria-label="عرض التركيز"
                    aria-pressed={viewMode === 'focus'}
                    className={`p-2 rounded-md transition-all ${viewMode === 'focus' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600 dark:text-white' : 'text-gray-400'}`}
                >
                    <RectangleStackIcon className="w-5 h-5" />
                </button>
            </div>

            <button onClick={() => navigate('settings')} aria-label="الإعدادات" className="p-2 -mr-2 rtl:-ml-2 rtl:mr-0 bg-surface-card/50 dark:bg-black/20 rounded-full backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/40 transition-colors">
                <Cog6ToothIcon className="w-6 h-6 text-gray-900 dark:text-white" />
            </button>
        </div>
      </header>
      
      {/* Progress Bar & Audio Controller Container */}
      <div className="mb-4 z-20 relative">
          <div className="flex items-center space-x-2 rtl:space-x-reverse bg-surface-card p-3 rounded-xl shadow-sm dark:shadow-none border border-gray-100 dark:border-midnight-800">
              <div className="flex-grow">
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>{t('azkar_list_progress')}</span>
                    <span className="font-mono">{progressPercentage}%</span>
                </div>
                <div className="w-full bg-surface-card-2 dark:bg-midnight-800 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
              </div>
              
              <button 
                onClick={() => setIsControllerVisible(!isControllerVisible)}
                aria-label={isControllerVisible ? 'إخفاء وحدة التحكم بالصوت' : 'إظهار وحدة التحكم بالصوت'}
                aria-expanded={isControllerVisible}
                className={`p-2.5 rounded-lg transition-colors ${
                    isControllerVisible 
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                    : 'bg-surface-card-2 dark:bg-midnight-800 text-gray-400 hover:text-gray-600'
                }`}
              >
                {isControllerVisible ? (
                    <ChevronUpIcon className="w-5 h-5" />
                ) : (
                    <PlayIcon className="w-5 h-5" />
                )}
              </button>
          </div>

          <AudioController 
              isVisible={isControllerVisible}
              isPlaying={!!playingZikrId}
              isLoopMode={isLoopMode}
              onToggleLoop={() => setIsLoopMode(!isLoopMode)}
              onStop={stopAudio}
              onClose={() => setIsControllerVisible(false)}
          />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-grow overflow-y-auto overflow-x-hidden pb-10 z-10 scroll-smooth">
          {category.azkar.length > 0 ? (
             viewMode === 'list' ? (
                 // List View
                 category.azkar.map((zikr, index) => {
                     if (hiddenAzkarIds.includes(zikr.id)) return null; 
                     return (
                        <ZikrCard 
                            key={zikr.id} 
                            zikr={zikr} 
                            index={index} 
                            total={category.azkar.length}
                            sessionCount={sessionProgress[zikr.id] || 0}
                            onUpdateSession={handleUpdateSession}
                            onHide={handleHideZikr}
                            isPlaying={playingZikrId === zikr.id}
                            isAudioLoading={playingZikrId === zikr.id && isAudioLoading}
                            onPlayRequest={handlePlayRequest}
                            onStopRequest={handleStopRequest}
                        />
                    );
                 })
             ) : (
                 // Focus Mode
                 <FocusModeView 
                    azkar={category.azkar}
                    sessionProgress={sessionProgress}
                    onUpdateSession={handleUpdateSession}
                    playingZikrId={playingZikrId}
                    isAudioLoading={isAudioLoading}
                    onPlay={handlePlayRequest}
                    onStop={handleStopRequest}
                 />
             )
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                 <div className="bg-surface-card-2 dark:bg-midnight-800 p-6 rounded-full mb-4">
                    <BookOpenIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">لا توجد أذكار</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">{t('azkar_list_empty')}</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default AzkarListScreen;
