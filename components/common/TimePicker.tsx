
import React, { useState, useEffect } from 'react';
import { ClockIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

interface TimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (time: string) => void;
  initialTime: string;
}

const formatTimePart = (part: number): string => part.toString().padStart(2, '0');

const TimePicker: React.FC<TimePickerProps> = ({ isOpen, onClose, onSave, initialTime }) => {
    const [view, setView] = useState<'clock' | 'input'>('clock');
    // Single source of truth: minutes since midnight (0 - 1439)
    const [minutesOfDay, setMinutesOfDay] = useState(5 * 60 + 30);
    const [activeInput, setActiveInput] = useState<'hour' | 'minute'>('hour');

    // Close on Escape while open
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // Derived 12h display values
    const period: 'AM' | 'PM' = minutesOfDay >= 720 ? 'PM' : 'AM';
    const hour12 = Math.floor((minutesOfDay % 720) / 60) || 12;
    const minutePart = minutesOfDay % 60;

    useEffect(() => {
        if (isOpen) {
            const [time, initialPeriod] = initialTime.split(' ');
            const [rawHour, rawMinute] = time.split(':').map(Number);
            let hour24 = Number.isFinite(rawHour) ? rawHour % 24 : 0;
            const minute = Number.isFinite(rawMinute) ? rawMinute : 0;
            hour24 = hour24 % 12; // Normalize 12h clock values (12 -> 0)
            let total = hour24 * 60 + minute;
            if (initialPeriod === 'PM') total += 720;
            setMinutesOfDay(((total % 1440) + 1440) % 1440);
            setActiveInput('hour');
            setView('clock');
        }
    }, [isOpen, initialTime]);

    const handleSave = () => {
        const finalTime = `${formatTimePart(hour12)}:${formatTimePart(minutePart)} ${period}`;
        onSave(finalTime);
    };
    
    const ClockView = () => {
        const numbers = activeInput === 'hour' 
            ? Array.from({ length: 12 }, (_, i) => i + 1)
            : Array.from({ length: 12 }, (_, i) => i * 5);

        const handleSelect = (num: number) => {
            if (activeInput === 'hour') {
                // num is 1..12; normalize 12 -> 0 while respecting the active period
                const base = (num % 12) * 60 + (period === 'PM' ? 720 : 0);
                setMinutesOfDay(base + minutePart);
                setActiveInput('minute');
            } else {
                setMinutesOfDay(Math.floor(minutesOfDay / 60) * 60 + num);
            }
        };

        return (
            <div className="relative w-64 h-64 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center my-4">
                {numbers.map((num, i) => {
                    const angle = (i / 12) * 360 - 90;
                    const isSelected = activeInput === 'hour' ? hour12 === num : minutePart === num;
                    return (
                        <button
                            key={num}
                            onClick={() => handleSelect(num)}
                            className={`absolute w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                                isSelected ? 'bg-primary-500 text-white' : 'text-black dark:text-white'
                            }`}
                            style={{
                                transform: `translate(-50%, -50%) rotate(${angle}deg) translateX(100px) rotate(${-angle}deg)`,
                                top: '50%',
                                left: '50%',
                            }}
                        >
                            {activeInput === 'minute' ? formatTimePart(num) : num}
                        </button>
                    );
                })}
                <div className="absolute w-2 h-2 rounded-full bg-primary-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-black"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="اختر الوقت"
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-none p-4 w-full max-w-xs"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-4">{view === 'clock' ? 'اختر الوقت' : 'أدخل الوقت'}</h2>
                
                <div className="flex items-center justify-center space-x-4">
                    {view === 'clock' ? (
                        <div className="flex items-center text-5xl font-light dark:text-white">
                           <button onClick={() => setActiveInput('hour')} className={`px-3 py-1 rounded-md ${activeInput === 'hour' ? 'bg-primary-100 dark:bg-primary-800' : ''}`}>
                                {formatTimePart(hour12)}
                            </button>
                            <span>:</span>
                            <button onClick={() => setActiveInput('minute')} className={`px-3 py-1 rounded-md ${activeInput === 'minute' ? 'bg-primary-100 dark:bg-primary-800' : ''}`}>
                                {formatTimePart(minutePart)}
                            </button>
                        </div>
                    ) : (
                         <div className="flex items-center space-x-2">
                             <input type="number" value={formatTimePart(hour12)} onChange={e => { const h = Math.max(1, Math.min(12, parseInt(e.target.value) || 0)); setMinutesOfDay((h % 12) * 60 + (period === 'PM' ? 720 : 0) + minutePart); }} className="w-16 p-2 text-center text-2xl bg-gray-100 dark:bg-gray-700 rounded-md dark:text-white" />
                              <span className="text-2xl dark:text-white">:</span>
                             <input type="number" value={formatTimePart(minutePart)} onChange={e => setMinutesOfDay(Math.floor(minutesOfDay / 60) * 60 + Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))} className="w-16 p-2 text-center text-2xl bg-gray-100 dark:bg-gray-700 rounded-md dark:text-white" />
                         </div>
                    )}
                    
                    <div className="flex flex-col border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
                        <button onClick={() => setMinutesOfDay(period === 'PM' ? minutesOfDay - 720 : minutesOfDay)} className={`px-3 py-2 text-sm font-medium ${period === 'AM' ? 'bg-primary-500 text-white' : 'dark:text-white'}`}>AM</button>
                        <button onClick={() => setMinutesOfDay(period === 'AM' ? minutesOfDay + 720 : minutesOfDay)} className={`px-3 py-2 text-sm font-medium border-t border-gray-300 dark:border-gray-600 ${period === 'PM' ? 'bg-primary-500 text-white' : 'dark:text-white'}`}>PM</button>
                    </div>
                </div>

                {view === 'clock' && <ClockView />}
                
                <div className="flex justify-between items-center mt-6">
                    <button onClick={() => setView(view === 'clock' ? 'input' : 'clock')} aria-label={view === 'clock' ? "إدخال الوقت يدوياً" : "عرض الساعة"} className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500">
                        {view === 'clock' ? <PencilSquareIcon className="w-6 h-6" /> : <ClockIcon className="w-6 h-6" />}
                    </button>
                    <div className="space-x-4">
                        <button onClick={onClose} className="font-semibold text-primary-500">إلغاء</button>
                        <button onClick={handleSave} className="font-semibold text-primary-500">موافق</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimePicker;
