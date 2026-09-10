/**
 * What's-new modal (M4-T4).
 *
 * Mounted once at app level (post-onboarding) by App.tsx. When the user's
 * `lastSeenVersion` is older than the current app version (or null on
 * first launch), the modal renders the entries shipped between the two
 * versions. The user dismisses once; the choice is persisted.
 *
 * The modal is read-only — the brand posture is calm, not pushy. No
 * "Don't show again" toggle, no CTA button: tapping the close button is
 * the only action.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { loadChangelogEntries, entriesSince, type ChangelogEntry } from '../../utils/changelog';

interface WhatsNewModalProps {
    /** True when the modal should be visible. App.tsx owns this state. */
    isOpen: boolean;
    /** User's last-seen version (null on first launch). */
    lastSeenVersion: string | null;
    /** Current app version, e.g. "1.1.0". */
    currentVersion: string;
    onDismiss: (newLastSeenVersion: string) => void;
}

/** Single-entry renderer. Kept dumb so the parent can reuse it for
 *  tests or future print views. */
const ChangelogBlock: React.FC<{ entry: ChangelogEntry }> = ({ entry }) => (
    <section className="mb-5 last:mb-0" data-testid={`changelog-${entry.version}`}>
        <header className="flex items-baseline justify-between mb-2">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                الإصدار {entry.version}
            </h3>
            {entry.date && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{entry.date}</span>
            )}
        </header>
        <ul className="space-y-1.5 list-none pr-0">
            {entry.bullets.map((bullet, idx) => (
                <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200 leading-relaxed"
                >
                    <span className="text-primary-500 mt-1 shrink-0" aria-hidden="true">•</span>
                    <span>{bullet}</span>
                </li>
            ))}
        </ul>
    </section>
);

const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
    isOpen,
    lastSeenVersion,
    currentVersion,
    onDismiss,
}) => {
    const [newEntries, setNewEntries] = useState<ChangelogEntry[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        if (!isOpen) {
            // Defer the clear to a microtask so the effect body doesn't
            // setState synchronously (react-hooks v7 set-state-in-effect).
            queueMicrotask(() => { if (!cancelled) setNewEntries(null); });
            return () => { cancelled = true; };
        }
        loadChangelogEntries().then((all) => {
            if (cancelled) return;
            entriesSince(lastSeenVersion, all).then((filtered) => {
                if (cancelled) return;
                setNewEntries(filtered);
            });
        });
        return () => { cancelled = true; };
    }, [isOpen, lastSeenVersion]);

    if (!isOpen) return null;
    if (newEntries === null) return null; // still loading
    if (newEntries.length === 0) return null;

    const handleDismiss = () => {
        const highest = newEntries.reduce((acc, e) =>
            !acc || compareDesc(e.version, acc) > 0 ? e.version : acc, '' as string);
        onDismiss(highest || currentVersion);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="whats-new-title"
                data-testid="whats-new-modal"
                onClick={handleDismiss}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-[#1A3129] rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <header className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-primary-500" />
                            <h2 id="whats-new-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                جديد في التطبيق
                            </h2>
                        </div>
                        <button
                            onClick={handleDismiss}
                            aria-label="إغلاق"
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5 text-gray-500" />
                        </button>
                    </header>

                    <div className="overflow-y-auto p-5 flex-1">
                        {newEntries.map((entry) => (
                            <ChangelogBlock key={entry.version} entry={entry} />
                        ))}
                    </div>

                    <footer className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={handleDismiss}
                            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-lg transition-colors"
                            data-testid="whats-new-dismiss"
                        >
                            متابعة
                        </button>
                    </footer>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

/** Internal: compare two semver strings descending. Returns >0 when `a`
 *  is newer than `b`. Mirrors compareSemver but inlined to avoid an
 *  import cycle in this file (the modal is the only consumer). */
function compareDesc(a: string, b: string): number {
    const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
    const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const x = pa[i] ?? 0;
        const y = pb[i] ?? 0;
        if (x !== y) return x - y;
    }
    return 0;
}

export default WhatsNewModal;
