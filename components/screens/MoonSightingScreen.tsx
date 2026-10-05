import React, { useId, useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, MoonIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { formatHijriArabic, hijriMonthNameOf, hijriPartsOf } from "../../utils/hijri";

interface MoonSightingScreenProps {
  onBack: () => void;
}

/** Mean length of a lunar (synodic) month in days. */
const SYNODIC_MONTH = 29.530588853;
/** A known new moon: 2000-01-06 18:14 UTC, the standard reference epoch. */
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

/** Moon age in days: 0 at new moon, ~14.8 at full moon. */
function moonAgeOf(date: Date): number {
  const daysSinceReference = (date.getTime() - REFERENCE_NEW_MOON_MS) / 86400000;
  const age = daysSinceReference % SYNODIC_MONTH;
  return age < 0 ? age + SYNODIC_MONTH : age;
}

/** Phase name for a moon age, using the standard eight-phase boundaries. */
function phaseNameOf(moonAge: number): string {
  if (moonAge < 1.85) return "محاق (القمر الجديد)";
  if (moonAge < 5.54) return "هلال متزايد";
  if (moonAge < 9.23) return "تربيع أول";
  if (moonAge < 12.92) return "أحدب متزايد";
  if (moonAge < 16.61) return "بدر (القمر المكتمل)";
  if (moonAge < 20.3) return "أحدب متناقص";
  if (moonAge < 23.99) return "تربيع آخر";
  if (moonAge < 27.68) return "هلال متناقص";
  return "محاق (القمر الجديد)";
}

interface MoonSightingData {
  currentPhase: string;
  nextPhase: string;
  hijriDate: string;
}

/**
 * Everything the screen shows, computed once from a single "now". This is pure
 * for a given date, so it belongs in a lazy state initializer rather than in an
 * effect that sets three pieces of state after mount.
 */
function moonSightingFor(now: Date): MoonSightingData {
  const moonAge = moonAgeOf(now);
  const parts = hijriPartsOf(now);
  const monthName = hijriMonthNameOf(now);

  return {
    currentPhase: phaseNameOf(moonAge),
    nextPhase: phaseNameOf((moonAge + 1) % SYNODIC_MONTH),
    hijriDate:
      parts && monthName
        ? `${parts.day} ${monthName} ${parts.year} هـ`
        : formatHijriArabic(now),
  };
}

/**
 * The unlit part of the disc, drawn as a mask over a fully lit circle:
 * `circle` bites in from one side (crescents/gibbous phases), `half` covers
 * exactly one half (quarters), and `null` leaves the disc fully lit.
 */
type MoonShadow =
  | { type: "circle"; cx: number; r: number }
  | { type: "half"; cover: "left" | "right" }
  | null;

const MoonPhaseIcon: React.FC<{ shadow: MoonShadow; className?: string }> = ({ shadow, className }) => {
  const maskId = `moon-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <defs>
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          {shadow?.type === "circle" && <circle cx={shadow.cx} cy="12" r={shadow.r} fill="black" />}
          {shadow?.type === "half" && (
            <rect x={shadow.cover === "left" ? 0 : 12} y="0" width="12" height="24" fill="black" />
          )}
        </mask>
      </defs>
      {/* Dark side, kept faintly visible so a new moon still reads as a disc */}
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.2" />
      {/* Lit side */}
      <circle cx="12" cy="12" r="9" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
};

// Shadow circles share the disc's radius, so the terminator is the true
// circle-circle intersection: the waxing moon is lit on the right, the waning
// moon on the left, as seen from the northern hemisphere.
const moonPhases: { name: string; desc: string; shadow: MoonShadow }[] = [
  { name: "محاق (القمر الجديد)", desc: "بداية الشهر الهجري", shadow: { type: "circle", cx: 12, r: 9 } },
  { name: "هلال متزايد", desc: "بعد المحاق بـ 1-3 أيام", shadow: { type: "circle", cx: 9, r: 9 } },
  { name: "تربيع أول", desc: "بعد المحاق بـ 7 أيام", shadow: { type: "half", cover: "left" } },
  { name: "أحدب متزايد", desc: "بعد المحاق بـ 10 أيام", shadow: { type: "circle", cx: 0, r: 9 } },
  { name: "بدر (القمر المكتمل)", desc: "منتصف الشهر الهجري", shadow: null },
  { name: "أحدب متناقص", desc: "بعد البدر بـ 3 أيام", shadow: { type: "circle", cx: 24, r: 9 } },
  { name: "تربيع آخر", desc: "بعد البدر بـ 7 أيام", shadow: { type: "half", cover: "right" } },
  { name: "هلال متناقص", desc: "نهاية الشهر الهجري", shadow: { type: "circle", cx: 15, r: 9 } },
];

const cardClass =
  "bg-surface-card dark:bg-surface-card rounded-2xl p-6 shadow-sm dark:shadow-none border border-gray-100 dark:border-midnight-800";

const MoonSightingScreen: React.FC<MoonSightingScreenProps> = ({ onBack }) => {
  const [{ currentPhase, nextPhase, hijriDate }] = useState(() => moonSightingFor(new Date()));

  return (
    <div className="h-full flex flex-col bg-surface dark:bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface dark:bg-surface border-b border-gray-100 dark:border-midnight-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            aria-label="إغلاق"
            className="p-2 rounded-full hover:bg-surface-card-2 dark:hover:bg-surface-card-2 transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-xl font-bold font-serif text-gray-900 dark:text-white">مراحل القمر</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Own scroll container — as with GlobalSearch, non-main routes have no
          scrollable ancestor, so min-h-screen content used to clip. */}
      <div className="p-4 flex-grow overflow-y-auto">
        {/* Current Phase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${cardClass} mb-4`}
        >
          <div className="text-center">
            <MoonIcon className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold font-serif text-gray-900 dark:text-white mb-2">المرحلة الحالية</h2>
            <p className="text-2xl font-bold font-serif text-primary-600 dark:text-primary-400 mb-2">{currentPhase}</p>
            <p className="font-serif text-gray-500 dark:text-gray-400">المرحلة القادمة: {nextPhase}</p>
          </div>
        </motion.div>

        {/* Hijri Date */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${cardClass} mb-4`}
        >
          <div className="text-center">
            <CalendarIcon className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold font-serif text-gray-900 dark:text-white mb-2">التاريخ الهجري</h2>
            <p className="text-2xl font-bold font-serif text-primary-600 dark:text-primary-400">{hijriDate}</p>
          </div>
        </motion.div>

        {/* Moon Phases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cardClass}
        >
          <h2 className="text-lg font-semibold font-serif text-gray-900 dark:text-white mb-4">مراحل القمر</h2>
          <div className="grid grid-cols-2 gap-3">
            {moonPhases.map((phase, index) => (
              <div
                key={index}
                className="bg-surface-card-2 dark:bg-surface-card-2 rounded-xl p-4 text-center"
              >
                <MoonPhaseIcon
                  shadow={phase.shadow}
                  className="w-10 h-10 mx-auto mb-2 text-primary-500 dark:text-primary-400"
                />
                <h3 className="font-semibold font-serif text-gray-900 dark:text-white text-sm mb-1">{phase.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{phase.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Info */}
        <div className="mt-6 bg-surface-card-2 dark:bg-surface-card-2 rounded-xl p-4">
          <p className="text-sm font-serif text-gray-600 dark:text-gray-300 leading-relaxed text-center">
            مراحل القمر تساعد في تحديد بداية الشهر الهجري ونهايته، وهي مهمة لتحديد مواعيد رمضان والأعياد الإسلامية.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MoonSightingScreen;
