
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PrayerTimesService } from '../../services/PrayerTimesService';
import { addHijriMonths, hijriPartsOf } from '../../utils/hijri';

const WEEKDAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

const HijriCalendarScreen: React.FC = () => {
    const { navigate } = useAppContext();
    const [viewDate, setViewDate] = useState(new Date());
    // Derived directly during render - no effect/setState cycle needed
    const calendarData = useMemo(
        () => PrayerTimesService.getHijriMonthGrid(viewDate),
        [viewDate]
    );
    const [today] = useState(new Date());

    const changeMonth = (delta: number) => {
        // Land exactly on the first day of the previous/next Hijri month,
        // using real Umm al-Qura month boundaries instead of +/-29-day guesses.
        const next = addHijriMonths(viewDate, delta);
        if (next) setViewDate(next);
    };

    const isSameDate = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() && 
               d1.getMonth() === d2.getMonth() && 
               d1.getFullYear() === d2.getFullYear();
    };

    const getHijriDayNumber = (d: Date) => {
        return String(hijriPartsOf(d)?.day ?? '');
    };

    const getEventForDate = (d: Date) => {
        const parts = hijriPartsOf(d);
        if (!parts) return undefined;
        const events = PrayerTimesService.getIslamicEvents();
        return events.find(e => e.month === parts.month && e.day === parts.day);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-[#12241C]">
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-white dark:bg-[#1A3129] shadow-sm z-10">
                <button onClick={() => navigate('home')} aria-label="رجوع" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-900 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">التقويم الهجري</h1>
                <div className="w-10"></div>
            </header>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between px-6 py-6 bg-primary-600 text-white rounded-b-[2rem] shadow-lg mb-4 transition-colors duration-300">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h2 className="text-2xl font-bold font-serif mb-1">{calendarData.title}</h2>
                    <p className="text-sm opacity-80 font-mono">
                        {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} (ميلادي)
                    </p>
                </div>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Grid */}
            <div className="flex-grow px-4 overflow-y-auto">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2 text-center">
                    {WEEKDAYS.map(d => (
                        <div key={d} className="text-xs font-bold text-gray-500 dark:text-gray-400 py-2">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-2 mb-6">
                    {calendarData.days.map((date, idx) => {
                        if (!date) return <div key={idx} className="h-14"></div>;

                        const isTodayDate = isSameDate(date, today);
                        const dayNum = getHijriDayNumber(date);
                        const event = getEventForDate(date);
                        const isFriday = date.getDay() === 5; // Friday

                        return (
                            <div 
                                key={idx}
                                className={`
                                    h-14 md:h-20 rounded-xl flex flex-col items-center justify-center relative border transition-all
                                    ${isTodayDate 
                                        ? 'bg-primary-500 text-white border-primary-500 shadow-lg scale-105 z-10' 
                                        : 'bg-white dark:bg-[#1A3129] border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200'
                                    }
                                    ${isFriday && !isTodayDate ? 'bg-primary-50/50 dark:bg-primary-900/10 text-primary-700 dark:text-primary-400' : ''}
                                    ${event ? 'border-amber-400 border-2' : ''}
                                `}
                            >
                                <span className={`text-lg font-bold font-mono ${isTodayDate ? 'text-white' : ''}`}>
                                    {dayNum}
                                </span>
                                {/* Gregorian small text */}
                                <span className={`text-[9px] mt-1 ${isTodayDate ? 'text-white/80' : 'text-gray-400'}`}>
                                    {date.getDate()}
                                </span>

                                {/* Event Dot */}
                                {event && (
                                    <div className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Events List for this month */}
                <div className="mb-8">
                     <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 px-2">مناسبات هذا الشهر</h3>
                     <div className="space-y-2">
                        {calendarData.days.filter(d => d && getEventForDate(d)).map((d, idx) => {
                            if(!d) return null;
                            const ev = getEventForDate(d);
                            return (
                                <div key={idx} className="bg-white dark:bg-[#1A3129] p-4 rounded-xl flex items-center shadow-sm border border-gray-100 dark:border-none">
                                    <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold text-lg w-10 h-10 flex items-center justify-center rounded-lg ml-4 rtl:mr-0 rtl:ml-4 font-mono">
                                        {getHijriDayNumber(d)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{ev?.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        {calendarData.days.filter(d => d && getEventForDate(d)).length === 0 && (
                            <div className="text-center text-gray-400 text-sm py-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl">
                                لا توجد مناسبات خاصة في هذا الشهر
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default HijriCalendarScreen;
