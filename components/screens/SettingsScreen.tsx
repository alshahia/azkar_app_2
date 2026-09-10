
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon, ChevronRightIcon, MoonIcon, BellIcon, EnvelopeIcon, InformationCircleIcon, SpeakerWaveIcon, SwatchIcon, ArchiveBoxArrowDownIcon, ArrowUpTrayIcon, PaintBrushIcon, FingerPrintIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../common/Toast';
import { HomeLayout, AppTheme } from '../../types';
import { getStorage } from '../../data/storage';
import { previewBackupCounts } from '../../data/backup';
import {
    getCacheStats, getCacheStatsByReciter, removeReciterAudio, clearCache, formatBytes,
    type ReciterCacheStats,
} from '../../services/audioCache';
import { getReciter } from '../../services/reciterCatalog';

const SettingsScreen: React.FC = () => {
    const { navigate, darkMode, toggleDarkMode, fontSize, setFontSize, homeLayout, setHomeLayout, theme, setTheme, hapticsEnabled, toggleHaptics } = useAppContext();
    const { t } = useTranslation();
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getPreviewClass = (size: number) => {
        const sizes = [
            'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'
        ];
        return sizes[size - 1] || 'text-3xl';
    };

    const handleBackup = async () => {
        try {
            const data = await getStorage().exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `azkar_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Backup failed:', error);
            toast.show(t('error_backup_failed'), { variant: 'error' });
        }
    };

    const handleRestoreClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onerror = () => {
            console.error('Restore failed reading backup file');
            toast.show(t('error_restore_failed'), { variant: 'error' });
            e.target.value = '';
        };
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            if (!content) {
                e.target.value = '';
                return;
            }

            let parsed: unknown;
            try {
                parsed = JSON.parse(content);
            } catch {
                toast.show(t('error_restore_failed'), { variant: 'error' });
                e.target.value = '';
                return;
            }

            const counts = previewBackupCounts(parsed);
            if (!counts) {
                toast.show(t('restore_preview_invalid'), { variant: 'error' });
                e.target.value = '';
                return;
            }

            // Build a per-section summary for the user.
            const sections: Array<{ key: string; label: string; n: number }> = [
                { key: 'preferences', label: t('restore_preview_section_preferences'), n: counts.preferences },
                { key: 'progress', label: t('restore_preview_section_progress'), n: counts.progress },
                { key: 'stats', label: t('restore_preview_section_stats'), n: counts.stats },
                { key: 'userQuotes', label: t('restore_preview_section_userQuotes'), n: counts.userQuotes },
                { key: 'userSalawat', label: t('restore_preview_section_userSalawat'), n: counts.userSalawat },
                { key: 'userCategories', label: t('restore_preview_section_userCategories'), n: counts.userCategories },
                { key: 'userAzkar', label: t('restore_preview_section_userAzkar'), n: counts.userAzkar },
                { key: 'hiddenStaticIds', label: t('restore_preview_section_hiddenStaticIds'), n: counts.hiddenStaticIds },
                { key: 'quranBookmarks', label: t('restore_preview_section_quranBookmarks'), n: counts.quranBookmarks },
                { key: 'quranLastRead', label: t('restore_preview_section_quranLastRead'), n: counts.quranLastRead },
            ];
            const summary = sections
                .filter(s => s.n > 0)
                .map(s => s.label + ': ' + s.n)
                .join(' • ');

            const versionLabel = counts.hasEnvelope
                ? t('restore_preview_envelope_label')
                : t('restore_preview_legacy_label');
            const message = t('restore_preview_title')
                + '\n' + versionLabel
                + (summary ? ('\n' + summary) : '');

            const choice = await toast.promptChoice(message, [
                { label: t('restore_preview_choice_merge'), value: 'merge', kind: 'neutral' },
                { label: t('restore_preview_choice_replace'), value: 'replace', kind: 'primary' },
                { label: t('restore_preview_choice_cancel'), value: 'cancel', kind: 'neutral' },
            ]);

            if (choice === 'cancel' || choice === null) {
                e.target.value = '';
                return;
            }

            try {
                const success = await getStorage().importData(content, { mode: choice === 'merge' ? 'merge' : 'replace' });
                if (success) {
                    toast.show(
                        choice === 'merge' ? t('success_restore_merged') : t('success_restore_complete'),
                        { variant: 'success' }
                    );
                    window.location.reload();
                } else {
                    toast.show(t('error_restore_failed'), { variant: 'error' });
                }
            } catch (error) {
                console.error('Restore failed:', error);
                toast.show(t('error_restore_failed'), { variant: 'error' });
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    // M1-T7: per-reciter audio cache overview + reclaim.
    const [reciterStats, setReciterStats] = useState<ReciterCacheStats[]>([]);
    const [audioStats, setAudioStats] = useState<{ entries: number; totalBytes: number }>({ entries: 0, totalBytes: 0 });

    const refreshAudioStats = useCallback(async () => {
        try {
            const [byReciter, totals] = await Promise.all([getCacheStatsByReciter(), getCacheStats()]);
            setReciterStats(byReciter);
            setAudioStats(totals);
        } catch {
            // best-effort; UI keeps last-known values
        }
    }, []);

    useEffect(() => {
        void refreshAudioStats();
    }, [refreshAudioStats]);

    const handleRemoveReciter = async (reciterId: string) => {
        const confirmed = await toast.confirm(t('quran_audio_delete_reciter_confirm'));
        if (!confirmed) return;
        await removeReciterAudio(reciterId);
        await refreshAudioStats();
    };

    const handleClearAudioCache = async () => {
        const confirmed = await toast.confirm(t('quran_audio_clear_confirm'));
        if (!confirmed) return;
        await clearCache();
        await refreshAudioStats();
    };

    const SettingItem: React.FC<{ icon: React.ElementType, label: string, value?: string, hasToggle?: boolean, isChecked?: boolean, onToggle?: () => void, onClick?: () => void }> = ({ icon: Icon, label, value, hasToggle, isChecked, onToggle, onClick }) => {
        const Container = hasToggle ? 'div' : 'button';
        return (
            <Container 
                onClick={hasToggle ? undefined : onClick} 
                className={'w-full flex items-center justify-between p-4 mb-2 bg-white dark:bg-[#1A3129] rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-[#203c31] shadow-sm dark:shadow-none border border-gray-100 dark:border-[#111827]/30 ' + (hasToggle ? '' : 'cursor-pointer')}
            >
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    <span className="text-gray-900 dark:text-white">{label}</span>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {value && <span className="text-gray-500 dark:text-gray-400">{value}</span>}
                    {hasToggle ? (
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isChecked} onChange={onToggle} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:right-[2px] rtl:after:left-auto after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
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
                <button onClick={() => navigate('home')} aria-label="رجوع" className="p-2 -ml-2 rtl:-mr-2 rtl:ml-0 absolute left-0 rtl:right-0 rtl:left-auto">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mx-auto">{t('settings_title')}</h1>
            </header>
            
            <div className="flex-grow overflow-y-auto pb-4">
                
                <h2 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2">{t('settings_preferences')}</h2>
                <SettingItem icon={MoonIcon} label={t('settings_dark_mode')} hasToggle isChecked={darkMode} onToggle={toggleDarkMode} />
                <SettingItem icon={FingerPrintIcon} label="الاهتزاز (Haptics)" hasToggle isChecked={hapticsEnabled} onToggle={toggleHaptics} />
                <SettingItem icon={BellIcon} label="تخصيص الإشعارات" onClick={() => navigate('notificationSettings')} />
                <SettingItem icon={SpeakerWaveIcon} label="إعدادات الصوت" onClick={() => navigate('audioSettings')} />
                
                <div className="p-4 mb-2 bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-[#111827]/30 shadow-sm dark:shadow-none rounded-lg">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse mb-3">
                        <PaintBrushIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        <span className="text-gray-900 dark:text-white font-medium">لون التطبيق</span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {(['emerald', 'blue', 'rose', 'amber', 'purple', 'cyan'] as AppTheme[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTheme(t)}
                                aria-label={`لون ${t}`}
                                className={`h-12 rounded-xl border-2 transition-all flex items-center justify-center ${theme === t ? 'border-primary-500 scale-105 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'}`}
                                style={{ 
                                    backgroundColor: 
                                        t === 'emerald' ? '#10b981' : 
                                        t === 'blue' ? '#3b82f6' :
                                        t === 'rose' ? '#f43f5e' : 
                                        t === 'amber' ? '#f59e0b' :
                                        t === 'purple' ? '#a855f7' : '#06b6d4'
                                }}
                            >
                                {theme === t && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 mb-2 bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-[#111827]/30 shadow-sm dark:shadow-none rounded-lg">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse mb-3">
                        <SwatchIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        <span className="text-gray-900 dark:text-white font-medium">{t('settings_layout_title')}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                        الوضع الموصى به للقراءة اليومية هو <span className="font-bold text-primary-600 dark:text-primary-400">التركيز</span> — ذكر واحد مع ثلاث خطوات. أما <span className="font-bold">اللوحة</span> فتضم أذكاراً أكثر وتناسب الاستكشاف.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {(['dashboard', 'stream', 'focus', 'simple'] as HomeLayout[]).map(layout => (
                            <button
                                key={layout}
                                onClick={() => setHomeLayout(layout)}
                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                    homeLayout === layout 
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' 
                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                                }`}
                            >
                                {
                                    layout === 'dashboard' ? t('home_layout_dashboard') :
                                    layout === 'stream' ? t('home_layout_stream') :
                                    layout === 'focus' ? t('home_layout_focus') :
                                    t('home_layout_simple')
                                }
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 mb-2 bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-[#111827]/30 shadow-sm dark:shadow-none rounded-lg">
                    <span className="text-gray-900 dark:text-white font-medium mb-4 block">{t('settings_font_size')}</span>
                    <div className="h-20 bg-gray-50 dark:bg-[#12241C] rounded-lg flex items-center justify-center p-2 mb-4 overflow-hidden">
                        <p className={`${getPreviewClass(fontSize)} text-gray-900 dark:text-white font-serif text-center transition-all duration-200`}>
                            سُبْحَانَ اللَّهِ
                        </p>
                    </div>
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <span className="text-lg font-medium text-gray-400">A</span>
                        <input 
                            type="range" 
                            min="1" 
                            max="8" 
                            step="1"
                            value={fontSize} 
                            onChange={(e) => setFontSize(parseInt(e.target.value))} 
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500" 
                        />
                        <span className="text-2xl font-medium text-gray-900 dark:text-white">A</span>
                    </div>
                </div>

                <h2 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mt-6 mb-2">إدارة البيانات</h2>
                <SettingItem icon={ArchiveBoxArrowDownIcon} label="نسخ احتياطي للبيانات" onClick={handleBackup} />
                <SettingItem icon={ArrowUpTrayIcon} label="استعادة البيانات" onClick={handleRestoreClick} />
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".json" 
                    className="hidden" 
                />

                <h2 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mt-6 mb-2">{t('quran_audio_storage_title')}</h2>
                <div className="p-4 mb-2 bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-[#111827]/30 shadow-sm dark:shadow-none rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            <SpeakerWaveIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            <span className="text-gray-900 dark:text-white font-medium">{t('quran_audio_cache_size')}</span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatBytes(audioStats.totalBytes)} • {audioStats.entries} {t('quran_audio_cached_files')}
                        </span>
                    </div>
                    {reciterStats.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            {t('quran_audio_autocache_note')}
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {reciterStats.map(row => {
                                const reciter = getReciter(row.reciterId);
                                return (
                                    <li key={row.reciterId} className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-[#12241C] rounded-xl px-3 py-2">
                                        <div className="min-w-0 text-right rtl:text-right">
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                                                {reciter?.name ?? row.reciterId}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                {row.entries} {t('quran_audio_cached_files')} • {formatBytes(row.bytes)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveReciter(row.reciterId)}
                                            className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                            aria-label={t('quran_audio_delete_reciter')}
                                            title={t('quran_audio_delete_reciter')}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    {reciterStats.length > 0 && (
                        <button
                            onClick={handleClearAudioCache}
                            className="w-full mt-3 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 font-bold py-2.5 rounded-2xl transition"
                        >
                            <TrashIcon className="w-4 h-4" />
                            <span>{t('quran_audio_clear_cache')}</span>
                        </button>
                    )}
                </div>

                <h2 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mt-6 mb-2">{t('settings_support')}</h2>
                <SettingItem icon={EnvelopeIcon} label={t('settings_contact_us_report_bug')} onClick={() => navigate('reportBug')} />
                <SettingItem icon={InformationCircleIcon} label={t('settings_about_us')} onClick={() => navigate('aboutUs')} />
                
                <div className="mt-8 text-center text-gray-400 text-xs pb-8">
                    <p>{t('settings_footer')}</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsScreen;
