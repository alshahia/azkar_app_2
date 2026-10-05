import React from 'react';

export function LoadingFallback() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-surface dark:bg-surface">
      <div className="animate-pulse flex flex-col items-center">
        <svg 
          viewBox="0 0 512 512" 
          className="w-24 h-24 mb-6 text-primary-600 dark:text-primary-400 drop-shadow-xl transition-colors duration-300"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g transform="translate(256 256)">
            <rect x="-120" y="-120" width="240" height="240" rx="40" transform="rotate(45)" className="fill-primary-100 dark:fill-[rgb(var(--surface)_/_0.6)] opacity-80" />
            <rect x="-100" y="-100" width="200" height="200" rx="30" className="stroke-primary-200 dark:stroke-primary-800" strokeWidth="4" fill="none" transform="rotate(45)" />
          </g>
          <g className="fill-current" filter="url(#logo-glow)">
            <path d="M 286 190 C 286 190, 210 220, 210 290 C 210 360, 286 390, 286 390 C 260 390, 180 360, 180 290 C 180 220, 260 190, 286 190 Z" />
            <polygon points="320,240 326,258 345,258 330,270 336,288 320,278 304,288 310,270 295,258 314,258" />
          </g>
        </svg>
        <span className="text-primary-800 dark:text-primary-200 font-bold font-serif text-2xl tracking-widest">أذكار</span>
      </div>
    </div>
  );
}
