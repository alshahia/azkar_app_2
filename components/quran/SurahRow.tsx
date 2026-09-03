import React from 'react';
import OrnamentNumber from './OrnamentNumber';
import { SurahMeta } from '../../services/QuranService';

interface SurahRowProps {
    surah: SurahMeta;
    onOpen: () => void;
    bookmarkCount?: number;
}

/**
 * One row of the surah index list. Designed to be read at a glance even in
 * dense lists: large ornamental number, Arabic name, transliteration + meaning,
 * and a small chip strip (revelation type, ayah count).
 */
const SurahRow: React.FC<SurahRowProps> = ({ surah, onOpen, bookmarkCount = 0 }) => {
    return (
        <button
            onClick={onOpen}
            className="w-full flex items-center gap-4 p-3 rounded-2xl bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-primary-500/10 hover:border-primary-300 dark:hover:border-primary-500/30 active:scale-[0.98] transition-all shadow-sm text-right rtl:text-right"
        >
            <OrnamentNumber number={surah.id} />
            <div className="flex-1 min-w-0">
                <p className="font-quran text-xl text-gray-900 dark:text-gray-100 truncate">
                    {surah.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    <span className="font-medium">{surah.transliteration}</span>
                    <span className="mx-1.5 opacity-50">·</span>
                    <span>{surah.meaning}</span>
                </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${surah.revelation === 'مكية' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' }`}>
                    {surah.revelation}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                    {surah.ayahCount} آية
                </span>
                {bookmarkCount > 0 && (
                    <span className="text-[10px] text-primary-600 dark:text-primary-400 font-bold">
                        ★ {bookmarkCount}
                    </span>
                )}
            </div>
        </button>
    );
};

export default SurahRow;
