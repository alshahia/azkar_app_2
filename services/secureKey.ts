import { Capacitor } from '@capacitor/core';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
/** * Single source of truth for the user's Gemini API key. * * On native (iOS / Android) the key is stored in the platform secure * store — Keychain on iOS, EncryptedSharedPreferences on Android — so it * never lands in the SQLite kv_store or any backup blob. * * On web there is no hardware-backed secure store, so the key lives in * a module-level variable: lost on page reload, never written to disk. * That matches the existing threat model (a logged-out laptop sees no * key on next launch) without pretending to be more secure than it is. */
const KEY_NAME = 'gemini_api_key';
let memoryKey: string | null = null;
export const secureKeyStore = {
    async get(): Promise<string> {
        if (Capacitor.isNativePlatform()) {
            try {
                const value = await SecureStorage.getItem(KEY_NAME);
                return value ?? '';
            } catch (e) {
                console.error('secureKeyStore.get failed; falling back to empty.', e);
                return '';
            }
        }
        return memoryKey ?? '';
    },
    async set(value: string): Promise<void> {
        if (Capacitor.isNativePlatform()) {
            try {
                if (value) {
                    await SecureStorage.setItem(KEY_NAME, value);
                } else {
                    await SecureStorage.removeItem(KEY_NAME);
                }
            } catch (e) {
                console.error('secureKeyStore.set failed; key not persisted.', e);
            }
        } else {
            memoryKey = value || null;
        }
    },
    async clear(): Promise<void> {
        return this.set('');
    },
};
