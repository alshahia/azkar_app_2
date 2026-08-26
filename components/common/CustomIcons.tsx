
import React from 'react';

interface IconProps {
    className?: string;
}

// Helper for default classes
const defaultClasses = "w-full h-full object-contain";

export const GeneralIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 512 512" className={className || defaultClasses} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="ng-gen" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
                <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.3  0 0 0 0 1  0 0 0 0 0.6  0 0 0 1 0" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Background */}
        <rect width="512" height="512" className="fill-primary-50 dark:fill-[#08100d] transition-colors duration-300"/>
        
        <g transform="translate(256, 256)">
            {/* Decorative Shapes */}
            <rect x="-200" y="-200" width="400" height="400" rx="40" transform="rotate(45)" className="fill-primary-100 dark:fill-[#0f221b] opacity-60 transition-colors duration-300"/>
            <rect x="-180" y="-180" width="360" height="360" rx="60" className="fill-white dark:fill-[#13261e] stroke-primary-200 dark:stroke-[#1f3d30] transition-colors duration-300" strokeWidth="2"/>
        </g>

        {/* Main Content */}
        <g className="stroke-primary-600 dark:stroke-primary-400 dark:filter-[url(#ng-gen)] transition-all duration-300" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round">
            
            {/* Crescent Moon */}
            <path d="M 230 140 A 40 40 0 1 1 265 205 A 32 32 0 1 0 230 140 Z" className="fill-primary-500 dark:fill-primary-400 stroke-none transition-colors duration-300"/>
            
            {/* Star */}
            <polygon points="275,145 280,158 294,158 283,167 287,180 275,172 263,180 267,167 256,158 270,158" className="fill-primary-500 dark:fill-primary-400 stroke-none transition-colors duration-300"/>

            <g transform="translate(0, 10)">
                <path d="M 160 330 Q 256 360 352 330 L 340 390 Q 256 420 172 390 Z" strokeWidth="5"/>
                <path d="M 256 360 L 256 420" strokeWidth="3"/>
                <path d="M 175 345 Q 210 355 245 355" strokeWidth="2"/>
                <path d="M 172 355 Q 210 365 245 365" strokeWidth="2"/>
                <path d="M 169 365 Q 210 375 245 375" strokeWidth="2"/>
                <path d="M 166 375 Q 210 385 245 385" strokeWidth="2"/>
                <path d="M 337 345 Q 302 355 267 355" strokeWidth="2"/>
                <path d="M 340 355 Q 302 365 267 365" strokeWidth="2"/>
                <path d="M 343 365 Q 302 375 267 375" strokeWidth="2"/>
                <path d="M 346 375 Q 302 385 267 385" strokeWidth="2"/>
            </g>
            <path d="M 250 360 C 250 360 240 300 245 270 C 246 250 230 250 230 270 L 225 300 M 230 270 C 230 270 225 230 210 230 C 200 230 200 250 205 280 M 210 230 C 210 230 190 200 175 210 C 165 220 175 250 185 280 M 175 210 C 175 210 155 200 145 220 C 140 230 150 260 165 300 C 175 330 200 350 200 350"/>
            <path d="M 262 360 C 262 360 272 300 267 270 C 266 250 282 250 282 270 L 287 300 M 282 270 C 282 270 287 230 302 230 C 312 230 312 250 307 280 M 302 230 C 302 230 322 200 337 210 C 347 220 337 250 327 280 M 337 210 C 337 210 357 200 367 220 C 372 230 362 260 347 300 C 337 330 312 350 312 350"/>
            
            <g stroke="none" className="fill-primary-500 dark:fill-primary-400 transition-colors duration-300">
                <circle cx="310" cy="240" r="4"/>
                <circle cx="320" cy="235" r="4"/>
                <circle cx="330" cy="238" r="4"/>
                <circle cx="340" cy="245" r="4"/>
                <circle cx="348" cy="255" r="4"/>
                <circle cx="355" cy="268" r="4"/>
                <circle cx="360" cy="282" r="4"/>
                <circle cx="362" cy="296" r="4"/>
                <circle cx="360" cy="310" r="4"/>
                <circle cx="355" cy="322" r="4"/>
                <circle cx="348" cy="332" r="4"/>
                <circle cx="338" cy="340" r="4"/>
                <circle cx="328" cy="345" r="4"/>
                <circle cx="318" cy="348" r="4"/>
                <circle cx="308" cy="345" r="4"/>
                <circle cx="300" cy="338" r="4"/>
                <circle cx="295" cy="328" r="4"/>
                <circle cx="292" cy="318" r="4"/>
                <circle cx="290" cy="308" r="4"/>
                {/* Tassel lines */}
                <path d="M 300 338 L 295 360 L 285 370 L 305 370 L 295 360" className="stroke-primary-600 dark:stroke-primary-400 fill-none transition-colors duration-300" strokeWidth="2"/>
                <line x1="295" y1="360" x2="290" y2="375" className="stroke-primary-600 dark:stroke-primary-400 transition-colors duration-300" strokeWidth="1.5"/>
                <line x1="295" y1="360" x2="295" y2="378" className="stroke-primary-600 dark:stroke-primary-400 transition-colors duration-300" strokeWidth="1.5"/>
                <line x1="295" y1="360" x2="300" y2="375" className="stroke-primary-600 dark:stroke-primary-400 transition-colors duration-300" strokeWidth="1.5"/>
            </g>
        </g>
    </svg>
);

export const MosqueIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 512 512" className={className || defaultClasses} xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(256, 256) scale(-1, 1) translate(-256, -256)">
            <defs>
                <filter id="ng-mos" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
                    <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.4  0 0 0 0 1  0 0 0 0 0.6  0 0 0 1 0" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            <rect x="106" y="106" width="300" height="300" rx="40" transform="rotate(45 256 256)" className="fill-primary-100 dark:fill-[#101f1a] opacity-60 transition-colors duration-300"/>
            <rect x="86" y="86" width="340" height="340" rx="60" className="fill-white dark:fill-[#15221d] stroke-primary-200 dark:stroke-[#1f3a2f] transition-colors duration-300" strokeWidth="4"/>
            <g className="stroke-primary-600 dark:stroke-primary-400 dark:filter-[url(#ng-mos)] transition-all duration-300" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <line x1="140" y1="390" x2="372" y2="390"/>
                <rect x="196" y="310" width="120" height="80"/>
                <path d="M208 390 V 355 A 15 15 0 0 1 238 355 V 390"/>
                <path d="M244 390 V 350 A 18 18 0 0 1 280 350 V 390"/>
                <path d="M286 390 V 355 A 15 15 0 0 1 316 355 V 390"/>
                <line x1="210" y1="310" x2="302" y2="310" strokeWidth="6"/>
                <path d="M210 310 C 200 270, 220 230, 256 215 C 292 230, 312 270, 302 310"/>
                <line x1="256" y1="215" x2="256" y2="195"/>
                <path d="M256 195 A 28 28 0 1 1 235 155 A 22 22 0 1 0 256 195 Z" fill="none"/>
                <polygon points="272,158 275,165 282,165 277,170 279,177 272,173 265,177 267,170 262,165 269,165" className="fill-primary-500 dark:fill-primary-400 stroke-none transition-colors duration-300"/>
                <g>
                    <path d="M152 390 L 152 300"/>
                    <path d="M180 390 L 180 300"/>
                    <path d="M148 300 H 184 L 188 285 H 144 L 148 300 Z"/>
                    <path d="M156 285 V 220"/>
                    <path d="M176 285 V 220"/>
                    <path d="M160 250 A 6 6 0 0 1 172 250 V 260 H 160 Z" strokeWidth="5"/>
                    <path d="M154 220 C 150 205, 155 190, 166 185 C 177 190, 182 205, 178 220 Z"/>
                    <line x1="166" y1="185" x2="166" y2="175"/>
                </g>
                <g transform="translate(180, 0)">
                    <path d="M152 390 L 152 300"/>
                    <path d="M180 390 L 180 300"/>
                    <path d="M148 300 H 184 L 188 285 H 144 L 148 300 Z"/>
                    <path d="M156 285 V 220"/>
                    <path d="M176 285 V 220"/>
                    <path d="M160 250 A 6 6 0 0 1 172 250 V 260 H 160 Z" strokeWidth="5"/>
                    <path d="M154 220 C 150 205, 155 190, 166 185 C 177 190, 182 205, 178 220 Z"/>
                    <line x1="166" y1="185" x2="166" y2="175"/>
                </g>
            </g>
        </g>
    </svg>
);

