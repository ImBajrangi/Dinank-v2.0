import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Birthday, ReminderTiming } from '../types/birthday';

// Register global notification handler at module load time to guarantee visibility
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
  // Safe fallback if running in non-native environment
}

export class NotificationService {
  private static initialized = false;

  /**
   * Initialize notification handler, channels, and permissions
   */
  static async init(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('birthday-reminders', {
            name: 'Birthday Reminders',
            description: 'Urgent alarms and notifications for upcoming birthdays and special events',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            enableVibrate: true,
            vibrationPattern: [0, 250, 250, 250],
            showBadge: true,
            enableLights: true,
            lightColor: '#007AFF',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            bypassDnd: false,
          });
        } catch (chanErr) {
          // Channel setup fallback
        }
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
  static async scheduleBirthdayReminders(
    birthday: Birthday,
    defaultTime: string = '06:00'
  ): Promise<{ timing: ReminderTiming; notificationId: string }[]> {
    const scheduledList: { timing: ReminderTiming; notificationId: string }[] = [];

    try {
      await this.init();

      if (Platform.OS === 'web') {
        return scheduledList;
      }

      // Cancel existing scheduled notifications for this contact to prevent duplicates
      await this.cancelBirthdayReminders(birthday);

      // Parse birth date safely across all formats (YYYY-MM-DD, DD/MM/YYYY, ISO)
      const now = new Date();
      const currentYear = now.getFullYear();
      let birthYear = currentYear;
      let birthMonth = 1;
      let birthDay = 1;

      if (birthday.birthDate.includes('T')) {
        const d = new Date(birthday.birthDate);
        birthYear = d.getFullYear();
        birthMonth = d.getMonth() + 1;
        birthDay = d.getDate();
      } else {
        const parts = birthday.birthDate.split(/[-/.]/).map(Number);
        if (parts.length === 3) {
          if (parts[0] > 31) {
            // YYYY-MM-DD
            birthYear = parts[0];
            birthMonth = parts[1];
            birthDay = parts[2];
          } else {
            // DD-MM-YYYY
            birthDay = parts[0];
            birthMonth = parts[1];
            birthYear = parts[2];
          }
        }
      }

      // Fallback if reminders array is missing or empty
      const activeReminders =
        birthday.reminders && birthday.reminders.length > 0
          ? birthday.reminders
          : [
            {
              id: 'default_on_day',
              timing: 'on_day' as ReminderTiming,
              time: defaultTime,
              enabled: true,
            },
          ];

      for (const reminder of activeReminders) {
        if (!reminder.enabled) continue;

        const timeStr = reminder.time || defaultTime || '06:00';
        const [remHour, remMinute] = timeStr.split(':').map(Number);
        const safeHour = isNaN(remHour) ? 9 : remHour;
        const safeMinute = isNaN(remMinute) ? 0 : remMinute;

        let targetDate = new Date(
          currentYear,
          birthMonth - 1,
          birthDay,
          safeHour,
          safeMinute,
          0,
          0
        );

        if (reminder.timing === 'day_before') {
          targetDate.setDate(targetDate.getDate() - 1);
        } else if (reminder.timing === 'week_before') {
          targetDate.setDate(targetDate.getDate() - 7);
        }

        // If target time has already passed this year, roll over to next year
        if (targetDate.getTime() <= now.getTime()) {
          targetDate = new Date(
            currentYear + 1,
            birthMonth - 1,
            birthDay,
            safeHour,
            safeMinute,
            0,
            0
          );
          if (reminder.timing === 'day_before') {
            targetDate.setDate(targetDate.getDate() - 1);
          } else if (reminder.timing === 'week_before') {
            targetDate.setDate(targetDate.getDate() - 7);
          }
        }

        const turningAge = targetDate.getFullYear() - birthYear;
        const groupInfo = birthday.groupClass ? ` (${birthday.groupClass})` : '';

        let title = '';
        let body = '';

        if (reminder.timing === 'on_day') {
          title = `🎉 Today is ${birthday.name}'s Birthday!`;
          body =
            turningAge > 0
              ? `${birthday.name}${groupInfo} is turning ${turningAge} today. Tap to send a warm wish!`
              : `Wish ${birthday.name}${groupInfo} a fantastic birthday today!`;
        } else if (reminder.timing === 'day_before') {
          title = `Tomorrow is ${birthday.name}'s Birthday!`;
          body = `Get ready! ${birthday.name}${groupInfo}'s birthday is coming up tomorrow.`;
        } else if (reminder.timing === 'week_before') {
          title = `${birthday.name}'s Birthday in 7 Days`;
          body = `Plan ahead! ${birthday.name}${groupInfo}'s birthday is in one week.`;
        }

        try {
          const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title,
              body,
              data: { birthdayId: birthday.id, birthdayName: birthday.name },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
              color: '#007AFF',
              badge: 1,
              autoDismiss: true,
              sticky: false,
              ...(Platform.OS === 'android' ? { channelId: 'birthday-reminders' } : {}),
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: targetDate,
            },
          });

          scheduledList.push({ timing: reminder.timing, notificationId });
        } catch (scheduleErr) {
          console.warn('[NotificationService] Schedule error:', scheduleErr);
        }
      }
    } catch (error) {
      console.warn('[NotificationService] Error scheduling birthday reminders:', error);
    }

    return scheduledList;
  }

  /**
   * Schedule all birthdays across the active database for 100% offline reminder reliability
   */
  static async scheduleAllBirthdayReminders(
    birthdays: Birthday[],
    defaultTime: string = '06:00'
  ): Promise<number> {
    if (Platform.OS === 'web' || !birthdays || birthdays.length === 0) return 0;

    let totalScheduled = 0;
    // Cap at 250 contacts to stay well within Android's 500 alarm limit
    const targetList = birthdays.slice(0, 250);

    for (const b of targetList) {
      try {
        const res = await this.scheduleBirthdayReminders(b, defaultTime);
        totalScheduled += res.length;
      } catch (e) { }
    }

    return totalScheduled;
  }

  /**
   * Cancel all registered local reminders for a given birthday
   */
  static async cancelBirthdayReminders(birthday: Birthday): Promise<void> {
    try {
      if (Platform.OS === 'web' || !birthday.reminders) return;

      for (const reminder of birthday.reminders) {
        if (reminder.notificationId) {
          try {
            await Notifications.cancelScheduledNotificationAsync(reminder.notificationId);
          } catch (e) { }
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
      } catch (e) { }

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
          color: '#007AFF',
          badge: 1,
          autoDismiss: true,
          sticky: false,
          ...(Platform.OS === 'android' ? { channelId: 'birthday-reminders' } : {}),
        },
        trigger: null, // null trigger forces immediate post to OS notification shade
      });

      return true;
    } catch (error) {
      return false;
    }
  }
}
