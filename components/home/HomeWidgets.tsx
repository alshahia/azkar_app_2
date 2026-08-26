
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShareIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, ArrowsPointingOutIcon, SparklesIcon, MoonIcon, SunIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { MosqueIcon } from '../common/CustomIcons';
import { useAppContext } from '../../context/AppContext';
import { getQuotesRepository, getSalawatRepository } from '../../data/repository';
import { Quote, Salawat } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import Skeleton from '../common/Skeleton';
import { GLOBAL_TASBEEH_ID } from '../../constants';

// --- Helper: Container Wrapper ---
const WidgetContainer: React.FC<{ children: React.ReactNode, title?: string, icon?: React.ReactNode, className?: string, headerAction?: React.ReactNode }> = ({ children, title, icon, className = "", headerAction }) => (
    <div className={`bg-white dark:bg-[#1A3129] rounded-2xl border border-gray-100 dark:border-primary-500/10 shadow-sm p-5 mb-4 overflow-hidden relative ${className}`}>
        {(title || icon) && (
            <div className="flex items-center justify-between mb-4 z-10 relative">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    {icon}
                    {title && <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">{title}</h3>}
                </div>
                {headerAction}
            </div>
        )}
        <div className="relative z-10">
            {children}
        </div>
    </div>
);

// --- 0. Smart Suggestion Widget (Context Aware) ---
export const SmartSuggestionWidget: React.FC = () => {
    const { navigate } = useAppContext();
    const [suggestion, setSuggestion] = useState<{
        title: string;
        subtitle: string;
        icon: any;
        action: () => void;
        gradient: string;
        bgClass: string;
    } | null>(null);

    useEffect(() => {
        const date = new Date();
        const day = date.getDay(); // 5 is Friday
        const hour = date.getHours();

        // Priority 1: Friday (Jummah)
        if (day === 5 && hour > 4 && hour < 17) {
            setSuggestion({
                title: "يوم الجمعة",
                subtitle: "سنن وأذكار يوم الجمعة المباركة",
                icon: <MosqueIcon className="w-8 h-8 text-white" />,
                action: () => navigate('azkarList', { categoryId: 'jummah' }),
                gradient: "from-primary-500 to-primary-700",
                bgClass: "bg-primary-500"
            });
            return;
        }

        // Priority 2: Sleep (Night)
        if (hour >= 21 || hour < 4) {
             setSuggestion({
                title: "أذكار النوم",
                subtitle: "باسمك ربي وضعت جنبي...",
                icon: <MoonIcon className="w-8 h-8 text-indigo-100" />,
                action: () => navigate('azkarList', { categoryId: 'sleep' }),
                gradient: "from-indigo-600 to-blue-800",
                bgClass: "bg-indigo-600"
            });
            return;
        }

        // Priority 3: Morning/Evening (Already covered by header, but maybe suggest something specific inside?)
        // Let's suggest "Tasbeeh" if middle of day
        if (hour >= 11 && hour < 15) {
             setSuggestion({
                title: "وقت الضحى/الظهر",
                subtitle: "اجعل لسانك رطباً بذكر الله",
                icon: <SunIcon className="w-8 h-8 text-orange-100" />,
                action: () => navigate('azkarList', { categoryId: 'tasbeeh' }),
                gradient: "from-orange-400 to-amber-500",
                bgClass: "bg-orange-500"
            });
            return;
        }
        
        // Default: Quranic Duas
        setSuggestion({
             title: "أدعية قرآنية",
             subtitle: "ربنا آتنا في الدنيا حسنة",
             icon: <BookOpenIcon className="w-8 h-8 text-primary-100" />,
             action: () => navigate('azkarList', { categoryId: 'quranic' }),
             gradient: "from-primary-500 to-primary-600",
             bgClass: "bg-primary-600"
        });

    }, []);

    if (!suggestion) return null;

    return (
        <div onClick={suggestion.action} className={`rounded-2xl p-5 mb-4 text-white shadow-lg cursor-pointer bg-gradient-to-r ${suggestion.gradient} relative overflow-hidden group transition-transform active:scale-[0.98]`}>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-5 rounded-full -ml-8 -mb-8"></div>
            
            <div className="flex items-center justify-between relative z-10">
                <div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                        <SparklesIcon className="w-4 h-4 text-yellow-300 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider opacity-90">مقترح لك</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-1 font-serif">{suggestion.title}</h3>
                    <p className="text-sm opacity-90 font-medium">{suggestion.subtitle}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm shadow-inner">
                    {suggestion.icon}
                </div>
            </div>
        </div>
    );
};

// --- 1. Quranic Verse Widget ---
export const QuranicVerseWidget: React.FC = () => {
    const { t } = useTranslation();
    const { categories, navigate } = useAppContext();
    const quranicVerses = useMemo(() => {
        const cat = categories.find(c => c.id === 'quranic_verses');
        return cat ? cat.azkar : [];
    }, [categories]);

    const [verse, setVerse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (quranicVerses.length > 0) {
            setVerse(quranicVerses[Math.floor(Math.random() * quranicVerses.length)]);
            setLoading(false);
        }
    }, [quranicVerses]);

    const refreshVerse = () => {
        setVerse(quranicVerses[Math.floor(Math.random() * quranicVerses.length)]);
    };

    const handleShare = async () => {
        if (verse) {
           navigate('shareEditor', { text: verse.arabic, source: verse.reference });
        }
    };

    if (loading) {
        return (
            <WidgetContainer className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-[#1A3129] dark:to-[#12241C] border-none">
                <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <div className="space-y-3 mb-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mx-auto" />
                    <Skeleton className="h-4 w-4/6 mx-auto" />
                </div>
                <Skeleton className="h-3 w-20 mx-auto mb-4" />
                <div className="flex justify-center mt-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </WidgetContainer>
        );
    }

    if (!verse) return null;

    return (
        <WidgetContainer className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-[#1A3129] dark:to-[#12241C] border-none">
            <div className="flex justify-between items-start mb-4">
                <span className="text-primary-600 dark:text-primary-400 font-bold text-lg">{t('home_widget_quran')}</span>
                <button onClick={handleShare}><ShareIcon className="w-5 h-5 text-primary-600/50 hover:text-primary-600" /></button>
            </div>
            
            <p className="font-serif text-2xl text-center text-gray-800 dark:text-gray-100 leading-loose mb-4">
                {verse.arabic}
            </p>
            {verse.reference && (
                <p className="text-center text-sm text-primary-600/70 dark:text-primary-400/70 mb-4 font-medium">
                    {verse.reference}
                </p>
            )}
            
            <div className="flex justify-center mt-4">
                <button onClick={refreshVerse} className="bg-white dark:bg-primary-900/30 p-3 rounded-full shadow-sm hover:shadow-md transition-all active:scale-90">
                    <ArrowPathIcon className="w-6 h-6 text-primary-500" />
                </button>
            </div>
        </WidgetContainer>
    );
};

// --- 2. Asmaul Husna Widget ---
export const AsmaulHusnaWidget: React.FC = () => {
    const { t } = useTranslation();
    const { categories } = useAppContext();
    const names = useMemo(() => {
        const cat = categories.find(c => c.id === 'names_of_allah');
        return cat ? cat.azkar : [];
    }, [categories]);

    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if(names.length > 0) {
            setIndex(Math.floor(Math.random() * names.length));
            setLoading(false);
        }
    }, [names]);

    const nextName = () => setIndex((prev) => (prev + 1) % names.length);
    const prevName = () => setIndex((prev) => (prev - 1 + names.length) % names.length);
    // The refresh-icon button: jump to a random name other than the current one
    const randomName = () => {
        if (names.length < 2) return;
        setIndex((prev) => {
            let next = prev;
            while (next === prev) next = Math.floor(Math.random() * names.length);
            return next;
        });
    };

    if (loading) {
        return (
            <WidgetContainer title={t('home_widget_asmaulhusna')}>
                <div className="flex flex-col items-center justify-center py-6">
                    <Skeleton className="h-16 w-32 mb-2" />
                    <Skeleton className="w-12 h-1 rounded-full mt-4 mb-6" />
                    <div className="flex items-center space-x-8 rtl:space-x-reverse">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <Skeleton className="w-10 h-10 rounded-full" />
                    </div>
                </div>
            </WidgetContainer>
        );
    }

    if (names.length === 0) return null;
    const currentName = names[index];

    return (
        <WidgetContainer title={t('home_widget_asmaulhusna')}>
            <div className="flex flex-col items-center justify-center py-6">
                <h2 className="text-5xl font-bold text-primary-500 dark:text-primary-400 mb-2 font-serif transition-all duration-500">
                    {currentName.arabic}
                </h2>
                <div className="w-12 h-1 bg-primary-100 dark:bg-primary-900 rounded-full mt-4 mb-6"></div>
                
                <div className="flex items-center space-x-8 rtl:space-x-reverse">
                    <button onClick={prevName} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </button>
                    <button onClick={randomName} aria-label="اسم عشوائي" className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-md hover:shadow-lg text-primary-500 transition-all active:scale-95">
                        <ArrowPathIcon className="w-6 h-6" />
                    </button>
                    <button onClick={nextName} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors">
                        <ChevronLeftIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>
        </WidgetContainer>
    );
};

