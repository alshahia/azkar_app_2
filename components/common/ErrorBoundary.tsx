import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
    children: React.ReactNode;
    /** 'screen' shows a retry button that resets state; 'root' shows a reload button that reloads the window */
    variant?: 'screen' | 'root';
    /** Optional callback when the retry button is clicked (screen variant only) */
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Consolidated error boundary for both screen-level and root-level errors.
 *
 * - Screen variant: shows a retry button that resets the boundary state and
 *   calls the optional onReset callback. Used at the screen root.
 * - Root variant: shows a reload button that reloads the window. Used at the
 *   app root.
 */
class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        const label = this.props.variant === 'root' ? 'RootErrorBoundary' : 'ScreenErrorBoundary';
        console.error(`[${label}] Uncaught error:`, error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const isRoot = this.props.variant === 'root';
            return (
                <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-surface dark:bg-midnight-950 text-center">
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 max-w-xs w-full border border-red-100 dark:border-red-800/30">
                        <ExclamationTriangleIcon className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                            {isRoot ? 'حدث خطأ غير متوقع في التطبيق' : 'حدث خطأ في هذه الصفحة'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            {this.state.error?.message?.slice(0, 100) || 'خطأ غير متوقع'}
                        </p>
                        <button
                            onClick={isRoot ? this.handleReload : this.handleReset}
                            className="flex items-center justify-center space-x-2 rtl:space-x-reverse w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2.5 px-4 rounded-xl transition-colors"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            <span>{isRoot ? 'إعادة تحميل التطبيق' : 'إعادة المحاولة'}</span>
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
