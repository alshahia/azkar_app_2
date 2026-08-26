
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Cog6ToothIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import { WelcomeCard, QuickAccessGrid } from '../home/HomeHeader';
import { 
    QuranicVerseWidget, 
    AsmaulHusnaWidget, 
    TasbeehWidget, 
    SalawatWidget, 
    InfoWidget,
    SmartSuggestionWidget // Import new widget
} from '../home/HomeWidgets';
import PrayerTimesWidget from '../home/PrayerTimesWidget'; 
import FocusLayout from '../home/FocusLayout';
import StreamLayout from '../home/StreamLayout';
import DashboardLayout from '../home/DashboardLayout';

// Helper component for the standard/rich widget view
const WidgetsLayout: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="animate-fade-in-up">
                <WelcomeCard />
                
                {/* Contextual Smart Suggestion */}
                <SmartSuggestionWidget />
                
                {/* Insert Prayer Times Widget Here */}
                <PrayerTimesWidget />

                <QuickAccessGrid />
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse my-6">
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-grow"></div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{t('home_layout_stream') || "Explore"}</span>
                <div className="h-px bg-gray-200 dark:bg-gray-700 flex-grow"></div>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <QuranicVerseWidget />
            </div>
            
            <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <AsmaulHusnaWidget />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <TasbeehWidget />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                <SalawatWidget />
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                <InfoWidget />
            </div>
            
            <div className="h-10 text-center text-gray-400 text-xs mt-4">
                نهاية القائمة
            </div>
        </div>
    );
};

const HomeScreen: React.FC = () => {
    const { navigate, homeLayout, categories } = useAppContext();
    const { t } = useTranslation();

    // Flatten all Azkar for Focus/Stream layouts to use
    // Using simple mapping to ensure categoryName is available
    const allAzkar = useMemo(() => {
        return categories.flatMap(cat => cat.azkar.map(z => ({
            ...z,
            categoryName: cat.title
        })));
    }, [categories]);

    // Random zikr for initial states in sub-layouts
    const [currentRandomZikr, setCurrentRandomZikr] = useState<any>(() => {
        if (allAzkar.length === 0) return { id: 0, arabic: "...", categoryName: "..." };
        return allAzkar[Math.floor(Math.random() * allAzkar.length)];
    });

    const refreshRandomZikr = () => {
        if (allAzkar.length > 0) {
            setCurrentRandomZikr(allAzkar[Math.floor(Math.random() * allAzkar.length)]);
        }
    };

    // Render the specific layout content
    const renderLayout = () => {
        switch (homeLayout) {
            case 'focus':
                return <FocusLayout allAzkar={allAzkar} onRefresh={refreshRandomZikr} currentZikr={currentRandomZikr} />;
            case 'stream':
                return <StreamLayout allAzkar={allAzkar} />;
            case 'simple':
                return <DashboardLayout allAzkar={allAzkar} onRefresh={refreshRandomZikr} currentZikr={currentRandomZikr} />;
            case 'dashboard':
            default:
                return <WidgetsLayout />;
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header (Top Bar) */}
            <header className="flex justify-between items-center p-4 shrink-0 bg-gray-50 dark:bg-[#12241C] z-20">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <button 
                        onClick={() => navigate('settings')}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Cog6ToothIcon className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors" />
                    </button>
                    <button 
                        onClick={() => navigate('search')}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        <MagnifyingGlassIcon className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors" />
                    </button>
                </div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors">
                    أذكار
                </h1>
            </header>

            {/* Scrollable Area */}
            <div className="flex-grow overflow-y-auto overflow-x-hidden px-4 pb-20 scroll-smooth">
                {renderLayout()}
            </div>
        </div>
    );
};

export default HomeScreen;
