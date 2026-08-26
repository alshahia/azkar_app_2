
import { Coordinates, CalculationMethod, PrayerTimes, Madhab, Qibla } from 'adhan';
import { LocationCoordinates } from '../types';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

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
        try {
            return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(date);
        } catch {
            try {
                return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                }).format(date);
            } catch {
                return date.toLocaleDateString('ar-SA');
            }
        }
    },

    /**
     * Helper to get Hijri Month and Year components
     */
    getHijriMonthYear(date: Date): { month: string, year: string, monthIndex: number } {
        try {
            const locales = ['ar-SA-u-ca-islamic-umalqura', 'ar-SA-u-ca-islamic'];
            let parts: Intl.DateTimeFormatPart[] = [];
            for (const locale of locales) {
                try {
                    parts = new Intl.DateTimeFormat(locale, {
                        month: 'numeric',
                        year: 'numeric'
                    }).formatToParts(date);
                    break;
                } catch { /* try next */ }
            }

            const monthIndex = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
            const year = parts.find(p => p.type === 'year')?.value || '';

            let arabicMonth = '';
            for (const locale of ['ar-SA-u-ca-islamic-umalqura', 'ar-SA-u-ca-islamic']) {
                try {
                    arabicMonth = new Intl.DateTimeFormat(locale, { month: 'long' }).format(date);
                    break;
                } catch { /* try next */ }
            }
            if (!arabicMonth) arabicMonth = String(monthIndex + 1);

            return { month: arabicMonth, year, monthIndex };
        } catch (e) {
            console.error('getHijriMonthYear error:', e);
            return { month: String(date.getMonth() + 1), year: String(date.getFullYear()), monthIndex: date.getMonth() };
        }
    },

    /**
     * Generate Calendar Grid for the Hijri Month containing the given date
     * Returns array of objects representing days
     */
    getHijriMonthGrid(refDate: Date) {
        try {
            const locales = ['en-US-u-ca-islamic-umalqura', 'en-US-u-ca-islamic'];
            let fmt: Intl.DateTimeFormat | null = null;
            for (const locale of locales) {
                try {
                    fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric', year: 'numeric' });
                    // Test it works
                    fmt.formatToParts(refDate);
                    break;
                } catch { fmt = null; }
            }

            if (!fmt) {
                // Fallback: return simple Gregorian grid
                const days: (Date | null)[] = [];
                const start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
                const end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
                const startDay = (start.getDay() + 1) % 7;
                for (let i = 0; i < startDay; i++) days.push(null);
                const cur = new Date(start);
                while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
                return { days, title: this.getHijriDate(refDate) };
            }

            const parts = fmt.formatToParts(refDate);
            const targetMonth = parts.find(p => p.type === 'month')?.value;

            let startDate = new Date(refDate);
            let safety = 0;
            while (safety < 35) {
                const prev = new Date(startDate);
                prev.setDate(prev.getDate() - 1);
                const pMonth = fmt.formatToParts(prev).find(p => p.type === 'month')?.value;
                if (pMonth !== targetMonth) break;
                startDate = prev;
                safety++;
            }

            let endDate = new Date(refDate);
            safety = 0;
            while (safety < 35) {
                const next = new Date(endDate);
                next.setDate(next.getDate() + 1);
                const nMonth = fmt.formatToParts(next).find(p => p.type === 'month')?.value;
                if (nMonth !== targetMonth) break;
                endDate = next;
                safety++;
            }

            const days: (Date | null)[] = [];
            const startDayOfWeek = startDate.getDay();
            const satBasedStart = (startDayOfWeek + 1) % 7;
            for (let i = 0; i < satBasedStart; i++) days.push(null);

            const current = new Date(startDate);
            while (current <= endDate) {
                days.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }

            return { days, title: this.getHijriDate(refDate).split(' ').slice(1).join(' ') };
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
