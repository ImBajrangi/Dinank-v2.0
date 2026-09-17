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
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  Bell,
  Sparkles,
  Cake,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
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
const SHORT_WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
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
    birthdays,
    triggerSystemNotificationTest,
    refreshNotifications,
    settings,
  } = useBirthdays();

  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number | null>(null);
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

  // Clean, modern app title
  const title = useMemo(() => {
    return settings.senderName ? `Hello, ${settings.senderName}` : 'Dinank';
  }, [settings.senderName]);

  // Formatted date string e.g. "THURSDAY, SEPTEMBER 17"
  const todayDateString = useMemo(() => {
    const d = new Date();
    return `${WEEKDAYS[d.getDay()]}, ${MONTHS_UPPER[d.getMonth()]} ${d.getDate()}`;
  }, []);

  const monthYearString = useMemo(() => {
    const d = new Date();
    return `${MONTHS_UPPER[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  // 7-day Apple-style interactive week strip
  const weekStrip = useMemo(() => {
    const now = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dayNum = d.getDate();
      const dayName = SHORT_WEEKDAYS[d.getDay()];
      const isToday = i === 0;

      // Check birthdays for this day offset
      const celebrants = (i === 0 ? todayBirthdays : []).concat(
        upcomingBirthdays.filter((b) => b.daysUntil === i)
      );

      days.push({
        offset: i,
        dayNum,
        dayName,
        isToday,
        hasBirthday: celebrants.length > 0,
        bdayCount: celebrants.length,
        celebrants,
      });
    }
    return days;
  }, [todayBirthdays, upcomingBirthdays]);

  // Count of total birthdays this entire week
  const weekBirthdayCount = useMemo(() => {
    return weekStrip.reduce((acc, curr) => acc + curr.bdayCount, 0);
  }, [weekStrip]);

  // Dynamic list of classes/departments
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    birthdays.forEach((b) => {
      if (b.groupClass && b.groupClass.trim()) {
        classes.add(b.groupClass.trim());
      }
    });
    return Array.from(classes).sort();
  }, [birthdays]);

  const thisMonthCount = useMemo(() => {
    return upcomingBirthdays.filter((b) => b.daysUntil <= 30).length;
  }, [upcomingBirthdays]);

  // Selected day info
  const activeDayData = useMemo(() => {
    if (selectedDayOffset === null) return null;
    return weekStrip.find((w) => w.offset === selectedDayOffset) || null;
  }, [selectedDayOffset, weekStrip]);

  const nextUpcoming = useMemo(() => {
    return upcomingBirthdays.length > 0 ? upcomingBirthdays[0] : null;
  }, [upcomingBirthdays]);

  const filteredToday = useMemo(() => {
    if (selectedDayOffset !== null && selectedDayOffset !== 0) return [];
    if (!searchQuery.trim()) return todayBirthdays;
    const q = searchQuery.toLowerCase();
    return todayBirthdays.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.relationship.toLowerCase().includes(q) ||
        (b.groupClass && b.groupClass.toLowerCase().includes(q)) ||
        (b.rollNo && b.rollNo.toLowerCase().includes(q)) ||
        (b.section && b.section.toLowerCase().includes(q))
    );
  }, [todayBirthdays, selectedDayOffset, searchQuery]);

  const filteredUpcoming = useMemo(() => {
    let list = upcomingBirthdays;

    if (selectedDayOffset !== null) {
      list = list.filter((b) => b.daysUntil === selectedDayOffset);
    } else if (selectedFilter === 'month') {
      list = list.filter((b) => b.daysUntil <= 30);
    } else if (selectedFilter !== 'all') {
      list = list.filter(
        (b) => b.groupClass && b.groupClass.trim().toLowerCase() === selectedFilter.toLowerCase()
      );
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.relationship.toLowerCase().includes(q) ||
        (b.groupClass && b.groupClass.toLowerCase().includes(q)) ||
        (b.rollNo && b.rollNo.toLowerCase().includes(q)) ||
        (b.section && b.section.toLowerCase().includes(q))
    );
  }, [upcomingBirthdays, selectedFilter, selectedDayOffset, searchQuery]);

  const handleTestNotification = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    triggerSystemNotificationTest();
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: topInset + 8 }]}>
      {/* Navigation Bar Header */}
      <View style={styles.navBarRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.dateSubtitle, { color: colors.textSecondary }]}>
            {todayDateString}
          </Text>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>
            {title}
          </Text>
        </View>

        {/* Right Navigation Actions */}
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
            style={[
              styles.addIconBtn,
              {
                backgroundColor: colors.accent,
                ...Platform.select({
                  web: { boxShadow: '0 2px 8px rgba(0,122,255,0.3)' } as any,
                  default: { elevation: 3 },
                }),
              },
            ]}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search name, class, section, roll no..."
      />

      {/* Apple-Style iOS 18 Week Calendar Widget */}
      <View
        style={[
          styles.appleWidgetContainer,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? colors.surfaceBorder : colors.cardBorder,
            ...Platform.select({
              web: { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' } as any,
              default: { elevation: 2 },
            }),
          },
        ]}
      >
        {/* Widget Top Header Bar */}
        <View style={styles.widgetHeaderRow}>
          <View style={styles.widgetHeaderLeft}>
            <CalendarIcon size={14} color={colors.accent} />
            <Text style={[styles.widgetMonthText, { color: colors.textPrimary }]}>
              {monthYearString}
            </Text>
          </View>
        </View>

        {/* 7-Day Day Columns (Apple Calendar Style with Orange Birthday Circles) */}
        <View style={styles.weekStripDays}>
          {weekStrip.map((item) => {
            const isSelected = selectedDayOffset === item.offset;
            const isToday = item.isToday;

            return (
              <TouchableOpacity
                key={item.offset}
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (e) {}
                  setSelectedDayOffset(selectedDayOffset === item.offset ? null : item.offset);
                }}
                style={styles.dayColumn}
              >
                {/* Day of Week Label (e.g. THU) */}
                <Text
                  style={[
                    styles.dayNameLabel,
                    {
                      color: isToday
                        ? colors.accent
                        : colors.textSecondary,
                      fontWeight: isToday ? '700' : '600',
                    },
                  ]}
                >
                  {item.dayName}
                </Text>

                {/* Day Number Circle with Orange Birthday Outline */}
                <View
                  style={[
                    styles.dayNumCircle,
                    isToday
                      ? {
                          backgroundColor: colors.accent,
                          ...(item.hasBirthday ? { borderWidth: 2, borderColor: '#FF9500' } : {}),
                          ...Platform.select({
                            web: { boxShadow: '0 2px 6px rgba(0,122,255,0.4)' } as any,
                            default: { elevation: 2 },
                          }),
                        }
                      : item.hasBirthday
                      ? {
                          borderWidth: 1.5,
                          borderColor: '#FF9500',
                          backgroundColor: isDark ? 'rgba(255,149,0,0.1)' : '#FFF9F0',
                        }
                      : isSelected
                      ? {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                          borderWidth: 1,
                          borderColor: colors.accent,
                        }
                      : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumText,
                      {
                        color: isToday
                          ? '#FFFFFF'
                          : item.hasBirthday
                          ? '#FF9500'
                          : colors.textPrimary,
                        fontWeight: isToday || item.hasBirthday ? '800' : '600',
                      },
                    ]}
                  >
                    {item.dayNum}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Context Peek Ribbon */}
        <View
          style={[
            styles.contextPeekBar,
            {
              backgroundColor: isDark ? colors.surface : colors.surfaceSubtle,
              borderTopColor: isDark ? colors.surfaceBorder : colors.cardBorder,
            },
          ]}
        >
          {activeDayData ? (
            activeDayData.celebrants.length > 0 ? (
              <View style={styles.peekContentRow}>
                <Cake size={14} color="#FF9500" />
                <Text style={[styles.peekMainText, { color: colors.textPrimary }]} numberOfLines={1}>
                  {activeDayData.celebrants.map((c) => `${c.name} (${c.groupClass || c.relationship})`).join(', ')}
                </Text>
              </View>
            ) : (
              <Text style={[styles.peekSubText, { color: colors.textMuted }]}>
                No celebrations on {activeDayData.dayName}, {activeDayData.dayNum}
              </Text>
            )
          ) : nextUpcoming ? (
            <View style={styles.peekContentRow}>
              <Sparkles size={14} color="#007AFF" />
              <Text style={[styles.peekMainText, { color: colors.textPrimary }]} numberOfLines={1}>
                Next: {nextUpcoming.name}
                {nextUpcoming.groupClass ? ` • ${nextUpcoming.groupClass}` : ''} (in {nextUpcoming.daysUntil} days)
              </Text>
            </View>
          ) : (
            <Text style={[styles.peekSubText, { color: colors.textMuted }]}>
              All clear across your cohorts
            </Text>
          )}
        </View>
      </View>

      {/* CASE 1: BIRTHDAYS TODAY */}
      {filteredToday.length > 0 && (
        <View style={styles.sectionBlock}>
          <View
            style={[
              styles.todayCelebrationBanner,
              {
                backgroundColor: isDark ? '#1F1A00' : '#FFFBEB',
                borderColor: '#F59E0B',
              },
            ]}
          >
            <View style={styles.todayBannerHeader}>
              <View style={styles.todayBadgeTag}>
                <Cake size={18} color="#D97706" />
                <Text style={styles.todayBadgeText}>TODAY'S CELEBRATIONS</Text>
              </View>
              <View style={[styles.todayCountPill, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.todayCountPillText}>
                  {filteredToday.length} {filteredToday.length === 1 ? 'Birthday' : 'Birthdays'}
                </Text>
              </View>
            </View>
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

      {/* Class / Group Filters & Upcoming Header */}
      <View style={styles.upcomingHeaderContainer}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.iosSectionTitle, { color: colors.textSecondary }]}>
            {selectedDayOffset !== null
              ? selectedDayOffset === 0
                ? 'TODAY'
                : selectedDayOffset === 1
                ? 'TOMORROW'
                : `IN ${selectedDayOffset} DAYS`
              : 'UPCOMING'}
          </Text>
          <Text style={[styles.iosBadgeText, { color: colors.textMuted }]}>
            {filteredUpcoming.length} {filteredUpcoming.length === 1 ? 'person' : 'people'}
          </Text>
        </View>

        {/* Filter Chips */}
        {availableClasses.length > 0 && selectedDayOffset === null ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.classChipsScroll}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedFilter('all')}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    selectedFilter === 'all'
                      ? colors.accent
                      : isDark
                      ? colors.surface
                      : colors.surfaceSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: selectedFilter === 'all' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                All ({upcomingBirthdays.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedFilter('month')}
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    selectedFilter === 'month'
                      ? colors.accent
                      : isDark
                      ? colors.surface
                      : colors.surfaceSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: selectedFilter === 'month' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Next 30 Days ({thisMonthCount})
              </Text>
            </TouchableOpacity>

            {availableClasses.map((cls) => {
              const count = upcomingBirthdays.filter(
                (b) => b.groupClass && b.groupClass.trim().toLowerCase() === cls.toLowerCase()
              ).length;

              return (
                <TouchableOpacity
                  key={cls}
                  activeOpacity={0.7}
                  onPress={() => setSelectedFilter(cls)}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor:
                        selectedFilter.toLowerCase() === cls.toLowerCase()
                          ? colors.accent
                          : isDark
                          ? colors.surface
                          : colors.surfaceSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color:
                          selectedFilter.toLowerCase() === cls.toLowerCase()
                            ? '#FFFFFF'
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {cls} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}
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
          filteredToday.length === 0 && filteredUpcoming.length === 0 ? (
            <EmptyState
              title={
                searchQuery
                  ? 'No Results Found'
                  : selectedDayOffset !== null
                  ? 'No Birthdays on This Day'
                  : 'No Birthdays Added'
              }
              subtitle={
                searchQuery
                  ? `No records found matching "${searchQuery}".`
                  : selectedDayOffset !== null
                  ? 'Tap another day in the calendar ribbon above.'
                  : 'Tap + above or import a Google Sheet / CSV to get started.'
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
    paddingBottom: 4,
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
    fontSize: 32,
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
  },
  appleWidgetContainer: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  widgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  widgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  widgetMonthText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  weekStripDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayNameLabel: {
    fontSize: 11,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dayNumCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumText: {
    fontSize: 15,
  },
  contextPeekBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  peekContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  peekMainText: {
    fontSize: 12,
    fontWeight: '600',
  },
  peekSubText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  sectionBlock: {
    marginBottom: 12,
  },
  todayCelebrationBanner: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  todayBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#D97706',
  },
  todayCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  todayCountPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  upcomingHeaderContainer: {
    marginTop: 4,
    marginBottom: 6,
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
  classChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
