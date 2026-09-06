import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownTrayIcon, TrashIcon, XMarkIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../common/Toast';
import {
    downloadSurah, getCacheStats, clearCache, formatBytes, isCached,
} from '../../services/audioCache';

interface AudioDownloadSheetProps {
    open: boolean;
    reciterId: string;
    reciterName: string;
    /** All ayahs of the surah (in display order) - we need their globalNumber for the CDN. */
    surahAyat: ReadonlyArray<{ globalNumber: number }>;
    onClose: () => void;
}

interface DownloadState {
    active: boolean;
    done: number;
    total: number;
    bytes: number;
    failed: number;
    skipped: number;
}

/**
 * Bottom sheet for managing offline audio cache: download the current surah
 * for the active reciter, see how much space is used, and clear everything.
 *
 * Caching is implicit on first play (the mini player auto-caches every ayah it
 * loads); this sheet exists for power users who want a whole surah pinned
 * for offline recitation before going off-grid.
 */
const AudioDownloadSheet: React.FC<AudioDownloadSheetProps> = ({
    open, reciterId, reciterName, surahAyat, onClose,
}) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [stats, setStats] = useState<{ entries: number; totalBytes: number }>({ entries: 0, totalBytes: 0 });
    const [progress, setProgress] = useState<DownloadState>({ active: false, done: 0, total: 0, bytes: 0, failed: 0, skipped: 0 });
    const [surahCachedCount, setSurahCachedCount] = useState<number>(0);

    const refresh = useCallback(async () => {
        try {
            const [s, cached] = await Promise.all([
                getCacheStats(),
                Promise.all(surahAyat.map(a => isCached(reciterId, a.globalNumber))),
            ]);
            setStats(s);
            setSurahCachedCount(cached.filter(Boolean).length);
        } catch {
            // best-effort; UI just shows last-known values
        }
    }, [reciterId, surahAyat]);

    useEffect(() => {
        if (!open) return;
        refresh();
    }, [open, refresh]);

    const handleDownload = useCallback(async () => {
        if (progress.active) return;
        setProgress({ active: true, done: 0, total: surahAyat.length, bytes: 0, failed: 0, skipped: 0 });
        try {
            const res = await downloadSurah(reciterId, surahAyat, p => {
                setProgress(prev => ({
                    ...prev,
                    done: p.done,
                    bytes: p.bytesSoFar,
                }));
            });
            setProgress({
                active: false,
                done: res.downloaded + res.skipped + res.failed,
                total: surahAyat.length,
                bytes: res.bytes,
                failed: res.failed,
                skipped: res.skipped,
            });
        } finally {
            await refresh();
        }
    }, [progress.active, reciterId, surahAyat, refresh]);

    const handleClear = useCallback(async () => {
        const confirmed = await toast.confirm(t('quran_audio_clear_confirm'));
        if (!confirmed) return;
        await clearCache();
        await refresh();
    }, [refresh, t, toast]);

    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/40 z-40"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={progress.active ? undefined : onClose}
                    />
                    <motion.div
                        className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#12241C] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        <div className="sticky top-0 bg-white dark:bg-[#12241C] px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100">{t('quran_audio_offline_title')}</h3>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                aria-label={t('quran_close')}
                                disabled={progress.active}
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Cache summary */}
                            <section className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-700/30 rounded-2xl p-4">
                                <p className="text-xs text-primary-700 dark:text-primary-300 font-bold mb-1">
                                    {t('quran_audio_cache_size')}
                                </p>
                                <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 font-quran">
                                    {formatBytes(stats.totalBytes)}
                                </p>
                                <p className="text-xs text-primary-700/80 dark:text-primary-300/80 mt-1">
                                    {stats.entries} {t('quran_audio_cached_files')}
                                </p>
                            </section>

                            {/* Per-surah download */}
                            <section>
                                <p className="font-bold text-gray-800 dark:text-gray-100 mb-1">
                                    {t('quran_audio_download_surah')}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                    {reciterName} - {t('quran_audio_surah_cached_prefix')}{' '}{surahCachedCount}/{surahAyat.length}
                                </p>
                                {progress.active && (
                                    <div className="mb-3">
                                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-primary-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: pct + '%' }}
                                                transition={{ duration: 0.25 }}
                                            />
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-center">
                                            {progress.done} / {progress.total} - {formatBytes(progress.bytes)}
                                        </p>
                                    </div>
                                )}
                                {!progress.active && progress.total > 0 && (
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                                        {progress.failed > 0
                                            ? t('quran_audio_download_done_with_errors_prefix') + ' ' + progress.done + ' - ' + t('quran_audio_failed_count') + ' ' + progress.failed + ' (' + formatBytes(progress.bytes) + ')'
                                            : t('quran_audio_download_done_prefix') + ' ' + progress.done + ' (' + formatBytes(progress.bytes) + ')'}
                                    </p>
                                )}
                                <button
                                    onClick={handleDownload}
                                    disabled={progress.active || surahAyat.length === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold py-3 rounded-2xl shadow-md active:scale-95 transition"
                                >
                                    {progress.active ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>{t('quran_audio_downloading')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowDownTrayIcon className="w-5 h-5" />
                                            <span>{t('quran_audio_download_button')}</span>
                                        </>
                                    )}
                                </button>
                            </section>

                            {/* Note + clear */}
                            <section className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                    <CloudArrowDownIcon className="w-4 h-4 inline-block align-middle ml-1" />
                                    {t('quran_audio_autocache_note')}
                                </p>
                                <button
                                    onClick={handleClear}
                                    disabled={progress.active || stats.entries === 0}
                                    className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-40 font-bold py-2.5 rounded-2xl transition"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    <span>{t('quran_audio_clear_cache')}</span>
                                </button>
                            </section>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AudioDownloadSheet;
