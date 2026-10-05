import React from 'react';
import { JUZ_STARTS, getSurah } from '../../services/QuranService';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { useTranslation } from '../../hooks/useTranslation';

/**
 * Horizontal strip of 30 juz shortcuts. Tapping opens the start of the juz.
 * Navigation goes straight through the navigation store - the component
 * owns the destination, so it takes no props.
 */
const JuzChips: React.FC = () => {
    const navigate = useNavigationStore((state) => state.navigate);
    const { t } = useTranslation();

    return (
        <div>
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{t('quran_juz_title') || 'الأجزاء'}</h3>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">30</span>
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                {JUZ_STARTS.map(j => {
                    const s = getSurah(j.surah);
                    const label = s ? s.transliteration : String(j.surah);
                    return (
                        <button
                            key={j.juz}
                            onClick={() => navigate('surahReader', { surahId: j.surah, ayah: j.ayah })}
                            className="flex-shrink-0 w-14 h-14 rounded-2xl bg-surface-card dark:bg-surface-card border border-gray-100 dark:border-primary-500/10 hover:border-primary-300 dark:hover:border-primary-500/40 active:scale-95 transition-all flex flex-col items-center justify-center shadow-sm dark:shadow-none"
                            aria-label={'الجزء ' + j.juz + ' - ' + label}
                        >
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">جزء</span>
                            <span className="font-bold text-primary-700 dark:text-primary-300 tabular-nums">{j.juz}</span>
                            <span className="text-[9px] text-gray-500 dark:text-gray-400 truncate max-w-[3.5rem]">{label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default JuzChips;
