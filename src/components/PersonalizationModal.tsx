import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  GraduationCap,
  Users,
  RotateCcw,
  Sparkles,
  MessageCircle,
  CheckCheck,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';

interface PersonalizationModalProps {
  visible: boolean;
  onClose: () => void;
}

const PRESETS_STUDENT = [
  {
    id: 'academic',
    label: 'Academic & Warm',
    text: 'Dear *{name}*, wishing you a very *Happy Birthday!* 🎂🎓 May this year bring you great success, high scores, and wisdom in *{class}*. Keep shining! ✨🎉\n\nBest regards,\n*{sender_name}*',
  },
  {
    id: 'sweet',
    label: 'Simple & Sweet',
    text: 'Happy Birthday dear *{name}*! 🎂 Wishing you a wonderful day filled with laughter and joyful moments! 🌟\n\n- *{sender_name}*',
  },
  {
    id: 'celebratory',
    label: 'Celebratory',
    text: 'Wishing you a magnificent birthday, *{name}*! 🥳🎉 May all your dreams and goals turn into reality this year! 🍰\n\nWarmest wishes,\n*{sender_name}*',
  },
];

const PRESETS_PARENT = [
  {
    id: 'parent_academic',
    label: 'Academic Appreciation',
    text: 'Dear Parent, heartfelt congratulations on *{name}*\'s birthday today! 💐 Wishing your child a glorious year ahead filled with good health and academic excellence. 🎓\n\nWarm regards,\n*{sender_name}* (*{class}*)',
  },
  {
    id: 'parent_blessing',
    label: 'Warm Blessing',
    text: 'Respected Parent, warmest birthday wishes to dear *{name}* on this auspicious day! 🎂🌸 May God bless your family with joy and prosperity. ✨\n\nSincerely,\n*{sender_name}*',
  },
];

const DEFAULT_STUDENT_TEMPLATE = PRESETS_STUDENT[0].text;
const DEFAULT_PARENT_TEMPLATE = PRESETS_PARENT[0].text;

/**
 * Parses and renders WhatsApp formatted text (*bold*, _italic_, ~strike~)
 */
