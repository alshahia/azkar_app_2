import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    XMarkIcon,
    PlayIcon,
    BookmarkIcon,
    ClipboardIcon,
    ShareIcon,
    BookOpenIcon,
    Squares2X2Icon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import type { QuranAyah } from '../../services/QuranService';
import { useQuranStore } from '../../stores/useQuranStore';
import { useQuranAudio } from '../../context/QuranAudioContext';
import { copyText, shareText } from '../../utils/share';

// Mirrors the dev-detection pattern used in services/CrashReporter.ts so we
// don't regress on noisy production logs. process.env is replaced at build
// time by Vite for the browser bundle, so this resolves to false in prod.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

/**
 * Stable noop API returned by useVerseAction() when the hook runs outside a
 * <VerseActionModalContainer> provider. This is a defensive fallback for the
 * rare but real cases where the provider is missing:
 *   - a stale service worker chunk calls useVerseAction() from a location
 *     that the current code no longer renders the modal from (pre-fix
 *     layout), so React would otherwise crash the whole reader,
 *   - a future refactor accidentally hoists a useVerseAction() call above
 *     the provider,
 *   - a third-party embed renders SurahReaderScreen without the modal.
 * Every method is intentionally empty: long-press etc. silently no-op
 * rather than tearing down the screen. The object is frozen so a stray
 * mutation in the consumer can't poison the shared fallback.
 */
export const NOOP_VERSE_ACTION: Readonly<VerseActionApi> = Object.freeze({
    open: () => {},
    close: () => {},
    isOpen: false,
    target: null,
    openTafsir: () => {},
    toggleBookmark: () => {},
});

/**
 * VerseActionModalContainer (M3-T1).
 *
 * The single verse-actions surface for the Quran reader. Long-press an
 * ayah card to open it; only one modal can be open at a time, so the
 * inline action row on AyahCard remains as a discoverability cue while
 * the modal owns the canonical interaction.
 *
 * Actions exposed:
 *   - Tafsir         opens the existing TafsirSheet for the ayah
 *   - Bookmark      toggle; success toast on add/remove
 *   - Copy          single ayah text (multi-range deferred to M3 follow-up)
 *   - Share         opens the system share sheet with the verse text
 *   - Copy link     copies a permalink (surah:ayah)
 *   - Jump to mushaf switches to MushafPageScreen for the surah's first page
 *   - Play from here seeks the audio queue to this ayah
 *   - Repeat range  opens a sub-sheet to set a {from,to} repeat range
 *
 * The modal is mounted ONCE inside SurahReaderScreen (which knows the
 * surrounding audio + tafsir context). The useVerseAction() hook lets
 * any descendent open it without prop drilling.
 */

export interface VerseActionTarget {
    surah: number;
    ayah: number;
    text: string;
}

export interface VerseActionApi {
    open(target: VerseActionTarget): void;
    close(): void;
    isOpen: boolean;
    target: VerseActionTarget | null;
    /** Imperatively open the tafsir sheet for the current target. */
    openTafsir: () => void;
    /** Imperatively toggle the bookmark for the current target. */
    toggleBookmark: () => void;
}

const Ctx = createContext<VerseActionApi | null>(null);

export function useVerseAction(): VerseActionApi {
    // Defensive: a corrupted SW cache, a future refactor that hoists the
    // call above the provider, or a third-party embed rendering
    // SurahReaderScreen without the modal all make useContext resolve to
    // null, so we return a stable noop API instead of crashing the reader.
    // The noop fallback keeps the screen interactive — long-press silently
    // does nothing instead of nuking the page.
    const ctxOrNull = useContext(Ctx);
    if (!ctxOrNull) {
        if (isDev) {
            console.warn('[useVerseAction] no <VerseActionModalContainer> provider found; using noop fallback.');
        }
        return NOOP_VERSE_ACTION as VerseActionApi;
    }
    return ctxOrNull;
}

interface VerseActionModalContainerProps {
    /**
     * Full ayah metadata. Unused today (the tafsir action reads the text from
     * the target), but kept in the public contract - existing callers and tests
     * still pass it - so it is optional.
     */
    ayahLookup?: (surah: number, ayah: number) => QuranAyah | undefined;
    openTafsir: (surah: number, ayah: number) => void;
    /** Optional: jump to a specific Mushaf page. Default goes to page 1. */
    jumpToMushaf: (surah: number) => void;
    /** Optional: open the repeat-range picker for (from..current). */
    openRepeatRange: (surah: number, ayah: number) => void;
    /** Optional: show a toast after bookmark toggles. Default no-op. */
    onToast?: (message: string) => void;
    /** Optional: bilingual label fetcher for verse/ayah/toggle. */
    labels: {
        title: string;
        play: string;
        bookmark: string;
        bookmarkRemove: string;
        tafsir: string;
        copy: string;
        copyLink: string;
        share: string;
        mushaf: string;
        repeat: string;
        close: string;
    };
}