export const MorningIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 512 512" className={className || defaultClasses} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="ng-mor" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        {/* Background - Gradient in Dark Mode, Solid in Light */}
        <rect x="40" y="40" width="432" height="432" rx="80" className="fill-orange-50 dark:fill-[#1a2a20] transition-colors duration-300"/>
        
        <g className="stroke-orange-500 dark:stroke-orange-400 dark:filter-[url(#ng-mor)] transition-all duration-300" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <g id="sun-rays">
                <line x1="256" y1="120" x2="256" y2="145"/>
                <line x1="210" y1="130" x2="222" y2="152"/>
                <line x1="170" y1="155" x2="192" y2="170"/>
                <line x1="145" y1="195" x2="170" y2="195"/>
                <line x1="302" y1="130" x2="290" y2="152"/>
                <line x1="342" y1="155" x2="320" y2="170"/>
                <line x1="367" y1="195" x2="342" y2="195"/>
            </g>
            <path d="M 196 210 A 60 60 0 0 1 316 210"/>
            <rect x="156" y="210" width="200" height="170"/>
            <line x1="256" y1="210" x2="256" y2="380"/>
            <line x1="156" y1="295" x2="356" y2="295"/>
            <line x1="180" y1="260" x2="205" y2="235"/>
            <line x1="195" y1="265" x2="210" y2="250"/>
            <line x1="307" y1="235" x2="332" y2="260"/>
            <line x1="302" y1="250" x2="317" y2="265"/>
            <g className="fill-orange-800 dark:fill-[#0f1812] transition-colors duration-300">
                <path d="M 256 380 Q 256 380 256 410 Q 190 390 146 365 L 136 315 Q 190 350 256 350 Q 322 350 376 315 L 366 365 Q 322 390 256 410 Z"/>
            </g>
            <path d="M 146 365 L 156 325 Q 200 360 256 360 Q 312 360 356 325 L 366 365"/>
            <path d="M 256 350 L 256 410"/>
            <path d="M 170 335 Q 200 350 240 350" strokeWidth="5"/>
            <path d="M 165 345 Q 200 360 240 360" strokeWidth="5"/>
            <path d="M 160 355 Q 200 370 240 370" strokeWidth="5"/>
            <path d="M 155 365 Q 200 380 240 380" strokeWidth="5"/>
            <path d="M 342 335 Q 312 350 272 350" strokeWidth="5"/>
            <path d="M 347 345 Q 312 360 272 360" strokeWidth="5"/>
            <path d="M 352 355 Q 312 370 272 370" strokeWidth="5"/>
            <path d="M 357 365 Q 312 380 272 380" strokeWidth="5"/>
        </g>
    </svg>
);

