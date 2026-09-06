
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MagnifyingGlassIcon, ChevronRightIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

const CategoriesScreen: React.FC = () => {
  const { navigate, categories } = useAppContext();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.filter(category =>
    category.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 h-full flex flex-col relative bg-slate-50/50 dark:bg-transparent">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white text-center mb-8 tracking-tight">{t('categories_title')}</h1>
      
      {/* Search Bar - Floating Style */}
      <div className="relative mb-8 z-10">
        <div className="absolute left-4 rtl:right-4 rtl:left-auto top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder={t('categories_search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-[#1A3129] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-2xl py-4 pl-12 pr-4 rtl:pr-12 rtl:pl-4 focus:ring-2 focus:ring-primary-500/50 focus:outline-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none transition-all"
        />
      </div>

      <div className="flex-grow overflow-y-auto pb-24 px-1 -mx-1">
        {filteredCategories.map(category => (
          <button 
            key={category.id} 
            onClick={() => navigate('azkarList', { categoryId: category.id })}
            className="w-full flex items-center justify-between p-5 mb-4 bg-white dark:bg-[#1A3129] rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:bg-[#203c31] shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-transparent dark:border-gray-800 group relative"
          >
            <div className="flex items-center space-x-5 rtl:space-x-reverse">
              {/* Islamic Star Icon Container - Filled Style */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <div className="absolute inset-0 bg-primary-50 dark:bg-[#12241C] rounded-xl rotate-45 transition-colors group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30"></div>
                  <div className="absolute inset-0 bg-primary-50 dark:bg-[#12241C] rounded-xl transition-colors group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30"></div>
                  {/* Standard Icon */}
                  <category.icon className="relative w-7 h-7 text-primary-600 dark:text-primary-400 transition-transform duration-300 group-hover:scale-110" />
              </div>
              
              <div className="flex flex-col items-start space-y-1">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <p className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                        {category.title}
                    </p>
                    {category.isUserCreated && (
                        <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                            <TagIcon className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                            شخصي
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">
                    {category.count} {category.id === 'quranic' ? t('categories_duas_count') : t('categories_azkar_count')}
                </p>
              </div>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 rtl:rotate-180 group-hover:text-white" />
            </div>
          </button>
        ))}
      </div>

      {/* Floating Action Button for Adding Custom Zikr */}
      <button 
        onClick={() => navigate('addZikr')}
        aria-label="إضافة ذكر جديد"
        className="absolute bottom-6 left-6 rtl:right-auto rtl:left-6 w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl shadow-xl shadow-primary-600/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-20 group"
      >
        <PlusIcon className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
};

export default CategoriesScreen;
