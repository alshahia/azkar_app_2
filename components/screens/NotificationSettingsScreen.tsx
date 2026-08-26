
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon, SunIcon, MoonIcon, BellIcon, PlusIcon, TrashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import TimePicker from '../common/TimePicker';
import { NotificationService } from '../../services/NotificationService';
import { CustomReminder } from '../../types';

const NotificationSettingsScreen: React.FC = () => {
    const { navigate, 
            morningReminderEnabled, setMorningReminderEnabled, 
            morningReminderTime, setMorningReminderTime,
            eveningReminderEnabled, setEveningReminderEnabled,
            eveningReminderTime, setEveningReminderTime,
            categories,
            customReminders, addCustomReminder, removeCustomReminder,
            prayerNotificationsEnabled, setPrayerNotificationsEnabled,
            location
    } = useAppContext();
    const { t } = useTranslation();

    const [activePicker, setActivePicker] = useState<'morning' | 'evening' | 'custom' | null>(null);
    
    // Custom Reminder State
    const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
    const [customTime, setCustomTime] = useState('09:00 AM');

    // Helper to parse "05:00 AM" -> { hour: 5, minute: 0 }
    const parseTime = (timeStr: string) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return { hours, minutes };
    };

    const handleToggleMorning = async () => {
        const newState = !morningReminderEnabled;
        setMorningReminderEnabled(newState);
        
        if (newState) {
            const granted = await NotificationService.requestPermissions();
            if (granted) {
                const { hours, minutes } = parseTime(morningReminderTime);
                NotificationService.scheduleReminder(1, hours, minutes, "أذكار الصباح", "حان موعد قراءة أذكار الصباح", "morning");
            } else {
                setMorningReminderEnabled(false); // Revert if no permission
                alert("يرجى تفعيل الإشعارات من إعدادات الهاتف.");
            }
        } else {
            NotificationService.cancelReminder(1);
        }
    };

    const handleToggleEvening = async () => {
        const newState = !eveningReminderEnabled;
        setEveningReminderEnabled(newState);

        if (newState) {
            const granted = await NotificationService.requestPermissions();
            if (granted) {
                const { hours, minutes } = parseTime(eveningReminderTime);
                NotificationService.scheduleReminder(2, hours, minutes, "أذكار المساء", "حان موعد قراءة أذكار المساء", "evening");
            } else {
                setEveningReminderEnabled(false);
                alert("يرجى تفعيل الإشعارات من إعدادات الهاتف.");
            }
        } else {
            NotificationService.cancelReminder(2);
        }
    };

    const handleTogglePrayer = async () => {
        if (!location && !prayerNotificationsEnabled) {
             alert('يرجى تفعيل الموقع أولاً من الصفحة الرئيسية لتحديد أوقات الصلاة.');
             return;
        }

        const newState = !prayerNotificationsEnabled;
        setPrayerNotificationsEnabled(newState);

        if (newState) {
             const granted = await NotificationService.requestPermissions();
             if (!granted) {
                setPrayerNotificationsEnabled(false);
                alert("يرجى تفعيل الإشعارات من إعدادات الهاتف.");
             }
             // Scheduling happens in App.tsx useEffect based on this state change
        }
    };

    const handleAddCustomReminder = async () => {
        const granted = await NotificationService.requestPermissions();
        if (!granted) {
            alert("يرجى تفعيل الإشعارات أولاً.");
            return;
        }

        const cat = categories.find(c => c.id === selectedCategory);
        if (!cat) return;

        const reminderId = Date.now(); // Simple unique ID
        const { hours, minutes } = parseTime(customTime);

        await NotificationService.scheduleReminder(
            reminderId, 
            hours, 
            minutes, 
            cat.title, 
            `حان موعد قراءة ${cat.title}`,
            cat.id
        );

        const newReminder: CustomReminder = {
            id: reminderId,
            categoryId: cat.id,
            categoryTitle: cat.title,
            time: customTime,
            enabled: true
        };

        addCustomReminder(newReminder);
    };

    const handleSaveTime = (newTime: string) => {
        if (activePicker === 'morning') {
            setMorningReminderTime(newTime);
            if (morningReminderEnabled) {
                const { hours, minutes } = parseTime(newTime);
                NotificationService.scheduleReminder(1, hours, minutes, "أذكار الصباح", "حان موعد قراءة أذكار الصباح", "morning");
            }
        } else if (activePicker === 'evening') {
            setEveningReminderTime(newTime);
            if (eveningReminderEnabled) {
                const { hours, minutes } = parseTime(newTime);
                NotificationService.scheduleReminder(2, hours, minutes, "أذكار المساء", "حان موعد قراءة أذكار المساء", "evening");
            }
        } else if (activePicker === 'custom') {
            setCustomTime(newTime);
        }
        setActivePicker(null);
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex items-center mb-6 relative">
                <button onClick={() => navigate('settings')} className="p-2 -ml-2 rtl:-mr-2 rtl:ml-0 absolute left-0 rtl:right-0 rtl:left-auto">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mx-auto">إعدادات الإشعارات</h1>
            </header>

            <div className="flex-grow overflow-y-auto space-y-4 pb-20">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg flex items-start space-x-3 rtl:space-x-reverse">
                    <BellIcon className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">تذكيرات يومية</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            احصل على تذكير يومي لقراءة الأذكار وأوقات الصلاة.
                        </p>
                    </div>
                </div>

                {/* Prayer Times Section */}
                <div className="bg-white dark:bg-[#1A3129] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-none">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full">
                                <MapPinIcon className="w-6 h-6 text-primary-500" />
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 dark:text-white block">مواقيت الصلاة</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">تنبيه عند دخول وقت الصلاة</span>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={prayerNotificationsEnabled} onChange={handleTogglePrayer} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:right-[2px] rtl:after:left-auto after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                    {!location && prayerNotificationsEnabled && (
                        <p className="text-xs text-red-400 mt-2 text-center">يرجى تفعيل الموقع من الصفحة الرئيسية</p>
                    )}
                </div>

                {/* Morning Section */}
                <div className="bg-white dark:bg-[#1A3129] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-none">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                                <SunIcon className="w-6 h-6 text-orange-500" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">أذكار الصباح</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={morningReminderEnabled} onChange={handleToggleMorning} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:right-[2px] rtl:after:left-auto after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                    
                    {morningReminderEnabled && (
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">وقت التنبيه</span>
                            <button 
                                onClick={() => setActivePicker('morning')}
                                className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg text-primary-600 dark:text-primary-400 font-bold font-mono"
                            >
                                {morningReminderTime}
                            </button>
                        </div>
                    )}
                </div>

                {/* Evening Section */}
                <div className="bg-white dark:bg-[#1A3129] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-none">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full">
                                <MoonIcon className="w-6 h-6 text-indigo-500" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">أذكار المساء</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={eveningReminderEnabled} onChange={handleToggleEvening} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:right-[2px] rtl:after:left-auto after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                    
                    {eveningReminderEnabled && (
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 flex justify-between items-center">
                            <span className="text-sm text-gray-500 dark:text-gray-400">وقت التنبيه</span>
                            <button 
                                onClick={() => setActivePicker('evening')}
                                className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg text-primary-600 dark:text-primary-400 font-bold font-mono"
                            >
                                {eveningReminderTime}
                            </button>
                        </div>
                    )}
                </div>

                {/* Custom Reminders Section */}
                <h2 className="text-lg font-bold text-primary-600 dark:text-primary-400 mt-6 px-2">تذكيرات مخصصة</h2>
                
                <div className="bg-white dark:bg-[#1A3129] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-none">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">اختر الفئة</label>
                            <select 
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-3 rounded-lg border-none focus:ring-2 focus:ring-primary-500"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <label className="block text-sm text-gray-600 dark:text-gray-400">الوقت</label>
                            <button 
                                onClick={() => setActivePicker('custom')}
                                className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg text-primary-600 dark:text-primary-400 font-bold font-mono"
                            >
                                {customTime}
                            </button>
                        </div>

                        <button 
                            onClick={handleAddCustomReminder}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 rtl:space-x-reverse transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span>إضافة تذكير</span>
                        </button>
                    </div>
                </div>

                {/* List of Custom Reminders */}
                {customReminders.length > 0 && (
                    <div className="space-y-2 mt-4">
                        {customReminders.map(reminder => (
                            <div key={reminder.id} className="bg-white dark:bg-[#1A3129] p-4 rounded-lg flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{reminder.categoryTitle}</p>
                                    <p className="text-sm text-primary-600 dark:text-primary-400 font-mono">{reminder.time}</p>
                                </div>
                                <button 
                                    onClick={() => removeCustomReminder(reminder.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TimePicker 
                isOpen={activePicker !== null}
                initialTime={
                    activePicker === 'morning' ? morningReminderTime : 
                    activePicker === 'evening' ? eveningReminderTime : 
                    customTime
                }
                onClose={() => setActivePicker(null)}
                onSave={handleSaveTime}
            />
        </div>
    );
};

export default NotificationSettingsScreen;
