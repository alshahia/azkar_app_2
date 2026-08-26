
import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
    children: React.ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ScreenErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ScreenErrorBoundary] Uncaught error:', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-midnight-950 text-center">
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 max-w-xs w-full border border-red-100 dark:border-red-800/30">
                        <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                            حدث خطأ في هذه الصفحة
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                            {this.state.error?.message?.slice(0, 100) || 'خطأ غير متوقع'}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="flex items-center justify-center space-x-2 rtl:space-x-reverse w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2.5 px-4 rounded-xl transition-colors"
                        >
                            <ArrowPathIcon className="w-4 h-4" />
                            <span>إعادة المحاولة</span>
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ScreenErrorBoundary;
