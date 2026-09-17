import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Animated,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';
import { Birthday, RelationshipType, ReminderTiming } from '../types/birthday';
import { useBirthdays } from '../context/BirthdayContext';
import { AppleCalendarPicker } from './AppleCalendarPicker';
import { AppleSwitch } from './AppleSwitch';
import { AVATAR_COLORS, RELATIONSHIP_COLORS } from '../constants/theme';

interface AddBirthdayModalProps {
  visible: boolean;
  onClose: () => void;
  birthdayToEdit?: Birthday | null;
}

const MONTHS = [
  { label: 'Jan', val: 1 },
  { label: 'Feb', val: 2 },
  { label: 'Mar', val: 3 },
  { label: 'Apr', val: 4 },
  { label: 'May', val: 5 },
  { label: 'Jun', val: 6 },
  { label: 'Jul', val: 7 },
  { label: 'Aug', val: 8 },
  { label: 'Sep', val: 9 },
  { label: 'Oct', val: 10 },
  { label: 'Nov', val: 11 },
  { label: 'Dec', val: 12 },
];

export const AddBirthdayModal: React.FC<AddBirthdayModalProps> = ({
  visible,
  onClose,
  birthdayToEdit,
}) => {
  const { colors, isDark, addBirthday, updateBirthday, customCategories, addCustomCategory } =
    useBirthdays();

  const [newCategoryModalVisible, setNewCategoryModalVisible] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const now = new Date();
  const [name, setName] = useState('');
  const [year, setYear] = useState(String(now.getFullYear() - 25));
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [day, setDay] = useState(now.getDate());
  const [relationship, setRelationship] = useState<RelationshipType>('student');
  const [groupClass, setGroupClass] = useState('');
  const [section, setSection] = useState('');
  const [session, setSession] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);

  const [notifyOnDay, setNotifyOnDay] = useState(true);
  const [notifyDayBefore, setNotifyDayBefore] = useState(true);
  const [notifyWeekBefore, setNotifyWeekBefore] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');

  useEffect(() => {
    if (birthdayToEdit) {
      setName(birthdayToEdit.name);
      const [y, m, d] = birthdayToEdit.birthDate.split('-').map(Number);
      setYear(String(y));
      setMonth(m);
      setDay(d);
      setRelationship(birthdayToEdit.relationship);
      setGroupClass(birthdayToEdit.groupClass || '');
      setSection(birthdayToEdit.section || '');
      setSession(birthdayToEdit.session || '');
      setRollNo(birthdayToEdit.rollNo || '');
      setPhone(birthdayToEdit.phone || '');
      setParentPhone(birthdayToEdit.parentPhone || '');
      setEmail(birthdayToEdit.email || '');
      setNotes(birthdayToEdit.notes || '');
      setSelectedColor(birthdayToEdit.avatarColor || AVATAR_COLORS[0]);

      const onDay = birthdayToEdit.reminders.some((r) => r.timing === 'on_day' && r.enabled);
      const dayBefore = birthdayToEdit.reminders.some((r) => r.timing === 'day_before' && r.enabled);
      const weekBefore = birthdayToEdit.reminders.some((r) => r.timing === 'week_before' && r.enabled);
      setNotifyOnDay(onDay);
      setNotifyDayBefore(dayBefore);
      setNotifyWeekBefore(weekBefore);
      if (birthdayToEdit.reminders[0]?.time) {
        setReminderTime(birthdayToEdit.reminders[0].time);
      }
    } else {
      resetForm();
    }
  }, [birthdayToEdit, visible]);

  const resetForm = () => {
    const today = new Date();
    setName('');
    setYear(String(today.getFullYear() - 18));
    setMonth(today.getMonth() + 1);
    setDay(today.getDate());
    setRelationship('student');
    setGroupClass('');
    setSection('');
    setSession('');
    setRollNo('');
    setPhone('');
    setParentPhone('');
    setEmail('');
    setNotes('');
    setSelectedColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
    setNotifyOnDay(true);
    setNotifyDayBefore(true);
    setNotifyWeekBefore(false);
    setReminderTime('09:00');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a name for this contact.');
      return;
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > now.getFullYear()) {
      Alert.alert('Invalid Year', `Please enter a birth year between 1900 and ${now.getFullYear()}.`);
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { }

    const formattedDate = `${yearNum}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const reminders = [
      { id: 'rem_on_day', timing: 'on_day' as ReminderTiming, time: reminderTime, enabled: notifyOnDay },
      { id: 'rem_day_before', timing: 'day_before' as ReminderTiming, time: reminderTime, enabled: notifyDayBefore },
      { id: 'rem_week_before', timing: 'week_before' as ReminderTiming, time: reminderTime, enabled: notifyWeekBefore },
    ];

    if (birthdayToEdit) {
      await updateBirthday({
        ...birthdayToEdit,
        name: name.trim(),
        birthDate: formattedDate,
        relationship,
        groupClass: groupClass.trim() || undefined,
        section: section.trim() || undefined,
        session: session.trim() || undefined,
        rollNo: rollNo.trim() || undefined,
        phone: phone.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        avatarColor: selectedColor,
        reminders,
      });
    } else {
      await addBirthday({
        name: name.trim(),
        birthDate: formattedDate,
        relationship,
        groupClass: groupClass.trim() || undefined,
        section: section.trim() || undefined,
        session: session.trim() || undefined,
        rollNo: rollNo.trim() || undefined,
        phone: phone.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        avatarColor: selectedColor,
        reminders,
      });
    }

    onClose();
  };

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
          } catch (e) { }
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

  const daysInMonth = new Date(parseInt(year, 10) || 2000, month, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
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

          {/* Apple Form Header: Cancel | Title | Done */}
          <View {...panResponder.panHandlers} style={[styles.navHeader, { borderBottomColor: colors.surfaceBorder }]}>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.navBtn}>
              <Text style={[styles.cancelText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {birthdayToEdit ? 'Edit Birthday' : 'New Birthday'}
            </Text>

            <TouchableOpacity activeOpacity={0.7} onPress={handleSave} style={styles.navBtn}>
              <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Section 1: Category (First so form adapts immediately) */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>CATEGORY</Text>
            <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relScrollRow}
              >
                {[
                  { type: 'student', label: 'Student' },
                  { type: 'family', label: 'Family' },
                  { type: 'friend', label: 'Friend' },
                  { type: 'work', label: 'Work' },
                  ...(customCategories || []).map((cat) => ({
                    type: cat,
                    label: cat.charAt(0).toUpperCase() + cat.slice(1),
                  })),
                ].map((rel) => {
                  const isSelected = relationship.toLowerCase() === rel.type.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={rel.type}
                      activeOpacity={0.7}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch (e) {}
                        setRelationship(rel.type);
                      }}
                      style={[
                        styles.relPill,
                        {
                          backgroundColor: isSelected ? colors.accent : isDark ? '#2C2C2E' : '#E5E5EA',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.relPillText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textPrimary,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}
                      >
                        {rel.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* + New Category Button */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setNewCategoryModalVisible(true);
                  }}
                  style={[
                    styles.relPill,
                    {
                      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.accent,
                      borderStyle: 'dashed',
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Plus size={13} color={colors.accent} style={{ marginRight: 4 }} />
                  <Text
                    style={[
                      styles.relPillText,
                      {
                        color: colors.accent,
                        fontWeight: '600',
                      },
                    ]}
                  >
                    New
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Section 2: Contact Details */}
            {relationship === 'student' ? (
              <>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>STUDENT CONTACT</Text>
                <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Student Full Name *"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                  />
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Student Phone / WhatsApp (optional)"
                    placeholderTextColor={colors.textSecondary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Parent Phone / WhatsApp"
                    placeholderTextColor={colors.textSecondary}
                    value={parentPhone}
                    onChangeText={setParentPhone}
                    keyboardType="phone-pad"
                  />
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Email (optional)"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Section 3: Academic Information */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>ACADEMIC INFORMATION</Text>
                <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Class / Grade (e.g. 10th, 12th, B.Tech)"
                    placeholderTextColor={colors.textSecondary}
                    value={groupClass}
                    onChangeText={setGroupClass}
                  />
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Section (e.g. A, B, Blue)"
                    placeholderTextColor={colors.textSecondary}
                    value={section}
                    onChangeText={setSection}
                  />
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Academic Session (e.g. 2024-2025)"
                    placeholderTextColor={colors.textSecondary}
                    value={session}
                    onChangeText={setSession}
                  />
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Roll Number (e.g. 24)"
                    placeholderTextColor={colors.textSecondary}
                    value={rollNo}
                    onChangeText={setRollNo}
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>CONTACT DETAILS</Text>
                <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Full Name *"
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                  />
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Phone / WhatsApp"
                    placeholderTextColor={colors.textSecondary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Group / Department / Tag (optional)"
                    placeholderTextColor={colors.textSecondary}
                    value={groupClass}
                    onChangeText={setGroupClass}
                  />
                  <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Email (optional)"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </>
            )}

            {/* Section 3: Date of Birth */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>DATE OF BIRTH</Text>
            <AppleCalendarPicker
              month={month}
              day={day}
              year={year}
              onDateChange={(m, d, y) => {
                setMonth(m);
                setDay(d);
                setYear(y);
              }}
            />

            {/* Section 4: Reminders */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>DEVICE REMINDERS</Text>
            <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>On Birthday</Text>
                <AppleSwitch
                  value={notifyOnDay}
                  onValueChange={(v) => setNotifyOnDay(v)}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>1 Day Before</Text>
                <AppleSwitch
                  value={notifyDayBefore}
                  onValueChange={(v) => setNotifyDayBefore(v)}
                />
              </View>
            </View>

            {/* Section 5: Notes */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>NOTES</Text>
            <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <TextInput
                style={[styles.notesInput, { color: colors.textPrimary }]}
                placeholder="Notes (optional)"
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* CREATE NEW CATEGORY MODAL */}
      <Modal
        visible={newCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setNewCategoryModalVisible(false);
          setNewCategoryInput('');
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 16,
              borderWidth: StyleSheet.hairlineWidth,
              padding: 20,
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? '#2C2C2E' : '#E5E5EA',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 6,
                letterSpacing: -0.3,
                color: colors.textPrimary,
              }}
            >
              Create Category
            </Text>
            <Text
              style={{
                fontSize: 13,
                marginBottom: 14,
                lineHeight: 18,
                color: colors.textSecondary,
              }}
            >
              Enter a name for this category (e.g. Alumni, Faculty, VIPs). It will be saved for all contacts and filters.
            </Text>
            <TextInput
              value={newCategoryInput}
              onChangeText={setNewCategoryInput}
              autoFocus
              placeholder="e.g. Alumni, Faculty, VIP"
              placeholderTextColor={colors.textMuted}
              style={{
                height: 44,
                borderRadius: 10,
                borderWidth: StyleSheet.hairlineWidth,
                paddingHorizontal: 12,
                fontSize: 15,
                marginBottom: 16,
                color: colors.textPrimary,
                borderColor: isDark ? '#3A3A3C' : '#D1D1D6',
                backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => {
                  setNewCategoryModalVisible(false);
                  setNewCategoryInput('');
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  minWidth: 80,
                  alignItems: 'center',
                  backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
                }}
              >
                <Text style={{ fontSize: 14, color: colors.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const trimmed = newCategoryInput.trim();
                  if (!trimmed) {
                    setNewCategoryModalVisible(false);
                    return;
                  }
                  try {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } catch (e) {}
                  const created = await addCustomCategory(trimmed);
                  if (created) {
                    setRelationship(created);
                  }
                  setNewCategoryInput('');
                  setNewCategoryModalVisible(false);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  minWidth: 80,
                  alignItems: 'center',
                  backgroundColor: colors.accent,
                }}
              >
                <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '700' }}>
                  Add & Select
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: '90%',
  },
  grabberWrapper: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  navBtn: {
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 17,
    letterSpacing: -0.4,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  groupedBox: {
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  textInput: {
    paddingHorizontal: 14,
    height: 44,
    fontSize: 17,
    letterSpacing: -0.3,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  scrollRow: {
    padding: 10,
    flexDirection: 'row',
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  dayBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  divider: {
    height: 0.5,
    marginLeft: 14,
  },
  dayYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  yearField: {
    width: 72,
    height: 34,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  relScrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  relPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  relPillText: {
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    letterSpacing: -0.3,
  },
  notesInput: {
    padding: 14,
    fontSize: 16,
    letterSpacing: -0.3,
    minHeight: 70,
    textAlignVertical: 'top',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
});
