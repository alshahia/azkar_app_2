
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { PrayerTimes } from 'adhan';
import { Capacitor } from '@capacitor/core';
import { pickVotd, votdTitle } from '../utils/votd';
import { loadSurah } from './QuranService';

export const NotificationService = {
    async checkPermissions(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) return true;
        try {
            const status = await LocalNotifications.checkPermissions();
            return status.display === 'granted';
        } catch (error) {
            console.error('Error checking notification permissions:', error);
            return false;
        }
    },

    async requestPermissions(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) return true;
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    },

    // Deprecated: legacy method
    async scheduleDailyReminder(hour: number, minute: number): Promise<void> {
        return this.scheduleReminder(1, hour, minute, "أذكار الصباح", "حان وقت أذكار الصباح، بارك الله في يومك.", "morning");
    },

    async scheduleReminder(id: number, hour: number, minute: number, title: string, body: string, categoryId: string): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;
        try {
            // Cancel existing notification with this ID first to avoid duplicates or stale times
            await this.cancelReminder(id);

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id,
                        schedule: { 
                            on: { hour, minute },
                            allowWhileIdle: true,
                            every: 'day' // Ensure repeats daily
                        },
                        attachments: [],
                        actionTypeId: "",
                        extra: { categoryId }
                    }
                ]
            });
            console.log(`Reminder ${id} scheduled for ${hour}:${minute} with category ${categoryId}`);
        } catch (error) {
            console.error(`Error scheduling notification ${id}:`, error);
        }
    },

    async schedulePrayerReminders(today: PrayerTimes, tomorrow: PrayerTimes): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;

        const prayers = [
            { name: 'الفجر', key: 'fajr', idOffset: 0 },
            { name: 'الظهر', key: 'dhuhr', idOffset: 1 },
            { name: 'العصر', key: 'asr', idOffset: 2 },
            { name: 'المغرب', key: 'maghrib', idOffset: 3 },
            { name: 'العشاء', key: 'isha', idOffset: 4 }
        ];

        const notifications: LocalNotificationSchema[] = [];
        const now = new Date();

        // Process Today
        prayers.forEach(p => {
            const time = today[p.key as keyof PrayerTimes] as Date;
            if (time > now) {
                 notifications.push({
                    title: `صلاة ${p.name}`,
                    body: `حان الآن موعد صلاة ${p.name}`,
                    id: 100 + p.idOffset,
                    schedule: { at: time, allowWhileIdle: true },
                    // The PrePrayerOverlay CTA reads this to navigate the
                    // user straight into the adhan-category adhkar.
                    extra: { type: 'prayer', prayer: p.key, ctaCategoryId: 'adhan' },
                    // Adhan audio clip bundled at android/app/src/main/res/raw/adhan.mp3
                    // (and in the iOS bundle). Capacitor gracefully falls
                    // back to the system default if the file is missing,
                    // so this is safe to set even before the asset lands.
                    sound: 'adhan.mp3',
                });
            }
        });

        // Process Tomorrow (to ensure coverage)
        prayers.forEach(p => {
            const time = tomorrow[p.key as keyof PrayerTimes] as Date;
            notifications.push({
                title: `صلاة ${p.name}`,
                body: `حان الآن موعد صلاة ${p.name}`,
                id: 105 + p.idOffset,
                schedule: { at: time, allowWhileIdle: true },
                extra: { type: 'prayer', prayer: p.key, ctaCategoryId: 'adhan' },
                sound: 'adhan.mp3',
            });
        });

        try {
            // Cancel existing prayer notifications first
            const pending = await LocalNotifications.getPending();
            const prayerIds = pending.notifications
                .filter(n => n.id >= 100 && n.id <= 110)
                .map(n => ({ id: n.id }));
            
            if (prayerIds.length > 0) {
                await LocalNotifications.cancel({ notifications: prayerIds });
            }

            if (notifications.length > 0) {
                await LocalNotifications.schedule({ notifications });
                console.log(`Scheduled ${notifications.length} prayer notifications`);
            }
        } catch (error) {
            console.error("Error scheduling prayer reminders:", error);
        }
    },

    async cancelPrayerReminders(): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;
        try {
            const pending = await LocalNotifications.getPending();
            const prayerIds = pending.notifications
                .filter(n => n.id >= 100 && n.id <= 110)
                .map(n => ({ id: n.id }));
            
            if (prayerIds.length > 0) {
                await LocalNotifications.cancel({ notifications: prayerIds });
                console.log("Cancelled prayer notifications");
            }
        } catch (error) {
            console.error("Error canceling prayer reminders:", error);
        }
    },

    async cancelReminder(id: number): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;
        try {
            const pending = await LocalNotifications.getPending();
            const exists = pending.notifications.some(n => n.id === id);
            if (exists) {
                await LocalNotifications.cancel({ notifications: [{ id }] });
                console.log(`Reminder ${id} cancelled`);
            }
        } catch (error) {
            console.error(`Error canceling notification ${id}:`, error);
        }
    },

    async cancelReminders(): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;
        try {
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
            }
        } catch (error) {
            console.error('Error canceling notifications:', error);
        }
    },

    /**
     * Verse-of-the-Day notification (M4-T1).
     *
     * Schedules (or cancels) a daily notification at the user-chosen
     * hour:minute. The ayah is picked at scheduling time by the deterministic
     * hash in utils/votd, then re-resolved daily inside a one-shot
     * notification per day (re-scheduled when the app comes back to the
     * foreground, same pattern as prayer reminders). The body loads the
     * surah on demand to include the actual Uthmani text (truncated for
     * the notification body limit). Deep-link extra `{type:'votd', surah, ayah}`
     * so the App.tsx tap handler can navigate straight into the reader.
     */
    async scheduleVotd(hour: number, minute: number, now: Date = new Date()): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;
        const VOTD_ID = 50;
        try {
            await this.cancelReminder(VOTD_ID);
            const votd = pickVotd(now);
            if (!votd) {
                console.warn('VOTD: no Islamic calendar in this engine, skipping schedule.');
                return;
            }
            const surahName = votdTitle(votd);
            // Pre-load the surah so the notification body contains a snippet
            // of the actual ayah text (Android caps title/body at ~480 chars
            // total). On any failure we degrade gracefully - the title still
            // tells the user which ayah to open.
            let bodyText = '\u0627\u0641\u062a\u062a\u0627\u062d \u0627\u0644\u0622\u064a\u0629 \u0627\u0644\u064a\u0648\u0645 \u0641\u064a \u062a\u0637\u0628\u064a\u0642 \u0623\u0630\u0643\u0627\u0631.';
            try {
                const ayahs = await loadSurah(votd.surah);
                const text = ayahs[votd.ayah - 1]?.text ?? '';
                if (text) bodyText = text.length > 200 ? text.slice(0, 197) + '\u2026' : text;
            } catch (e) {
                console.warn('VOTD: surah text load failed, falling back to default body.', e);
            }
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: '\u0622\u064a\u0629 \u0627\u0644\u064a\u0648\u0645 \u2014 ' + surahName,
                        body: bodyText,
                        id: VOTD_ID,
                        schedule: {
                            on: { hour, minute },
                            allowWhileIdle: true,
                            every: 'day',
                        },
                        attachments: [],
                        actionTypeId: '',
                        extra: { type: 'votd', surah: votd.surah, ayah: votd.ayah },
                    },
                ],
            });
            console.log(`VOTD scheduled for ${hour}:${minute} -> ${surahName}`);
        } catch (error) {
            console.error('Error scheduling VOTD:', error);
        }
    },

    async cancelVotd(): Promise<void> {
        return this.cancelReminder(50);
    },
};