export const EveningIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 512 512" className={className || defaultClasses} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="ng-eve" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <path id="star" d="M0,-10 L2.3,-3.1 L9.5,-3.1 L3.7,1.1 L5.9,8.1 L0,3.8 L-5.9,8.1 L-3.7,1.1 L-9.5,-3.1 L-2.3,-3.1 Z"/>
        </defs>
        <rect width="512" height="512" rx="80" className="fill-indigo-50 dark:fill-[#0f1a15] transition-colors duration-300"/>
        
        <g className="stroke-indigo-600 dark:stroke-[#6affaa] dark:filter-[url(#ng-eve)] transition-all duration-300" fill="none" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
            <path d="M190,120 A45,45 0 1,1 175,200 A35,35 0 1,0 190,120 Z" className="fill-indigo-500 dark:fill-[#6affaa] stroke-none transition-colors duration-300" transform="translate(10, 10)"/>
            <g className="fill-indigo-500 dark:fill-[#6affaa] stroke-none transition-colors duration-300">
                <use href="#star" transform="translate(215, 150) scale(1.8)"/>
                <use href="#star" transform="translate(295, 130) scale(1.2)"/>
                <use href="#star" transform="translate(355, 150) scale(1.4)"/>
                <use href="#star" transform="translate(315, 180) scale(1.6)"/>
                <use href="#star" transform="translate(360, 205) scale(1.0)"/>
                <use href="#star" transform="translate(270, 155) scale(0.8)"/>
                <use href="#star" transform="translate(155, 225) scale(0.9)"/>
            </g>
            <path d="M160,270 L256,195 L352,270"/>
            <path d="M160,270 L170,280" strokeWidth="8"/>
            <path d="M352,270 L342,280" strokeWidth="8"/>
            <path d="M300,230 L300,210 L325,210 L325,250"/>
            <rect x="236" y="265" width="40" height="45" rx="4"/>
            <g transform="translate(0, 10)">
                <path d="M256,325 L170,285 L140,355 L256,395"/>
                <path d="M256,325 L342,285 L372,355 L256,395"/>
                <path d="M140,355 L140,365 L256,405 L372,365 L372,355"/>
                <path d="M256,325 L256,395" strokeWidth="6"/>
                <path d="M256,395 L256,405" strokeWidth="6"/>
                <g strokeWidth="5">
                    <path d="M240,335 L175,305"/>
                    <path d="M240,350 L170,318"/>
                    <path d="M240,365 L165,331"/>
                    <path d="M240,380 L160,344"/>
                </g>
                <g strokeWidth="5">
                    <path d="M272,335 L337,305"/>
                    <path d="M272,350 L342,318"/>
                    <path d="M272,365 L347,331"/>
                    <path d="M272,380 L352,344"/>
                </g>
            </g>
        </g>
    </svg>
);

export const WuduIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 512 512" className={className || defaultClasses} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="ng-wud" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Background */}
        <rect width="512" height="512" className="fill-primary-50 dark:fill-[#05100c] transition-colors duration-300"/>
        <g transform="translate(256 256) rotate(45)">
            <rect x="-180" y="-180" width="360" height="360" rx="40" className="fill-primary-100 dark:fill-[#132b21] opacity-50 transition-colors duration-300"/>
        </g>
        <rect x="86" y="86" width="340" height="340" rx="60" className="fill-white dark:fill-[#162e24] stroke-primary-200 dark:stroke-[#1f4032] transition-colors duration-300" strokeWidth="2"/>
        
        <g className="stroke-primary-600 dark:stroke-[#5affb0] dark:filter-[url(#ng-wud)] transition-all duration-300" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M340 125 C340 125 330 115 345 115 C360 115 350 125 350 125 L355 130 C375 135 385 150 385 170 C385 195 365 210 345 205 C325 200 320 180 310 165 L305 160 C315 140 335 135 355 130"/>
            <path d="M385 155 C410 145 420 170 415 185 C410 200 395 200 380 195"/>
            <path d="M350 170 C365 175 380 170 385 165" strokeWidth="3" opacity="0.8"/>
            <path d="M305 160 C290 160 295 200 290 230"/>
            <path d="M310 165 C300 180 305 210 300 250"/>
            <path d="M170 230 C210 250 240 230 260 230 C280 230 300 240 320 250 C330 255 330 265 320 270"/>
            <path d="M140 265 C180 265 220 250 250 270 C270 285 290 285 300 280 C315 275 335 285 325 300 C315 315 280 330 250 330 C200 330 180 315 145 315"/>
            <path d="M220 260 C230 250 250 250 270 260" strokeWidth="4"/>
            <path d="M280 285 C290 290 310 290 320 285" strokeWidth="4"/>
            <path d="M260 250 C270 245 280 255 290 250" strokeWidth="3"/>
            <path d="M250 260 C260 255 270 265 280 260" strokeWidth="3"/>
            <path d="M250 330 C250 350 245 360 245 370 C245 378 255 378 255 370 C255 360 260 350 265 330"/>
            <circle cx="250" cy="390" r="3" className="fill-primary-500 dark:fill-[#5affb0] stroke-none transition-colors duration-300"/>
            <path d="M275 330 C275 360 270 380 270 400 C270 410 280 410 280 400 C280 380 285 350 290 330"/>
            <path d="M305 325 C305 340 310 350 310 360 C310 368 320 368 320 360 C320 350 315 330 315 320"/>
            <circle cx="315" cy="380" r="3" className="fill-primary-500 dark:fill-[#5affb0] stroke-none transition-colors duration-300"/>
        </g>
    </svg>
);

