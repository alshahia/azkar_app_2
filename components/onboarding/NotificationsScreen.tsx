
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { BellIcon, ClockIcon, HeartIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

const NotificationsScreen: React.FC = () => {
  const { navigate, toggleNotifications } = useAppContext();
  const { t } = useTranslation();

  const FeatureItem: React.FC<{ icon: React.ElementType, title: string, description: string }> = ({ icon: Icon, title, description }) => (
    <div className="flex items-start space-x-4 rtl:space-x-reverse">
      <div className="bg-primary-100 dark:bg-[#1A3129] p-3 rounded-full shrink-0">
        <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
      </div>
      <div className="text-right">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col justify-between text-center p-8">
      <div>
        <div className="inline-block bg-primary-100 dark:bg-[#1A3129] p-8 rounded-full mb-8">
          <BellIcon className="w-16 h-16 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('notifications_title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-4">
          {t('notifications_subtitle')}
        </p>

        <div className="space-y-6 mt-10">
          <FeatureItem icon={ClockIcon} title={t('notifications_feature1_title')} description={t('notifications_feature1_desc')} />
          <FeatureItem icon={HeartIcon} title={t('notifications_feature2_title')} description={t('notifications_feature2_desc')} />
          <FeatureItem icon={QuestionMarkCircleIcon} title={t('notifications_feature3_title')} description={t('notifications_feature3_desc')} />
        </div>
      </div>

      <div>
        <div className="flex justify-center space-x-2 my-4">
            <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-primary-500 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
        <button
          onClick={() => { toggleNotifications(true); navigate('personalize'); }}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 rounded-full transition-all transform active:scale-95 mb-4 shadow-lg shadow-primary-500/30"
        >
          {t('notifications_button_yes')}
        </button>
        <button
          onClick={() => { toggleNotifications(false); navigate('personalize'); }}
          className="text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200"
        >
          {t('notifications_button_no')}
        </button>
      </div>
    </div>
  );
};

export default NotificationsScreen;
