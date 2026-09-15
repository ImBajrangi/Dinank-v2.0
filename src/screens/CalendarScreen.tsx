import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { BirthdayCard } from '../components/BirthdayCard';
import { CalculatedBirthday } from '../types/birthday';

interface CalendarScreenProps {
  onSelectBirthday: (bday: CalculatedBirthday) => void;
  onOpenAIWish: (bday: CalculatedBirthday) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  onSelectBirthday,
  onOpenAIWish,
}) => {
  const { colors, isDark, calculatedBirthdays } = useBirthdays();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthBirthdays = useMemo(() => {
    return calculatedBirthdays.filter((b) => {
      const [, mStr] = b.birthDate.split('-').map(Number);
      return mStr === month + 1;
    });
  }, [calculatedBirthdays, month]);

  const birthdayDayMap = useMemo(() => {
    const map = new Map<number, CalculatedBirthday[]>();
    for (const b of monthBirthdays) {
      const [, , dStr] = b.birthDate.split('-').map(Number);
      const list = map.get(dStr) || [];
      list.push(b);
      map.set(dStr, list);
    }
    return map;
  }, [monthBirthdays]);

  const displayedBirthdays = useMemo(() => {
    if (selectedDay !== null) {
      return birthdayDayMap.get(selectedDay) || [];
    }
    return monthBirthdays;
  }, [selectedDay, birthdayDayMap, monthBirthdays]);

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const today = new Date();
  const isCurrentCalendarMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const handleSelectDay = (d: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSelectedDay(selectedDay === d ? null : d);
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
        {/* Apple iOS Large Title Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>Calendar</Text>
          <View style={[styles.badgePill, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.badgeText, { color: colors.accent }]}>
              {monthBirthdays.length} this month
            </Text>
          </View>
        </View>

        {/* Apple Calendar Inset Grouped Card */}
        <View
          style={[
            styles.calendarCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Month & Nav Controls */}
          <View style={styles.monthNavRow}>
            <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
              {MONTH_NAMES[month]} {year}
            </Text>

            <View style={styles.arrowsGroup}>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={handlePrevMonth}
                style={[styles.arrowBtn, { backgroundColor: isDark ? colors.surfaceSubtle : colors.chipBg }]}
              >
                <ChevronLeft size={16} color={colors.accent} strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.6}
                onPress={handleNextMonth}
                style={[styles.arrowBtn, { backgroundColor: isDark ? colors.surfaceSubtle : colors.chipBg }]}
              >
                <ChevronRight size={16} color={colors.accent} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekdaysRow}>
            {DAYS_OF_WEEK.map((d, i) => (
              <Text key={i} style={[styles.weekdayText, { color: colors.textSecondary }]}>
                {d}
              </Text>
            ))}
          </View>

          {/* Day Grid */}
          <View style={styles.grid}>
            {calendarCells.map((dayNum, idx) => {
              if (dayNum === null) {
                return <View key={`empty_${idx}`} style={styles.cell} />;
              }

              const hasBirthdays = birthdayDayMap.has(dayNum);
              const isSelected = selectedDay === dayNum;
              const isTodayCell = isCurrentCalendarMonth && today.getDate() === dayNum;

              return (
                <TouchableOpacity
                  key={`day_${dayNum}`}
                  activeOpacity={0.65}
                  onPress={() => handleSelectDay(dayNum)}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      isSelected && {
                        backgroundColor: colors.accent,
                        borderRadius: 17,
                      },
                      !isSelected && isTodayCell && {
                        backgroundColor: colors.danger,
                        borderRadius: 17,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        {
                          color: isSelected || isTodayCell ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: isSelected || isTodayCell ? '700' : '400',
                        },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </View>

                  {hasBirthdays && (
                    <View
                      style={[
                        styles.birthdayDot,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.warning,
                        },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {selectedDay !== null
              ? `BIRTHDAYS ON ${MONTH_NAMES[month].toUpperCase()} ${selectedDay}`
              : `BIRTHDAYS IN ${MONTH_NAMES[month].toUpperCase()}`}
          </Text>
          {selectedDay !== null && (
            <TouchableOpacity onPress={() => setSelectedDay(null)}>
              <Text style={[styles.clearBtnText, { color: colors.accent }]}>
                Show all
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Birthday Items */}
        {displayedBirthdays.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <CalIcon size={24} color={colors.textSecondary} style={{ marginBottom: 6 }} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {selectedDay !== null
                ? `No birthdays on ${MONTH_NAMES[month]} ${selectedDay}`
                : `No birthdays in ${MONTH_NAMES[month]}`}
            </Text>
          </View>
        ) : (
          displayedBirthdays.map((b) => (
            <BirthdayCard
              key={b.id}
              birthday={b}
              onPress={() => onSelectBirthday(b)}
              onWishPress={() => onOpenAIWish(b)}
            />
          ))
        )}
      </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  calendarCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 14,
    marginBottom: 20,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  arrowsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 15,
  },
  birthdayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
  },
});