export const FoodIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 512 512" className={className || defaultClasses} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="ng-food" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
                <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 18 -7" result="goo"/>
                <feComposite in="SourceGraphic" in2="goo" operator="over"/>
            </filter>
        </defs>
        <rect width="512" height="512" className="fill-primary-50 dark:fill-[#050a07] transition-colors duration-300"/>
        <rect x="106" y="106" width="300" height="300" rx="40" transform="rotate(45 256 256)" className="fill-primary-100 dark:fill-[#0f2418] opacity-60 transition-colors duration-300"/>
        <rect x="64" y="64" width="384" height="384" rx="60" className="fill-white dark:fill-[#1a2e22] stroke-primary-200 dark:stroke-[#1f3d2e] transition-colors duration-300" strokeWidth="2"/>
        
        <g className="stroke-primary-600 dark:stroke-[#4fffa0] dark:filter-[url(#ng-food)] transition-all duration-300" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g transform="translate(280, 110)">
                <ellipse cx="45" cy="15" rx="45" ry="12"/>
                <path d="M 0 15 L 10 110 Q 15 135 45 135 Q 75 135 80 110 L 90 15"/>
                <path d="M 8 50 Q 45 70 82 50"/>
                <path d="M 75 60 L 72 100" strokeWidth="3" opacity="0.6" strokeLinecap="round"/>
                <path d="M 15 60 L 18 90" strokeWidth="3" opacity="0.6" strokeLinecap="round"/>
            </g>
            <g transform="translate(130, 160)">
                <path d="M 0 30 Q 0 85 68 85 Q 136 85 136 30"/>
                <path d="M 0 30 Q 68 60 136 30"/>
                <path d="M 35 88 Q 68 100 101 88"/>
                <path d="M 15 25 Q 10 10 30 5 Q 50 0 60 15 Q 65 30 45 35 Q 25 40 15 25 Z"/>
                <path d="M 25 15 Q 35 12 45 20" strokeWidth="3" opacity="0.7"/>
                <path d="M 50 15 Q 55 -5 80 0 Q 105 5 100 25 Q 95 40 70 35 Q 45 30 50 15 Z"/>
                <path d="M 65 10 Q 75 10 85 20" strokeWidth="3" opacity="0.7"/>
                <path d="M 85 35 Q 90 20 110 25 Q 130 30 125 45 Q 120 60 100 55 Q 80 50 85 35 Z"/>
                <path d="M 95 35 Q 105 35 115 40" strokeWidth="3" opacity="0.7"/>
            </g>
            <g transform="translate(225, 245) rotate(10)">
                <path d="M 5 15 Q 0 0 25 -5 Q 50 -10 55 5 Q 60 20 35 25 Q 10 30 5 15 Z"/>
                <path d="M 15 10 Q 28 8 40 15" strokeWidth="3" opacity="0.7"/>
            </g>
        </g>
    </svg>
);