export const VerseActionModalContainer: React.FC<{ children: React.ReactNode } & VerseActionModalContainerProps> = ({
    children,
    // Kept in the public prop contract (existing callers and tests pass it) and
    // intentionally unused for now - the underscore alias documents that.
    ayahLookup: _ayahLookup,
    openTafsir,
    jumpToMushaf,
    openRepeatRange,
    onToast,
    labels,
}) => {
    const bookmarks = useQuranStore((state) => state.bookmarks);
    const addBookmark = useQuranStore((state) => state.addBookmark);
    const removeBookmark = useQuranStore((state) => state.removeBookmark);
    const { play } = useQuranAudio();

    const [target, setTarget] = useState<VerseActionTarget | null>(null);

    const api = useMemo<VerseActionApi>(() => ({
        open: (next) => setTarget(next),
        close: () => setTarget(null),
        isOpen: target !== null,
        target,
        openTafsir: () => {
            if (!target) return;
            openTafsir(target.surah, target.ayah);
            setTarget(null);
        },
        toggleBookmark: () => {
            if (!target) return;
            const isMarked = bookmarks.some(b => b.surah === target.surah && b.ayah === target.ayah);
            if (isMarked) removeBookmark(target.surah, target.ayah);
            else addBookmark({ surah: target.surah, ayah: target.ayah, createdAt: Date.now() });
            setTarget(null);
        },
    }), [target, bookmarks, addBookmark, removeBookmark, openTafsir]);

    const onPlay = useCallback(() => {
        if (!target) return;
        play(target.surah, target.ayah, { source: 'user' });
        setTarget(null);
    }, [target, play]);

    const onMushaf = useCallback(() => {
        if (!target) return;
        jumpToMushaf(target.surah);
        setTarget(null);
    }, [target, jumpToMushaf]);

    const onRepeat = useCallback(() => {
        if (!target) return;
        openRepeatRange(target.surah, target.ayah);
        setTarget(null);
    }, [target, openRepeatRange]);

    const onCopy = useCallback(async () => {
        if (!target) return;
        await copyText(target.text);
        if (onToast) onToast('تم النسخ');
        setTarget(null);
    }, [target, onToast]);

    const onCopyLink = useCallback(async () => {
        if (!target) return;
        await copyText(target.surah + ':' + target.ayah);
        if (onToast) onToast('تم نسخ الرابط');
        setTarget(null);
    }, [target, onToast]);

    const onShare = useCallback(async () => {
        if (!target) return;
        await shareText('سورة ' + target.surah + ' - آية ' + target.ayah, target.text);
        setTarget(null);
    }, [target]);

    const isBookmarked = !!target && bookmarks.some(b => b.surah === target.surah && b.ayah === target.ayah);

    // Escape closes the sheet, focus lands inside it on open and returns to the
    // trigger on close. The backdrop click closes it as well.
    const sheetRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!target) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setTarget(null);
        };
        document.addEventListener('keydown', onKey);
        const previous = document.activeElement as HTMLElement | null;
        sheetRef.current?.focus();
        return () => {
            document.removeEventListener('keydown', onKey);
            previous?.focus?.();
        };
    }, [target]);

    return (
        <Ctx.Provider value={api}>
            {children}
            <AnimatePresence>
                {target && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/50 z-40"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setTarget(null)}
                        />
                        <motion.div
                            ref={sheetRef}
                            tabIndex={-1}
                            className="fixed inset-x-3 bottom-3 z-50 bg-surface-card dark:bg-surface rounded-2xl shadow-2xl max-w-md mx-auto overflow-hidden outline-none"
                            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            role="dialog"
                            aria-modal="true"
                            aria-label={labels.title}
                            dir="rtl"
                        >
                            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-card-2 dark:border-midnight-800">
                                <p className="font-quran text-base text-gray-800 dark:text-gray-100 truncate">
                                    {labels.title}
                                </p>
                                <button
                                    onClick={() => setTarget(null)}
                                    aria-label={labels.close}
                                    className="p-1.5 rounded-full hover:bg-surface-card-2 dark:hover:bg-midnight-800"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-3 text-gray-700 dark:text-gray-200 text-[12px]">
                                <ActionTile icon={<PlayIcon className="w-5 h-5" />} label={labels.play} onClick={onPlay} />
                                <ActionTile
                                    icon={isBookmarked ? <BookmarkSolid className="w-5 h-5 text-primary-500" /> : <BookmarkIcon className="w-5 h-5" />}
                                    label={isBookmarked ? labels.bookmarkRemove : labels.bookmark}
                                    onClick={() => api.toggleBookmark()}
                                />
                                <ActionTile icon={<BookOpenIcon className="w-5 h-5" />} label={labels.tafsir} onClick={() => api.openTafsir()} />
                                <ActionTile icon={<ClipboardIcon className="w-5 h-5" />} label={labels.copy} onClick={() => void onCopy()} />
                                <ActionTile icon={<ShareIcon className="w-5 h-5" />} label={labels.share} onClick={() => void onShare()} />
                                <ActionTile icon={<ClipboardIcon className="w-5 h-5 opacity-70" />} label={labels.copyLink} onClick={() => void onCopyLink()} />
                                <ActionTile icon={<Squares2X2Icon className="w-5 h-5" />} label={labels.mushaf} onClick={onMushaf} />
                                <ActionTile icon={<ArrowPathIcon className="w-5 h-5" />} label={labels.repeat} onClick={onRepeat} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Ctx.Provider>
    );
};

interface ActionTileProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}
const ActionTile: React.FC<ActionTileProps> = ({ icon, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-surface-card-2 dark:border-midnight-800 hover:border-primary-300 dark:hover:border-primary-500/40 hover:bg-surface-card-2 dark:hover:bg-surface-card active:scale-95 transition"
    >
        {icon}
        <span>{label}</span>
    </button>
);

export default VerseActionModalContainer;
