import React from "react";
import { useNavigationStore } from "../../stores/useNavigationStore";
import { useProgressStore } from "../../stores/useProgressStore";
import { useTranslation } from "../../hooks/useTranslation";
import { MorningIcon, EveningIcon } from "../common/CustomIcons";
import { CalendarDaysIcon, FireIcon, BookOpenIcon, SparklesIcon, MoonIcon, CalculatorIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export const WelcomeCard: React.FC = () => {
    const { t } = useTranslation();
    const stats = useProgressStore((state) => state.stats);
    const hour = new Date().getHours();
    // Time-of-Day Gradient Rule (DESIGN.md): three periods, three exact formulas.
    const isDay = hour >= 5 && hour < 17;
    const isEvening = hour >= 17 && hour < 21;
    const washGradient = isDay
        ? "from-emerald-500 to-emerald-700"
        : isEvening
            ? "from-indigo-600 to-purple-700"
            : "from-midnight-900 to-indigo-600";

    return (
        <div className="mb-6 relative overflow-hidden rounded-[2rem] bg-surface-card dark:bg-midnight-900 shadow-sm dark:shadow-none p-8 transition-all duration-300 border border-white dark:border-midnight-800 group">
            <div className={`absolute inset-0 opacity-10 dark:opacity-5 transition-colors duration-500 bg-gradient-to-br ${washGradient}`}></div>
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${isDay ? "bg-emerald-400" : isEvening ? "bg-indigo-500" : "bg-indigo-600"}`}></div>

            <div className="relative z-10 flex flex-col items-start w-full">
                <div className="flex items-center justify-between w-full mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className={`p-2 rounded-xl ${isDay ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"}`}>
                            {isDay ? (
                                <MorningIcon className="w-6 h-6" />
                            ) : isEvening ? (
                                <EveningIcon className="w-6 h-6" />
                            ) : (
                                <MoonIcon className="w-6 h-6" />
                            )}
                        </div>
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            {isDay ? t("home_dashboard_morning") : t("home_dashboard_evening")}
                        </span>
                    </div>

                    {stats.streak > 0 && (
                        <div className="flex items-center space-x-1 rtl:space-x-reverse bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full border border-amber-100 dark:border-amber-800/30">
                            <FireIcon className="w-4 h-4 text-amber-500" />
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono pt-0.5">{stats.streak}</span>
                        </div>
                    )}
                </div>
                
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white font-serif tracking-tight">
                    {t("home_greeting")}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium">
                    {t("welcome_subtitle")}
                </p>
            </div>
        </div>
    );
};

export const QuickAccessGrid: React.FC = () => {
    const navigate = useNavigationStore((state) => state.navigate);
    const { t } = useTranslation();

    const items = [
        {
            id: "quran",
            label: t("nav_quran"),
            gradient: "from-emerald-500 to-emerald-700",
            icon: <BookOpenIcon className="w-6 h-6" />,
            onClick: () => navigate("quran")
        },
        {
            id: "morning",
            label: t("home_dashboard_morning"),
            gradient: "from-emerald-500 to-emerald-700",
            icon: "☀️",
            onClick: () => navigate("azkarList", { categoryId: "morning" })
        },
        {
            id: "evening",
            label: t("home_dashboard_evening"),
            gradient: "from-indigo-600 to-purple-700",
            icon: "🌙",
            onClick: () => navigate("azkarList", { categoryId: "evening" })
        },
        {
            id: "calendar",
            label: "التقويم",
            gradient: "from-emerald-500 to-emerald-700",
            icon: <CalendarDaysIcon className="w-6 h-6" />,
            onClick: () => navigate("calendar")
        },
        {
            id: "qibla",
            label: "القبلة",
            gradient: "from-emerald-500 to-emerald-700",
            icon: "🕋",
            onClick: () => navigate("qibla")
        },
        {
            id: "focusMode",
            label: "التركيز",
            gradient: "from-purple-500 to-purple-700",
            icon: <SparklesIcon className="w-6 h-6" />,
            onClick: () => navigate("azkarList", { categoryId: "morning", initialViewMode: "focus" })
        },
        {
            id: "asmaUlHusna",
            label: "أسماء الله",
            gradient: "from-emerald-500 to-emerald-700",
            icon: "🌸",
            onClick: () => navigate("asmaUlHusna")
        },
        {
            id: "hadith",
            label: "الحديث",
            gradient: "from-emerald-500 to-emerald-700",
            icon: <BookOpenIcon className="w-6 h-6" />,
            onClick: () => navigate("hadith")
        },
        {
            id: "zakat",
            label: "الزكاة",
            gradient: "from-emerald-500 to-emerald-700",
            icon: <CalculatorIcon className="w-6 h-6" />,
            onClick: () => navigate("zakat")
        },
        {
            id: "duas",
            label: "الأدعية",
            gradient: "from-emerald-500 to-emerald-700",
            icon: "🤲",
            onClick: () => navigate("duas")
        },
        {
            id: "wordByWord",
            label: "كلمة بكلمة",
            gradient: "from-emerald-500 to-emerald-700",
            icon: "📖",
            onClick: () => navigate("wordByWord")
        },
        {
            id: "moonSighting",
            label: "مراحل القمر",
            gradient: "from-indigo-500 to-purple-700",
            icon: <MoonIcon className="w-6 h-6" />,
            onClick: () => navigate("moonSighting")
        },
        {
            id: "readingStats",
            label: "إحصائيات القراءة",
            gradient: "from-emerald-500 to-emerald-700",
            icon: <ChartBarIcon className="w-6 h-6" />,
            onClick: () => navigate("readingStats")
        },
        {
            id: "islamicLibrary",
            label: "المكتبة",
            gradient: "from-emerald-500 to-emerald-700",
            icon: <BookOpenIcon className="w-6 h-6" />,
            onClick: () => navigate("islamicLibrary")
        },
        {
            id: "memorization",
            label: "تتبع الحفظ",
            gradient: "from-emerald-500 to-emerald-700",
            icon: "🎯",
            onClick: () => navigate("memorization")
        }
    ];

    return (
        <div className="grid grid-cols-3 gap-3 mb-8">
            {items.map((item) => (
                <button
                    key={item.id}
                    onClick={item.onClick}
                    className={"w-full rounded-[1.5rem] p-3 h-24 flex flex-col justify-between items-start shadow-md hover:shadow-xl active:scale-95 transition-all bg-gradient-to-br " + item.gradient + " text-white relative overflow-hidden group dark:shadow-none dark:hover:shadow-none"}
                >
                    <div className="text-xl bg-white/20 p-1.5 rounded-full backdrop-blur-sm group-hover:scale-110 transition-transform">
                        {item.icon}
                    </div>
                    <span className="font-bold text-xs leading-tight opacity-90 group-hover:opacity-100">
                        {item.label}
                    </span>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
            ))}
        </div>
    );
};