// --- 3. Tasbeeh Widget ---
export const TasbeehWidget: React.FC = () => {
    const { t } = useTranslation();
    const { incrementProgress, navigate } = useAppContext();
    const [count, setCount] = useState(0);
    const target = 33;
    const progressPercent = Math.min((count / target) * 100, 100);
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;

    const phrases = ["سُبْحَانَ اللَّهِ", "الْحَمْدُ لِلَّهِ", "اللَّهُ أَكْبَرُ", "لَا إِلَهَ إِلَّا اللَّهُ"];
    const [phraseIndex, setPhraseIndex] = useState(0);

    const handleTap = () => {
        if (count < target) {
            setCount(c => c + 1);
            // Atomic accumulate under a shared pseudo-id for the global tasbeeh counter
            incrementProgress(GLOBAL_TASBEEH_ID, 1);
        } else {
            setCount(0);
            setPhraseIndex(p => (p + 1) % phrases.length);
        }
    };

    return (
        <WidgetContainer 
            className="!p-0 border-t-4 border-t-primary-500"
            headerAction={
                <button onClick={() => navigate('tasbeeh')} className="text-gray-400 hover:text-primary-500 p-1" title="الشاشة الكاملة">
                    <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
            }
        >
            <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-[#1A3129]">
                <div className="flex justify-between w-full items-center mb-4 px-2">
                    <h3 className="font-bold text-primary-600 dark:text-primary-400">{t('home_widget_tasbeeh')}</h3>
                    <div className="flex space-x-3 rtl:space-x-reverse">
                        <button onClick={() => { setCount(0); setPhraseIndex(0); }} className="text-gray-400 hover:text-primary-500">
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center w-full justify-between gap-4">
                    <div className="flex flex-col space-y-2 w-1/2">
                        {phrases.map((p, idx) => (
                            <button 
                                key={idx}
                                onClick={() => { setPhraseIndex(idx); setCount(0); }}
                                className={`text-right text-xs font-bold py-2 px-3 rounded-lg transition-colors ${
                                    idx === phraseIndex 
                                    ? 'bg-primary-500 text-white shadow-md' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-32 h-32 flex items-center justify-center cursor-pointer active:scale-95 transition-transform" onClick={handleTap}>
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64" cy="64" r={radius}
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-gray-100 dark:text-gray-800"
                            />
                            <circle
                                cx="64" cy="64" r={radius}
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                className="text-primary-500 transition-all duration-200"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">{count}</span>
                            <span className="text-[10px] text-gray-400">/{target}</span>
                        </div>
                    </div>
                </div>
            </div>
        </WidgetContainer>
    );
};

// --- 4. Salawat Widget ---
export const SalawatWidget: React.FC = () => {
    const { t } = useTranslation();
    const { navigate } = useAppContext();
    const repo = useMemo(() => getSalawatRepository(), []);
    const [currentSalawat, setCurrentSalawat] = useState<Salawat | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const staleRef = useRef(false);

    useEffect(() => {
        staleRef.current = false;
        return () => {
            staleRef.current = true;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const refreshSalawat = async () => {
        setLoading(true);
        setLoadError(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            try {
                const item = await repo.getRandom();
                if (staleRef.current) return;
                setCurrentSalawat(item);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load salawat:", error);
                if (staleRef.current) return;
                setLoadError(true);
                setLoading(false);
            }
        }, 300);
    };

    useEffect(() => {
        refreshSalawat();
    }, [repo]);

    const handleShare = () => {
        if(currentSalawat) navigate('shareEditor', { text: currentSalawat.text, source: 'الصلاة على النبي' });
    }

    if (!loading && loadError) {
        return (
            <WidgetContainer className="bg-gradient-to-b from-primary-400 to-primary-600 dark:from-primary-800 dark:to-primary-900 border-none text-white text-center">
                <div className="py-2 flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-yellow-300 mb-4 drop-shadow-sm">{t('home_widget_salawat')}</h3>
                    <button onClick={refreshSalawat} className="bg-white/20 hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-all active:scale-95">
                        <ArrowPathIcon className="w-6 h-6 text-white" />
                    </button>
                </div>
            </WidgetContainer>
        );
    }

    if (loading || !currentSalawat) {
        return (
            <WidgetContainer className="bg-gradient-to-b from-primary-400 to-primary-600 dark:from-primary-800 dark:to-primary-900 border-none text-white text-center">
                <div className="py-2 flex flex-col items-center">
                    <Skeleton className="h-8 w-40 mb-4 bg-white/20" />
                    <Skeleton className="h-4 w-full bg-white/20 mb-2" />
                    <Skeleton className="h-4 w-5/6 bg-white/20" />
                </div>
                <div className="mt-6 flex justify-center">
                    <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
                </div>
            </WidgetContainer>
        );
    }

    return (
        <WidgetContainer className="bg-gradient-to-b from-primary-400 to-primary-600 dark:from-primary-800 dark:to-primary-900 border-none text-white text-center relative">
            <button onClick={handleShare} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><ShareIcon className="w-4 h-4 text-white" /></button>
            <div className="py-2">
                <h3 className="text-2xl font-bold text-yellow-300 mb-2 drop-shadow-sm">{t('home_widget_salawat')}</h3>
                <p className="font-serif text-lg leading-relaxed opacity-95">
                    {currentSalawat.text}
                </p>
            </div>

            <div className="mt-6 flex justify-center">
                <button onClick={refreshSalawat} className="bg-white/20 hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-all active:scale-95">
                    <ArrowPathIcon className="w-6 h-6 text-white" />
                </button>
            </div>
        </WidgetContainer>
    );
};

// --- 5. Info Widget (Islamic Quotes) ---
export const InfoWidget: React.FC = () => {
    const { navigate } = useAppContext();
    const repo = useMemo(() => getQuotesRepository(), []);
    const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const staleRef = useRef(false);

    useEffect(() => {
        staleRef.current = false;
        return () => {
            staleRef.current = true;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    const refreshQuote = async () => {
        setLoading(true);
        setLoadError(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            try {
                const item = await repo.getRandom();
                if (staleRef.current) return;
                setCurrentQuote(item);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load quote:", error);
                if (staleRef.current) return;
                setLoadError(true);
                setLoading(false);
            }
        }, 300);
    };

    useEffect(() => {
        refreshQuote();
    }, [repo]);

    const handleShare = () => {
        if(currentQuote) navigate('shareEditor', { text: currentQuote.text, source: currentQuote.author });
    }

    if (!loading && loadError) {
        return (
            <WidgetContainer className="bg-gradient-to-b from-primary-400 to-primary-600 dark:from-primary-800 dark:to-primary-900 border-none text-white text-center">
                <div className="py-2 flex justify-center">
                    <button onClick={refreshQuote} className="bg-white/20 hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-all active:scale-95">
                        <ArrowPathIcon className="w-6 h-6 text-white" />
                    </button>
                </div>
            </WidgetContainer>
        );
    }

    if (loading || !currentQuote) {
        return (
            <WidgetContainer className="bg-gradient-to-b from-primary-400 to-primary-600 dark:from-primary-800 dark:to-primary-900 border-none text-white text-center">
                <div className="py-2 flex flex-col items-center">
                    <Skeleton className="h-8 w-32 mb-4 bg-white/20" />
                    <Skeleton className="h-4 w-full bg-white/20 mb-2" />
                    <Skeleton className="h-4 w-4/6 bg-white/20" />
                </div>
                <div className="mt-6 flex justify-center">
                    <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
                </div>
            </WidgetContainer>
        );
    }

    return (
        <WidgetContainer className="bg-gradient-to-b from-primary-400 to-primary-600 dark:from-primary-800 dark:to-primary-900 border-none text-white text-center relative">
            <button onClick={handleShare} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><ShareIcon className="w-4 h-4 text-white" /></button>
            <div className="py-2">
                <h3 className="text-2xl font-bold text-yellow-300 mb-2 drop-shadow-sm font-serif">{currentQuote.author}</h3>
                <p className="font-serif text-lg leading-relaxed opacity-95">
                    {currentQuote.text}
                </p>
            </div>
            
            <div className="mt-6 flex justify-center">
                 <button onClick={refreshQuote} className="bg-white/20 hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-all active:scale-95">
                    <ArrowPathIcon className="w-6 h-6 text-white" />
                </button>
            </div>
        </WidgetContainer>
    );
};
