
import React, { useState, useEffect } from 'react';
import { WifiIcon } from '@heroicons/react/24/solid';
import { Network } from '@capacitor/network';
import { PluginListenerHandle } from '@capacitor/core';

const OfflineIndicator: React.FC = () => {
    const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

    useEffect(() => {
        let networkListener: PluginListenerHandle | null = null;

        // Initialize status
        Network.getStatus().then(status => {
            setIsOffline(!status.connected);
        }).catch(() => {});

        // Listen for changes via Capacitor Network plugin
        Network.addListener('networkStatusChange', status => {
            setIsOffline(!status.connected);
        }).then(handle => {
            networkListener = handle;
        }).catch(() => {});

        // Web event fallbacks
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            if (networkListener) networkListener.remove();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="bg-red-500/90 backdrop-blur-sm text-white px-4 py-1 text-[10px] font-bold text-center flex items-center justify-center space-x-2 rtl:space-x-reverse absolute top-0 left-0 w-full z-50 animate-slide-down">
            <WifiIcon className="w-3 h-3" />
            <span>لا يوجد اتصال بالإنترنت - يتم عرض المحتوى المحفوظ</span>
        </div>
    );
};

export default OfflineIndicator;