const renderFormattedWhatsAppText = (text: string, baseColor: string) => {
  const parts = text.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~)/g);
  return parts.map((part, index) => {
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <Text key={index} style={{ fontWeight: '700', color: baseColor }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return (
        <Text key={index} style={{ fontStyle: 'italic', color: baseColor }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
      return (
        <Text key={index} style={{ textDecorationLine: 'line-through', color: baseColor }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return (
      <Text key={index} style={{ color: baseColor }}>
        {part}
      </Text>
    );
  });
};

export const PersonalizationModal: React.FC<PersonalizationModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark, settings, updateSettings } = useBirthdays();

  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student');
  const [senderName, setSenderName] = useState(settings.senderName || '');
  const [studentTemplate, setStudentTemplate] = useState(
    settings.customStudentTemplate || DEFAULT_STUDENT_TEMPLATE
  );
  const [parentTemplate, setParentTemplate] = useState(
    settings.customParentTemplate || DEFAULT_PARENT_TEMPLATE
  );
  const [activePresetId, setActivePresetId] = useState<string>('academic');
  const [selection, setSelection] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });

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
      setSenderName(settings.senderName || '');
      const initStudent = settings.customStudentTemplate || DEFAULT_STUDENT_TEMPLATE;
      const initParent = settings.customParentTemplate || DEFAULT_PARENT_TEMPLATE;
      setStudentTemplate(initStudent);
      setParentTemplate(initParent);
      setActivePresetId(activeTab === 'student' ? 'academic' : 'parent_academic');
      const curLen = (activeTab === 'student' ? initStudent : initParent).length;
      setSelection({ start: curLen, end: curLen });
    }
  }, [visible, settings]);

  const insertToken = (token: string) => {
    try {
      Haptics.selectionAsync();
    } catch (e) { }

    const currentText = activeTab === 'student' ? studentTemplate : parentTemplate;
    const start = selection.start >= 0 ? selection.start : currentText.length;
    const end = selection.end >= 0 ? selection.end : currentText.length;

    const before = currentText.slice(0, start);
    const after = currentText.slice(end);
    const newText = before + token + after;
    const newCursor = start + token.length;

    if (activeTab === 'student') {
      setStudentTemplate(newText);
    } else {
      setParentTemplate(newText);
    }

    setSelection({ start: newCursor, end: newCursor });
  };

  const handleSelectPreset = (preset: { id: string; text: string }) => {
    try {
      Haptics.selectionAsync();
    } catch (e) { }
    setActivePresetId(preset.id);
    if (activeTab === 'student') {
      setStudentTemplate(preset.text);
    } else {
      setParentTemplate(preset.text);
    }
    setSelection({ start: preset.text.length, end: preset.text.length });
  };

  const handleSave = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { }

    updateSettings({
      senderName: senderName.trim(),
      customStudentTemplate: studentTemplate.trim(),
      customParentTemplate: parentTemplate.trim(),
    });

    onClose();
  };

  const handleResetDefaults = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) { }
    setStudentTemplate(DEFAULT_STUDENT_TEMPLATE);
    setParentTemplate(DEFAULT_PARENT_TEMPLATE);
    setActivePresetId(activeTab === 'student' ? 'academic' : 'parent_academic');
    const resetText = activeTab === 'student' ? DEFAULT_STUDENT_TEMPLATE : DEFAULT_PARENT_TEMPLATE;
    setSelection({ start: resetText.length, end: resetText.length });
  };

  // Live sample preview
  const livePreviewText = useMemo(() => {
    const raw = activeTab === 'student' ? studentTemplate : parentTemplate;
    const author = senderName.trim() || 'Well-wisher';
    return raw
      .replace(/\{name\}/g, 'Aarav')
      .replace(/\{class\}/g, 'Class 10th-A')
      .replace(/\{age\}/g, '16')
      .replace(/\{session\}/g, '2024-25')
      .replace(/\{sender_name\}/g, author);
  }, [activeTab, studentTemplate, parentTemplate, senderName]);

  const currentPresets = activeTab === 'student' ? PRESETS_STUDENT : PRESETS_PARENT;

  // Backgrounds & hair lines matching iOS HIG
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const screenBg = isDark ? '#000000' : '#F2F2F7';
  const segmentedBg = isDark ? '#1C1C1E' : '#E3E3E8';
  const segmentActiveBg = isDark ? '#3A3A3C' : '#FFFFFF';

  // Cross-platform input style to remove web focus outline
  const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none', outline: 'none' } as any) : {};

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: screenBg,
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Apple Sheet Grabber */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' }]} />
          </View>

          {/* Standard Apple iOS Navigation Bar */}
          <View style={styles.navHeader} {...panResponder.panHandlers}>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.navBtnLeft}>
              <Text style={[styles.navCancelText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.navTitleContainer}>
              <Text style={[styles.navTitle, { color: colors.textPrimary }]}>
                Personalization
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={handleSave} style={styles.navBtnRight}>
              <Text style={[styles.navSaveText, { color: colors.accent }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            {/* Section 1: Sender Name */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
              SENDER NAME
            </Text>
            <View
              style={[
                styles.insetCard,
                { backgroundColor: cardBg, borderColor: borderColor },
              ]}
            >
              <TextInput
                value={senderName}
                onChangeText={setSenderName}
                placeholder="e.g. Prof. Sharma / Teacher"
                placeholderTextColor={colors.textMuted}
                style={[styles.senderInput, { color: colors.textPrimary }, webNoOutline]}
                clearButtonMode="while-editing"
                autoCapitalize="words"
              />
            </View>
            <Text style={[styles.sectionFooter, { color: colors.textSecondary }]}>
              Appears as the sign-off name in your birthday greetings and messages.
            </Text>

            {/* Section 2: Wish Category & Presets */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginTop: 22 }]}>
              WISH TEMPLATES
            </Text>

            {/* iOS Segmented Control */}
            <View style={[styles.segmentedControl, { backgroundColor: segmentedBg }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (e) { }
                  setActiveTab('student');
                  setActivePresetId('academic');
                  setSelection({ start: studentTemplate.length, end: studentTemplate.length });
                }}
                style={[
                  styles.segmentBtn,
                  activeTab === 'student' && [
                    styles.segmentBtnActive,
                    { backgroundColor: segmentActiveBg },
                  ],
                ]}
              >
                <GraduationCap
                  size={14}
                  color={activeTab === 'student' ? colors.accent : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: activeTab === 'student' ? colors.textPrimary : colors.textSecondary,
                      fontWeight: activeTab === 'student' ? '600' : '400',
                    },
                  ]}
                >
                  Student Wish
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (e) { }
                  setActiveTab('parent');
                  setActivePresetId('parent_academic');
                  setSelection({ start: parentTemplate.length, end: parentTemplate.length });
                }}
                style={[
                  styles.segmentBtn,
                  activeTab === 'parent' && [
                    styles.segmentBtnActive,
                    { backgroundColor: segmentActiveBg },
                  ],
                ]}
              >
                <Users
                  size={14}
                  color={activeTab === 'parent' ? colors.accent : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: activeTab === 'parent' ? colors.textPrimary : colors.textSecondary,
                      fontWeight: activeTab === 'parent' ? '600' : '400',
                    },
                  ]}
                >
                  Parent WhatsApp
                </Text>
              </TouchableOpacity>
            </View>

            {/* Template Presets Carousel */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsContainer}
              keyboardShouldPersistTaps="handled"
            >
              {currentPresets.map((pr) => {
                const isSelected = activePresetId === pr.id;
                return (
                  <TouchableOpacity
                    key={pr.id}
                    activeOpacity={0.7}
                    onPress={() => handleSelectPreset(pr)}
                    style={[
                      styles.presetPill,
                      {
                        backgroundColor: isSelected
                          ? colors.accentLight
                          : isDark
                          ? '#1C1C1E'
                          : '#FFFFFF',
                        borderColor: isSelected ? colors.accent : borderColor,
                      },
                    ]}
                  >
                    <Sparkles
                      size={12}
                      color={isSelected ? colors.accent : colors.textMuted}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.presetPillText,
                        {
                          color: isSelected ? colors.accent : colors.textPrimary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {pr.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Section 3: Template Editor Card */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginTop: 20 }]}>
              CUSTOM MESSAGE
            </Text>
            <View
              style={[
                styles.insetCard,
                { backgroundColor: cardBg, borderColor: borderColor },
              ]}
            >
              <TextInput
                value={activeTab === 'student' ? studentTemplate : parentTemplate}
                onChangeText={activeTab === 'student' ? setStudentTemplate : setParentTemplate}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                multiline
                scrollEnabled={false}
                style={[styles.templateTextArea, { color: colors.textPrimary }, webNoOutline]}
                placeholderTextColor={colors.textMuted}
              />

              {/* Quick-Insert Token Shelf */}
              <View style={[styles.tokenShelf, { borderTopColor: borderColor }]}>
                <Text style={[styles.tokenShelfLabel, { color: colors.textSecondary }]}>
                  + Insert:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tokensScrollContent}
                  keyboardShouldPersistTaps="always"
                >
                  {[
                    { label: 'Name', token: '{name}' },
                    { label: 'Class', token: '{class}' },
                    { label: 'Age', token: '{age}' },
                    { label: 'My Name', token: '{sender_name}' },
                  ].map((tok) => (
                    <TouchableOpacity
                      key={tok.token}
                      activeOpacity={0.7}
                      onPress={() => insertToken(tok.token)}
                      style={[
                        styles.tokenChip,
                        {
                          backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                          borderColor: borderColor,
                        },
                      ]}
                    >
                      <Text style={[styles.tokenChipText, { color: colors.accent }]}>
                        {tok.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Section 4: WhatsApp Live Preview (Rich Formatted) */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginTop: 22 }]}>
              LIVE PREVIEW
            </Text>
            <View
              style={[
                styles.previewCard,
                {
                  backgroundColor: isDark ? '#1F2C34' : '#E7FFDB',
                  borderColor: isDark ? '#2A3942' : '#D1F4C9',
                },
              ]}
            >
              <View style={styles.previewHeaderRow}>
                <MessageCircle size={14} color="#25D366" style={{ marginRight: 6 }} />
                <Text style={styles.previewBadgeText}>WhatsApp Message Preview</Text>
              </View>

              {/* Formatted Text (Parses *bold* to bold text) */}
              <Text style={styles.previewBodyText}>
                {renderFormattedWhatsAppText(
                  livePreviewText,
                  isDark ? '#E9EDEF' : '#111B21'
                )}
              </Text>

              {/* WhatsApp Message Metadata (Timestamp & Read Receipts) */}
              <View style={styles.previewMetaRow}>
                <Text style={[styles.previewMetaTime, { color: isDark ? '#8696A0' : '#667781' }]}>
                  09:00 AM
                </Text>
                <CheckCheck size={14} color="#53BDEB" style={{ marginLeft: 4 }} />
              </View>
            </View>

            {/* Section 5: Reset Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleResetDefaults}
              style={styles.resetBtn}
            >
              <RotateCcw size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.resetBtnText, { color: colors.textSecondary }]}>
                Restore Default Templates
              </Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: '90%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handleBar: {
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120, 120, 128, 0.2)',
  },
  navBtnLeft: {
    minWidth: 60,
    alignItems: 'flex-start',
  },
  navCancelText: {
    fontSize: 17,
    letterSpacing: -0.4,
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  navBtnRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  navSaveText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 120 : 80,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  sectionFooter: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 6,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  insetCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  senderInput: {
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
    height: 36,
    marginBottom: 10,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
  },
  presetsContainer: {
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  presetPillText: {
    fontSize: 13,
  },
  templateTextArea: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  tokenShelf: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tokenShelfLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  tokensScrollContent: {
    gap: 6,
  },
  tokenChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  tokenChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
    marginBottom: 6,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#25D366',
  },
  previewBodyText: {
    fontSize: 14,
    lineHeight: 21,
  },
  previewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  previewMetaTime: {
    fontSize: 11,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
