
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

const ReportBugScreen: React.FC = () => {
    const { navigate } = useAppContext();
    const { t } = useTranslation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');

    const handleSubmit = () => {
        // Construct mailto link
        const subject = encodeURIComponent(`[Azkar App Bug Report]: ${title}`);
        const body = encodeURIComponent(`
Category: ${category}
Description:
${description}

---
Device Info (Optional):
User Agent: ${navigator.userAgent}
        `);
        
        window.open(`mailto:support@azkarapp.com?subject=${subject}&body=${body}`, '_self');
        
        // Navigate back after initiating email
        // We could also show a success message toast here in a real app
        setTimeout(() => navigate('settings'), 1000);
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex items-center mb-6 relative">
                <button onClick={() => navigate('settings')} className="p-2 -ml-2 rtl:-mr-2 rtl:ml-0 absolute left-0 rtl:right-0 rtl:left-auto">
                    <ArrowLeftIcon className="w-6 h-6 text-white rtl:rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-white mx-auto text-center">{t('report_bug_title')}</h1>
            </header>
            
            <div className="flex-grow overflow-y-auto space-y-6">
                <p className="text-gray-400 text-center">{t('report_bug_subtitle')}</p>
                
                <div>
                    <label htmlFor="bug-title" className="block text-sm font-medium text-gray-300 mb-1">{t('report_bug_field_title_label')}</label>
                    <input 
                        id="bug-title"
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('report_bug_field_title_placeholder')}
                        className="w-full bg-[#1A3129] text-white placeholder-gray-500 border-transparent rounded-lg p-3 focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div>
                    <label htmlFor="bug-description" className="block text-sm font-medium text-gray-300 mb-1">{t('report_bug_field_desc_label')}</label>
                    <textarea 
                        id="bug-description"
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('report_bug_field_desc_placeholder')}
                        className="w-full bg-[#1A3129] text-white placeholder-gray-500 border-transparent rounded-lg p-3 focus:ring-2 focus:ring-emerald-500"
                    ></textarea>
                </div>

                <div>
                    <label htmlFor="bug-category" className="block text-sm font-medium text-gray-300 mb-1">{t('report_bug_field_category_label')}</label>
                    <select 
                        id="bug-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-[#1A3129] text-white border-transparent rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 appearance-none"
                    >
                        <option value="">{t('report_bug_field_category_placeholder')}</option>
                        <option value="UI/Design">{t('report_bug_field_category_ui')}</option>
                        <option value="Functionality">{t('report_bug_field_category_functionality')}</option>
                        <option value="Content">{t('report_bug_field_category_content')}</option>
                        <option value="Performance">{t('report_bug_field_category_performance')}</option>
                        <option value="Other">{t('report_bug_field_category_other')}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">{t('report_bug_attachments_label')}</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex text-sm text-gray-500 justify-center">
                                <span className="text-gray-400">المرفقات غير مدعومة في هذا الإصدار.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-500 text-center">{t('report_bug_info')}</p>
            </div>

            <div className="py-4">
                <button 
                    onClick={handleSubmit}
                    className="w-full bg-emerald-500 text-white font-bold py-4 rounded-full transition-transform transform active:scale-95"
                >
                    {t('report_bug_submit_button')}
                </button>
            </div>
        </div>
    );
};

export default ReportBugScreen;
