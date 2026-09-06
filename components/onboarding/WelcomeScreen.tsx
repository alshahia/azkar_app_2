
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useTranslation } from '../../hooks/useTranslation';
import { getStorage } from '../../data/storage';

const WelcomeScreen: React.FC = () => {
    const { navigate, darkMode } = useAppContext();
    const { t } = useTranslation();

    const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
        <div className="bg-white/80 dark:bg-[#1A3129]/50 backdrop-blur-sm rounded-lg p-4 flex flex-col items-start text-start shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="text-2xl mb-2">{icon}</div>
            <h3 className="font-bold text-gray-900 dark:text-white transition-colors">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors">{description}</p>
        </div>
    );

    const handleSkip = async () => {
        await getStorage().setOnboardingComplete();
        navigate('home');
    };
    
    return (
        <div 
            className="h-full flex flex-col justify-between p-6 bg-cover bg-center transition-all duration-500" 
            style={{ 
                backgroundImage: darkMode 
                    ? "linear-gradient(to bottom, rgba(18, 36, 28, 0.8), rgba(18, 36, 28, 1)), url('/images/background_dark.webp')" 
                    : "linear-gradient(to bottom, rgba(255, 255, 255, 0.85), rgba(236, 253, 245, 1)), url('/images/background_light.webp')" 
            }}
        >
            <div>
                <div className="text-right">
                    <button onClick={handleSkip} className="text-gray-500 dark:text-gray-300 font-medium">{t('welcome_skip')}</button>
                </div>
                <div className="text-center mt-8">
                    <div className="inline-block bg-primary-100 dark:bg-primary-500/20 p-4 rounded-full mb-4 transition-colors">
                        <svg className="w-12 h-12 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white transition-colors">{t('welcome_title')}</h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2 transition-colors">{t('welcome_subtitle')}</p>
                </div>
                <div className="space-y-4 mt-12">
                    <FeatureCard icon="☀️" title={t('welcome_feature1_title')} description={t('welcome_feature1_desc')} />
                    <FeatureCard icon="🔔" title={t('welcome_feature2_title')} description={t('welcome_feature2_desc')} />
                    <FeatureCard icon="📈" title={t('welcome_feature3_title')} description={t('welcome_feature3_desc')} />
                </div>
            </div>
            
            <div className="text-center">
                 <div className="flex justify-center space-x-2 my-4">
                    <div className="w-2.5 h-2.5 bg-primary-500 dark:bg-primary-400 rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                <button 
                    onClick={() => navigate('notifications')}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-full transition-transform transform active:scale-95 shadow-lg shadow-primary-500/30"
                >
                    {t('welcome_button')}
                </button>
            </div>
        </div>
    );
};

export default WelcomeScreen;
