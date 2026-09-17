import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
  Linking,
  Animated,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  Share2,
  Edit2,
  Trash2,
  Bell,
  MessageCircle,
  Phone,
  MessageSquare,
  Mail,
  GraduationCap,
  Users,
  ChevronRight,
  Compass,
} from 'lucide-react-native';
import { CalculatedBirthday } from '../types/birthday';
import { Avatar } from './Avatar';
import { useBirthdays } from '../context/BirthdayContext';
import { RELATIONSHIP_COLORS, getCategoryStyle } from '../constants/theme';
import { NotificationService } from '../services/notifications';
import { ActionService } from '../services/actions';

interface BirthdayDetailModalProps {
  visible: boolean;
  onClose: () => void;
  birthday: CalculatedBirthday | null;
  onEdit: (bday: CalculatedBirthday) => void;
  onOpenAIWish: (bday: CalculatedBirthday) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BirthdayDetailModal: React.FC<BirthdayDetailModalProps> = ({
  visible,
  onClose,
  birthday,
  onEdit,
  onOpenAIWish,
}) => {
  const { colors, isDark, deleteBirthday, settings } = useBirthdays();

  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 65 || gestureState.vy > 0.5) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (e) {}
          onClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible]);

  if (!birthday) return null;

  const [, birthMonthStr, birthDayStr] = birthday.birthDate.split('-').map(Number);
  const formattedFullDate = `${birthDayStr} ${MONTH_NAMES[birthMonthStr - 1]}`;
  const relColor = getCategoryStyle(birthday.relationship);

  const handleDelete = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to remove ${birthday.name}'s birthday?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBirthday(birthday.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleTestSystemAlert = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    await NotificationService.triggerImmediateSystemNotification(
      `${birthday.name}'s Birthday Reminder`,
      `${birthday.name} is turning ${birthday.nextAge}. (Device Alarm Active)`
    );
  };

  const handleParentWhatsApp = () => {
    if (!birthday.parentPhone) {
      Alert.alert('No Parent Phone', `No parent contact recorded for ${birthday.name}.`);
      return;
    }
    const msg = ActionService.formatParentGreeting(
      settings.customParentTemplate,
      birthday,
      settings.senderName
    );
    ActionService.sendWhatsApp(birthday.parentPhone, msg, `${birthday.name}'s Parent`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Apple Sheet Grabber Handle */}
          <View {...panResponder.panHandlers} style={styles.grabberWrapper}>
            <View style={[styles.grabber, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
          </View>

          {/* Navigation Bar */}
          <View {...panResponder.panHandlers} style={styles.navBar}>
            <View style={[styles.relPill, { backgroundColor: relColor.bg }]}>
              <Text style={[styles.relText, { color: relColor.text }]}>{relColor.label}</Text>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.doneBtn}>
              <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Hero Profile */}
            <View style={styles.heroSection}>
              <Avatar
                name={birthday.name}
                size={80}
                backgroundColor={birthday.avatarColor || colors.accent}
                fontSize={30}
              />
              <Text style={[styles.heroName, { color: colors.textPrimary }]}>
                {birthday.name}
              </Text>
              <Text style={[styles.heroSub, { color: colors.textSecondary }]}>
                {formattedFullDate} • Born {birthday.birthDate.split('-')[0]}
              </Text>

              <View
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: birthday.isToday
                      ? colors.dangerBg
                      : isDark
                      ? '#2C2C2E'
                      : '#E5E5EA',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: birthday.isToday ? colors.danger : colors.textPrimary },
                  ]}
                >
                  {birthday.isToday
                    ? 'Celebrating Today'
                    : birthday.isTomorrow
                    ? 'Tomorrow'
                    : `In ${birthday.daysUntil} days`}
                </Text>
              </View>
            </View>

            {/* Apple Quick Action Bar (Call, WhatsApp, SMS, AI Wish) */}
            <View style={styles.quickActionRow}>
              {/* Call */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => ActionService.callPhone(birthday.phone, birthday.name)}
                style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: '#34C759' }]}>
                  <Phone size={17} color="#FFFFFF" />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Call</Text>
              </TouchableOpacity>

              {/* WhatsApp */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const msg = ActionService.formatCategoryGreeting(
                    birthday,
                    settings.senderName,
                    birthday.relationship === 'student' ? settings.customStudentTemplate : undefined
                  );
                  ActionService.sendWhatsApp(birthday.phone, msg, birthday.name);
                }}
                style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: '#25D366' }]}>
                  <MessageCircle size={17} color="#FFFFFF" />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>WhatsApp</Text>
              </TouchableOpacity>

              {/* SMS */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  const msg = ActionService.formatCategoryGreeting(
                    birthday,
                    settings.senderName,
                    birthday.relationship === 'student' ? settings.customStudentTemplate : undefined
                  );
                  ActionService.sendSMS(birthday.phone, msg, birthday.name);
                }}
                style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: '#007AFF' }]}>
                  <MessageSquare size={17} color="#FFFFFF" />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>Message</Text>
              </TouchableOpacity>

              {/* AI Wish */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onOpenAIWish(birthday)}
                style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <View style={[styles.quickIconCircle, { backgroundColor: '#AF52DE' }]}>
                  <Sparkles size={17} color="#FFFFFF" />
                </View>
                <Text style={[styles.quickLabel, { color: colors.textPrimary }]}>AI Wish</Text>
              </TouchableOpacity>
            </View>

            {/* Inset Grouped Metrics */}
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.metricNum, { color: colors.textPrimary }]}>
                  {birthday.nextAge}
                </Text>
                <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>TURNS AGE</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Text style={[styles.metricNum, { color: colors.textPrimary }]}>
                  {birthday.daysUntil}
                </Text>
                <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>DAYS LEFT</Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Compass size={22} color={colors.accent} style={{ marginBottom: 4 }} />
                <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>
                  {birthday.zodiacSign}
                </Text>
              </View>
            </View>

            {/* Contact & Student Information */}
            {(birthday.phone || birthday.groupClass || birthday.section || birthday.session || birthday.rollNo || birthday.parentPhone || birthday.email) && (
              <>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  {birthday.relationship === 'student' ? 'STUDENT & CONTACT INFO' : 'CONTACT INFO'}
                </Text>
                <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  {birthday.phone && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => ActionService.callPhone(birthday.phone, birthday.name)}
                      style={styles.infoRow}
                    >
                      <View style={styles.infoLeft}>
                        <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Phone</Text>
                        <Text style={[styles.infoValue, { color: colors.accent }]}>{birthday.phone}</Text>
                      </View>
                      <Phone size={15} color={colors.accent} />
                    </TouchableOpacity>
                  )}

                  {(birthday.groupClass || birthday.section) && (
                    <>
                      {birthday.phone && <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />}
                      <View style={styles.infoRow}>
                        <View style={styles.infoLeft}>
                          <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Class / Section</Text>
                          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                            {[birthday.groupClass, birthday.section ? `Sec ${birthday.section}` : null].filter(Boolean).join(' - ')}
                          </Text>
                        </View>
                        <GraduationCap size={16} color={colors.textSecondary} />
                      </View>
                    </>
                  )}

                  {birthday.session && (
                    <>
                      <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
                      <View style={styles.infoRow}>
                        <View style={styles.infoLeft}>
                          <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Academic Session / Batch</Text>
                          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{birthday.session}</Text>
                        </View>
                      </View>
                    </>
                  )}

                  {birthday.rollNo && (
                    <>
                      <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
                      <View style={styles.infoRow}>
                        <View style={styles.infoLeft}>
                          <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Roll No / Student ID</Text>
                          <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{birthday.rollNo}</Text>
                        </View>
                      </View>
                    </>
                  )}

                  {birthday.parentPhone && (
                    <>
                      <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => ActionService.callPhone(birthday.parentPhone, `${birthday.name}'s Parent`)}
                        style={styles.infoRow}
                      >
                        <View style={styles.infoLeft}>
                          <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Parent Contact (Call)</Text>
                          <Text style={[styles.infoValue, { color: colors.accent }]}>{birthday.parentPhone}</Text>
                        </View>
                        <Users size={15} color={colors.accent} />
                      </TouchableOpacity>
                    </>
                  )}

                  {birthday.email && (
                    <>
                      <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => ActionService.sendEmail(birthday.email, undefined, undefined, birthday.name)}
                        style={styles.infoRow}
                      >
                        <View style={styles.infoLeft}>
                          <Text style={[styles.infoTitle, { color: colors.textSecondary }]}>Email</Text>
                          <Text style={[styles.infoValue, { color: colors.accent }]}>{birthday.email}</Text>
                        </View>
                        <Mail size={15} color={colors.accent} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}

            {/* Notes */}
            {birthday.notes ? (
              <>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>NOTES</Text>
                <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.notesContent, { color: colors.textPrimary }]}>
                    {birthday.notes}
                  </Text>
                </View>
              </>
            ) : null}

            {/* Actions (Apple Style) */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ACTIONS</Text>
            <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {/* Wish Parent if parentPhone exists */}
              {birthday.parentPhone && (
                <>
                  <TouchableOpacity
                    activeOpacity={0.65}
                    onPress={handleParentWhatsApp}
                    style={styles.actionRow}
                  >
                    <View style={[styles.actionIconBox, { backgroundColor: '#34C759' }]}>
                      <Users size={16} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                      Wish Parents on WhatsApp
                    </Text>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />
                </>
              )}

              {/* Share */}
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => ActionService.shareContact(birthday)}
                style={styles.actionRow}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#007AFF' }]}>
                  <Share2 size={16} color="#FFFFFF" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                  Share Birthday Card
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

              {/* Test Alert */}
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={handleTestSystemAlert}
                style={styles.actionRow}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#FF9500' }]}>
                  <Bell size={16} color="#FFFFFF" />
                </View>
                <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                  Trigger Alarm Test
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Edit & Delete Section */}
            <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder, marginTop: 14 }]}>
              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => onEdit(birthday)}
                style={styles.actionRow}
              >
                <View style={[styles.actionIconBox, { backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                  <Edit2 size={15} color={colors.textPrimary} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
                  Edit Details
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.separator, { backgroundColor: colors.surfaceBorder }]} />

              <TouchableOpacity
                activeOpacity={0.65}
                onPress={handleDelete}
                style={styles.actionRow}
              >
                <View style={[styles.actionIconBox, { backgroundColor: colors.dangerBg }]}>
                  <Trash2 size={15} color={colors.danger} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.danger }]}>
                  Delete Contact
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '88%',
  },
  grabberWrapper: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    width: '100%',
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  relPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  relText: {
    fontSize: 12,
    fontWeight: '600',
  },
  doneBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 10,
  },
  heroSub: {
    fontSize: 14,
    marginTop: 3,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0.5,
    marginHorizontal: 4,
  },
  quickIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    marginHorizontal: 4,
  },
  metricNum: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  metricZodiac: {
    fontSize: 20,
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  groupedBox: {
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoLeft: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 1,
  },
  notesContent: {
    padding: 14,
    fontSize: 15,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionLabel: {
    fontSize: 16,
    letterSpacing: -0.3,
    flex: 1,
  },
  separator: {
    height: 0.5,
    marginLeft: 54,
  },
});
