import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';

export type ToastVariant = 'info' | 'success' | 'error';

interface ToastItem {
    id: number;
    message: string;
    variant: ToastVariant;
    durationMs: number;
}

interface PendingConfirm {
    resolve: (value: boolean) => void;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
}

interface ToastContextValue {
    show: (message: string, opts?: { variant?: ToastVariant; durationMs?: number }) => void;
    confirm: (message: string, opts?: { confirmLabel?: string; cancelLabel?: string }) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook for showing a transient toast or a modal confirmation.
 * Replaces the legacy alert() / confirm() browser dialogs so the brand voice
 * stays consistent across the app (CompletionScreen already established the
 * floating-toast pattern).
 */
export const useToast = (): ToastContextValue => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
};

let nextToastId = 0;

const variantClass = (variant: ToastVariant): string => {
    if (variant === 'success') return 'bg-primary-500 text-white';
    if (variant === 'error') return 'bg-red-500 text-white';
    return 'bg-gray-900 dark:bg-gray-800 text-white';
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<ToastItem[]>([]);
    const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
    const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

    const removeToast = useCallback((id: number) => {
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const show = useCallback<ToastContextValue['show']>((message, opts) => {
        const id = ++nextToastId;
        const durationMs = opts?.durationMs ?? 3000;
        const variant = opts?.variant ?? 'info';
        setItems(prev => [...prev, { id, message, variant, durationMs }]);
        const timer = setTimeout(() => removeToast(id), durationMs);
        timersRef.current.set(id, timer);
    }, [removeToast]);

    const confirm = useCallback<ToastContextValue['confirm']>((message, opts) => {
        return new Promise<boolean>(resolve => {
            setPendingConfirm({ resolve, message, confirmLabel: opts?.confirmLabel, cancelLabel: opts?.cancelLabel });
        });
    }, []);

    const resolveConfirm = useCallback((value: boolean) => {
        setPendingConfirm(prev => {
            if (prev) prev.resolve(value);
            return null;
        });
    }, []);

    useEffect(() => {
        const timers = timersRef.current;
        return () => {
            timers.forEach(t => clearTimeout(t));
            timers.clear();
        };
    }, []);

    return (
        <ToastContext.Provider value={{ show, confirm }}>
            {children}

            <div
                aria-live="polite"
                className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-[min(90vw,24rem)]"
            >
                {items.map(item => (
                    <div
                        key={item.id}
                        role="status"
                        dir="rtl"
                        onClick={() => removeToast(item.id)}
                        className={'pointer-events-auto px-4 py-3 rounded-xl shadow-lg font-medium text-sm text-center transition-opacity duration-200 cursor-pointer ' + variantClass(item.variant)}
                    >
                        {item.message}
                    </div>
                ))}
            </div>

            {pendingConfirm && <ConfirmSheet pending={pendingConfirm} onResolve={resolveConfirm} />}
        </ToastContext.Provider>
    );
};

interface ConfirmSheetProps {
    pending: PendingConfirm;
    onResolve: (value: boolean) => void;
}

const ConfirmSheet: React.FC<ConfirmSheetProps> = ({ pending, onResolve }) => {
    const { t } = useTranslation();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onResolve(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onResolve]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-message"
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => onResolve(false)}
        >
            <div
                className="bg-white dark:bg-[#1A3129] w-full max-w-sm mx-auto rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
                onClick={e => e.stopPropagation()}
                dir="rtl"
            >
                <p id="confirm-message" className="text-gray-900 dark:text-white text-base font-medium mb-6 text-center leading-relaxed">
                    {pending.message}
                </p>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => onResolve(false)}
                        className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold transition-colors hover:bg-gray-50 dark:hover:bg-[#203c31]"
                    >
                        {pending.cancelLabel || t('toast_cancel_action')}
                    </button>
                    <button
                        type="button"
                        onClick={() => onResolve(true)}
                        className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-colors shadow-md shadow-primary-500/20"
                    >
                        {pending.confirmLabel || t('toast_confirm_action')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToastProvider;