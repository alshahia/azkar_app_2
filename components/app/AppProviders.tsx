import React from 'react';
import { MotionConfig } from 'framer-motion';
import { RepeatSettingsProvider } from '../../context/RepeatSettingsContext';
import { QuranAudioProvider } from '../../context/QuranAudioContext';
import { ToastProvider } from '../common/Toast';
import ErrorBoundary from '../common/ErrorBoundary';
import ProviderBoundary from '../common/ProviderBoundary';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary variant="root">
      <ProviderBoundary
        name="AppRoot"
        fallback={
          <div
            className="h-full flex flex-col items-center justify-center bg-surface dark:bg-surface p-6 text-center"
            dir="rtl"
            role="alert"
          >
            <p className="text-red-600 dark:text-red-400 mb-4 font-bold">
              عذراً، حدث خطأ غير متوقع في التطبيق.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold transition-colors"
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        }
      >
        <RepeatSettingsProvider>
          <QuranAudioProvider>
            <ToastProvider>
              <MotionConfig reducedMotion="user">
                {children}
              </MotionConfig>
            </ToastProvider>
          </QuranAudioProvider>
        </RepeatSettingsProvider>
      </ProviderBoundary>
    </ErrorBoundary>
  );
}
