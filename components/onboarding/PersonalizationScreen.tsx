
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { getStorage } from '../../data/storage';
import { useTranslation } from '../../hooks/useTranslation';
import TimePicker from '../common/TimePicker';
import { NotificationService } from '../../services/NotificationService';

const PersonalizationScreen: React.FC = () => {
    const { 
        navigate, 
        setFontSize: setContextFontSize, 
        setMorningReminderEnabled,
        setMorningReminderTime
    } = useAppContext();
    const { t } = useTranslation();
    const [fontSizeValue, setFontSizeValue] = useState(2); 
    const [reminders, setReminders] = useState(true);
    const [isTimePickerOpen, setTimePickerOpen] = useState(false);
    const [reminderTime, setReminderTime] = useState('05:30 AM');

    const getPreviewClass = (size: number) => {
        const sizes = [
            'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl'
        ];
        return sizes[size - 1] || 'text-3xl';
    };

    const handleSave = async () => {
        setContextFontSize(fontSizeValue);
        
        // Sync context
        setMorningReminderEnabled(reminders);
        setMorningReminderTime(reminderTime);

        if (reminders) {
            const permission = await NotificationService.requestPermissions();
            if (permission) {
                // Parse 12h format to 24h
                const [time, period] = reminderTime.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (period === 'PM' && hours !== 12) hours += 12;
                if (period === 'AM' && hours === 12) hours = 0;
                
                // Schedule Morning Reminder (ID 1) with 'morning' categoryId
                NotificationService.scheduleReminder(1, hours, minutes, "أذكار الصباح", "حان موعد قراءة أذكار الصباح", "morning");
            }
        } else {
            NotificationService.cancelReminder(1);
        }
        
        await getStorage().setOnboardingComplete();
        navigate('home');
    };

    return (
        <div className="h-full flex flex-col justify-between p-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('personalize_title')}</h1>

                <div className="my-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('personalize_font_title')}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('personalize_font_desc')}</p>
                    <div className="h-32 bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-none shadow-sm rounded-lg flex items-center justify-center p-4 mb-6 overflow-hidden transition-colors">
                        <p className={`${getPreviewClass(fontSizeValue)} text-gray-900 dark:text-white font-serif text-center transition-all duration-200`}>
                            سُبْحَانَ اللَّهِ
                        </p>
                    </div>
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <span className="text-lg font-medium text-gray-400">A</span>
                        <input 
                            type="range" 
                            min="1" 
                            max="8" 
                            step="1"
                            value={fontSizeValue} 
                            onChange={(e) => setFontSizeValue(parseInt(e.target.value))} 
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500" 
                        />
                        <span className="text-2xl font-medium text-gray-900 dark:text-white">A</span>
                    </div>
                </div>

                <div className="my-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('personalize_reminder_title')}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('personalize_reminder_desc')}</p>
                    <div className="flex justify-between items-center bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-none shadow-sm p-4 rounded-lg transition-colors">
                        <span className="font-medium text-gray-900 dark:text-white">{t('personalize_reminder_enable')}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={reminders} onChange={() => setReminders(!reminders)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:right-[2px] rtl:after:left-auto after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                    </div>
                     {reminders && (
                         <>
                            <div className="flex justify-between items-center bg-white dark:bg-[#1A3129] border border-gray-100 dark:border-none shadow-sm p-4 rounded-lg mt-3 transition-colors">
                                <span className="font-medium text-gray-900 dark:text-white">{t('personalize_reminder_time')}</span>
                                <button onClick={() => setTimePickerOpen(true)} className="font-medium text-primary-600 dark:text-primary-400">
                                    {reminderTime}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <div className="pb-4">
                <div className="flex justify-center space-x-2 my-4">
                    <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-primary-500 rounded-full"></div>
                </div>
                <button 
                    onClick={handleSave}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-full transition-all transform active:scale-95 shadow-lg shadow-primary-500/30"
                >
                    {t('personalize_button_save')}
                </button>
            </div>
             <TimePicker 
                isOpen={isTimePickerOpen}
                initialTime={reminderTime}
                onClose={() => setTimePickerOpen(false)}
                onSave={(newTime) => {
                    setReminderTime(newTime);
                    setTimePickerOpen(false);
                }}
            />
        </div>
    );
};

export default PersonalizationScreen;
