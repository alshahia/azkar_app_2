
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

const AboutUsScreen: React.FC = () => {
    const { navigate } = useAppContext();
    const { t } = useTranslation();

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex items-center mb-6 relative">
                <button onClick={() => navigate('settings')} className="p-2 -ml-2 rtl:-mr-2 rtl:ml-0 absolute left-0 rtl:right-0 rtl:left-auto">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mx-auto">{t('settings_about_us')}</h1>
            </header>

            <div className="flex-grow overflow-y-auto text-center space-y-6 px-4">
                <div className="my-8">
                    <img src="/images/icon.png" alt="App Logo" className="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-lg" />
                    <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">تطبيق أذكار</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">الإصدار 1.0.0</p>
                </div>

                <div className="bg-white dark:bg-[#1A3129] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-none text-right">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        تطبيق أذكار هو رفيقك اليومي للحفاظ على وردك من الأذكار والأدعية. تم تصميم التطبيق ليكون سهلاً، جميلاً، ومساعداً لك في رحلتك الإيمانية.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        يتميز التطبيق بإمكانية العمل بدون إنترنت، الوضع الليلي المريح للعين، وتذكيرات ذكية لمساعدتك على الاستمرار.
                    </p>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>نسأل الله أن يتقبل منا ومنكم صالح الأعمال.</p>
                </div>
            </div>
        </div>
    );
};

export default AboutUsScreen;
