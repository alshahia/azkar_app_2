
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Haptic Service
 * Centralizes vibration logic and checks for global enabled state.
 * Uses Capacitor Haptics on native platforms, falling back to Navigator Vibrate on web.
 */
export const HapticService = {
    enabled: true,

    setEnabled(value: boolean) {
        this.enabled = value;
    },

    async light() {
        if (!this.enabled) return;
        try {
            if (Capacitor.isNativePlatform()) {
                await Haptics.impact({ style: ImpactStyle.Light });
            } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(10);
            }
        } catch (e) {
            // Silently ignore haptic failures
        }
    },

    async medium() {
        if (!this.enabled) return;
        try {
            if (Capacitor.isNativePlatform()) {
                await Haptics.impact({ style: ImpactStyle.Medium });
            } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(40);
            }
        } catch (e) {
            // Silently ignore haptic failures
        }
    },

    async heavy() {
        if (!this.enabled) return;
        try {
            if (Capacitor.isNativePlatform()) {
                await Haptics.impact({ style: ImpactStyle.Heavy });
            } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(70);
            }
        } catch (e) {
            // Silently ignore haptic failures
        }
    },

    async success() {
        if (!this.enabled) return;
        try {
            if (Capacitor.isNativePlatform()) {
                await Haptics.notification({ type: NotificationType.Success });
            } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([50, 50, 50]);
            }
        } catch (e) {
            // Silently ignore haptic failures
        }
    },
    
    async error() {
        if (!this.enabled) return;
        try {
            if (Capacitor.isNativePlatform()) {
                await Haptics.notification({ type: NotificationType.Error });
            } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([50, 100, 50]);
            }
        } catch (e) {
            // Silently ignore haptic failures
        }
    },

    async pattern(pattern: number[]) {
        if (!this.enabled) return;
        try {
            if (Capacitor.isNativePlatform()) {
                await Haptics.vibrate({ duration: pattern[0] || 300 });
            } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(pattern);
            }
        } catch (e) {
            // Silently ignore haptic failures
        }
    }
};

