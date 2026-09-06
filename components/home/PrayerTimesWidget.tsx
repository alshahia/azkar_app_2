
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PrayerTimesService } from '../../services/PrayerTimesService';
import { MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../common/Toast';
import { PrayerTimes } from 'adhan';

const PrayerTimesWidget: React.FC = () => {
    const { location, setLocation, navigate } = useAppContext();
    const { t } = useTranslation();
    const toast = useToast();
    
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [nextPrayer, setNextPrayer] = useState<{name: string, time: Date} | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    // Fetch Times if location exists
    useEffect(() => {
        if (location) {
            const times = PrayerTimesService.getPrayerTimes(new Date(), location);
            setPrayerTimes(times);
            calculateNextPrayer(times);
        }
    }, [location]);

    // Update countdown every minute
    useEffect(() => {
        if (nextPrayer) {
            const timer = setInterval(() => {
                const now = new Date().getTime();
                const target = nextPrayer.time.getTime();
                const diff = target - now;

                if (diff <= 0) {
                    // Refresh times if passed
                    if (location) {
                        const times = PrayerTimesService.getPrayerTimes(new Date(), location);
                        setPrayerTimes(times);
                        calculateNextPrayer(times);
                    }
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeRemaining(`${hours}س ${minutes}د`);
            }, 60000); // Update every minute
            
            // Initial call
            const now = new Date().getTime();
            const target = nextPrayer.time.getTime();
            const diff = target - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeRemaining(`${hours}س ${minutes}د`);

            return () => clearInterval(timer);
        }
    }, [nextPrayer, location]);

    const calculateNextPrayer = (times: PrayerTimes) => {
        const now = new Date();
        const prayers = [
            { name: 'الفجر', time: times.fajr },
            { name: 'الشروق', time: times.sunrise },
            { name: 'الظهر', time: times.dhuhr },
            { name: 'العصر', time: times.asr },
            { name: 'المغرب', time: times.maghrib },
            { name: 'العشاء', time: times.isha }
        ];

        const next = prayers.find(p => p.time > now);
        
        if (next) {
            setNextPrayer(next);
        } else {
            // Next is Fajr tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            if(location) {
                const tomorrowTimes = PrayerTimesService.getPrayerTimes(tomorrow, location);
                setNextPrayer({ name: 'الفجر', time: tomorrowTimes.fajr });
            }
        }
    };

    const handleEnableLocation = async () => {
        try {
            const loc = await PrayerTimesService.getCurrentLocation();
            setLocation(loc);
        } catch (e) {
            toast.show(t('error_location_denied'), { variant: 'error' });
        }
    };

    if (!location) {
        return (
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg mb-4">
                <div className="flex flex-col items-center text-center space-y-3">
                    <MapPinIcon className="w-8 h-8 opacity-80" />
                    <h3 className="font-bold text-lg">مواقيت الصلاة</h3>
                    <p className="text-sm opacity-90">قم بتفعيل الموقع للحصول على مواقيت الصلاة الدقيقة لمنطقتك</p>
                    <button 
                        onClick={handleEnableLocation}
                        className="bg-white text-primary-700 px-6 py-2 rounded-full font-bold text-sm hover:bg-opacity-90 transition-all mt-2"
                    >
                        تحديد الموقع
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={() => navigate('prayerTimes')}
            className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-lg mb-4 cursor-pointer relative overflow-hidden"
        >
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full -ml-8 -mb-8 blur-xl"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse opacity-80">
                        <MapPinIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">موقعي الحالي</span>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        <span>التفاصيل</span>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-sm font-medium opacity-90 mb-1">الصلاة القادمة</p>
                        <h2 className="text-3xl font-bold font-serif mb-1">{nextPrayer?.name || '...'}</h2>
                        <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs bg-black/20 w-fit px-3 py-1 rounded-lg">
                            <span>متبقي</span>
                            <span className="font-mono font-bold text-yellow-300">{timeRemaining}</span>
                        </div>
                    </div>

                    <div className="text-left rtl:text-right">
                        <p className="text-3xl font-mono font-bold opacity-90">
                            {nextPrayer ? PrayerTimesService.formatTime(nextPrayer.time) : '--:--'}
                        </p>
                    </div>
                </div>
                
                {/* Mini Timeline of Prayers */}
                <div className="mt-5 pt-4 border-t border-white/10 flex justify-between text-center">
                    {prayerTimes && ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => {
                        const key = p as keyof PrayerTimes;
                        const time = prayerTimes[key] as Date;
                        const isNext = nextPrayer?.name === (
                            p === 'fajr' ? 'الفجر' : 
                            p === 'dhuhr' ? 'الظهر' : 
                            p === 'asr' ? 'العصر' : 
                            p === 'maghrib' ? 'المغرب' : 'العشاء'
                        );

                        return (
                            <div key={p} className={`flex flex-col items-center ${isNext ? 'text-yellow-300 scale-110 font-bold' : 'opacity-60'}`}>
                                <span className="text-[10px] mb-1">
                                    {p === 'fajr' ? 'فجر' : p === 'dhuhr' ? 'ظهر' : p === 'asr' ? 'عصر' : p === 'maghrib' ? 'مغرب' : 'عشاء'}
                                </span>
                                <span className="text-[10px] font-mono whitespace-nowrap">
                                    {time.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: false})}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PrayerTimesWidget;
