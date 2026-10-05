
import React, { useState } from 'react';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { ArrowLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';

const ReportBugScreen: React.FC = () => {
    const navigate = useNavigationStore((state) => state.navigate);
    const { t } = useTranslation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (submitted) return;

        if (!title.trim() || !description.trim()) {
            setError(t('report_bug_error_required'));
            return;
        }

        setError('');
        setSubmitted(true);

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

        // Let the confirmation be read before leaving the screen.
        setTimeout(() => navigate('settings'), 1500);
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex items-center mb-6 relative">
                <button onClick={() => navigate('settings')} aria-label="رجوع" className="p-2 -ml-2 rtl:-mr-2 rtl:ml-0 absolute left-0 rtl:right-0 rtl:left-auto text-gray-900 dark:text-white">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mx-auto text-center">{t('report_bug_title')}</h1>
            </header>
            
            <div className="flex-grow overflow-y-auto space-y-6">
                <p className="text-gray-500 dark:text-gray-300 text-center">{t('report_bug_subtitle')}</p>
                
                <div>
                    <label htmlFor="bug-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('report_bug_field_title_label')}</label>
                    <input 
                        id="bug-title"
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('report_bug_field_title_placeholder')}
                        className="w-full bg-surface-card dark:bg-surface-card text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-transparent rounded-lg p-3 focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div>
                    <label htmlFor="bug-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('report_bug_field_desc_label')}</label>
                    <textarea 
                        id="bug-description"
                        rows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('report_bug_field_desc_placeholder')}
                        className="w-full bg-surface-card dark:bg-surface-card text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-transparent rounded-lg p-3 focus:ring-2 focus:ring-primary-500"
                    ></textarea>
                </div>

                <div>
                    <label htmlFor="bug-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('report_bug_field_category_label')}</label>
                    <div className="relative">
                        <select 
                            id="bug-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-surface-card dark:bg-surface-card text-gray-900 dark:text-white border border-gray-300 dark:border-transparent rounded-lg p-3 pl-10 focus:ring-2 focus:ring-primary-500 appearance-none"
                        >
                            <option value="">{t('report_bug_field_category_placeholder')}</option>
                            <option value="UI/Design">{t('report_bug_field_category_ui')}</option>
                            <option value="Functionality">{t('report_bug_field_category_functionality')}</option>
                            <option value="Content">{t('report_bug_field_category_content')}</option>
                            <option value="Performance">{t('report_bug_field_category_performance')}</option>
                            <option value="Other">{t('report_bug_field_category_other')}</option>
                        </select>
                        <ChevronDownIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('report_bug_attachments_label')}</span>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-sm text-gray-600 dark:text-gray-300">المرفقات غير مدعومة في هذا الإصدار.</p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-300 text-center">{t('report_bug_info')}</p>
            </div>

            <div className="py-4">
                {error && (
                    <p role="alert" className="text-sm text-gray-700 dark:text-gray-200 text-center mb-3">{error}</p>
                )}
                {submitted && (
                    <p role="status" className="text-sm text-primary-600 dark:text-primary-400 text-center mb-3">{t('report_bug_success')}</p>
                )}
                <button 
                    onClick={handleSubmit}
                    disabled={submitted}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-full transition-transform transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t('report_bug_submit_button')}
                </button>
            </div>
        </div>
    );
};

export default ReportBugScreen;
