
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon, SpeakerWaveIcon, KeyIcon, PlayIcon, StopIcon, CloudArrowDownIcon, ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { audioService } from '../../services/AudioService';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { useToast } from '../common/Toast';
import { useTranslation } from '../../hooks/useTranslation';

const AVAILABLE_VOICES = ['Charon', 'Kore', 'Puck', 'Fenrir', 'Zephyr'];

const AudioSettingsScreen: React.FC = () => {
    const { 
        navigate, 
        apiKey, setApiKey, 
        voiceName, setVoiceName, 
        audioAutoSave, setAudioAutoSave, 
        audioLoopDefault, setAudioLoopDefault 
    } = useAppContext();
    const { t } = useTranslation();
    const toast = useToast();
    
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

    const openApiKeyPortal = async (e: React.MouseEvent) => {
        e.preventDefault();
        const url = 'https://aistudio.google.com/app/apikey';
        if (Capacitor.isNativePlatform()) {
            await Browser.open({ url });
        } else {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    const handleVoicePreview = async (voice: string) => {
        if (previewingVoice === voice) {
            audioService.stop();
            setPreviewingVoice(null);
            return;
        }

        setPreviewingVoice(voice);
        try {
            await audioService.playZikrAudio("اللهم صل على محمد وآل محمد", voice, apiKey);
        } catch (error) {
            console.error(error);
            if ((error as any).message === 'API_KEY_MISSING') {
                toast.show(t('error_api_key_missing'), { variant: 'error' });
            } else if ((error as any).message === 'OFFLINE_AND_NOT_CACHED') {
                toast.show(t('error_audio_offline'), { variant: 'error' });
            } else {
                toast.show(t('error_audio_generic'), { variant: 'error' });
            }
        } finally {
            setPreviewingVoice(null);
        }
    };

    const SettingItem: React.FC<{ icon: React.ElementType, label: string, description?: string, hasToggle?: boolean, isChecked?: boolean, onToggle?: () => void }> = ({ icon: Icon, label, description, hasToggle, isChecked, onToggle }) => {
        const Container = hasToggle ? 'div' : 'button';
        return (
            <Container 
                onClick={hasToggle ? undefined : onToggle} 
                className={`w-full flex items-center justify-between p-4 mb-2 bg-white dark:bg-[#1A3129] rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-[#203c31] shadow-sm dark:shadow-none border border-gray-100 dark:border-none ${hasToggle ? '' : 'cursor-pointer'}`}
            >
                <div className="flex flex-col items-start flex-1 ml-4 rtl:mr-4 rtl:ml-0">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-gray-900 dark:text-white font-medium">{label}</span>
                    </div>
                    {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-10 rtl:mr-0 rtl:ml-10">{description}</p>}
                </div>
                
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {hasToggle ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isChecked} onChange={onToggle} aria-label={label} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:right-[2px] rtl:after:left-auto after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    ) : (
                        <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 rtl:rotate-180" />
                    )}
                </div>
            </Container>
        );
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex items-center mb-6 relative">
                <button onClick={() => navigate('settings')} aria-label="رجوع" className="p-2 -ml-2 rtl:-mr-2 rtl:ml-0 absolute left-0 rtl:right-0 rtl:left-auto">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mx-auto">إعدادات الصوت</h1>
            </header>

            <div className="flex-grow overflow-y-auto pb-4 space-y-6">
                
                {/* General Audio Settings */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">عام</h2>
                    <SettingItem 
                        icon={CloudArrowDownIcon} 
                        label="حفظ الصوت تلقائياً" 
                        description="عند التفعيل، سيتم حفظ الملفات الصوتية على جهازك لتعمل بدون إنترنت لاحقاً."
                        hasToggle 
                        isChecked={audioAutoSave} 
                        onToggle={() => setAudioAutoSave(!audioAutoSave)} 
                    />

                    <SettingItem 
                        icon={ArrowPathIcon} 
                        label="تشغيل تلقائي متتابع" 
                        description="الانتقال التلقائي للذكر التالي عند الانتهاء من قراءة العدد المطلوب."
                        hasToggle 
                        isChecked={audioLoopDefault} 
                        onToggle={() => setAudioLoopDefault(!audioLoopDefault)} 
                    />
                </div>

                {/* Voice Selection */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">الصوت والنبرة</h2>
                    <div className="bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-none shadow-sm dark:shadow-none rounded-lg overflow-hidden">
                        <div className="p-4 flex items-center space-x-4 rtl:space-x-reverse border-b border-gray-100 dark:border-gray-800">
                            <SpeakerWaveIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-gray-900 dark:text-white font-medium">اختر القارئ المفضل</span>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {AVAILABLE_VOICES.map((voice) => (
                                <div 
                                    key={voice} 
                                    onClick={() => setVoiceName(voice)}
                                    className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                                        voiceName === voice 
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20' 
                                        : 'hover:bg-gray-50 dark:hover:bg-[#203c31]'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${voiceName === voice ? 'border-emerald-500' : 'border-gray-400'}`}>
                                            {voiceName === voice && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>}
                                        </div>
                                        <span className={`text-sm ${voiceName === voice ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>{voice}</span>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleVoicePreview(voice); }}
                                        aria-label={previewingVoice === voice ? "إيقاف المعاينة" : "معاينة الصوت"}
                                        className={`p-2 rounded-full transition-colors ${previewingVoice === voice ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'}`}
                                    >
                                        {previewingVoice === voice ? <StopIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* API Key */}
                <div>
                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">الإعدادات المتقدمة</h2>
                    <div className="p-4 bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-none shadow-sm dark:shadow-none rounded-lg">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse mb-3">
                            <KeyIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-gray-900 dark:text-white font-medium">مفتاح Google API</span>
                        </div>
                        <input 
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="أدخل مفتاح الـ API الخاص بك"
                            className="w-full bg-gray-50 dark:bg-[#12241C] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 transition-colors text-sm mb-2"
                            dir="ltr"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            هذه الميزة تتطلب مفتاح API لتوليد الصوت. يمكنك الحصول عليه مجاناً من: {' '}
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                onClick={openApiKeyPortal}
                                className="text-emerald-600 underline cursor-pointer"
                            >
                                aistudio.google.com
                            </a>
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AudioSettingsScreen;
