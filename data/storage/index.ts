import { Capacitor } from '@capacitor/core';
import { StorageAdapter } from './interface';
import { WebStorage } from './web';
import { MobileStorage } from './mobile';

let storageInstance: StorageAdapter | null = null;

export const getStorage = (): StorageAdapter => {
    if (storageInstance) {
        return storageInstance;
    }

    if (Capacitor.isNativePlatform()) {
        storageInstance = new MobileStorage();
    } else {
        storageInstance = new WebStorage();
    }

    return storageInstance;
};