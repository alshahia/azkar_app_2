import React, { useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, ClockIcon, TrophyIcon, FireIcon } from "@heroicons/react/24/outline";

interface MemorizationScreenProps {
  onBack: () => void;
}

interface MemorizationProgress {
  surahId: number;
  surahName: string;
  totalAyahs: number;
  memorizedAyahs: number;
  lastPracticed: string;
  status: "not_started" | "in_progress" | "completed";
}

const STORAGE_KEY = "memorization-progress";

// Built once at module scope so the lazy state initializer below stays pure
// during render (no Date call inside it).
const TODAY = new Date().toISOString().split("T")[0];

const SAMPLE_PROGRESS: MemorizationProgress[] = [
  { surahId: 1, surahName: "الفاتحة", totalAyahs: 7, memorizedAyahs: 7, lastPracticed: TODAY, status: "completed" },
  { surahId: 2, surahName: "البقرة", totalAyahs: 286, memorizedAyahs: 50, lastPracticed: TODAY, status: "in_progress" },
  { surahId: 3, surahName: "آل عمران", totalAyahs: 200, memorizedAyahs: 0, lastPracticed: "", status: "not_started" },
  { surahId: 36, surahName: "يس", totalAyahs: 83, memorizedAyahs: 20, lastPracticed: TODAY, status: "in_progress" },
  { surahId: 55, surahName: "الرحمن", totalAyahs: 78, memorizedAyahs: 30, lastPracticed: TODAY, status: "in_progress" },
  { surahId: 56, surahName: "الواقعة", totalAyahs: 96, memorizedAyahs: 0, lastPracticed: "", status: "not_started" },
  { surahId: 67, surahName: "الملك", totalAyahs: 30, memorizedAyahs: 30, lastPracticed: TODAY, status: "completed" },
  { surahId: 112, surahName: "الإخلاص", totalAyahs: 4, memorizedAyahs: 4, lastPracticed: TODAY, status: "completed" },
  { surahId: 113, surahName: "الفلق", totalAyahs: 5, memorizedAyahs: 5, lastPracticed: TODAY, status: "completed" },
  { surahId: 114, surahName: "الناس", totalAyahs: 6, memorizedAyahs: 6, lastPracticed: TODAY, status: "completed" },
];

const readStoredProgress = (): MemorizationProgress[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PROGRESS));
  return SAMPLE_PROGRESS;
};

const MemorizationScreen: React.FC<MemorizationScreenProps> = ({ onBack }) => {
  const [progress, setProgress] = useState<MemorizationProgress[]>(readStoredProgress);

  const updateProgress = (surahId: number, memorizedAyahs: number) => {
    const updated = progress.map(p => {
      if (p.surahId === surahId) {
        const newStatus: MemorizationProgress["status"] =
          memorizedAyahs >= p.totalAyahs ? "completed" : memorizedAyahs > 0 ? "in_progress" : "not_started";
        return {
          ...p,
          memorizedAyahs,
          lastPracticed: new Date().toISOString().split("T")[0],
          status: newStatus,
        };
      }
      return p;
    });
    setProgress(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const totalMemorized = progress.reduce((sum, p) => sum + p.memorizedAyahs, 0);
  const totalAyahs = progress.reduce((sum, p) => sum + p.totalAyahs, 0);
  const completedSurahs = progress.filter(p => p.status === "completed").length;
  const inProgressSurahs = progress.filter(p => p.status === "in_progress").length;
  const overallPercent = totalAyahs > 0 ? Math.min(100, (totalMemorized / totalAyahs) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} aria-label="رجوع" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">تتبع حفظ القرآن</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <TrophyIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{completedSurahs}</p>
            <p className="text-xs text-gray-500 dark:text-gray-300">سور مكتملة</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <ClockIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{inProgressSurahs}</p>
            <p className="text-xs text-gray-500 dark:text-gray-300">قيد الحفظ</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <FireIcon className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalMemorized}</p>
            <p className="text-xs text-gray-500 dark:text-gray-300">آيات محفوظة</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">التقدم الإجمالي</h2>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-300">الآيات المحفوظة</span>
            <span className="text-gray-800 dark:text-white font-medium">{totalMemorized} / {totalAyahs}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className="bg-emerald-500 h-3 rounded-full transition-all" style={{ width: overallPercent + "%" }} />
          </div>
        </div>

        <div className="space-y-3">
          {progress.map((surah, index) => (
            <motion.div
              key={surah.surahId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{surah.surahName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{surah.memorizedAyahs} / {surah.totalAyahs} آية</p>
                </div>
                <span className={"px-3 py-1 rounded-full text-xs font-medium " + (surah.status === "completed" ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" : surah.status === "in_progress" ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300")}>
                  {surah.status === "completed" ? "مكتمل" : surah.status === "in_progress" ? "قيد الحفظ" : "لم يبدأ"}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                <div className={"h-2 rounded-full transition-all " + (surah.status === "completed" ? "bg-emerald-500" : surah.status === "in_progress" ? "bg-blue-500" : "bg-gray-400")} style={{ width: Math.min(100, (surah.memorizedAyahs / surah.totalAyahs) * 100) + "%" }} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateProgress(surah.surahId, Math.max(0, surah.memorizedAyahs - 1))} className="flex-1 px-3 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition-colors">
                  إنقاص
                </button>
                <button onClick={() => updateProgress(surah.surahId, Math.min(surah.totalAyahs, surah.memorizedAyahs + 1))} className="flex-1 px-3 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors">
                  زيادة
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemorizationScreen;
