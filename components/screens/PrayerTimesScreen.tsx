
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { PrayerTimesService } from '../../services/PrayerTimesService';
import { PrayerTimes } from 'adhan';

const PrayerTimesScreen: React.FC = () => {
    const { navigate, location } = useAppContext();
    const [date, setDate] = useState(new Date());
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);

    useEffect(() => {
        if (location) {
            const times = PrayerTimesService.getPrayerTimes(date, location);
            setPrayerTimes(times);
        }
    }, [date, location]);

    const changeDate = (days: number) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        setDate(newDate);
    };

    const isToday = (d: Date) => {
        const today = new Date();
        return d.getDate() === today.getDate() && 
               d.getMonth() === today.getMonth() && 
               d.getFullYear() === today.getFullYear();
    };

    const prayers = prayerTimes ? [
        { key: 'fajr', name: 'الفجر', time: prayerTimes.fajr },
        { key: 'sunrise', name: 'الشروق', time: prayerTimes.sunrise },
        { key: 'dhuhr', name: 'الظهر', time: prayerTimes.dhuhr },
        { key: 'asr', name: 'العصر', time: prayerTimes.asr },
        { key: 'maghrib', name: 'المغرب', time: prayerTimes.maghrib },
        { key: 'isha', name: 'العشاء', time: prayerTimes.isha },
    ] : [];

    // Find current active prayer interval
    const now = new Date();
    const currentPrayerIndex = isToday(date) ? prayers.findIndex((p, idx) => {
        const nextP = prayers[idx + 1];
        if (!nextP) return now >= p.time; // Isha until midnight/fajr
        return now >= p.time && now < nextP.time;
    }) : -1;

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-[#12241C]">
            {/* Header */}
            <div className="bg-primary-600 pb-8 pt-4 px-4 rounded-b-[2.5rem] shadow-lg relative z-10 transition-colors duration-300">
                <header className="flex items-center justify-between mb-6">
                    <button onClick={() => navigate('home')} aria-label="رجوع" className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors">
                        <ArrowLeftIcon className="w-6 h-6 rtl:rotate-180" />
                    </button>
                    <h1 className="text-xl font-bold text-white">مواقيت الصلاة</h1>
                    <div className="w-10"></div>
                </header>
                
                {/* Date Navigator */}
                <div className="flex items-center justify-between text-white mb-4">
                    <button onClick={() => changeDate(-1)} aria-label="اليوم السابق" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <p className="font-bold text-lg">{PrayerTimesService.getHijriDate(date)}</p>
                        <p className="text-sm opacity-80 font-mono">
                            {date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={() => changeDate(1)} aria-label="اليوم التالي" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Location Badge */}
                <div className="flex justify-center">
                    <div className="bg-black/20 px-4 py-1.5 rounded-full flex items-center space-x-2 rtl:space-x-reverse text-xs text-white/90">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        <span>موقعي الحالي</span>
                    </div>
                </div>
            </div>

            {/* Prayer List */}
            <div className="flex-grow overflow-y-auto px-4 py-6 -mt-4 relative z-0">
                <div className="space-y-3">
                    {prayers.map((prayer, idx) => {
                        const isActive = idx === currentPrayerIndex;
                        const isNext = idx === currentPrayerIndex + 1;
                        
                        return (
                            <div 
                                key={prayer.key}
                                className={`
                                    flex items-center justify-between p-4 rounded-2xl transition-all duration-300
                                    ${isActive 
                                        ? 'bg-white dark:bg-[#1A3129] border-2 border-primary-500 shadow-md scale-[1.02]' 
                                        : 'bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-transparent shadow-sm'
                                    }
                                    ${isNext ? 'opacity-100' : ''}
                                `}
                            >
                                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center
                                        ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}
                                    `}>
                                        <ClockIconWrapper type={prayer.key} className="w-5 h-5" />
                                    </div>
                                    <span className={`font-bold ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {prayer.name}
                                    </span>
                                </div>
                                
                                <span className={`font-mono text-lg ${isActive ? 'font-bold text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {PrayerTimesService.formatTime(prayer.time)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="p-4 text-center text-xs text-gray-400">
               طريقة الحساب: رابطة العالم الإسلامي
            </div>
        </div>
    );
};

// Helper Icon Wrapper since we can't dynamic import easy icons inside map
const ClockIconWrapper = ({ type, className }: { type: string, className: string }) => {
    // Just a placeholder visual distinction, normally specific icons
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
        </svg>
    );
}

export default PrayerTimesScreen;
