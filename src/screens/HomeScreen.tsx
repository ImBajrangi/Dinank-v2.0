import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Plus, Bell } from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { BirthdayCard } from '../components/BirthdayCard';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { CalculatedBirthday } from '../types/birthday';

interface HomeScreenProps {
  onOpenAdd: () => void;
  onSelectBirthday: (bday: CalculatedBirthday) => void;
  onOpenAIWish: (bday: CalculatedBirthday) => void;
}

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS_UPPER = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenAdd,
  onSelectBirthday,
  onOpenAIWish,
}) => {
  const {
    colors,
    isDark,
    todayBirthdays,
    upcomingBirthdays,
    triggerSystemNotificationTest,
    refreshNotifications,
    settings,
  } = useBirthdays();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

  // Dynamic personalized greeting
  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    const timeGreeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    return settings.senderName ? `${timeGreeting}, ${settings.senderName}` : 'Dinank';
  }, [settings.senderName]);

  // Formatted date string in Apple style e.g. "TUESDAY, SEPTEMBER 15"
  const todayDateString = useMemo(() => {
    const d = new Date();
    return `${WEEKDAYS[d.getDay()]}, ${MONTHS_UPPER[d.getMonth()]} ${d.getDate()}`;
  }, []);

  const filteredToday = useMemo(() => {
    if (!searchQuery.trim()) return todayBirthdays;
    const q = searchQuery.toLowerCase();
    return todayBirthdays.filter(
      (b) => b.name.toLowerCase().includes(q) || b.relationship.toLowerCase().includes(q)
    );
  }, [todayBirthdays, searchQuery]);

  const filteredUpcoming = useMemo(() => {
    if (!searchQuery.trim()) return upcomingBirthdays;
    const q = searchQuery.toLowerCase();
    return upcomingBirthdays.filter(
      (b) => b.name.toLowerCase().includes(q) || b.relationship.toLowerCase().includes(q)
    );
  }, [upcomingBirthdays, searchQuery]);

  const handleTestNotification = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    triggerSystemNotificationTest();
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: topInset + 8 }]}>
      {/* Apple iOS Navigation Bar Header */}
      <View style={styles.navBarRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.dateSubtitle, { color: colors.textSecondary }]}>
            {todayDateString}
          </Text>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>
            {greeting}
          </Text>
        </View>

        {/* Right Navigation Actions (Apple Style) */}
        <View style={styles.navActionButtons}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleTestNotification}
            style={[
              styles.iconBtn,
              { backgroundColor: isDark ? colors.surface : colors.surfaceSubtle },
            ]}
          >
            <Bell size={18} color={colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenAdd}
            style={[styles.addIconBtn, { backgroundColor: colors.accent }]}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* iOS Search Bar */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Today Section */}
      {filteredToday.length > 0 && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.iosSectionTitle, { color: colors.textSecondary }]}>
              TODAY
            </Text>
            <Text style={[styles.iosBadgeText, { color: colors.danger }]}>
              {filteredToday.length} today
            </Text>
          </View>

          {filteredToday.map((item) => (
            <BirthdayCard
              key={item.id}
              birthday={item}
              onPress={() => onSelectBirthday(item)}
              onWishPress={() => onOpenAIWish(item)}
            />
          ))}
        </View>
      )}

      {/* Upcoming Section Header */}
      <View style={[styles.sectionHeaderRow, { marginTop: filteredToday.length > 0 ? 18 : 6 }]}>
        <Text style={[styles.iosSectionTitle, { color: colors.textSecondary }]}>
          UPCOMING
        </Text>
        <Text style={[styles.iosBadgeText, { color: colors.textMuted }]}>
          {filteredUpcoming.length} upcoming
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />

      <FlatList
        data={filteredUpcoming}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BirthdayCard
            birthday={item}
            onPress={() => onSelectBirthday(item)}
            onWishPress={() => onOpenAIWish(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          filteredToday.length === 0 ? (
            <EmptyState
              title={searchQuery ? 'No Results' : 'No Birthdays'}
              subtitle={
                searchQuery
                  ? `No contacts found matching "${searchQuery}".`
                  : 'Tap + above to add your first birthday reminder.'
              }
              onAction={onOpenAdd}
            />
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  headerContainer: {
    paddingBottom: 6,
  },
  navBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  navActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  iosSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  iosBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
