import React from 'react';

interface OrnamentNumberProps {
    number: number;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Decorative surah badge inspired by the rosette markers used in printed
 * Mushafs. Keeps the Arabic-Indic numeral inside a thin circular border so the
 * item reads as an ornament rather than a plain list bullet.
 */
const OrnamentNumber: React.FC<OrnamentNumberProps> = ({ number, size = 'md', className = '' }) => {
    const sizeMap = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-14 h-14 text-2xl',
    } as const;
    const arabic = number.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
    return (
        <div className={`relative flex items-center justify-center ${sizeMap[size]} ${className}`}>
            <svg viewBox="0 0 48 48" className="absolute inset-0 w-full h-full text-primary-500/70 dark:text-primary-400/70" aria-hidden>
                <path
                    d="M24 1 L34.7 4.6 L44.4 12.5 L46.7 24 L44.4 35.5 L34.7 43.4 L24 47 L13.3 43.4 L3.6 35.5 L1.3 24 L3.6 12.5 L13.3 4.6 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
                <path
                    d="M24 5 L32.6 8 L41 14.5 L43 24 L41 33.5 L32.6 40 L24 43 L15.4 40 L7 33.5 L5 24 L7 14.5 L15.4 8 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.8"
                    opacity="0.5"
                />
            </svg>
            <span className="relative font-bold text-primary-700 dark:text-primary-300 tabular-nums">{arabic}</span>
        </div>
    );
};

export default OrnamentNumber;
