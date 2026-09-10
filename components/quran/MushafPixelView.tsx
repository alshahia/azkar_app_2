import React, { useEffect, useState } from 'react';
import { loadQuranMadinaHtml, default as QuranMadinaHtml } from '@tarekeldeeb/quran-madina-react';

interface MushafPixelViewProps {
    page: number;
    /** When true, render with the Tajweed-colored variant of the Uthmani font. */
    tajweed: boolean;
}

/**
 * "Pixel-perfect" Mushaf page renderer. Wraps the third-party
 * @tarekeldeeb/quran-madina-html web component (HTML/CSS, no images) which
 * re-flows the printed Madinah Mushaf line-by-line against a per-page layout
 * database. Same look as the printed page; font is configurable.
 *
 * The wrapper is loaded once on first mount (the library reads its config
 * from its own <script> tag, so a plain import would not work).
 */
const MushafPixelView: React.FC<MushafPixelViewProps> = ({ page, tajweed }) => {
    const [ready, setReady] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadQuranMadinaHtml({ font: tajweed ? 'Amiri Quran Colored' : 'Amiri Quran' })
            .then(() => { if (!cancelled) setReady(true); })
            .catch(e => { if (!cancelled) setErr(String(e?.message || e)); });
        return () => { cancelled = true; };
    }, [tajweed]);

    if (err) {
        return (
            <div className="p-6 text-center text-sm text-red-600 dark:text-red-400" dir="rtl">
                تعذّر تحميل عرض المصحف. تحقق من اتصال الإنترنت.
                <div className="text-[11px] text-gray-400 mt-2 ltr:text-left" dir="ltr">{err}</div>
            </div>
        );
    }
    if (!ready) {
        return (
            <div className="p-10 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400" dir="rtl">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-3" aria-hidden></div>
                <p className="text-sm">جاري تحميل المصحف...</p>
            </div>
        );
    }
    return (
        <div className="quran-pixel-frame flex justify-center py-3 px-2" dir="rtl">
            <QuranMadinaHtml page={page} font={tajweed ? 'Amiri Quran Colored' : 'Amiri Quran'} />
        </div>
    );
};

export default MushafPixelView;
