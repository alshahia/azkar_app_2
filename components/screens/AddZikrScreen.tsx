
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import { azkarRepository } from '../../data/azkarRepository';
import { UserZikr, UserCategory } from '../../types';

const AddZikrScreen: React.FC = () => {
    const { navigate, categories, refreshData } = useAppContext();
    const { t } = useTranslation();

    const [categoryId, setCategoryId] = useState(categories[0]?.id || 'morning');
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    
    const [arabic, setArabic] = useState('');
    const [translation, setTranslation] = useState('');
    const [reference, setReference] = useState('');
    const [count, setCount] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!arabic.trim()) return;
        if (isNewCategory && !newCategoryTitle.trim()) return;

        setIsSubmitting(true);
        try {
            let finalCategoryId = categoryId;

            // Handle New Category Creation
            if (isNewCategory) {
                finalCategoryId = `custom_${Date.now()}`;
                const newCategory: UserCategory = {
                    id: finalCategoryId,
                    title: newCategoryTitle.trim()
                };
                await azkarRepository.addCategory(newCategory);
            }

            const newZikr: UserZikr = {
                id: Date.now(), // Generate a unique ID based on timestamp
                categoryId: finalCategoryId,
                arabic: arabic.trim(),
                translation: translation.trim() || null,
                transliteration: null,
                benefit: null,
                reference: reference.trim() || t('azkar_reference') + ' ' + t('report_bug_field_category_other'),
                count,
                isCustom: true
            };

            await azkarRepository.addZikr(newZikr);
            
            // CRITICAL: Refresh the app state so the new Zikr appears instantly
            await refreshData();
            
            // Navigate back to the category list to see the new item
            navigate('azkarList', { categoryId: finalCategoryId });
        } catch (error) {
            console.error('Failed to add zikr:', error);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <header className="flex items-center mb-6 relative">
                <button onClick={() => navigate('categories')} aria-label="رجوع" className="p-2 -ml-2 rtl:-mr-2 rtl:ml-0 absolute left-0 rtl:right-0 rtl:left-auto">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mx-auto">إضافة ذكر جديد</h1>
            </header>

            <div className="flex-grow overflow-y-auto space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('report_bug_field_category_label')}
                    </label>
                    
                    {!isNewCategory ? (
                        <div className="flex space-x-2 rtl:space-x-reverse">
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full bg-white dark:bg-[#1A3129] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 appearance-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                                ))}
                            </select>
                            <button 
                                onClick={() => setIsNewCategory(true)}
                                aria-label="إنشاء فئة جديدة"
                                className="bg-primary-100 dark:bg-primary-900 p-3 rounded-lg text-primary-600 dark:text-primary-400"
                                title="إنشاء فئة جديدة"
                            >
                                <PlusIcon className="w-6 h-6" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                             <input
                                type="text"
                                value={newCategoryTitle}
                                onChange={(e) => setNewCategoryTitle(e.target.value)}
                                placeholder="اسم الفئة الجديدة (مثل: أدعية رمضان)"
                                className="w-full bg-white dark:bg-[#1A3129] text-gray-900 dark:text-white border border-primary-500 rounded-lg p-3 focus:ring-2 focus:ring-primary-500"
                            />
                            <button 
                                onClick={() => setIsNewCategory(false)}
                                className="text-sm text-gray-500 hover:text-primary-500"
                            >
                                إلغاء واختيار فئة موجودة
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        نص الذكر (بالعربية) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        rows={4}
                        value={arabic}
                        onChange={(e) => setArabic(e.target.value)}
                        placeholder="أدخل نص الذكر هنا..."
                        className="w-full bg-white dark:bg-[#1A3129] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 font-serif text-lg"
                        dir="rtl"
                    ></textarea>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الترجمة أو المعنى (اختياري)
                    </label>
                    <input
                        type="text"
                        value={translation}
                        onChange={(e) => setTranslation(e.target.value)}
                        className="w-full bg-white dark:bg-[#1A3129] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="flex space-x-4 rtl:space-x-reverse">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            عدد التكرار
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                            className="w-full bg-white dark:bg-[#1A3129] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 text-center"
                        />
                    </div>
                    <div className="flex-[2]">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            المصدر (اختياري)
                        </label>
                        <input
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="مثال: رواه البخاري"
                            className="w-full bg-white dark:bg-[#1A3129] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>

            <div className="py-4">
                <button
                    onClick={handleSubmit}
                    disabled={!arabic.trim() || (isNewCategory && !newCategoryTitle.trim()) || isSubmitting}
                    className={`w-full bg-primary-500 text-white font-bold py-4 rounded-full transition-all transform active:scale-95 ${
                        !arabic.trim() || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-600'
                    }`}
                >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ الذكر'}
                </button>
            </div>
        </div>
    );
};

export default AddZikrScreen;
