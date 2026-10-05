import React, { useState } from 'react';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { usePreferencesStore } from '../../stores/usePreferencesStore';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../common/Toast';
import { azkarRepository } from '../../data/azkarRepository';
import { UserZikr, UserCategory } from '../../types';

type FormErrors = {
    arabic?: string;
    count?: string;
    category?: string;
    translation?: string;
};

const AddZikrScreen: React.FC = () => {
    const navigate = useNavigationStore((state) => state.navigate);
    const categories = usePreferencesStore((state) => state.categories);
    const refreshData = usePreferencesStore((state) => state.refreshData);
    const { t } = useTranslation();
    const toast = useToast();

    const [categoryId, setCategoryId] = useState(categories[0]?.id || 'morning');
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    
    const [arabic, setArabic] = useState('');
    const [translation, setTranslation] = useState('');
    const [reference, setReference] = useState('');
    const [count, setCount] = useState('1');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    const clearError = (field: keyof FormErrors) => {
        setErrors(prev => {
            if (!prev[field]) return prev;
            return { ...prev, [field]: undefined };
        });
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        // Arabic text: required, must contain at least one Arabic character, max 2000 chars
        if (!arabic.trim()) {
            newErrors.arabic = 'نص الذكر مطلوب';
        } else if (!/[\u0600-\u06FF]/.test(arabic)) {
            newErrors.arabic = 'نص الذكر يجب أن يحتوي على حرف عربي واحد على الأقل';
        } else if (arabic.length > 2000) {
            newErrors.arabic = 'نص الذكر يجب ألا يتجاوز 2000 حرف';
        }

        // Count: required, integer between 1 and 999
        if (!count.trim()) {
            newErrors.count = 'عدد التكرار مطلوب';
        } else {
            const countNum = Number(count);
            if (!Number.isInteger(countNum) || countNum < 1 || countNum > 999) {
                newErrors.count = 'عدد التكرار يجب أن يكون عدداً صحيحاً بين 1 و 999';
            }
        }

        // Category: must be selected
        if (isNewCategory) {
            if (!newCategoryTitle.trim()) {
                newErrors.category = 'يرجى إدخال اسم الفئة الجديدة';
            }
        } else if (!categoryId) {
            newErrors.category = 'يرجى اختيار فئة';
        }

        // Translation: optional, max 5000 chars
        if (translation.length > 5000) {
            newErrors.translation = 'الترجمة يجب ألا تتجاوز 5000 حرف';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

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
                reference: reference.trim() || null,
                count: parseInt(count, 10),
                isCustom: true
            };

            await azkarRepository.addZikr(newZikr);
            
            // CRITICAL: Refresh the app state so the new Zikr appears instantly
            await refreshData();
            
            // Navigate back to the category list to see the new item
            navigate('azkarList', { categoryId: finalCategoryId });
        } catch (error) {
            console.error('Failed to add zikr:', error);
            toast.show('تعذّر حفظ الذكر. حاول مرة أخرى.', { variant: 'error' });
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
                    <label htmlFor={isNewCategory ? 'new-category-input' : 'category-select'} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('report_bug_field_category_label')}
                    </label>
                    
                    {!isNewCategory ? (
                        <div className="flex space-x-2 rtl:space-x-reverse">
                            <select
                                id="category-select"
                                value={categoryId}
                                onChange={(e) => {
                                    setCategoryId(e.target.value);
                                    clearError('category');
                                }}
                                className={`w-full bg-surface-card dark:bg-surface-card text-gray-900 dark:text-white border rounded-lg p-3 focus:ring-2 focus:ring-primary-500 appearance-none ${errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                                ))}
                            </select>
                            <button 
                                onClick={() => {
                                    setIsNewCategory(true);
                                    clearError('category');
                                }}
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
                                id="new-category-input"
                                type="text"
                                value={newCategoryTitle}
                                onChange={(e) => {
                                    setNewCategoryTitle(e.target.value);
                                    clearError('category');
                                }}
                                placeholder="اسم الفئة الجديدة (مثل: أدعية رمضان)"
                                className={`w-full bg-surface-card dark:bg-surface-card text-gray-900 dark:text-white border rounded-lg p-3 focus:ring-2 focus:ring-primary-500 ${errors.category ? 'border-red-500' : 'border-primary-500'}`}
                            />
                            <button 
                                onClick={() => {
                                    setIsNewCategory(false);
                                    clearError('category');
                                }}
                                className="text-sm text-gray-500 hover:text-primary-500"
                            >
                                إلغاء واختيار فئة موجودة
                            </button>
                        </div>
                    )}
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                <div>
                    <label htmlFor="arabic-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        نص الذكر (بالعربية) <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="arabic-input"
                        rows={4}
                        value={arabic}
                        onChange={(e) => {
                            setArabic(e.target.value);
                            clearError('arabic');
                        }}
                        placeholder="أدخل نص الذكر هنا..."
                        className={`w-full bg-surface-card dark:bg-surface-card text-gray-900 dark:text-white border rounded-lg p-3 focus:ring-2 focus:ring-primary-500 font-serif text-lg ${errors.arabic ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                        dir="rtl"
                    ></textarea>
                    {errors.arabic && <p className="text-red-500 text-sm mt-1">{errors.arabic}</p>}
                </div>

                <div>
                    <label htmlFor="translation-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الترجمة أو المعنى (اختياري)
                    </label>
                    <input
                        id="translation-input"
                        type="text"
                        value={translation}
                        onChange={(e) => {
                            setTranslation(e.target.value);
                            clearError('translation');
                        }}
                        className={`w-full bg-surface-card dark:bg-surface-card text-gray-900 dark:text-white border rounded-lg p-3 focus:ring-2 focus:ring-primary-500 ${errors.translation ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                    />
                    {errors.translation && <p className="text-red-500 text-sm mt-1">{errors.translation}</p>}
                </div>

                <div className="flex space-x-4 rtl:space-x-reverse">
                    <div className="flex-1">
                        <label htmlFor="count-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            عدد التكرار <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="count-input"
                            type="number"
                            min="1"
                            max="999"
                            value={count}
                            onChange={(e) => {
                                setCount(e.target.value);
                                clearError('count');
                            }}
                            className={`w-full bg-surface-card dark:bg-surface-card text-gray-900 dark:text-white border rounded-lg p-3 focus:ring-2 focus:ring-primary-500 text-center ${errors.count ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                        />
                        {errors.count && <p className="text-red-500 text-sm mt-1">{errors.count}</p>}
                    </div>
                    <div className="flex-[2]">
                        <label htmlFor="reference-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            المصدر (اختياري)
                        </label>
                        <input
                            id="reference-input"
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="مثال: رواه البخاري"
                            className="w-full bg-surface-card dark:bg-surface-card text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>

            <div className="py-4">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full bg-primary-500 text-white font-bold py-4 rounded-full transition-all transform active:scale-95 ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-600'
                    }`}
                >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ الذكر'}
                </button>
            </div>
        </div>
    );
};

export default AddZikrScreen;
