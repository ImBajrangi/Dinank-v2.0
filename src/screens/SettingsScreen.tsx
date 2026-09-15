import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Share,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  Moon,
  Sun,
  Smartphone,
  ShieldCheck,
  Download,
  Database,
  ChevronRight,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Users,
  Calendar,
  Layers,
  Share2,
  Sliders,
  Volume2,
  UserCheck,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { NotificationService } from '../services/notifications';
import { ImporterService } from '../services/importer';
import { ImportModal } from '../components/ImportModal';
import { PersonalizationModal } from '../components/PersonalizationModal';
import { Avatar } from '../components/Avatar';
import { ThemePreference } from '../types/birthday';

export const SettingsScreen: React.FC = () => {
  const {
    colors,
    isDark,
    settings,
    themePreference,
    setThemePreference,
    updateSettings,
    triggerSystemNotificationTest,
    refreshNotifications,
    birthdays,
    todayBirthdays,
    upcomingBirthdays,
  } = useBirthdays();

  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

  const [testingNotif, setTestingNotif] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);

  // Group statistics
  const distinctGroups = React.useMemo(() => {
    return new Set(birthdays.map((b) => b.groupClass).filter(Boolean)).size;
  }, [birthdays]);

  const handleTestNotification = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setTestingNotif(true);
    const sent = await triggerSystemNotificationTest();
    setTestingNotif(false);

    if (sent) {
      Alert.alert(
        'System Notification Dispatched 🔔',
        'Direct local device reminder is operational.'
      );
    }
  };

  const handleRequestPermissions = async () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    const granted = await NotificationService.requestPermissions();
    if (granted) {
      await refreshNotifications();
      Alert.alert('Notifications Enabled', 'All device reminder alarms are scheduled.');
    }
  };

  const handleExportCSV = async () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    try {
      const csvData = ImporterService.exportToCSV(birthdays);
      await Share.share({
        title: 'Birthdays_Spreadsheet.csv',
        message: csvData,
      });
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export CSV spreadsheet.');
    }
  };

  const handleExportJSON = async () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    try {
      const dataStr = JSON.stringify(birthdays, null, 2);
      await Share.share({
        title: 'Birthdays_Backup.json',
        message: dataStr,
      });
    } catch (e) {}
  };

  const handleToggle = (key: keyof typeof settings, val: boolean) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    updateSettings({ [key]: val });
  };

  const TIMES = ['08:00', '09:00', '10:00', '12:00', '18:00', '20:00'];

  const getSoundLabel = (id?: string) => {
    switch (id) {
      case 'chime':
        return 'Celebration Bell';
      case 'aurora':
        return 'Apple Aurora';
      case 'harp':
        return 'Gentle Harp';
      case 'pop':
        return 'Pop Chord';
      case 'silent':
        return 'Vibrate Only';
      default:
        return 'System Default';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topInset + 8, paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>Settings</Text>

        {/* Apple ID Style Profile Card */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch (e) {}
            setIsPersonalizationOpen(true);
          }}
          style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        >
          <Avatar
            name={settings.senderName || 'Dinank'}
            size={50}
            backgroundColor={colors.accent}
            fontSize={19}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {settings.senderName || 'Set Your Name'}
            </Text>
            <Text style={[styles.profileSub, { color: colors.textSecondary }]}>
              Dinank Profile • Custom Wishes & Sender ID
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Section 0: Overview & Statistics Card */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          OVERVIEW
        </Text>
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.accentLight }]}>
                <Users size={15} color={colors.accent} />
              </View>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{birthdays.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, { backgroundColor: isDark ? 'rgba(255,59,48,0.2)' : '#FFEBEA' }]}>
                <Sparkles size={15} color="#FF3B30" />
              </View>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{todayBirthdays.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Today</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, { backgroundColor: isDark ? 'rgba(255,149,0,0.2)' : '#FFF4E5' }]}>
                <Calendar size={15} color="#FF9500" />
              </View>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{upcomingBirthdays.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Upcoming</Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBadge, { backgroundColor: isDark ? 'rgba(88,86,214,0.2)' : '#ECEBFC' }]}>
                <Layers size={15} color="#5856D6" />
              </View>
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>{distinctGroups}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Groups</Text>
            </View>
          </View>
        </View>

        {/* Section 1: Personalization */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          PERSONALIZATION
        </Text>
        <View style={[styles.groupedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch (e) {}
              setIsPersonalizationOpen(true);
            }}
            style={styles.cellRow}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FF2D55' }]}>
              <Sliders size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellLabel, { color: colors.textPrimary }]}>
                Greeting Templates
              </Text>
              <Text style={[styles.cellSubLabel, { color: colors.textSecondary }]}>
                {settings.senderName ? `Sender: ${settings.senderName}` : 'Custom message tokens'}
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          <TouchableOpacity
            activeOpacity={0.65}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch (e) {}
              setIsPersonalizationOpen(true);
            }}
            style={styles.cellRow}
          >
            <View style={[styles.iconBox, { backgroundColor: '#5856D6' }]}>
              <Volume2 size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellLabel, { color: colors.textPrimary }]}>
                Alert Sound
              </Text>
            </View>
            <Text style={[styles.cellValue, { color: colors.accent }]}>
              {getSoundLabel(settings.notificationSound)}
            </Text>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Section 2: Notifications (iOS Grouped Style) */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          NOTIFICATIONS & REMINDERS
        </Text>
        <View style={[styles.groupedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Test Notification Row */}
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={handleTestNotification}
            style={styles.cellRow}
            disabled={testingNotif}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FF3B30' }]}>
              <Bell size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellLabel, { color: colors.textPrimary }]}>
                Send Test Notification
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          {/* Permissions Row */}
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={handleRequestPermissions}
            style={styles.cellRow}
          >
            <View style={[styles.iconBox, { backgroundColor: '#34C759' }]}>
              <ShieldCheck size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellLabel, { color: colors.textPrimary }]}>
                System Permissions
              </Text>
            </View>
            <Text style={[styles.cellValue, { color: colors.accent }]}>Authorized</Text>
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          {/* On Birthday Switch */}
          <View style={styles.cellRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FF9500' }]}>
              <Sparkles size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellLabel, { color: colors.textPrimary }]}>
                Remind On Birthday
              </Text>
            </View>
            <Switch
              value={settings.notifyOnDay}
              onValueChange={(val) => handleToggle('notifyOnDay', val)}
              trackColor={{ false: isDark ? '#39393D' : '#E9E9EB', true: '#34C759' }}
            />
          </View>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          {/* 1 Day Before Switch */}
          <View style={styles.cellRow}>
            <View style={[styles.iconBox, { backgroundColor: '#007AFF' }]}>
              <Clock size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellLabel, { color: colors.textPrimary }]}>
                Remind 1 Day Before
              </Text>
            </View>
            <Switch
              value={settings.notifyDayBefore}
              onValueChange={(val) => handleToggle('notifyDayBefore', val)}
              trackColor={{ false: isDark ? '#39393D' : '#E9E9EB', true: '#34C759' }}
            />
          </View>
        </View>

        {/* Section 3: Default Alert Time */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          DEFAULT ALERT TIME
        </Text>
        <View style={[styles.groupedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.timePillGrid}>
            {TIMES.map((t) => {
              const isSelected = settings.defaultReminderTime === t;
              return (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    updateSettings({ defaultReminderTime: t });
                  }}
                  style={[
                    styles.timePill,
                    {
                      backgroundColor: isSelected ? colors.accent : isDark ? '#2C2C2E' : '#E5E5EA',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timePillText,
                      { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontWeight: isSelected ? '600' : '400' },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 4: Appearance */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          APPEARANCE
        </Text>
        <View style={[styles.groupedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.themeRow}>
            {[
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'system', label: 'Automatic', icon: Smartphone },
            ].map((t) => {
              const isSelected = themePreference === t.id;
              const Icon = t.icon;
              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setThemePreference(t.id as ThemePreference);
                  }}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isSelected ? (isDark ? '#2C2C2E' : '#FFFFFF') : 'transparent',
                      borderColor: isSelected ? colors.accent : 'transparent',
                      borderWidth: isSelected ? 1 : 0,
                    },
                  ]}
                >
                  <Icon size={18} color={isSelected ? colors.accent : colors.textSecondary} style={{ marginBottom: 4 }} />
                  <Text
                    style={[
                      styles.themeLabel,
                      { color: isSelected ? colors.textPrimary : colors.textSecondary, fontWeight: isSelected ? '600' : '400' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 5: Data & Spreadsheet Tools */}
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          DATA & SPREADSHEET TOOLS
        </Text>
        <View style={[styles.groupedCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Active Cache count */}
          <View style={styles.cellRow}>
            <View style={[styles.iconBox, { backgroundColor: '#5856D6' }]}>
              <Database size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellLabel, { color: colors.textPrimary }]}>
                Cached Birthdays
              </Text>
            </View>
            <Text style={[styles.cellValue, { color: colors.textSecondary }]}>
              {birthdays.length} contacts (0ms)
            </Text>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          {/* Import Excel / CSV / Google Sheets */}
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch (e) {}
              setIsImportModalOpen(true);
            }}
            style={styles.cellRow}
          >
            <View style={[styles.iconBox, { backgroundColor: '#34C759' }]}>
              <FileSpreadsheet size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellLabel, { color: colors.textPrimary }]}>
                Import Contacts
              </Text>
              <Text style={[styles.cellSubLabel, { color: colors.textSecondary }]}>
                Excel, CSV or Google Sheets
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          {/* Export CSV Spreadsheet */}
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={handleExportCSV}
            style={styles.cellRow}
          >
            <View style={[styles.iconBox, { backgroundColor: '#007AFF' }]}>
              <Share2 size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellLabel, { color: colors.textPrimary }]}>
                Export CSV
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

          {/* Export JSON Backup */}
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={handleExportJSON}
            style={styles.cellRow}
          >
            <View style={[styles.iconBox, { backgroundColor: '#AF52DE' }]}>
              <Download size={16} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellLabel, { color: colors.textPrimary }]}>
                Backup JSON
              </Text>
            </View>
            <ChevronRight size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Spreadsheet / Google Sheets Importer Sheet */}
      <ImportModal
        visible={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Personalization Modal */}
      <PersonalizationModal
        visible={isPersonalizationOpen}
        onClose={() => setIsPersonalizationOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  brandingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 0.5,
    marginBottom: 8,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  profileSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 4,
    marginTop: 18,
  },
  statsCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 0.5,
    height: 38,
  },
  groupedCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  cellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cellContent: {
    flex: 1,
  },
  cellLabel: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  cellSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  cellValue: {
    fontSize: 15,
    fontWeight: '400',
    marginRight: 4,
  },
  separator: {
    height: 0.5,
    marginLeft: 54,
  },
  timePillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
  },
  timePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  timePillText: {
    fontSize: 13,
  },
  themeRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
