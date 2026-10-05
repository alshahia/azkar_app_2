import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getWordByWord } from '../../data/static/wordByWord';

interface WordByWordScreenProps {
  onBack: () => void;
}

/**
 * Word-by-word reader for Al-Fatiha. The info copy tells the user to tap a
 * word to see its translation, so the translation only renders for the
 * selected word - showing every translation up-front made the hint a lie and
 * buried the Arabic.
 */
const WordByWordScreen: React.FC<WordByWordScreenProps> = ({ onBack }) => {
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);

  const wordData = getWordByWord(1, selectedAyah);

  return (
    <div className="h-full flex flex-col bg-surface dark:bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-card dark:bg-surface-card border-b border-surface-card-2 dark:border-midnight-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            aria-label="إغلاق"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-surface-card-2 dark:hover:bg-midnight-800 transition-colors"
          >
            <XMarkIcon aria-hidden="true" className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">القرآن كلمة بكلمة</h1>
          <div className="w-11" aria-hidden="true" />
        </div>

        {/* Ayah Selector */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[1, 2, 3, 4, 5, 6, 7].map((ayah) => (
              <button
                key={ayah}
                onClick={() => {
                  setSelectedAyah(ayah);
                  setSelectedWord(null);
                }}
                aria-pressed={selectedAyah === ayah}
                className={'px-4 py-2.5 min-h-[44px] rounded-lg font-medium transition-colors ' +
                  (selectedAyah === ayah
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-card-2 dark:bg-surface-card-2 text-gray-800 dark:text-white')}
              >
                آية {ayah}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Word by Word Display — own scroll container (see KhatmaScreen). */}
      <div className="p-4 flex-grow overflow-y-auto">
        {wordData ? (
          <div className="bg-surface-card dark:bg-surface-card rounded-2xl p-6 shadow-sm dark:shadow-none border border-surface-card-2 dark:border-midnight-800">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 text-center">
              سورة الفاتحة - آية {selectedAyah}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {wordData.words.map((word, index) => {
                const isSelected = selectedWord === index;
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedWord(isSelected ? null : index)}
                    aria-pressed={isSelected}
                    className={'text-center p-3 rounded-xl transition-all ' +
                      (isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/40 ring-2 ring-primary-500'
                        : 'bg-surface-card-2 dark:bg-surface-card-2 hover:bg-surface-card dark:hover:bg-midnight-800')}
                  >
                    <p className="text-2xl font-quran text-gray-800 dark:text-white">{word.arabic}</p>
                    {isSelected && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{word.translation}</p>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-surface-card dark:bg-surface-card rounded-2xl p-6 shadow-sm dark:shadow-none border border-surface-card-2 dark:border-midnight-800 text-center">
            <p className="text-gray-500 dark:text-gray-400">البيانات غير متوفرة لهذه الآية</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
          <p className="text-sm text-primary-800 dark:text-primary-200 leading-relaxed text-center">
            اضغط على أي كلمة لرؤية ترجمتها. هذه الميزة تساعدك على فهم معاني القرآن الكريم كلمة بكلمة.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WordByWordScreen;
