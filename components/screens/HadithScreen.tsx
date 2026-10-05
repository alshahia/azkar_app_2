import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, BookOpenIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { HADITH_COLLECTIONS, HADITH_COLLECTIONS_LIST } from "../../data/static/hadith";

interface HadithScreenProps {
  onBack: () => void;
}

const HadithScreen: React.FC<HadithScreenProps> = ({ onBack }) => {
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [selectedHadith, setSelectedHadith] = useState<typeof HADITH_COLLECTIONS[0] | null>(null);
  const [showCollectionFilter, setShowCollectionFilter] = useState(false);

  const filteredHadiths = selectedCollection === "all"
    ? HADITH_COLLECTIONS
    : HADITH_COLLECTIONS.filter(h => h.collection === selectedCollection);

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
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">الحديث النبوي</h1>
          <div className="w-10" />
        </div>

        {/* Collection Filter */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowCollectionFilter(!showCollectionFilter)}
            aria-expanded={showCollectionFilter}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <BookOpenIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {selectedCollection === "all" ? "جميع المجموعات" : selectedCollection}
            </span>
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          </button>

          <AnimatePresence>
            {showCollectionFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => {
                    setSelectedCollection("all");
                    setShowCollectionFilter(false);
                  }}
                  className={"w-full px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors " +
                    (selectedCollection === "all" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "text-gray-800 dark:text-white")}
                >
                  جميع المجموعات
                </button>
                {HADITH_COLLECTIONS_LIST.map((collection) => (
                  <button
                    key={collection}
                    onClick={() => {
                      setSelectedCollection(collection);
                      setShowCollectionFilter(false);
                    }}
                    className={"w-full px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors " +
                      (selectedCollection === collection ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "text-gray-800 dark:text-white")}
                  >
                    {collection}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hadiths List */}
      <div className="flex-grow overflow-y-auto p-4">
        {filteredHadiths.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-300">لا توجد أحاديث في هذه المجموعة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHadiths.map((hadith, index) => (
              <motion.div
                key={hadith.id}
                role="button"
                tabIndex={0}
                aria-label={hadith.narrator + " - " + hadith.collection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedHadith(hadith)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedHadith(hadith);
                  }
                }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    {hadith.collection}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                    {hadith.reference}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">{hadith.narrator}</p>
                <p className="text-gray-800 dark:text-white leading-relaxed line-clamp-3 font-quran">{hadith.text}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedHadith && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedHadith(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selectedHadith.narrator + " - " + selectedHadith.collection}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-2">
                  {selectedHadith.collection}
                </span>
                <span className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm ml-2">
                  {selectedHadith.grade}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-4 text-center">{selectedHadith.narrator}</p>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 mb-4">
                <p className="text-gray-800 dark:text-white leading-relaxed text-lg font-quran">
                  {selectedHadith.text}
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-300 text-center mb-4">
                المرجع: {selectedHadith.reference}
              </p>
              <button
                onClick={() => setSelectedHadith(null)}
                className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
              >
                إغلاق
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HadithScreen;
