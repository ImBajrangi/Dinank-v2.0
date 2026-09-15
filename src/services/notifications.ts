import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Birthday, ReminderTiming } from '../types/birthday';

export class NotificationService {
  private static initialized = false;

  /**
   * Initialize notification handler and permissions
   */
  static async init(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      try {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
            priority: Notifications.AndroidNotificationPriority.MAX,
          }),
        });
      } catch (e) {
        // Ignored if handler is unavailable
      }

      const hasPermission = await this.requestPermissions();
      this.initialized = true;
      return hasPermission;
    } catch (error) {
      this.initialized = true;
      return false;
    }
  }

  /**
   * Request system notification permissions directly from the OS
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const perm = await window.Notification.requestPermission();
          return perm === 'granted';
        }
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Schedule direct local system reminders for a birthday into OS alarm manager
   */
  static async scheduleBirthdayReminders(birthday: Birthday): Promise<{ timing: ReminderTiming; notificationId: string }[]> {
    const scheduledList: { timing: ReminderTiming; notificationId: string }[] = [];

    try {
      await this.init();

      if (Platform.OS === 'web') {
        return scheduledList;
      }

      // Cancel existing scheduled notifications
      await this.cancelBirthdayReminders(birthday);

      const [birthYear, birthMonthStr, birthDayStr] = birthday.birthDate.split('-').map(Number);
      const now = new Date();
      const currentYear = now.getFullYear();

      for (const reminder of birthday.reminders) {
        if (!reminder.enabled) continue;

        const [remHour, remMinute] = (reminder.time || '09:00').split(':').map(Number);

        let targetDate = new Date(currentYear, birthMonthStr - 1, birthDayStr, remHour, remMinute, 0, 0);

        if (reminder.timing === 'day_before') {
          targetDate.setDate(targetDate.getDate() - 1);
        } else if (reminder.timing === 'week_before') {
          targetDate.setDate(targetDate.getDate() - 7);
        }

        if (targetDate.getTime() <= now.getTime()) {
          targetDate = new Date(currentYear + 1, birthMonthStr - 1, birthDayStr, remHour, remMinute, 0, 0);
          if (reminder.timing === 'day_before') {
            targetDate.setDate(targetDate.getDate() - 1);
          } else if (reminder.timing === 'week_before') {
            targetDate.setDate(targetDate.getDate() - 7);
          }
        }

        const turningAge = targetDate.getFullYear() - birthYear;

        let title = '';
        let body = '';

        if (reminder.timing === 'on_day') {
          title = `🎂 Today is ${birthday.name}'s Birthday!`;
          body = turningAge > 0 
            ? `${birthday.name} is turning ${turningAge} today! Send a warm wish.`
            : `Wish ${birthday.name} a fantastic birthday today!`;
        } else if (reminder.timing === 'day_before') {
          title = `🎁 Tomorrow is ${birthday.name}'s Birthday!`;
          body = `Get ready! ${birthday.name}'s birthday is coming up tomorrow.`;
        } else if (reminder.timing === 'week_before') {
          title = `🗓️ ${birthday.name}'s Birthday in 7 Days`;
          body = `Remember to plan ahead for ${birthday.name}'s birthday next week.`;
        }

        try {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { birthdayId: birthday.id },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: targetDate,
            },
          });

          scheduledList.push({ timing: reminder.timing, notificationId });
        } catch (scheduleErr) {
          // Fallback if specific trigger fails
        }
      }
    } catch (error) {
      // Clean fallback
    }

    return scheduledList;
  }

  /**
   * Cancel all registered local reminders for a given birthday
   */
  static async cancelBirthdayReminders(birthday: Birthday): Promise<void> {
    try {
      if (Platform.OS === 'web') return;

      for (const reminder of birthday.reminders) {
        if (reminder.notificationId) {
          try {
            await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
          } catch (e) {}
        }
      }
    } catch (error) {
      // Clean fallback
    }
  }

  /**
   * Directly fire an immediate test notification to the user's OS system tray / notification shade
   */
  static async triggerImmediateSystemNotification(title: string, body: string): Promise<boolean> {
    try {
      await this.init();

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (window.Notification.permission === 'granted') {
            new window.Notification(title, { body, icon: '/favicon.png' });
            return true;
          } else {
            const perm = await window.Notification.requestPermission();
            if (perm === 'granted') {
              new window.Notification(title, { body, icon: '/favicon.png' });
              return true;
            }
          }
        }
        return false;
      }

      // Schedule immediately directly into the device system tray / notification shade!
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null, // null trigger forces immediate post to OS notification shade
      });

      return true;
    } catch (error) {
      return false;
    }
  }
}
