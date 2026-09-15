import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { Birthday, CalculatedBirthday, UserSettings, ThemePreference } from '../types/birthday';
import { cache } from '../services/cache';
import { NotificationService } from '../services/notifications';
import { calculateBirthdayDetails, getInitialSeedBirthdays, sortBirthdaysUpcoming } from '../services/birthdays';
import { PALETTES } from '../constants/theme';

interface BirthdayContextType {
  birthdays: Birthday[];
  calculatedBirthdays: CalculatedBirthday[];
  todayBirthdays: CalculatedBirthday[];
  upcomingBirthdays: CalculatedBirthday[];
  settings: UserSettings;
  themePreference: ThemePreference;
  isDark: boolean;
  colors: typeof PALETTES['dark'];
  loading: boolean;
  addBirthday: (birthday: Omit<Birthday, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Birthday>;
  updateBirthday: (birthday: Birthday) => Promise<void>;
  deleteBirthday: (id: string) => Promise<void>;
  setThemePreference: (theme: ThemePreference) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  triggerSystemNotificationTest: () => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
}

const STORAGE_KEY_BIRTHDAYS = '@birthdays_v1';
const STORAGE_KEY_SETTINGS = '@settings_v1';

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  defaultReminderTime: '09:00',
  notifyOnDay: true,
  notifyDayBefore: true,
  notifyWeekBefore: false,
  soundEnabled: true,
  hapticsEnabled: true,
};

const BirthdayContext = createContext<BirthdayContextType | null>(null);

export const BirthdayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Initialize and hydrate cache on startup
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        await NotificationService.init();

        const cachedBirthdays = await cache.hydrate<Birthday[]>(
          STORAGE_KEY_BIRTHDAYS,
          getInitialSeedBirthdays()
        );
        const cachedSettings = await cache.hydrate<UserSettings>(
          STORAGE_KEY_SETTINGS,
          DEFAULT_SETTINGS
        );

        if (isMounted) {
          setBirthdays(cachedBirthdays);
          setSettings(cachedSettings);
          setLoading(false);
        }

        // Ensure system notifications are scheduled for existing birthdays
        for (const b of cachedBirthdays) {
          await NotificationService.scheduleBirthdayReminders(b);
        }
      } catch (err) {
        console.warn('[BirthdayContext] Load error:', err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Theme resolution
  const isDark = useMemo(() => {
    if (settings.theme === 'system') {
      return systemColorScheme === 'dark';
    }
    return settings.theme === 'dark';
  }, [settings.theme, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? PALETTES.dark : PALETTES.light;
  }, [isDark]);

  // Derived calculated birthday lists
  const calculatedBirthdays = useMemo(() => {
    return sortBirthdaysUpcoming(birthdays);
  }, [birthdays]);

  const todayBirthdays = useMemo(() => {
    return calculatedBirthdays.filter((b) => b.isToday);
  }, [calculatedBirthdays]);

  const upcomingBirthdays = useMemo(() => {
    return calculatedBirthdays.filter((b) => !b.isToday);
  }, [calculatedBirthdays]);

  // Actions
  const addBirthday = useCallback(
    async (data: Omit<Birthday, 'id' | 'createdAt' | 'updatedAt'>): Promise<Birthday> => {
      const now = new Date().toISOString();
      const newBirthday: Birthday = {
        ...data,
        id: 'bday_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: now,
        updatedAt: now,
      };

      const updated = [newBirthday, ...birthdays];
      setBirthdays(updated);
      cache.set(STORAGE_KEY_BIRTHDAYS, updated);

      // Schedule system notifications directly to device OS
      await NotificationService.scheduleBirthdayReminders(newBirthday);

      return newBirthday;
    },
    [birthdays]
  );

  const updateBirthday = useCallback(
    async (updatedBirthday: Birthday): Promise<void> => {
      const now = new Date().toISOString();
      const patched = { ...updatedBirthday, updatedAt: now };
      const updated = birthdays.map((b) => (b.id === patched.id ? patched : b));

      setBirthdays(updated);
      cache.set(STORAGE_KEY_BIRTHDAYS, updated);

      // Re-schedule system notification with new dates/times
      await NotificationService.scheduleBirthdayReminders(patched);
    },
    [birthdays]
  );

  const deleteBirthday = useCallback(
    async (id: string): Promise<void> => {
      const target = birthdays.find((b) => b.id === id);
      if (target) {
        await NotificationService.cancelBirthdayReminders(target);
      }

      const updated = birthdays.filter((b) => b.id !== id);
      setBirthdays(updated);
      cache.set(STORAGE_KEY_BIRTHDAYS, updated);
    },
    [birthdays]
  );

  const setThemePreference = useCallback((theme: ThemePreference) => {
    setSettings((prev) => {
      const next = { ...prev, theme };
      cache.set(STORAGE_KEY_SETTINGS, next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      cache.set(STORAGE_KEY_SETTINGS, next);
      return next;
    });
  }, []);

  const triggerSystemNotificationTest = useCallback(async (): Promise<boolean> => {
    return await NotificationService.triggerImmediateSystemNotification(
      '🎂 Birthday Reminder Test',
      'System local notification is active and working directly on your device!'
    );
  }, []);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    for (const b of birthdays) {
      await NotificationService.scheduleBirthdayReminders(b);
    }
  }, [birthdays]);

  return (
    <BirthdayContext.Provider
      value={{
        birthdays,
        calculatedBirthdays,
        todayBirthdays,
        upcomingBirthdays,
        settings,
        themePreference: settings.theme,
        isDark,
        colors,
        loading,
        addBirthday,
        updateBirthday,
        deleteBirthday,
        setThemePreference,
        updateSettings,
        triggerSystemNotificationTest,
        refreshNotifications,
      }}
    >
      {children}
    </BirthdayContext.Provider>
  );
};

export const useBirthdays = (): BirthdayContextType => {
  const context = useContext(BirthdayContext);
  if (!context) {
    throw new Error('useBirthdays must be used within a BirthdayProvider');
  }
  return context;
};
