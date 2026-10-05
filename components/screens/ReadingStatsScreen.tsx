import React, { useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, ChartBarIcon, CalendarIcon, FireIcon, BookOpenIcon } from "@heroicons/react/24/outline";

interface ReadingStatsScreenProps {
  onBack: () => void;
}

interface ReadingStats {
  totalPages: number;
  totalSurahs: number;
  dailyPages: number;
  weeklyPages: number;
  monthlyPages: number;
  streak: number;
  lastReadDate: string;
  favoriteSurah: string;
}

const DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

const STORAGE_KEY = "reading-stats";

// Built once at module scope so the lazy state initializer below stays pure
// during render (no Date call inside it).
const SAMPLE_STATS: ReadingStats = {
  totalPages: 120,
  totalSurahs: 15,
  dailyPages: 5,
  weeklyPages: 35,
  monthlyPages: 120,
  streak: 7,
  lastReadDate: new Date().toISOString().split("T")[0],
  favoriteSurah: "البقرة",
};

const readStoredStats = (): ReadingStats => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_STATS));
  return SAMPLE_STATS;
};

const ReadingStatsScreen: React.FC<ReadingStatsScreenProps> = ({ onBack }) => {
  const [stats] = useState<ReadingStats>(readStoredStats);

  const statCards = [
    { label: "إجمالي الصفحات", value: stats.totalPages, icon: BookOpenIcon, color: "emerald" },
    { label: "السور المكتملة", value: stats.totalSurahs, icon: ChartBarIcon, color: "blue" },
    { label: "صفحات اليوم", value: stats.dailyPages, icon: CalendarIcon, color: "purple" },
    { label: "أيام متتالية", value: stats.streak, icon: FireIcon, color: "orange" },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      emerald: { bg: "bg-emerald-100 dark:bg-emerald-900", text: "text-emerald-600 dark:text-emerald-400" },
      blue: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-600 dark:text-blue-400" },
      purple: { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-600 dark:text-purple-400" },
      orange: { bg: "bg-orange-100 dark:bg-orange-900", text: "text-orange-600 dark:text-orange-400" },
    };
    return colors[color] || colors.emerald;
  };

  const monthlyPercent = Math.min(100, (stats.monthlyPages / 604) * 100);
  const surahPercent = Math.min(100, (stats.totalSurahs / 114) * 100);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} aria-label="رجوع" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">إحصائيات القراءة</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {statCards.map((card, index) => {
            const colors = getColorClasses(card.color);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={"p-2 rounded-lg " + colors.bg}>
                    <card.icon className={"w-5 h-5 " + colors.text} />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-300">{card.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-4"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">التقدم الأسبوعي</h2>
          <div className="flex items-end justify-between gap-2 h-32">
            {[3, 5, 2, 7, 4, 6, 5].map((pages, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-emerald-500 rounded-t-lg transition-all"
                  style={{ height: Math.min(100, (pages / 7) * 100) + "%" }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-300">
                  {DAYS[index]}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-4"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">التقدم الشهري</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">الصفحات</span>
                <span className="text-gray-800 dark:text-white font-medium">{stats.monthlyPages} / 604</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: monthlyPercent + "%" }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-gray-300">السور</span>
                <span className="text-gray-800 dark:text-white font-medium">{stats.totalSurahs} / 114</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: surahPercent + "%" }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">الإنجازات</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <FireIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{stats.streak} أيام متتالية</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">استمر في القراءة يومياً</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <BookOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">{stats.totalSurahs} سورة مكتملة</p>
                <p className="text-sm text-gray-500 dark:text-gray-300">أكملت {stats.totalSurahs} سورة من القرآن الكريم</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReadingStatsScreen;
