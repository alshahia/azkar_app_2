
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { PrayerTimes } from 'adhan';
import { Capacitor } from '@capacitor/core';

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
                    extra: { type: 'prayer', prayer: p.key }
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
                extra: { type: 'prayer', prayer: p.key }
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
    }
};
