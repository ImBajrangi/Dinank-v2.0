import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';

interface AppleCalendarPickerProps {
  month: number; // 1 - 12
  day: number; // 1 - 31
  year: string; // '2004'
  onDateChange: (month: number, day: number, year: string) => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DECADES = [
  { id: 'all', label: 'All' },
  { id: '2020', label: '2020s' },
  { id: '2010', label: '2010s' },
  { id: '2000', label: '2000s' },
  { id: '1990', label: '1990s' },
  { id: '1980', label: '1980s' },
  { id: '1970', label: '1970s' },
  { id: 'older', label: 'Older' },
];

export const AppleCalendarPicker: React.FC<AppleCalendarPickerProps> = ({
  month,
  day,
  year,
  onDateChange,
}) => {
  const { colors, isDark } = useBirthdays();
  const [viewMode, setViewMode] = useState<'calendar' | 'years'>('calendar');
  const [selectedDecade, setSelectedDecade] = useState<string>('all');

  const currentYearNum = parseInt(year, 10) || new Date().getFullYear();

  // Days in month & offset
  const daysInMonth = useMemo(() => {
    return new Date(currentYearNum, month, 0).getDate();
  }, [currentYearNum, month]);

  const firstDayOffset = useMemo(() => {
    return new Date(currentYearNum, month - 1, 1).getDay();
  }, [currentYearNum, month]);

  // 7-column slots
  const calendarSlots = useMemo(() => {
    const slots: (number | null)[] = [];
    for (let i = 0; i < firstDayOffset; i++) {
      slots.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      slots.push(d);
    }
    return slots;
  }, [firstDayOffset, daysInMonth]);

  // Compact year list from current year down to 1940
  const availableYears = useMemo(() => {
    const maxYear = new Date().getFullYear();
    const yrs: number[] = [];
    for (let y = maxYear; y >= 1940; y--) {
      yrs.push(y);
    }
    return yrs;
  }, []);

  const filteredYears = useMemo(() => {
    if (selectedDecade === 'all') return availableYears;
    if (selectedDecade === 'older') return availableYears.filter((y) => y < 1970);
    const start = parseInt(selectedDecade, 10);
    const end = start + 9;
    return availableYears.filter((y) => y >= start && y <= end);
  }, [availableYears, selectedDecade]);

  const handlePrevMonth = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    if (month === 1) {
      onDateChange(12, Math.min(day, 31), String(currentYearNum - 1));
    } else {
      const nextDays = new Date(currentYearNum, month - 1, 0).getDate();
      onDateChange(month - 1, Math.min(day, nextDays), year);
    }
  };

  const handleNextMonth = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    if (month === 12) {
      onDateChange(1, Math.min(day, 31), String(currentYearNum + 1));
    } else {
      const nextDays = new Date(currentYearNum, month + 1, 0).getDate();
      onDateChange(month + 1, Math.min(day, nextDays), year);
    }
  };

  const handleSelectDay = (selectedDay: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    onDateChange(month, selectedDay, year);
  };

  const handleSelectYear = (selectedYear: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    const nextDays = new Date(selectedYear, month, 0).getDate();
    onDateChange(month, Math.min(day, nextDays), String(selectedYear));
    setViewMode('calendar');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Compact Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch (e) {}
            setViewMode(viewMode === 'calendar' ? 'years' : 'calendar');
          }}
          style={[styles.monthYearPill, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
        >
          <Text style={[styles.monthYearText, { color: colors.textPrimary }]}>
            {MONTH_NAMES[month - 1]} {year || currentYearNum}
          </Text>
          <CalendarIcon size={13} color={colors.accent} style={{ marginLeft: 5 }} />
        </TouchableOpacity>

        {viewMode === 'calendar' ? (
          <View style={styles.navArrows}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePrevMonth}
              style={[styles.arrowBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
            >
              <ChevronLeft size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNextMonth}
              style={[styles.arrowBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA', marginLeft: 4 }]}
            >
              <ChevronRight size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setViewMode('calendar')}
            style={[styles.donePill, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.donePillText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>

      {viewMode === 'years' ? (
        /* Year Picker with Decade Navigation */
        <View style={styles.yearPickerContainer}>
          {/* Decade quick filter tabs */}
          <ScrollView
            horizontal
            nestedScrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            style={styles.decadeScroll}
            contentContainerStyle={styles.decadeRow}
          >
            {DECADES.map((dec) => {
              const isDecSelected = selectedDecade === dec.id;
              return (
                <TouchableOpacity
                  key={dec.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setSelectedDecade(dec.id);
                  }}
                  style={[
                    styles.decadePill,
                    {
                      backgroundColor: isDecSelected
                        ? colors.accent
                        : isDark
                        ? '#2C2C2E'
                        : '#E5E5EA',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.decadeText,
                      {
                        color: isDecSelected ? '#FFFFFF' : colors.textPrimary,
                        fontWeight: isDecSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {dec.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 4-column year grid with nestedScrollEnabled */}
          <ScrollView
            nestedScrollEnabled={true}
            style={styles.yearScroll}
            contentContainerStyle={styles.yearGrid}
            showsVerticalScrollIndicator={true}
          >
            {filteredYears.map((y) => {
              const isSelected = y === currentYearNum;
              return (
                <TouchableOpacity
                  key={y}
                  activeOpacity={0.7}
                  onPress={() => handleSelectYear(y)}
                  style={[
                    styles.yearPill,
                    {
                      backgroundColor: isSelected ? colors.accent : isDark ? '#2C2C2E' : '#E5E5EA',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.yearText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {y}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        /* Compact 7-Column Calendar */
        <View style={styles.calendarBody}>
          {/* Weekday Row */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w, idx) => (
              <View key={idx} style={styles.gridDayCol}>
                <Text style={[styles.weekdayLabel, { color: colors.textMuted }]}>{w}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarSlots.map((d, index) => {
              if (d === null) {
                return <View key={`empty_${index}`} style={styles.gridDayCol} />;
              }
              const isSelected = d === day;
              return (
                <View key={`day_${d}`} style={styles.gridDayCol}>
                  <TouchableOpacity
                    activeOpacity={0.65}
                    onPress={() => handleSelectDay(d)}
                    style={[
                      styles.dayCircle,
                      {
                        backgroundColor: isSelected ? colors.accent : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthYearPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  monthYearText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  donePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  donePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  navArrows: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBody: {
    marginTop: 2,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  gridDayCol: {
    width: '14.285%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  weekdayLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 13,
  },
  yearPickerContainer: {
    paddingVertical: 4,
  },
  decadeScroll: {
    marginBottom: 8,
  },
  decadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  decadePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  decadeText: {
    fontSize: 12,
  },
  yearScroll: {
    maxHeight: 180,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  yearPill: {
    width: '23%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: {
    fontSize: 13,
  },
});
