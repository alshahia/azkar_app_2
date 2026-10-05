import React, { useState, useRef } from 'react';
import { useNavigationStore } from '../../stores/useNavigationStore';
import { ArrowLeftIcon, ShareIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toPng } from 'html-to-image';
import { Share } from '@capacitor/share';
import { useToast } from '../common/Toast';
import { useTranslation } from '../../hooks/useTranslation';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const BACKGROUNDS = [
    { id: 'gradient-1', class: 'bg-gradient-to-br from-primary-500 to-teal-700', name: 'Emerald' },
    { id: 'gradient-2', class: 'bg-gradient-to-br from-slate-800 to-black', name: 'Dark' },
    { id: 'gradient-3', class: 'bg-gradient-to-br from-indigo-500 to-purple-600', name: 'Purple' },
    { id: 'gradient-4', class: 'bg-gradient-to-br from-amber-400 to-orange-600', name: 'Sunrise' },
    { id: 'solid-white', class: 'bg-white', name: 'Clean', textClass: 'text-gray-800' },
    { id: 'solid-cream', class: 'bg-sand-50', name: 'Cream', textClass: 'text-gray-700' },
];

const FONTS = [
    { id: 'amiri', class: 'font-serif', name: 'Amiri' },
    { id: 'quran', class: 'font-quran', name: 'Uthmani' },
    { id: 'sans', class: 'font-sans', name: 'Modern' },
];

const ShareEditorScreen: React.FC<{ data: any }> = ({ data }) => {
    const navigate = useNavigationStore((state) => state.navigate);
    const toast = useToast();
    const { t } = useTranslation();
    const editorRef = useRef<HTMLDivElement>(null);
    const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0]);
    const [selectedFont, setSelectedFont] = useState(FONTS[1]);
    const [fontSize, setFontSize] = useState(24);
    const [showFooter, setShowFooter] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const text = data?.text || "سبحان الله";
    const source = data?.source || "";

    const handleShare = async () => {
        if (!editorRef.current || isGenerating) return;
        setIsGenerating(true);
        try {
            await document.fonts.ready;
            const dataUrl = await toPng(editorRef.current, { cacheBust: true, pixelRatio: 2, style: { transform: 'scale(1)' } });
            
            if (Capacitor.isNativePlatform()) {
                const fileName = `azkar-share-${Date.now()}.png`;
                const base64Data = dataUrl.split(',')[1];
                const savedFile = await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data,
                    directory: Directory.Cache
                });

                await Share.share({
                    title: 'مشاركة ذكر',
                    text: `${text} ${source ? `\n(${source})` : ''}`,
                    url: savedFile.uri,
                    dialogTitle: 'مشاركة ذكر'
                });
            } else {
                const blob = await (await fetch(dataUrl)).blob();
                const file = new File([blob], 'azkar-share.png', { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'مشاركة ذكر' });
                } else {
                    const link = document.createElement('a');
                    link.download = 'azkar-share.png';
                    link.href = dataUrl;
                    link.click();
                }
            }
        } catch (err) {
            console.error(err);
            toast.show(t('error_share'), { variant: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-surface">
            <header className="flex items-center justify-between p-4 bg-surface-card dark:bg-surface-card shadow-sm dark:shadow-none z-10">
                <button onClick={() => navigate('home')} aria-label="رجوع" className="p-2 rounded-full hover:bg-surface-card-2 dark:hover:bg-midnight-800 transition-colors">
                    <ArrowLeftIcon className="w-6 h-6 text-gray-800 dark:text-white rtl:rotate-180" />
                </button>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">مشاركة كصورة</h1>
                <button 
                    onClick={handleShare}
                    disabled={isGenerating}
                    aria-busy={isGenerating}
                    aria-label={isGenerating ? 'جاري إنشاء الصورة' : undefined}
                    className="flex items-center space-x-2 rtl:space-x-reverse bg-primary-500 hover:bg-primary-600 text-white px-4 h-10 rounded-full font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                >
                    {isGenerating ? (
                        <span aria-hidden="true" className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <ShareIcon className="w-4 h-4" />
                            <span>مشاركة</span>
                        </>
                    )}
                </button>
            </header>

            <div className="flex-grow flex items-center justify-center p-6 overflow-y-auto bg-surface-card-2 dark:bg-black/20">
                <div className="w-full max-w-sm aspect-square shadow-2xl rounded-xl overflow-hidden relative">
                    <div 
                        ref={editorRef}
                        className={`w-full h-full flex flex-col justify-center items-center p-8 text-center relative ${selectedBg.class}`}
                    >
                        <div className="flex-grow flex flex-col justify-center items-center z-10 w-full">
                            <p 
                                style={{ fontSize: `${fontSize}px` }}
                                className={`${selectedFont.class} ${selectedBg.textClass || 'text-white'} leading-relaxed drop-shadow-sm`}
                            >
                                {text}
                            </p>
                            {source && (
                                <p className={`mt-6 text-sm font-medium opacity-80 ${selectedBg.textClass || 'text-white'}`}>
                                    {source}
                                </p>
                            )}
                        </div>
                        {showFooter && (
                            <div className={`absolute bottom-4 flex items-center space-x-2 rtl:space-x-reverse opacity-70 ${selectedBg.textClass || 'text-white'}`}>
                                <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center backdrop-blur-sm">
                                    <span className="font-bold text-[10px]">Azkar</span>
                                </div>
                                <span className="text-[10px] font-mono tracking-widest">AZKAR APP</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-white opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
                    </div>
                </div>
            </div>

            <div className="bg-surface-card dark:bg-surface-card p-4 border-t border-surface-card-2 dark:border-midnight-800 space-y-4 z-20">
                <div className="flex space-x-3 rtl:space-x-reverse overflow-x-auto pb-2 no-scrollbar">
                    {BACKGROUNDS.map(bg => (
                        <button
                            key={bg.id}
                            onClick={() => setSelectedBg(bg)}
                            aria-label={bg.name}
                            className={`w-10 h-10 rounded-full shrink-0 ${bg.class} border-2 transition-all ${selectedBg.id === bg.id ? 'border-primary-500 scale-110' : 'border-transparent'}`}
                            title={bg.name}
                        />
                    ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse bg-surface-card-2 dark:bg-midnight-800 rounded-lg p-1.5">
                        <button onClick={() => setFontSize(s => Math.max(14, s - 2))} aria-label="تصغير الخط" className="h-10 w-10 flex items-center justify-center rounded-md hover:text-primary-500 dark:text-gray-300">
                            <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono w-6 text-center dark:text-gray-300">{fontSize}</span>
                        <button onClick={() => setFontSize(s => Math.min(60, s + 2))} aria-label="تكبير الخط" className="h-10 w-10 flex items-center justify-center rounded-md hover:text-primary-500 dark:text-gray-300">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex space-x-2 rtl:space-x-reverse">
                         {FONTS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSelectedFont(f)}
                                aria-pressed={selectedFont.id === f.id}
                                className={`h-10 px-4 rounded-md text-xs font-bold transition-colors ${selectedFont.id === f.id ? 'bg-primary-500 text-white' : 'bg-surface-card-2 dark:bg-midnight-800 text-gray-600 dark:text-gray-300'}`}
                            >
                                {f.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={showFooter} 
                            onChange={(e) => setShowFooter(e.target.checked)} 
                            className="form-checkbox text-primary-500 rounded focus:ring-primary-500 bg-surface-card-2 dark:bg-midnight-800 border-gray-300 dark:border-gray-600" 
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-300">إظهار الشعار</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default ShareEditorScreen;
