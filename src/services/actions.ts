import { Linking, Alert, Share, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CalculatedBirthday } from '../types/birthday';

export class ActionService {
  /**
   * Format personalized birthday greeting message using template and tokens based on category
   */
  static formatCategoryGreeting(
    birthday: CalculatedBirthday,
    senderName?: string,
    customTemplate?: string
  ): string {
    if (customTemplate && customTemplate.trim().length > 0) {
      return customTemplate
        .replace(/{name}/g, birthday.name || '')
        .replace(/{class}/g, birthday.groupClass || (birthday.section ? `Section ${birthday.section}` : 'Class'))
        .replace(/{section}/g, birthday.section || '')
        .replace(/{session}/g, birthday.session || '')
        .replace(/{age}/g, String(birthday.nextAge || ''))
        .replace(/{sender_name}/g, senderName || 'Your Well-Wisher')
        .replace(/{notes}/g, birthday.notes || '');
    }

    const sender = senderName || 'Your Well-Wisher';
    const classInfo = [birthday.groupClass, birthday.section ? `Sec ${birthday.section}` : null].filter(Boolean).join(' - ');

    switch (birthday.relationship) {
      case 'student':
        return `Dear *${birthday.name}*, wishing you a very *Happy Birthday!* 🎂🎓\n\nMay this year bring you wisdom, excellent academic success, and immense joy. Keep shining${classInfo ? ` in *${classInfo}*` : ''}! ✨🎉\n\nBest regards,\n*${sender}*`;

      case 'family':
        return `Happy Birthday, *${birthday.name}*! 🎂❤️\n\nHaving you in my life is a true blessing. Wishing you good health, endless smiles, and abundant happiness this year and always! 💐\n\nWith love,\n*${sender}*`;

      case 'friend':
        return `Happy Birthday to my great friend *${birthday.name}*! 🎉🥳\n\nWishing you an epic day packed with laughter, fun, and memorable moments! Cheers to another awesome year! 🍰✨\n\n- *${sender}*`;

      case 'work':
        return `Dear *${birthday.name}*, wishing you a very *Happy Birthday!* 🎂🌟\n\nIt is a pleasure working with you. May this upcoming year bring you continued professional success and happiness.\n\nWarm regards,\n*${sender}*`;

      case 'other':
      default:
        return `Wishing you a very Happy Birthday, *${birthday.name}*! 🎂🎉\n\nMay your day be filled with celebration, peace, and great achievements in the year ahead!\n\nBest regards,\n*${sender}*`;
    }
  }

  /**
   * Format personalized parent greeting message using template and tokens
   */
  static formatParentGreeting(
    template: string | undefined,
    birthday: CalculatedBirthday,
    senderName?: string
  ): string {
    const classInfo = [birthday.groupClass, birthday.section ? `Sec ${birthday.section}` : null].filter(Boolean).join(' - ');
    const defaultTpl =
      `Dear Parent, heartfelt congratulations on *{name}*'s birthday today! 💐 Wishing your child a glorious year ahead filled with good health and academic excellence. 🎓\n\nWarm regards,\n*{sender_name}*${classInfo ? ` (*${classInfo}*)` : ''}`;

    const tpl = template && template.trim().length > 0 ? template : defaultTpl;

    return tpl
      .replace(/{name}/g, birthday.name || 'your child')
      .replace(/{class}/g, classInfo || 'Class')
      .replace(/{section}/g, birthday.section || '')
      .replace(/{session}/g, birthday.session || '')
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
    } catch (e) { }

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
    } catch (e) { }

    const msg = message || `Happy Birthday ${name || ''}! Wishing you a wonderful celebration today!`;
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
    } catch (e) { }

    const msg = message || `Happy Birthday ${name || ''}! Wishing you a wonderful year ahead!`;
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
    } catch (e) { }

    const sub = subject || `Happy Birthday ${name || ''}!`;
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
    } catch (e) { }

    const [, m, d] = birthday.birthDate.split('-');
    const formatted = `${d}/${m}`;
    const info = [
      `${birthday.name}'s Birthday Reminder`,
      `Date: ${formatted} (Turning ${birthday.nextAge})`,
      birthday.groupClass ? `Group/Class: ${birthday.groupClass}` : null,
      birthday.phone ? `Phone: ${birthday.phone}` : null,
      birthday.notes ? `Note: ${birthday.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await Share.share({
        title: `${birthday.name}'s Birthday`,
        message: info,
      });
    } catch (e) { }
  }
}
