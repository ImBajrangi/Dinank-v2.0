import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  LogBox,
} from 'react-native';

LogBox.ignoreLogs([
  '[Notifications]',
  'ExpoNotificationChannelManager',
  'expo-notifications',
  '`expo-notifications`',
  'Android Push notifications',
  'Call to function',
]);

import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// Professional Apple HIG Tab Icons with clean compound cutouts
const AppleHomeIcon: React.FC<{ active: boolean; color: string; size?: number }> = ({ active, color, size = 22 }) => {
  if (active) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* Apple House with clean doorway cutout */}
        <Path
          fill={color}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2.5L2 11h3v10a1 1 0 001 1h4.5v-6.5a1.5 1.5 0 011.5-1.5h0a1.5 1.5 0 011.5 1.5V22H18a1 1 0 001-1V11h3L12 2.5z"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5h-4.5a1 1 0 01-1-1v-5a1.5 1.5 0 00-1.5-1.5h-1A1.5 1.5 0 0010 15.5v5a1 1 0 01-1 1H4.5A1.5 1.5 0 013 20v-9.5z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const AppleCalendarIcon: React.FC<{ active: boolean; color: string; size?: number; isDark: boolean }> = ({ active, color, size = 22, isDark }) => {
  const innerMarkColor = isDark ? '#1C1C1E' : '#FFFFFF';
  if (active) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Rect x="2.5" y="4.5" width="19" height="17" rx="3.5" fill={color} />
        <Rect x="6.5" y="2" width="2.2" height="4" rx="1.1" fill={color} />
        <Rect x="15.3" y="2" width="2.2" height="4" rx="1.1" fill={color} />
        <Path d="M3 9.5h18" stroke={innerMarkColor} strokeWidth="1.6" />
        <Circle cx="8" cy="13.5" r="1.3" fill={innerMarkColor} />
        <Circle cx="12" cy="13.5" r="1.3" fill={innerMarkColor} />
        <Circle cx="16" cy="13.5" r="1.3" fill={innerMarkColor} />
        <Circle cx="8" cy="17.2" r="1.3" fill={innerMarkColor} />
        <Circle cx="12" cy="17.2" r="1.3" fill={innerMarkColor} />
        <Circle cx="16" cy="17.2" r="1.3" fill={innerMarkColor} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4.5" width="18" height="16.5" rx="3" stroke={color} strokeWidth={1.9} />
      <Path d="M3 9.5h18" stroke={color} strokeWidth={1.9} />
      <Path d="M8 2.2v3.5M16 2.2v3.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
};

const ApplePeopleIcon: React.FC<{ active: boolean; color: string; size?: number; isDark: boolean }> = ({ active, color, size = 22, isDark }) => {
  const gapColor = isDark ? '#1C1C1E' : '#FFFFFF';
  if (active) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="16.5" cy="7.5" r="3.2" fill={color} />
        <Path d="M13.5 13.5a5.5 5.5 0 017.5 4.5v1.5a1 1 0 01-1 1h-6.5" fill={color} />
        <Circle cx="9" cy="8" r="4.3" fill={gapColor} />
        <Circle cx="9" cy="8" r="3.5" fill={color} />
        <Path
          d="M2.5 21v-1.8a5.5 5.5 0 015.5-5.5h2a5.5 5.5 0 015.5 5.5V21"
          stroke={gapColor}
          strokeWidth="1.8"
          fill="none"
        />
        <Path
          d="M3.2 20.5v-1.5a4.8 4.8 0 014.8-4.8h2a4.8 4.8 0 014.8 4.8v1.5a.8.8 0 01-.8.8H4a.8.8 0 01-.8-.8z"
          fill={color}
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7.5" r="3.5" stroke={color} strokeWidth={1.9} />
      <Path
        d="M3.5 19.5v-1.2A4.8 4.8 0 018.3 13.5h1.4a4.8 4.8 0 014.8 4.8v1.2"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <Path
        d="M14.5 4.5a3.5 3.5 0 010 6M17.5 14a4.5 4.5 0 013 4.2v1.3"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
    </Svg>
  );
};

const AppleSettingsIcon: React.FC<{ active: boolean; color: string; size?: number }> = ({ active, color, size = 22 }) => {
  if (active) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {/* Apple Gear with clean center hole cutout via evenodd */}
        <Path
          fill={color}
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10.2 2.5h3.6l.6 2.3a7.8 7.8 0 011.8.8l2-1.3 2.5 2.5-1.3 2a7.8 7.8 0 01.8 1.8l2.3.6v3.6l-2.3.6a7.8 7.8 0 01-.8 1.8l1.3 2-2.5 2.5-2-1.3a7.8 7.8 0 01-1.8.8l-.6 2.3h-3.6l-.6-2.3a7.8 7.8 0 01-1.8-.8l-2 1.3-2.5-2.5 1.3-2a7.8 7.8 0 01-.8-1.8l-2.3-.6v-3.6l2.3-.6a7.8 7.8 0 01.8-1.8l-1.3-2 2.5-2.5 2 1.3a7.8 7.8 0 011.8-.8l.6-2.3zM12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.2 2.5h3.6l.6 2.3a7.8 7.8 0 011.8.8l2-1.3 2.5 2.5-1.3 2a7.8 7.8 0 01.8 1.8l2.3.6v3.6l-2.3.6a7.8 7.8 0 01-.8 1.8l1.3 2-2.5 2.5-2-1.3a7.8 7.8 0 01-1.8.8l-.6 2.3h-3.6l-.6-2.3a7.8 7.8 0 01-1.8-.8l-2 1.3-2.5-2.5 1.3-2a7.8 7.8 0 01-.8-1.8l-2.3-.6v-3.6l2.3-.6a7.8 7.8 0 01.8-1.8l-1.3-2 2.5-2.5 2 1.3a7.8 7.8 0 011.8-.8l.6-2.3z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={1.9} />
    </Svg>
  );
};