export const TasbeehIcon: React.FC<IconProps> = ({ className }) => (
    <svg viewBox="0 0 512 512" className={className || defaultClasses} xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="ng-tas" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
                <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.3  0 0 0 0 1  0 0 0 0 0.6  0 0 0 1 0" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
            <symbol id="bead" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="7" fill="none" className="stroke-primary-600 dark:stroke-[#5dfc96] transition-colors duration-300" strokeWidth="2.5"/>
            </symbol>
        </defs>
        
        {/* Background */}
        <rect x="106" y="106" width="300" height="300" rx="40" transform="rotate(45 256 256)" className="fill-primary-50 dark:fill-[#0b1d16] transition-colors duration-300"/>
        <rect x="116" y="116" width="280" height="280" rx="50" className="fill-white dark:fill-[#152e24] transition-colors duration-300"/>
        
        <g className="dark:filter-[url(#ng-tas)]">
            <use href="#bead" x="246" y="365" width="20" height="20"/>
            <use href="#bead" x="263" y="360" width="20" height="20"/>
            <use href="#bead" x="280" y="350" width="20" height="20"/>
            <use href="#bead" x="295" y="336" width="20" height="20"/>
            <use href="#bead" x="308" y="319" width="20" height="20"/>
            <use href="#bead" x="316" y="300" width="20" height="20"/>
            <use href="#bead" x="320" y="280" width="20" height="20"/>
            <use href="#bead" x="318" y="260" width="20" height="20"/>
            <use href="#bead" x="310" y="241" width="20" height="20"/>
            <use href="#bead" x="298" y="224" width="20" height="20"/>
            <use href="#bead" x="282" y="210" width="20" height="20"/>
            <use href="#bead" x="264" y="202" width="20" height="20"/>
            <use href="#bead" x="246" y="200" width="20" height="20"/>
            <use href="#bead" x="228" y="202" width="20" height="20"/>
            <use href="#bead" x="210" y="210" width="20" height="20"/>
            <use href="#bead" x="194" y="224" width="20" height="20"/>
            <use href="#bead" x="182" y="241" width="20" height="20"/>
            <use href="#bead" x="174" y="260" width="20" height="20"/>
            <use href="#bead" x="172" y="280" width="20" height="20"/>
            <use href="#bead" x="176" y="300" width="20" height="20"/>
            <use href="#bead" x="184" y="319" width="20" height="20"/>
            <use href="#bead" x="197" y="336" width="20" height="20"/>
            <use href="#bead" x="212" y="350" width="20" height="20"/>
            <use href="#bead" x="229" y="360" width="20" height="20"/>
            
            <path d="M256 385 L256 405" className="stroke-primary-600 dark:stroke-[#5dfc96] transition-colors duration-300" strokeWidth="2.5" strokeLinecap="round"/>
            <ellipse cx="256" cy="395" rx="6" ry="9" fill="none" className="stroke-primary-600 dark:stroke-[#5dfc96] transition-colors duration-300" strokeWidth="2.5"/>
            <circle cx="256" cy="382" r="4" className="fill-primary-500 dark:fill-[#5dfc96] transition-colors duration-300"/>
            
            <g transform="translate(256, 410)">
                <circle cx="0" cy="0" r="3" fill="none" className="stroke-primary-600 dark:stroke-[#5dfc96] transition-colors duration-300" strokeWidth="2"/>
                <path d="M0 3 Q -5 10 -8 20" fill="none" className="stroke-primary-600 dark:stroke-[#5dfc96] transition-colors duration-300" strokeWidth="2" strokeLinecap="round"/>
                <path d="M0 3 Q 0 12 0 22" fill="none" className="stroke-primary-600 dark:stroke-[#5dfc96] transition-colors duration-300" strokeWidth="2" strokeLinecap="round"/>
                <path d="M0 3 Q 5 10 8 20" fill="none" className="stroke-primary-600 dark:stroke-[#5dfc96] transition-colors duration-300" strokeWidth="2" strokeLinecap="round"/>
            </g>
        </g>
    </svg>
);

// Map the specific icons for convenience, but preferring direct use in constants.ts
export const StandardAzkarIcon = GeneralIcon;
