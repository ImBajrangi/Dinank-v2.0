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
      // Direct openURL to bypass Android 11+ Package Visibility query restrictions
      await Linking.openURL(url);
      return true;
    } catch (err) {
      try {
        if (Platform.OS === 'ios') {
          await Linking.openURL(`telprompt:${clean}`);
          return true;
        }
      } catch (e2) {}
      Alert.alert('Dialer Unavailable', `Could not launch phone dialer for ${clean}.`);
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
    const encoded = encodeURIComponent(msg);

    // Format phone number: remove non-digits
    let cleanPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
    // Standard 10-digit Indian numbers require 91 prefix for WhatsApp API/deep-links
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    if (!cleanPhone) {
      // If no phone number provided, launch WhatsApp or Share sheet
      try {
        await Linking.openURL(`whatsapp://send?text=${encoded}`);
        return true;
      } catch (err) {
        await Share.share({ message: msg });
        return true;
      }
    }

    const whatsappDirectUrl = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;
    const waMeUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    const apiWhatsAppUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;

    try {
      await Linking.openURL(whatsappDirectUrl);
      return true;
    } catch (e1) {
      try {
        await Linking.openURL(waMeUrl);
        return true;
      } catch (e2) {
        try {
          await Linking.openURL(apiWhatsAppUrl);
          return true;
        } catch (e3) {
          await Share.share({ message: msg });
          return true;
        }
      }
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
      await Linking.openURL(url);
      return true;
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
      await Linking.openURL(url);
      return true;
    } catch (e) {
      Alert.alert('Mail App Unavailable', 'No default email app found on device.');
      return false;
    }
  }

  /**
   * Share formatted birthday card message
   */
  static async shareContact(birthday: CalculatedBirthday, senderName?: string): Promise<void> {
    try {
      Haptics.selectionAsync();
    } catch (e) { }

    const [, m, d] = birthday.birthDate.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const formatted = `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]}`;
    const ageText = birthday.nextAge ? ` (Turning ${birthday.nextAge})` : '';
    const classInfo = [
      birthday.groupClass ? `Class ${birthday.groupClass}` : null,
      birthday.section ? `Sec ${birthday.section}` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    const cardGreeting = this.formatCategoryGreeting(birthday, senderName);

    const message = `🎂 *HAPPY BIRTHDAY ${birthday.name.toUpperCase()}!* 🎉${ageText}
📅 *Date:* ${formatted}${classInfo ? `\n📚 *${classInfo}*` : ''}

${cardGreeting}

━━━━━━━━━━━━━━━━━━━━━
📲 *Shared with Dinank*
_Never miss a birthday, anniversary or special moment._`;

    try {
      await Share.share({
        title: `Birthday Greeting for ${birthday.name}`,
        message: message,
      });
    } catch (e) { }
  }
}
