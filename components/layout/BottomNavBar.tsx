
import React from 'react';
import { HomeIcon, ListBulletIcon, HeartIcon, Cog6ToothIcon, BookOpenIcon } from '@heroicons/react/24/solid';
import { useAppContext } from '../../context/AppContext';
import type { Screen } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';

interface BottomNavBarProps {
  activeScreen: Screen;
}

const NavItem: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
  const activeColor = 'text-primary-700 dark:text-primary-400';
  const inactiveColor = 'text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400';
  
  return (
    <button 
      onClick={onClick} 
      aria-current={isActive ? 'page' : undefined}
      className="group flex flex-col items-center justify-center w-full space-y-1 py-2 transition-all relative"
    >
      <div className={`p-1 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 -translate-y-1' : ''}`}>
        <Icon className={`h-6 w-6 transition-colors duration-300 ${isActive ? activeColor : inactiveColor}`} />
      </div>
      <span className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? activeColor : inactiveColor}`}>
        {label}
      </span>
      {isActive && (
        <div className="absolute -bottom-2 w-1 h-1 bg-primary-600 rounded-full"></div>
      )}
    </button>
  );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeScreen }) => {
  const { navigate } = useAppContext();
  const { t } = useTranslation();

  return (
    <div className="bg-white/85 dark:bg-midnight-950/85 backdrop-blur-xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] border-t border-white/50 dark:border-white/5 transition-all duration-300 pb-safe">
      <div className="flex justify-around items-center h-18 max-w-md mx-auto px-1">
        <NavItem
          icon={HomeIcon}
          label={t('nav_home')}
          isActive={activeScreen === 'home'}
          onClick={() => navigate('home')}
        />
        <NavItem
          icon={BookOpenIcon}
          label={t('nav_quran')}
          isActive={activeScreen === 'quran'}
          onClick={() => navigate('quran')}
        />
        <NavItem
          icon={ListBulletIcon}
          label={t('nav_categories')}
          isActive={activeScreen === 'categories'}
          onClick={() => navigate('categories')}
        />
        <NavItem
          icon={HeartIcon}
          label={t('nav_favorites')}
          isActive={activeScreen === 'favorites'}
          onClick={() => navigate('favorites')}
        />
        <NavItem
          icon={Cog6ToothIcon}
          label={t('nav_settings')}
          isActive={activeScreen === 'settings'}
          onClick={() => navigate('settings')}
        />
      </div>
    </div>
  );
};

export default BottomNavBar;
