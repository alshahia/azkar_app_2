import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserZikr } from '../../types';
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePreferencesStore } from '../../stores/usePreferencesStore';

interface EditZikrModalProps {
    isOpen: boolean;
    onClose: () => void;
    zikr: UserZikr;
    onSave: (updatedZikr: UserZikr) => void;
    onDelete: (id: number) => void;
}

const EditZikrModal: React.FC<EditZikrModalProps> = ({ isOpen, onClose, zikr, onSave, onDelete }) => {
    const darkMode = usePreferencesStore((state) => state.darkMode);

    // Close on Escape while open
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);
    const [arabic, setArabic] = useState(zikr.arabic);
    const [translation, setTranslation] = useState(zikr.translation || '');
    const [reference, setReference] = useState(zikr.reference || '');
    const [count, setCount] = useState(zikr.count);
    const [mounted, setMounted] = useState(false);
    
    // UI Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                setArabic(zikr.arabic);
                setTranslation(zikr.translation || '');
                setReference(zikr.reference || '');
                setCount(zikr.count);
                setShowDeleteConfirm(false); // Reset on open
            }, 0);
        }
    }, [zikr, isOpen]);

    if (!isOpen || !mounted) return null;

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSave({
            ...zikr,
            arabic,
            translation,
            reference,
            count
        });
        onClose();
    };

    // Explicitly stop propagation to prevent the backdrop from receiving the click and closing the modal
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowDeleteConfirm(true);
    };

    const confirmDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onDelete(zikr.id);
        onClose();
    };

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowDeleteConfirm(false);
    };

    const modalContent = (
        <div 
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 ${darkMode ? 'dark' : ''}`} 
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="تعديل الذكر"
                className="bg-surface-card dark:bg-surface-card w-full max-w-sm rounded-2xl shadow-xl dark:shadow-none overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up transition-colors duration-300"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-midnight-800 flex justify-between items-center bg-surface-card dark:bg-surface-card transition-colors">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">تعديل الذكر</h2>
                    <button 
                        onClick={onClose} 
                        aria-label="إغلاق"
                        className="p-2 rounded-full hover:bg-surface-card-2 dark:hover:bg-midnight-900 transition-colors"
                        type="button"
                    >
                        <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-4 overflow-y-auto space-y-4 bg-surface-card dark:bg-surface-card transition-colors">
                    <div>
                        <label htmlFor="edit-zikr-arabic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            نص الذكر
                        </label>
                        <textarea
                            id="edit-zikr-arabic"
                            rows={4}
                            value={arabic}
                            onChange={(e) => setArabic(e.target.value)}
                            className="w-full bg-surface dark:bg-surface text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 font-serif text-lg transition-colors"
                            dir="rtl"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="edit-zikr-translation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            الترجمة / المعنى
                        </label>
                        <input
                            id="edit-zikr-translation"
                            type="text"
                            value={translation}
                            onChange={(e) => setTranslation(e.target.value)}
                            className="w-full bg-surface dark:bg-surface text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 transition-colors"
                        />
                    </div>

                     <div>
                        <label htmlFor="edit-zikr-reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            المصدر
                        </label>
                        <input
                            id="edit-zikr-reference"
                            type="text"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full bg-surface dark:bg-surface text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label htmlFor="edit-zikr-count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            العدد
                        </label>
                        <input
                            id="edit-zikr-count"
                            type="number"
                            min="1"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                            className="w-full bg-surface dark:bg-surface text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 text-center transition-colors"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-midnight-800 bg-surface dark:bg-surface flex justify-between items-center transition-colors">
                    {showDeleteConfirm ? (
                        <div className="flex items-center w-full justify-between animate-fade-in bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800">
                            <span className="text-red-600 dark:text-red-400 font-bold text-sm">هل أنت متأكد؟</span>
                            <div className="flex space-x-2 rtl:space-x-reverse">
                                <button 
                                    type="button"
                                    onClick={cancelDelete}
                                    className="px-3 py-2 bg-surface-card dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md text-sm border border-gray-300 dark:border-gray-600 hover:bg-surface-card-2"
                                >
                                    إلغاء
                                </button>
                                <button 
                                    type="button"
                                    onClick={confirmDelete}
                                    className="px-3 py-2 bg-red-500 text-white rounded-md text-sm font-bold shadow-sm hover:bg-red-600"
                                >
                                    حذف نهائي
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <button 
                                type="button"
                                onClick={handleDeleteClick}
                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2.5 rounded-lg transition-colors flex items-center space-x-1 rtl:space-x-reverse"
                            >
                                <TrashIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">حذف</span>
                            </button>
                            <button 
                                type="button"
                                onClick={handleSave}
                                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-bold shadow-md transition-transform active:scale-95"
                            >
                                حفظ
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default EditZikrModal;