import { BirthdayProvider, useBirthdays } from './src/context/BirthdayContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { PeopleScreen } from './src/screens/PeopleScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

import { AddBirthdayModal } from './src/components/AddBirthdayModal';
import { BirthdayDetailModal } from './src/components/BirthdayDetailModal';
import { AIWishModal } from './src/components/AIWishModal';
import { UpdateModal } from './src/components/UpdateModal';
import { CalculatedBirthday, Birthday } from './src/types/birthday';
import { AutoUpdateService, AppUpdateInfo } from './src/services/updater';

type Tab = 'home' | 'calendar' | 'people' | 'settings';

const MainApp: React.FC = () => {
  const { colors, isDark } = useBirthdays();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [birthdayToEdit, setBirthdayToEdit] = useState<Birthday | null>(null);

  const [selectedBirthday, setSelectedBirthday] = useState<CalculatedBirthday | null>(null);
  const [aiWishBirthday, setAiWishBirthday] = useState<CalculatedBirthday | null>(null);

  // Auto-Update states
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  React.useEffect(() => {
    // Check for updates quietly after app loads
    const timer = setTimeout(async () => {
      try {
        const info = await AutoUpdateService.checkForUpdates();
        if (info.hasUpdate) {
          setUpdateInfo(info);
          setIsUpdateModalOpen(true);
        }
      } catch (e) {}
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenAdd = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setBirthdayToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (bday: CalculatedBirthday) => {
    setSelectedBirthday(null);
    setBirthdayToEdit(bday);
    setIsAddModalOpen(true);
  };

  const handleOpenAIWish = (bday: CalculatedBirthday) => {
    setAiWishBirthday(bday);
  };

  const handleTabPress = (tab: Tab) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setActiveTab(tab);
  };

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 8);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Active Screen */}
      <View style={styles.screenContainer}>
        {activeTab === 'home' && (
          <HomeScreen
            onOpenAdd={handleOpenAdd}
            onSelectBirthday={(b) => setSelectedBirthday(b)}
            onOpenAIWish={handleOpenAIWish}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarScreen
            onSelectBirthday={(b) => setSelectedBirthday(b)}
            onOpenAIWish={handleOpenAIWish}
          />
        )}
        {activeTab === 'people' && (
          <PeopleScreen
            onOpenAdd={handleOpenAdd}
            onSelectBirthday={(b) => setSelectedBirthday(b)}
            onOpenAIWish={handleOpenAIWish}
          />
        )}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Apple iOS Native Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBorder,
            height: 52 + bottomInset,
            paddingBottom: bottomInset,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleTabPress('home')}
          style={styles.tabItem}
        >
          <AppleHomeIcon
            active={activeTab === 'home'}
            color={activeTab === 'home' ? colors.accent : colors.textMuted}
            size={23}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'home' ? colors.accent : colors.textMuted,
                fontWeight: activeTab === 'home' ? '700' : '500',
              },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleTabPress('calendar')}
          style={styles.tabItem}
        >
          <AppleCalendarIcon
            active={activeTab === 'calendar'}
            color={activeTab === 'calendar' ? colors.accent : colors.textMuted}
            size={23}
            isDark={isDark}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'calendar' ? colors.accent : colors.textMuted,
                fontWeight: activeTab === 'calendar' ? '700' : '500',
              },
            ]}
          >
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleTabPress('people')}
          style={styles.tabItem}
        >
          <ApplePeopleIcon
            active={activeTab === 'people'}
            color={activeTab === 'people' ? colors.accent : colors.textMuted}
            size={23}
            isDark={isDark}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'people' ? colors.accent : colors.textMuted,
                fontWeight: activeTab === 'people' ? '700' : '500',
              },
            ]}
          >
            People
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleTabPress('settings')}
          style={styles.tabItem}
        >
          <AppleSettingsIcon
            active={activeTab === 'settings'}
            color={activeTab === 'settings' ? colors.accent : colors.textMuted}
            size={23}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'settings' ? colors.accent : colors.textMuted,
                fontWeight: activeTab === 'settings' ? '700' : '500',
              },
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add / Edit Birthday Modal */}
      <AddBirthdayModal
        visible={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setBirthdayToEdit(null);
        }}
        birthdayToEdit={birthdayToEdit}
      />

      {/* Birthday Details Modal */}
      <BirthdayDetailModal
        visible={selectedBirthday !== null}
        onClose={() => setSelectedBirthday(null)}
        birthday={selectedBirthday}
        onEdit={handleEdit}
        onOpenAIWish={(b) => {
          setSelectedBirthday(null);
          handleOpenAIWish(b);
        }}
      />

      {/* AI Wish Generator Modal */}
      <AIWishModal
        visible={aiWishBirthday !== null}
        onClose={() => setAiWishBirthday(null)}
        birthday={aiWishBirthday}
      />

      {/* Auto-Update Modal */}
      <UpdateModal
        visible={isUpdateModalOpen}
        updateInfo={updateInfo}
        onClose={() => setIsUpdateModalOpen(false)}
      />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <BirthdayProvider>
        <MainApp />
      </BirthdayProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 0.5,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: -0.2,
  },
});
