import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { Birthday, CalculatedBirthday, UserSettings, ThemePreference } from '../types/birthday';
import { cache } from '../services/cache';
import { NotificationService } from '../services/notifications';
import { SoundService } from '../services/sound';
import { calculateBirthdayDetails, sortBirthdaysUpcoming } from '../services/birthdays';
import { SourcesService, SavedSource } from '../services/sources';
import { PALETTES } from '../constants/theme';

interface BirthdayContextType {
  birthdays: Birthday[];
  calculatedBirthdays: CalculatedBirthday[];
  todayBirthdays: CalculatedBirthday[];
  upcomingBirthdays: CalculatedBirthday[];
  savedSources: SavedSource[];
  customCategories: string[];
  settings: UserSettings;
  themePreference: ThemePreference;
  isDark: boolean;
  colors: typeof PALETTES['dark'];
  loading: boolean;
  addBirthday: (birthday: Omit<Birthday, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Birthday>;
  addMultipleBirthdays: (
    items: Omit<Birthday, 'id' | 'createdAt' | 'updatedAt'>[],
    sourceMeta?: { id?: string; name: string; type: 'sheet' | 'file'; urlOrUri: string }
  ) => Promise<number>;
  cleanDuplicateBirthdays: () => Promise<number>;
  deleteSourceAndContacts: (sourceId: string, sourceName: string, deleteContacts: boolean) => Promise<void>;
  refreshSavedSources: () => Promise<void>;
  addCustomCategory: (name: string) => Promise<string>;
  deleteCustomCategory: (name: string) => Promise<void>;
  updateBirthday: (birthday: Birthday) => Promise<void>;
  deleteBirthday: (id: string) => Promise<void>;
  setThemePreference: (theme: ThemePreference) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  triggerSystemNotificationTest: () => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
}

const STORAGE_KEY_BIRTHDAYS = '@birthdays_v1';
const STORAGE_KEY_SETTINGS = '@settings_v1';
const STORAGE_KEY_CUSTOM_CATEGORIES = '@custom_categories_v1';

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
  const [savedSources, setSavedSources] = useState<SavedSource[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Initialize and hydrate cache on startup
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        await NotificationService.init();

        const [cachedBirthdays, cachedSettings, cachedSources, cachedCustomCats] = await Promise.all([
          cache.hydrate<Birthday[]>(STORAGE_KEY_BIRTHDAYS, []),
          cache.hydrate<UserSettings>(STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS),
          SourcesService.getSavedSources(),
          cache.hydrate<string[]>(STORAGE_KEY_CUSTOM_CATEGORIES, []),
        ]);

        const birthdaysList = Array.isArray(cachedBirthdays) ? cachedBirthdays : [];

        // Auto-discover any custom category present in stored contacts
        const standardCats = new Set(['student', 'family', 'friend', 'work', 'other']);
        const mergedCustomCatsSet = new Set(cachedCustomCats || []);
        birthdaysList.forEach((b) => {
          if (b.relationship && !standardCats.has(b.relationship.toLowerCase().trim())) {
            mergedCustomCatsSet.add(b.relationship.trim());
          }
        });
        const mergedCustomCats = Array.from(mergedCustomCatsSet);

        if (isMounted) {
          setBirthdays(birthdaysList);
          setSettings(cachedSettings);
          setSavedSources(cachedSources);
          setCustomCategories(mergedCustomCats);
          setLoading(false);
        }

        // Schedule system notifications for all active birthdays in background
        NotificationService.scheduleAllBirthdayReminders(
          birthdaysList,
          cachedSettings.defaultReminderTime || '06:00'
        ).catch(() => { });
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

      // Non-blocking background notification scheduling (instant UI save)
      NotificationService.scheduleBirthdayReminders(newBirthday).catch(() => { });

      return newBirthday;
    },
    [birthdays]
  );

  const refreshSavedSources = useCallback(async () => {
    const sources = await SourcesService.getSavedSources();
    setSavedSources(sources);
  }, []);

  const addMultipleBirthdays = useCallback(
    async (
      items: Omit<Birthday, 'id' | 'createdAt' | 'updatedAt'>[],
      sourceMeta?: { id?: string; name: string; type: 'sheet' | 'file'; urlOrUri: string }
    ): Promise<number> => {
      if (!items || items.length === 0) return 0;

      const now = new Date().toISOString();
      const existingKeys = new Set(
        birthdays.map((b) => `${b.name.trim().toLowerCase()}|${b.birthDate}|${b.rollNo || ''}`)
      );

      const savedSourceId = sourceMeta?.id || (sourceMeta ? 'src_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) : undefined);

      const newBirthdays: Birthday[] = [];
      for (const item of items) {
        const key = `${item.name.trim().toLowerCase()}|${item.birthDate}|${item.rollNo || ''}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          newBirthdays.push({
            ...item,
            id: 'bday_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
            sourceId: item.sourceId || savedSourceId,
            sourceName: item.sourceName || sourceMeta?.name,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      if (sourceMeta && savedSourceId) {
        SourcesService.saveSource({
          id: savedSourceId,
          name: sourceMeta.name,
          type: sourceMeta.type,
          urlOrUri: sourceMeta.urlOrUri,
          importedCount: newBirthdays.length > 0 ? newBirthdays.length : items.length,
          lastSyncedAt: now,
          createdAt: now,
        }).then(() => refreshSavedSources()).catch(() => { });
      }

      if (newBirthdays.length === 0) return 0;

      const updated = [...newBirthdays, ...birthdays];
      setBirthdays(updated);
      cache.set(STORAGE_KEY_BIRTHDAYS, updated);

      // Schedule system notifications for all contacts in background
      NotificationService.scheduleAllBirthdayReminders(
        updated,
        settings.defaultReminderTime || '06:00'
      ).catch(() => { });

      return newBirthdays.length;
    },
    [birthdays, refreshSavedSources]
  );

  const cleanDuplicateBirthdays = useCallback(async (): Promise<number> => {
    const seen = new Set<string>();
    const deduplicated: Birthday[] = [];
    let duplicateCount = 0;

    for (const b of birthdays) {
      const key = `${b.name.trim().toLowerCase()}|${b.birthDate}|${b.rollNo || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(b);
      } else {
        duplicateCount++;
      }
    }

    if (duplicateCount > 0) {
      setBirthdays(deduplicated);
      cache.set(STORAGE_KEY_BIRTHDAYS, deduplicated);
    }

    return duplicateCount;
  }, [birthdays]);

  const deleteSourceAndContacts = useCallback(
    async (sourceId: string, sourceName: string, deleteContacts: boolean) => {
      await SourcesService.deleteSource(sourceId);
      await refreshSavedSources();

      if (deleteContacts) {
        const cleanSourceName = (sourceName || '').trim().toLowerCase();
        const contactsToDelete = birthdays.filter((b) => {
          if (b.sourceId && b.sourceId === sourceId) return true;
          if (b.sourceName && b.sourceName.trim().toLowerCase() === cleanSourceName) return true;
          const bNotes = (b.notes || '').toLowerCase();
          const bGroup = (b.groupClass || '').toLowerCase();
          return cleanSourceName.length > 2 && (bNotes.includes(cleanSourceName) || bGroup.includes(cleanSourceName));
        });

        // Cancel system notifications for removed contacts
        contactsToDelete.forEach((c) => {
          NotificationService.cancelBirthdayReminders(c).catch(() => { });
        });

        const toDeleteIds = new Set(contactsToDelete.map((c) => c.id));
        const updated = birthdays.filter((b) => !toDeleteIds.has(b.id));

        setBirthdays(updated);
        await cache.set(STORAGE_KEY_BIRTHDAYS, updated);
      }
    },
    [birthdays, refreshSavedSources]
  );

  const updateBirthday = useCallback(
    async (updatedBirthday: Birthday): Promise<void> => {
      const now = new Date().toISOString();
      const patched = { ...updatedBirthday, updatedAt: now };
      const updated = birthdays.map((b) => (b.id === patched.id ? patched : b));

      setBirthdays(updated);
      cache.set(STORAGE_KEY_BIRTHDAYS, updated);

      // Non-blocking background notification re-scheduling
      NotificationService.scheduleBirthdayReminders(patched).catch(() => { });
    },
    [birthdays]
  );

  const deleteBirthday = useCallback(
    async (id: string): Promise<void> => {
      const target = birthdays.find((b) => b.id === id);
      if (target) {
        NotificationService.cancelBirthdayReminders(target).catch(() => { });
      }

      const updated = birthdays.filter((b) => b.id !== id);
      setBirthdays(updated);
      cache.set(STORAGE_KEY_BIRTHDAYS, updated);
    },
    [birthdays]
  );

  const addCustomCategory = useCallback(
    async (name: string): Promise<string> => {
      const trimmed = name.trim();
      if (!trimmed) return '';

      const standardCats = ['student', 'family', 'friend', 'work', 'other'];
      if (standardCats.includes(trimmed.toLowerCase())) {
        return trimmed.toLowerCase();
      }

      setCustomCategories((prev) => {
        if (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
          return prev;
        }
        const updated = [...prev, trimmed];
        cache.set(STORAGE_KEY_CUSTOM_CATEGORIES, updated);
        return updated;
      });

      return trimmed;
    },
    []
  );

  const deleteCustomCategory = useCallback(
    async (name: string): Promise<void> => {
      setCustomCategories((prev) => {
        const updated = prev.filter((c) => c.toLowerCase() !== name.toLowerCase().trim());
        cache.set(STORAGE_KEY_CUSTOM_CATEGORIES, updated);
        return updated;
      });
    },
    []
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

      // If default reminder time or sound changed, refresh background alarms
      if (
        newSettings.defaultReminderTime ||
        newSettings.notifyOnDay !== undefined ||
        newSettings.notifyDayBefore !== undefined ||
        newSettings.notifyWeekBefore !== undefined ||
        newSettings.notificationSound !== undefined
      ) {
        NotificationService.scheduleAllBirthdayReminders(
          birthdays,
          next.defaultReminderTime || '09:00'
        ).catch(() => { });
      }
      return next;
    });
  }, [birthdays]);

  const triggerSystemNotificationTest = useCallback(async (): Promise<boolean> => {
    SoundService.playSound(settings.notificationSound || 'default');
    return await NotificationService.triggerImmediateSystemNotification(
      'Birthday Reminder Test',
      'System local notification is active and working directly on your device!'
    );
  }, [settings.notificationSound]);

  const refreshNotifications = useCallback(async (): Promise<void> => {
    await NotificationService.scheduleAllBirthdayReminders(
      birthdays,
      settings.defaultReminderTime || '06:00'
    );
  }, [birthdays, settings.defaultReminderTime]);

  return (
    <BirthdayContext.Provider
      value={{
        birthdays,
        calculatedBirthdays,
        todayBirthdays,
        upcomingBirthdays,
        savedSources,
        customCategories,
        settings,
        themePreference: settings.theme,
        isDark,
        colors,
        loading,
        addBirthday,
        addMultipleBirthdays,
        cleanDuplicateBirthdays,
        deleteSourceAndContacts,
        refreshSavedSources,
        addCustomCategory,
        deleteCustomCategory,
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
