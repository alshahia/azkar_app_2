import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, BookOpenIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { DUAS, DUA_CATEGORIES } from "../../data/static/duas";

interface DuasScreenProps {
  onBack: () => void;
}

const DuasScreen: React.FC<DuasScreenProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDua, setSelectedDua] = useState<typeof DUAS[0] | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  const filteredDuas = selectedCategory === "all"
    ? DUAS
    : DUAS.filter(d => d.category === selectedCategory);

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
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">أدعية من القرآن والسنة</h1>
          <div className="w-10" />
        </div>

        {/* Category Filter */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            aria-expanded={showCategoryFilter}
            className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <BookOpenIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {selectedCategory === "all" ? "جميع الأدعية" : selectedCategory}
            </span>
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          </button>

          <AnimatePresence>
            {showCategoryFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => {
                    setSelectedCategory("all");
                    setShowCategoryFilter(false);
                  }}
                  className={"w-full px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors " +
                    (selectedCategory === "all" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "text-gray-800 dark:text-white")}
                >
                  جميع الأدعية
                </button>
                {DUA_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowCategoryFilter(false);
                    }}
                    className={"w-full px-4 py-3 text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors " +
                      (selectedCategory === category ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "text-gray-800 dark:text-white")}
                  >
                    {category}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Duas List */}
      <div className="flex-grow overflow-y-auto p-4">
        {filteredDuas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-300">لا توجد أدعية في هذا التصنيف</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDuas.map((dua, index) => (
              <motion.div
                key={dua.id}
                role="button"
                tabIndex={0}
                aria-label={dua.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedDua(dua)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedDua(dua);
                  }
                }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    {dua.category}
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                    {dua.source}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{dua.title}</h3>
                <p className="text-gray-800 dark:text-white leading-relaxed line-clamp-2 font-quran">{dua.arabic}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedDua && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedDua(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selectedDua.title}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-2">
                  {selectedDua.category}
                </span>
                <span className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm ml-2">
                  {selectedDua.source}
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 text-center">{selectedDua.title}</h2>
              <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 mb-4">
                <p className="text-gray-800 dark:text-white leading-relaxed text-lg font-quran text-center">
                  {selectedDua.arabic}
                </p>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-4">{selectedDua.translation}</p>
              {selectedDua.virtue && (
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-4">
                  <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed text-center">
                    {selectedDua.virtue}
                  </p>
                </div>
              )}
              <button
                onClick={() => setSelectedDua(null)}
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

export default DuasScreen;
