
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAppContext } from '../../context/AppContext';
import { GeminiService } from '../../services/GeminiService';

interface ExplainZikrModalProps {
    isOpen: boolean;
    onClose: () => void;
    zikrText: string;
    /** Bundled benefit/reference passed through so the LLM prompt stays grounded. */
    benefit?: string | null;
    reference?: string | null;
}

const ExplainZikrModal: React.FC<ExplainZikrModalProps> = ({ isOpen, onClose, zikrText, benefit, reference }) => {
    const { apiKey, darkMode } = useAppContext();
    const [explanation, setExplanation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Monotonic request id: stale responses never overwrite newer ones
    const requestIdRef = useRef(0);

    // Close on Escape while open
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen && zikrText) {
            fetchExplanation();
        } else {
            // Reset state on close; also invalidate any in-flight request
            requestIdRef.current++;
            setExplanation(null);
            setError(null);
        }
    }, [isOpen, zikrText, benefit, reference]);

    const fetchExplanation = async () => {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);
        try {
            // Prefer user settings key, fallback to env if available during build
            const effectiveKey = apiKey || process.env.API_KEY;

            if (!effectiveKey) {
                throw new Error("API_KEY_MISSING");
            }

            // Hard cap so the spinner can never spin forever
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("TIMEOUT")), 30000)
            );

            const result = await Promise.race([
                GeminiService.explainZikr(zikrText, effectiveKey, { benefit, reference }),
                timeoutPromise
            ]);

            if (requestId !== requestIdRef.current) return; // A newer request superseded this one
            setExplanation(result);
        } catch (err: any) {
            if (requestId !== requestIdRef.current) return; // Stale failure — ignore
            if (err.message === "API_KEY_MISSING" || err.message === "OFFLINE_AND_NOT_CACHED") {
                setError(err.message);
            } else {
                setError("GENERIC_ERROR");
            }
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div 
            className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 ${darkMode ? 'dark' : ''}`}
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="شرح الذكر"
                className="bg-white dark:bg-[#1A3129] w-full max-w-lg sm:rounded-2xl rounded-t-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up-mobile sm:animate-fade-in-up transition-colors duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-[#1A3129] sticky top-0 z-10">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-primary-600 dark:text-primary-400">
                        <SparklesIcon className="w-6 h-6 animate-pulse-slow" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">شرح وتدبر</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        aria-label="إغلاق" 
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-primary-100 dark:border-primary-900 rounded-full"></div>
                                <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                <SparklesIcon className="w-6 h-6 text-primary-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">جاري استدعاء المعاني...</p>
                        </div>
                    ) : error ? (
                         <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4 text-red-500">
                                <ExclamationTriangleIcon className="w-10 h-10" />
                            </div>
                            <p className="text-red-600 dark:text-red-400 mb-6 px-4 font-medium">
                                {error === "API_KEY_MISSING" || error === "OFFLINE_AND_NOT_CACHED"
                                    ? "يرجى إضافة مفتاح Google API في الإعدادات لاستخدام ميزة الشرح الذكي."
                                    : "حدث خطأ أثناء الاتصال. يرجى التحقق من الإنترنت أو المحاولة لاحقاً."}
                            </p>
                            {(error === "API_KEY_MISSING" || error === "OFFLINE_AND_NOT_CACHED") && (
                                <button 
                                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" 
                                    onClick={onClose}
                                >
                                    حسناً
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert prose-emerald max-w-none">
                            {/* Zikr Preview */}
                            <div className="mb-6 p-5 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-500/10">
                                <p className="text-lg font-serif text-center text-primary-800 dark:text-primary-100 leading-loose">
                                    {zikrText}
                                </p>
                            </div>
                            
                            {/* Explanation Content */}
                            <div className="text-gray-800 dark:text-gray-200 leading-loose whitespace-pre-wrap text-right text-lg font-sans">
                                {explanation}
                            </div>

                            {/* Footer Disclaimer */}
                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                                <p className="text-[10px] text-gray-400 flex items-center justify-center space-x-1 rtl:space-x-reverse">
                                    <SparklesIcon className="w-3 h-3" />
                                    <span>تم التوليد بواسطة Gemini AI</span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
    
    return createPortal(modalContent, document.body);
};

export default ExplainZikrModal;
