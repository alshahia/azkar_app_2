
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, Qibla } from 'adhan';
import { LocationCoordinates } from '../types';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { formatHijriArabic, hijriPartsOf, hijriMonthNameOf, getHijriMonthGrid as buildHijriMonthGrid } from '../utils/hijri';

export const PrayerTimesService = {
    /**
     * Request current position from device or browser
     */
    async getCurrentLocation(): Promise<LocationCoordinates> {
        if (Capacitor.isNativePlatform()) {
            try {
                let permission = await Geolocation.checkPermissions();
                if (permission.location !== 'granted') {
                    permission = await Geolocation.requestPermissions();
                    if (permission.location !== 'granted') {
                        throw new Error("LOCATION_PERMISSION_DENIED");
                    }
                }
                const position = await Geolocation.getCurrentPosition({ 
                    enableHighAccuracy: true, 
                    timeout: 10000, 
                    maximumAge: 3600000 
                });
                return {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
            } catch (error) {
                console.error("Native Geolocation failed:", error);
                throw error;
            }
        }

        // Web Fallback
        return new Promise((resolve, reject) => {
            if (typeof navigator === 'undefined' || !navigator.geolocation) {
                reject(new Error("Geolocation not supported"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 3600000 }
            );
        });
    },

    /**
     * Calculate prayer times for a given date and location
     */
    getPrayerTimes(date: Date, coords: LocationCoordinates, methodStr: string = 'MuslimWorldLeague') {
        if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number' || isNaN(coords.latitude) || isNaN(coords.longitude)) {
            // Default to Mecca coordinates if invalid
            coords = { latitude: 21.4225, longitude: 39.8262 };
        }
        const coordinates = new Coordinates(coords.latitude, coords.longitude);
        
        // Default to Muslim World League, can be dynamic later
        let params = CalculationMethod.MuslimWorldLeague();
        
        if (methodStr === 'Egyptian') params = CalculationMethod.Egyptian();
        else if (methodStr === 'Karachi') params = CalculationMethod.Karachi();
        else if (methodStr === 'UmmAlQura') params = CalculationMethod.UmmAlQura();
        else if (methodStr === 'Dubai') params = CalculationMethod.Dubai();
        else if (methodStr === 'Qatar') params = CalculationMethod.Qatar();
        else if (methodStr === 'Kuwait') params = CalculationMethod.Kuwait();
        else if (methodStr === 'MoonsightingCommittee') params = CalculationMethod.MoonsightingCommittee();
        else if (methodStr === 'Singapore') params = CalculationMethod.Singapore();
        else if (methodStr === 'Turkey') params = CalculationMethod.Turkey();
        else if (methodStr === 'Tehran') params = CalculationMethod.Tehran();
        else if (methodStr === 'NorthAmerica') params = CalculationMethod.NorthAmerica();

        params.madhab = Madhab.Shafi; // Default
        
        return new PrayerTimes(coordinates, date, params);
    },

    /**
     * Calculate Qibla Direction from True North (0-360 degrees)
     */
    getQiblaDirection(coords: LocationCoordinates | null | undefined): number {
        if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number' || isNaN(coords.latitude) || isNaN(coords.longitude)) {
            return 0;
        }
        try {
            const coordinates = new Coordinates(coords.latitude, coords.longitude);
            const q = Qibla(coordinates);
            return isNaN(q) ? 0 : q;
        } catch (e) {
            console.error("Error calculating Qibla direction:", e);
            return 0;
        }
    },

    /**
     * Format time (e.g. 5:30 PM)
     */
    formatTime(date: Date): string {
        return new Intl.DateTimeFormat('ar-SA', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(date);
    },
    
    /**
     * Get Hijri Date String
     */
    getHijriDate(date: Date): string {
        return formatHijriArabic(date);
    },

    /**
     * Helper to get Hijri Month and Year components
     */
    getHijriMonthYear(date: Date): { month: string, year: string, monthIndex: number } {
        const parts = hijriPartsOf(date);
        if (!parts) {
            // No Islamic calendar in this engine: fall back to Gregorian numbers
            return { month: String(date.getMonth() + 1), year: String(date.getFullYear()), monthIndex: date.getMonth() };
        }
        const arabicMonth = hijriMonthNameOf(date) ?? String(parts.month);
        return { month: arabicMonth, year: String(parts.year), monthIndex: parts.month - 1 };
    },

    /**
     * Generate Calendar Grid for the Hijri Month containing the given date
     * Returns array of objects representing days
     */
    getHijriMonthGrid(refDate: Date) {
        try {
            return buildHijriMonthGrid(refDate) ?? { days: [] as (Date | null)[], title: '' };
        } catch (e) {
            console.error('getHijriMonthGrid error:', e);
            return { days: [] as (Date | null)[], title: '' };
        }
    },

    getIslamicEvents() {
        return [
            { month: 1, day: 1, title: 'رأس السنة الهجرية' },
            { month: 1, day: 10, title: 'يوم عاشوراء' },
            { month: 3, day: 12, title: 'المولد النبوي الشريف' },
            { month: 7, day: 27, title: 'الإسراء والمعراج' },
            { month: 8, day: 15, title: 'ليلة النصف من شعبان' },
            { month: 9, day: 1, title: 'بداية رمضان' },
            { month: 10, day: 1, title: 'عيد الفطر المبارك' },
            { month: 12, day: 9, title: 'يوم عرفة' },
            { month: 12, day: 10, title: 'عيد الأضحى المبارك' }
        ];
    }
};
