
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { MorningIcon, EveningIcon } from '../common/CustomIcons';
import { CalendarDaysIcon, FireIcon, BookOpenIcon } from '@heroicons/react/24/outline';

export const WelcomeCard: React.FC = () => {
    const { t } = useTranslation();
    const { stats } = useAppContext();
    const time = new Date().getHours();
    const isMorning = time >= 4 && time < 17;

    return (
        <div className="mb-6 relative overflow-hidden rounded-[2rem] bg-white dark:bg-midnight-900 shadow-sm dark:shadow-none p-8 transition-all duration-300 border border-white dark:border-midnight-800 group">
            {/* Gradient Background Layer */}
            <div className={`absolute inset-0 opacity-10 transition-colors duration-500 ${isMorning ? 'bg-gradient-to-br from-orange-100 to-amber-100' : 'bg-gradient-to-br from-indigo-100 to-purple-100'} dark:opacity-5`}></div>
            
            {/* Decorative blob */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${isMorning ? 'bg-orange-400' : 'bg-indigo-500'}`}></div>

            <div className="relative z-10 flex flex-col items-start w-full">
                <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className={`p-2 rounded-xl ${isMorning ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'} dark:bg-opacity-20`}>
                            {isMorning ? (
                                <MorningIcon className="w-6 h-6" />
                            ) : (
                                <EveningIcon className="w-6 h-6" />
                            )}
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            {isMorning ? t('home_dashboard_morning') : t('home_dashboard_evening')}
                        </span>
                    </div>

                    {/* Streak Badge */}
                    {stats.streak > 0 && (
                        <div className="flex items-center space-x-1 rtl:space-x-reverse bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full border border-orange-100 dark:border-orange-800/30">
                            <FireIcon className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-bold text-orange-600 dark:text-orange-400 font-mono pt-0.5">{stats.streak}</span>
                        </div>
                    )}
                </div>
                
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white font-serif tracking-tight">
                    {t('home_greeting')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">
                    {t('welcome_subtitle')}
                </p>
            </div>
        </div>
    );
};

export const QuickAccessGrid: React.FC = () => {
    const { navigate } = useAppContext();
    const { t } = useTranslation();

    // Time-of-Day palette voices (DESIGN.md "Time-of-Day Gradient Rule"):
    //   day tiles (quran / morning / calendar / qibla) -> emerald-500 -> emerald-700
    //   evening tile -> indigo-500 -> purple-700
    // Five distinct gradients collapsed to two voices - the One Voice Rule.
    const items = [
        {
            id: 'quran',
            label: t('nav_quran'),
            gradient: 'from-emerald-500 to-emerald-700',
            icon: <BookOpenIcon className="w-6 h-6" />,
            onClick: () => navigate('quran')
        },
        {
            id: 'morning',
            label: t('home_dashboard_morning'),
            gradient: 'from-emerald-400 to-emerald-600',
            icon: '☀️',
            onClick: () => navigate('azkarList', { categoryId: 'morning' })
        },
        {
            id: 'evening',
            label: t('home_dashboard_evening'),
            gradient: 'from-indigo-500 to-purple-700',
            icon: '🌙',
            onClick: () => navigate('azkarList', { categoryId: 'evening' })
        },
        {
            id: 'calendar',
            label: 'التقويم',
            gradient: 'from-emerald-500 to-emerald-700',
            icon: <CalendarDaysIcon className="w-6 h-6" />,
            onClick: () => navigate('calendar')
        },
        {
            id: 'qibla',
            label: 'القبلة',
            gradient: 'from-emerald-500 to-emerald-700',
            icon: '🕋',
            onClick: () => navigate('qibla')
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-3 mb-8">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`w-full rounded-[1.5rem] p-4 h-24 flex flex-col justify-between items-start shadow-md hover:shadow-xl active:scale-95 transition-all bg-gradient-to-br ${item.gradient} text-white relative overflow-hidden group`}
                >
                    <div className="text-2xl bg-white/20 p-2 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                        {typeof item.icon === 'string' ? item.icon : item.icon}
                    </div>
                    <span className="font-bold text-sm leading-none opacity-90 group-hover:opacity-100">
                        {item.label}
                    </span>
                    {/* Shine effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
            ))}
        </div>
    );
};
