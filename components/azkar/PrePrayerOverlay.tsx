
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, BookOpenIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { PrayerTimesService } from '../../services/PrayerTimesService';
import { HapticService } from '../../services/HapticService';
import {
    type WatchedPrayer,
    DEFAULT_OVERLAY_DURATION_MS,
} from '../../data/prayerWatch';

interface PrePrayerOverlayProps {
    /** The prayer to surface. Null when nothing is being watched. */
    prayer: WatchedPrayer | null;
    /** How long until auto-dismiss (ms). Default 10s matches the spec. */
    durationMs?: number;
    /**
     * Tap-the-CTA handler — caller decides where to navigate. The overlay
     * itself does not import AppContext so it stays free of the screen
     * router, which keeps it testable and re-usable from any host.
     */
    onOpenAdhkar: (prayer: WatchedPrayer) => void;
    /** Dismiss handler — called when user taps X, the backdrop, or when
     *  the auto-dismiss timer expires. */
    onDismiss: (prayer: WatchedPrayer) => void;
    /**
     * Whether to attempt speech synthesis on entry. Caller passes the
     * user's `prayerNotificationsEnabled` preference so we never speak
     * over a user who muted prayers.
     */
    audioEnabled: boolean;
}

/**
 * PrePrayerOverlay — the sacred-moment surface.
 *
 * Design notes (DESIGN.md reference):
 * - Mode = Operate. Delight lives in the *moment of prayer*, not in
 *   chrome. The overlay is full-column, dark, low-saturation. The hero
 *   is the prayer name in Amiri serif (calligraphic register), not a
 *   stock illustration.
 * - The CTA is *one tap*: open the `adhan` category of adhkar
 *   ("أذكار عند سماع الآذان"), so the user is already reading the
 *   right words when the athan finishes.
 * - Auto-dismiss after 10s is generous but bounded. The countdown bar
 *   gives the user a tactile sense of the moment without making it
 *   mandatory. They can keep it open by tapping; they can dismiss with
 *   one tap on the X.
 * - Haptics: `HapticService.heavy()` on appear (a single thock, not a
 *   buzz) and `HapticService.selection()` on the CTA. The user opted
 *   into haptics at the app level; we never override that.
 */
const PrePrayerOverlay: React.FC<PrePrayerOverlayProps> = ({
    prayer,
    durationMs = DEFAULT_OVERLAY_DURATION_MS,
    onOpenAdhkar,
    onDismiss,
    audioEnabled,
}) => {
    const [countdownMs, setCountdownMs] = useState(durationMs);
    const dismissedRef = useRef<WatchedPrayer | null>(null);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Reset countdown + spoken audio when a new prayer arrives
    useEffect(() => {
        if (!prayer) return;
        // Don't re-arm if the same prayer was already dismissed this watch
        if (dismissedRef.current?.time.getTime() === prayer.time.getTime()) {
            return;
        }
        dismissedRef.current = null;
        setCountdownMs(durationMs);

        // Single thock haptic — heavy because this is a sacred moment,
        // not a button confirm. Falls through to no-op if haptics off.
        HapticService.heavy().catch(() => {});

        // Optional speech synthesis. We speak the prayer name with a
        // brief "حان الآن" preamble so the user can hear the moment
        // without looking at the screen. Falls back silently if the
        // browser blocks autoplay before the first user gesture.
        if (audioEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
                const u = new SpeechSynthesisUtterance(
                    `حان الآن موعد صلاة ${prayer.name}`,
                );
                u.lang = 'ar-SA';
                u.rate = 0.9;
                u.pitch = 1.0;
                u.volume = 0.85;
                speechRef.current = u;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(u);
            } catch {
                // Speech synthesis is best-effort; never block the overlay
                // if the browser refuses.
            }
        }

        return () => {
            if (speechRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [prayer, durationMs, audioEnabled]);

    // Countdown tick
    useEffect(() => {
        if (!prayer) return;
        const start = Date.now();
        const initialRemaining = durationMs;
        const tick = () => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, initialRemaining - elapsed);
            setCountdownMs(remaining);
            if (remaining <= 0) {
                handleDismiss();
            }
        };
        const interval = window.setInterval(tick, 100);
        return () => window.clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prayer, durationMs]);

    const handleDismiss = () => {
        if (!prayer) return;
        if (dismissedRef.current?.time.getTime() === prayer.time.getTime()) return;
        dismissedRef.current = prayer;
        HapticService.light().catch(() => {});
        if (speechRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        onDismiss(prayer);
    };

    const handleOpenAdhkar = () => {
        if (!prayer) return;
        HapticService.light().catch(() => {});
        if (speechRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        onOpenAdhkar(prayer);
    };

    return (
        <AnimatePresence>
            {prayer && (
                <motion.div
                    key={prayer.time.getTime()}
                    role="dialog"
                    aria-modal="true"
                    aria-live="assertive"
                    aria-label={`حان الآن موعد صلاة ${prayer.name}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md"
                    onClick={handleDismiss}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-[88vw] max-w-sm mx-auto bg-gradient-to-b from-[#0f2820] via-[#0a1d17] to-[#04140f] border border-primary-500/30 rounded-3xl px-7 pt-9 pb-6 shadow-2xl shadow-black/60 text-center"
                    >
                        {/* Background decoration — soft green halo, matches the brand's dawn-lit sanctuary */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary-500/15 rounded-full blur-3xl -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary-400/10 rounded-full blur-2xl translate-y-1/3 translate-x-1/3" />
                        </div>

                        {/* Eyebrow */}
                        <div className="relative flex items-center justify-center gap-2 text-primary-300/90 text-xs font-bold tracking-widest mb-5">
                            <SpeakerWaveIcon className="w-4 h-4" aria-hidden="true" />
                            <span>حان الآن</span>
                        </div>

                        {/* Hero: prayer name in Amiri serif, the calligraphic register of the product */}
                        <h1 className="relative font-serif font-bold text-5xl text-white mb-2 leading-tight">
                            صلاة {prayer.name}
                        </h1>

                        {/* Time */}
                        <div className="relative font-mono text-2xl text-primary-200/80 mb-6 tabular-nums">
                            {PrayerTimesService.formatTime(prayer.time)}
                        </div>

                        {/* Subcopy */}
                        <p className="relative text-sm text-gray-300/80 mb-6 leading-relaxed">
                            أقبل على الصلاة بسكينة، فإنها خير من كل ما كنت فيه.
                        </p>

                        {/* Primary CTA: open the adhan-category adhkar */}
                        <button
                            onClick={handleOpenAdhkar}
                            className="relative w-full bg-primary-500 hover:bg-primary-400 text-white font-bold py-3.5 px-4 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 mb-3"
                        >
                            <BookOpenIcon className="w-5 h-5" aria-hidden="true" />
                            <span>افتح أذكار الآذان</span>
                        </button>

                        {/* Auto-dismiss progress bar — gives the user a sense of the moment without nagging */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 rounded-b-3xl overflow-hidden">
                            <motion.div
                                className="h-full bg-primary-400/70 origin-left"
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: countdownMs / durationMs }}
                                transition={{ duration: 0.1, ease: 'linear' }}
                            />
                        </div>

                        {/* Close X — top-right corner, accessible */}
                        <button
                            onClick={handleDismiss}
                            aria-label="إغلاق"
                            className="absolute top-3 left-3 rtl:left-auto rtl:right-3 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PrePrayerOverlay;
