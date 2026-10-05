import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { shareContent, generateShareText, getSharePlatforms } from '../../utils/share';

interface ShareCardProps {
    type: 'zikr' | 'progress' | 'khatma' | 'verse';
    data: Record<string, unknown>;
    title: string;
}

const ShareCard: React.FC<ShareCardProps> = ({ type, data, title }) => {
    const [shared, setShared] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const platforms = getSharePlatforms();

    const handleShare = async (platform?: string) => {
        setLoading(true);
        const shareText = generateShareText(type, data);
        const success = await shareContent({
            title,
            text: shareText,
        }, { platform: platform as 'native' | 'twitter' | 'whatsapp' | 'telegram' | 'copy' | undefined });
        setLoading(false);
        
        if (success) {
            setShared(true);
            setShowOptions(false);
            setTimeout(() => setShared(false), 2000);
        }
    };

    return (
        <div className="relative">
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowOptions(true)}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                    shared
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
            >
                {shared ? (
                    <>
                        <CheckIcon className="w-5 h-5" />
                        <span>تمت المشاركة</span>
                    </>
                ) : (
                    <>
                        <ShareIcon className="w-5 h-5" />
                        <span>{loading ? 'جاري المشاركة...' : 'مشاركة'}</span>
                    </>
                )}
            </motion.button>

            {/* Share options modal */}
            <AnimatePresence>
                {showOptions && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowOptions(false)}
                    >
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label="مشاركة عبر"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">مشاركة عبر</h3>
                                <button
                                    onClick={() => setShowOptions(false)}
                                    aria-label="إغلاق"
                                    className="h-10 w-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {platforms.map((platform) => (
                                    <button
                                        key={platform.id}
                                        onClick={() => handleShare(platform.id)}
                                        className="flex items-center gap-2 p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <span className="text-xl">{platform.icon}</span>
                                        <span className="text-gray-900 dark:text-white">{platform.name}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ShareCard;
