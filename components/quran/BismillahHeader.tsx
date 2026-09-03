import React from 'react';

/**
 * Decorative Bismillah header rendered above the first ayah of every surah
 * except Al-Fatiha (where basmala is ayah 1 itself) and At-Tawbah (no bismillah).
 */
const BismillahHeader: React.FC = () => {
    return (
        <div className="flex flex-col items-center my-6 select-none">
            <svg viewBox="0 0 320 36" className="w-full max-w-xs text-primary-500/60 dark:text-primary-400/40" aria-hidden>
                <path d="M2 18 Q40 4 160 18 T318 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="160" cy="18" r="4" fill="currentColor" />
                <circle cx="2" cy="18" r="3" fill="currentColor" />
                <circle cx="318" cy="18" r="3" fill="currentColor" />
            </svg>
            <p className="font-quran text-2xl text-primary-800 dark:text-primary-200 mt-3 leading-relaxed">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
            <svg viewBox="0 0 320 36" className="w-full max-w-xs text-primary-500/60 dark:text-primary-400/40 rotate-180" aria-hidden>
                <path d="M2 18 Q40 4 160 18 T318 18" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="160" cy="18" r="4" fill="currentColor" />
                <circle cx="2" cy="18" r="3" fill="currentColor" />
                <circle cx="318" cy="18" r="3" fill="currentColor" />
            </svg>
        </div>
    );
};

export default BismillahHeader;
