import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';

interface OfflineStatus {
    isOnline: boolean;
    isOffline: boolean;
    wasOffline: boolean;
}

export function useOfflineStatus(): OfflineStatus {
    const [status, setStatus] = useState<OfflineStatus>({
        isOnline: navigator.onLine,
        isOffline: !navigator.onLine,
        wasOffline: false,
    });

    useEffect(() => {
        const handleOnline = () => {
            setStatus(prev => ({
                isOnline: true,
                isOffline: false,
                wasOffline: prev.isOffline || prev.wasOffline,
            }));
        };

        const handleOffline = () => {
            setStatus({
                isOnline: false,
                isOffline: true,
                wasOffline: true,
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return status;
}

// Hook for queuing actions when offline
export function useOfflineQueue() {
    const { isOnline } = useOfflineStatus();
    const [queue, setQueue] = useState<Array<() => Promise<void>>>([]);

    const enqueue = useCallback((action: () => Promise<void>) => {
        setQueue(prev => [...prev, action]);
    }, []);

    const processQueue = useCallback(async () => {
        if (!isOnline || queue.length === 0) return;
        
        const actions = [...queue];
        setQueue([]);
        
        for (const action of actions) {
            try {
                await action();
            } catch (error) {
                logger.error('Failed to process queued action:', { message: error instanceof Error ? error.message : String(error) });
            }
        }
    }, [isOnline, queue]);

    useEffect(() => {
        if (isOnline && queue.length > 0) {
            // Defer to a microtask so the synchronous setQueue() inside
            // processQueue doesn't run during the effect itself.
            queueMicrotask(() => {
                void processQueue();
            });
        }
    }, [isOnline, queue.length, processQueue]);

    return { enqueue, queue, processQueue };
}
