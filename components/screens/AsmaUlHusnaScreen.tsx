import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { ASMA_UL_HUSNA } from '../../data/static/asmaUlHusna';

interface AsmaUlHusnaScreenProps {
  onBack: () => void;
}

// Tashkeel, superscript alef and tatweel are stripped before matching, so a
// plain-Arabic query ("الرحمن") still finds the vocalised name ("الرَّحْمَنُ").
const ARABIC_DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;
const ALEF_VARIANTS = /[\u0622\u0623\u0625\u0671]/g;

const normalizeArabic = (value: string) =>
  value.replace(ARABIC_DIACRITICS, '').replace(ALEF_VARIANTS, '\u0627');

const AsmaUlHusnaScreen: React.FC<AsmaUlHusnaScreenProps> = ({ onBack }) => {
  const [selectedName, setSelectedName] = useState<typeof ASMA_UL_HUSNA[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Drop any queued recitation when the screen is left.
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const trimmedQuery = searchQuery.trim();
  const normalizedQuery = normalizeArabic(trimmedQuery);

  const filteredNames = ASMA_UL_HUSNA.filter(
    (name) =>
      normalizeArabic(name.name).includes(normalizedQuery) ||
      name.meaning.toLowerCase().includes(trimmedQuery.toLowerCase())
  );

  const handlePlayAudio = (name: string) => {
    // Use Web Speech API for audio
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(name);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            aria-label="رجوع"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">أسماء الله الحسنى</h1>
          <div className="w-10" />
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <input
            type="text"
            placeholder="ابحث عن اسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Names Grid */}
      <div className="flex-grow overflow-y-auto p-4">
        {filteredNames.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-300">لا توجد نتائج مطابقة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredNames.map((name, index) => (
              <motion.div
                key={name.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={name.name + ' - ' + name.meaning}
                    onClick={() => setSelectedName(name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedName(name);
                      }
                    }}
                    className="flex-1 flex items-center gap-3 cursor-pointer"
                  >
                    <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0">
                      {name.id}
                    </span>
                    <div>
                      <h3 className="text-2xl font-quran text-gray-800 dark:text-white">{name.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">{name.meaning}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(name.name)}
                    aria-label={'استماع إلى ' + name.name}
                    className="p-2.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-colors shrink-0"
                  >
                    <SpeakerWaveIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedName(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selectedName.name}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <span className="inline-block w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-2xl mb-4">
                  {selectedName.id}
                </span>
                <h2 className="text-4xl font-quran text-gray-800 dark:text-white mb-2">{selectedName.name}</h2>
                <p className="text-lg text-gray-500 dark:text-gray-300 mb-4">{selectedName.meaning}</p>
                {selectedName.virtue && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 mb-4">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
                      {selectedName.virtue}
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePlayAudio(selectedName.name)}
                    className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <SpeakerWaveIcon className="w-5 h-5" />
                    استماع
                  </button>
                  <button
                    onClick={() => setSelectedName(null)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-medium transition-colors"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AsmaUlHusnaScreen;
