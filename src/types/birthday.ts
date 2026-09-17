export type BuiltInRelationshipType = 'student' | 'family' | 'friend' | 'work' | 'other';
export type RelationshipType = string;

export interface CustomCategory {
  id: string;
  name: string;
  createdAt: string;
}

export type ReminderTiming = 'on_day' | 'day_before' | 'week_before';

export interface ReminderOption {
  id: string;
  timing: ReminderTiming;
  time: string; // '09:00' format
  enabled: boolean;
  notificationId?: string;
}

export interface Birthday {
  id: string;
  name: string;
  birthDate: string; // 'YYYY-MM-DD'
  relationship: RelationshipType;
  groupClass?: string; // Class / Grade / Dept (e.g. "10th")
  section?: string; // Section (e.g. "A", "B")
  session?: string; // Academic Session / Batch (e.g. "2024-2025")
  rollNo?: string; // Roll No / ID
  phone?: string;
  parentPhone?: string;
  email?: string;
  notes?: string;
  avatarColor?: string;
  reminders: ReminderOption[];
  createdAt: string;
  updatedAt: string;
}

export interface CalculatedBirthday extends Birthday {
  daysUntil: number;
  isToday: boolean;
  isTomorrow: boolean;
  isThisWeek: boolean;
  nextAge: number;
  currentAge: number;
  nextBirthdayDate: Date;
  zodiacSign: string;
}

export type ThemePreference = 'dark' | 'light' | 'system';

export interface UserGreetingPreset {
  id: string;
  label: string;
  text: string;
  category?: 'student' | 'parent' | 'general';
}

export interface UserSettings {
  theme: ThemePreference;
  defaultReminderTime: string; // e.g. '09:00'
  notifyOnDay: boolean;
  notifyDayBefore: boolean;
  notifyWeekBefore: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  senderName?: string;
  customStudentTemplate?: string;
  customParentTemplate?: string;
  accentColor?: string;
  notificationSound?: string;
  appIconTheme?: string;
  geminiApiKey?: string;
  savedGreetingPresets?: UserGreetingPreset[];
}

