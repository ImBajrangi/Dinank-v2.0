import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { CalculatedBirthday } from '../types/birthday';
import { Avatar } from './Avatar';
import { useBirthdays } from '../context/BirthdayContext';
import { RELATIONSHIP_COLORS, getCategoryStyle } from '../constants/theme';

interface BirthdayCardProps {
  birthday: CalculatedBirthday;
  onPress: () => void;
  onWishPress?: () => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const BirthdayCard: React.FC<BirthdayCardProps> = React.memo(({
  birthday,
  onPress,
  onWishPress,
}) => {
  const { colors, isDark } = useBirthdays();
  const [, birthMonthStr, birthDayStr] = birthday.birthDate.split('-').map(Number);
  const formattedDate = `${MONTH_NAMES[birthMonthStr - 1]} ${birthDayStr}`;

  const relColor = getCategoryStyle(birthday.relationship);

  // Apple-style status badge
  const getBadge = () => {
    if (birthday.isToday) {
      return {
        bg: colors.dangerBg,
        text: colors.danger,
        label: 'Today',
      };
    }
    if (birthday.isTomorrow) {
      return {
        bg: colors.warningBg,
        text: colors.warning,
        label: 'Tomorrow',
      };
    }
    return {
      bg: isDark ? colors.surfaceSubtle : colors.chipBg,
      text: colors.textSecondary,
      label: `in ${birthday.daysUntil}d`,
    };
  };

  const badge = getBadge();

  const handleCardPress = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.65}
      onPress={handleCardPress}
      style={[
        styles.cell,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.contentRow}>
        <Avatar
          name={birthday.name}
          size={46}
          backgroundColor={birthday.avatarColor || colors.accent}
          fontSize={17}
        />

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text
              numberOfLines={1}
              style={[styles.nameText, { color: colors.textPrimary }]}
            >
              {birthday.name}
            </Text>
            <View style={[styles.relPill, { backgroundColor: relColor.bg }]}>
              <Text style={[styles.relText, { color: relColor.text }]}>
                {relColor.label}
              </Text>
            </View>
          </View>

          <Text numberOfLines={1} style={[styles.metaText, { color: colors.textSecondary }]}>
            {formattedDate}
            {birthday.nextAge > 0 && birthday.nextAge <= 120 ? ` • Turns ${birthday.nextAge}` : ''}
            {birthday.groupClass ? ` • ${birthday.groupClass}` : ''}
            {birthday.section ? ` (${birthday.section})` : ''}
            {birthday.session ? ` • ${birthday.session}` : ''}
          </Text>
        </View>

        <View style={styles.accessoryCol}>
          <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeLabel, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>

          {onWishPress ? (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={(e) => {
                e.stopPropagation();
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (err) {}
                onWishPress();
              }}
              style={[
                styles.wishIconBtn,
                { backgroundColor: isDark ? colors.surfaceSubtle : colors.accentLight },
              ]}
            >
              <Sparkles size={13} color={colors.accent} />
            </TouchableOpacity>
          ) : (
            <ChevronRight size={16} color={colors.textMuted} style={styles.chevron} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cell: {
    borderRadius: 14,
    borderWidth: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginRight: 6,
  },
  relPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  relText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 13,
    fontWeight: '400',
  },
  accessoryCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  wishIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginLeft: 2,
  },
});
