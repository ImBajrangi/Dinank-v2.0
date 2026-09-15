import { Linking, Alert, Share, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CalculatedBirthday } from '../types/birthday';

export class ActionService {
  /**
   * Format personalized birthday greeting message using template and tokens
   */
  static formatStudentGreeting(
    template: string | undefined,
    birthday: CalculatedBirthday,
    senderName?: string
  ): string {
    const defaultTpl =
      "Dear *{name}*, wishing you a very *Happy Birthday!* 🎂 May this year bring you wisdom, great success, and joy. Keep shining in *{class}*! 🎉\n\nBest regards,\n*{sender_name}*";

    const tpl = template && template.trim().length > 0 ? template : defaultTpl;

    return tpl
      .replace(/{name}/g, birthday.name || 'Friend')
      .replace(/{class}/g, birthday.groupClass || 'Class')
      .replace(/{age}/g, String(birthday.nextAge || ''))
      .replace(/{sender_name}/g, senderName || 'Your Well-Wisher')
      .replace(/{notes}/g, birthday.notes || '');
  }

  /**
   * Format personalized parent greeting message using template and tokens
   */
  static formatParentGreeting(
    template: string | undefined,
    birthday: CalculatedBirthday,
    senderName?: string
  ): string {
    const defaultTpl =
      "Dear Parent, heartfelt congratulations on *{name}*'s birthday today! 💐 Wishing your child a glorious year ahead filled with good health and academic excellence.\n\nWarm regards,\n*{sender_name}* (*{class}*)";

    const tpl = template && template.trim().length > 0 ? template : defaultTpl;

    return tpl
      .replace(/{name}/g, birthday.name || 'your child')
      .replace(/{class}/g, birthday.groupClass || 'Class')
      .replace(/{age}/g, String(birthday.nextAge || ''))
      .replace(/{sender_name}/g, senderName || 'Teacher')
      .replace(/{notes}/g, birthday.notes || '');
  }

  /**
   * Directly dial phone number
   */
  static async callPhone(phoneNumber?: string, name?: string): Promise<boolean> {
    if (!phoneNumber || !phoneNumber.trim()) {
      Alert.alert('No Phone Number', `No phone number is recorded for ${name || 'this contact'}.`);
      return false;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const clean = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${clean}`;
    try {
      const can = await Linking.canOpenURL(url).catch(() => false);
      if (can) {
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert('Dialer Unavailable', 'Phone dialer could not be launched on this device.');
        return false;
      }
    } catch (err) {
      return false;
    }
  }

  /**
   * Directly send WhatsApp message
   */
  static async sendWhatsApp(
    phoneNumber?: string,
    message?: string,
    name?: string
  ): Promise<boolean> {
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    const msg = message || `Happy Birthday ${name || ''}! 🎂 Wishing you a wonderful celebration today! 🎉`;
    const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
    const encoded = encodeURIComponent(msg);

    let url = '';
    if (cleanPhone) {
      url = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
    } else {
      url = `whatsapp://send?text=${encoded}`;
    }

    try {
      const canOpen = await Linking.canOpenURL(url).catch(() => false);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        // Fallback to web link or system share
        if (cleanPhone) {
          const webUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
          const canWeb = await Linking.canOpenURL(webUrl).catch(() => false);
          if (canWeb) {
            await Linking.openURL(webUrl);
            return true;
          }
        }
        await Share.share({ message: msg });
        return true;
      }
    } catch (e) {
      await Share.share({ message: msg });
      return true;
    }
  }

  /**
   * Directly launch SMS composer
   */
  static async sendSMS(
    phoneNumber?: string,
    message?: string,
    name?: string
  ): Promise<boolean> {
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    const msg = message || `Happy Birthday ${name || ''}! 🎂 Wishing you a wonderful year ahead! 🎉`;
    const cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9+]/g, '') : '';
    const encoded = encodeURIComponent(msg);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = cleanPhone ? `sms:${cleanPhone}${separator}body=${encoded}` : `sms:${separator}body=${encoded}`;

    try {
      const can = await Linking.canOpenURL(url).catch(() => false);
      if (can) {
        await Linking.openURL(url);
        return true;
      } else {
        await Share.share({ message: msg });
        return true;
      }
    } catch (e) {
      await Share.share({ message: msg });
      return true;
    }
  }

  /**
   * Directly launch email composer
   */
  static async sendEmail(
    email?: string,
    subject?: string,
    body?: string,
    name?: string
  ): Promise<boolean> {
    if (!email || !email.trim()) {
      Alert.alert('No Email Address', `No email address is recorded for ${name || 'this contact'}.`);
      return false;
    }
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    const sub = subject || `Happy Birthday ${name || ''}! 🎂`;
    const bod = body || `Wishing you the happiest of birthdays, ${name || ''}! May this year bring you great joy, health, and success!`;
    const url = `mailto:${email.trim()}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(bod)}`;

    try {
      const can = await Linking.canOpenURL(url).catch(() => false);
      if (can) {
        await Linking.openURL(url);
        return true;
      } else {
        Alert.alert('Mail App Unavailable', 'No default email app found on device.');
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  /**
   * Share formatted birthday card
   */
  static async shareContact(birthday: CalculatedBirthday): Promise<void> {
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    const [, m, d] = birthday.birthDate.split('-');
    const formatted = `${d}/${m}`;
    const info = [
      `🎂 ${birthday.name}'s Birthday Reminder`,
      `📅 Date: ${formatted} (Turning ${birthday.nextAge})`,
      birthday.groupClass ? `🏷️ Group/Class: ${birthday.groupClass}` : null,
      birthday.phone ? `📱 Phone: ${birthday.phone}` : null,
      birthday.notes ? `📝 Note: ${birthday.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({
        title: `${birthday.name}'s Birthday`,
        message: info,
      });
    } catch (e) {}
  }
}
