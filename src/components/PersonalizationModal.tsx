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
  RotateCcw,
  Sparkles,
  MessageCircle,
  CheckCheck,
  Check,
  Plus,
  Sliders,
  X,
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
  const [studentTemplate, setStudentTemplate] = useState(
    settings.customStudentTemplate || DEFAULT_STUDENT_TEMPLATE
  );
  const [parentTemplate, setParentTemplate] = useState(
    settings.customParentTemplate || DEFAULT_PARENT_TEMPLATE
  );
  const [activePresetId, setActivePresetId] = useState<string>('academic');
  const [savedSuccess, setSavedSuccess] = useState(false);
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
      const initStudent = settings.customStudentTemplate || DEFAULT_STUDENT_TEMPLATE;
      const initParent = settings.customParentTemplate || DEFAULT_PARENT_TEMPLATE;
      setStudentTemplate(initStudent);
      setParentTemplate(initParent);
      setActivePresetId(activeTab === 'student' ? 'academic' : 'parent_academic');
      const curLen = (activeTab === 'student' ? initStudent : initParent).length;
      setSelection({ start: curLen, end: curLen });
      setSavedSuccess(false);
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
      customStudentTemplate: studentTemplate.trim(),
      customParentTemplate: parentTemplate.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
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
    const author = settings.senderName?.trim() || 'Well-wisher';
    return raw
      .replace(/\{name\}/g, 'Aarav Sharma')
      .replace(/\{class\}/g, 'Class 10th-A')
      .replace(/\{age\}/g, '16')
      .replace(/\{session\}/g, '2024-25')
      .replace(/\{sender_name\}/g, author);
  }, [activeTab, studentTemplate, parentTemplate, settings.senderName]);

  const currentPresets = activeTab === 'student' ? PRESETS_STUDENT : PRESETS_PARENT;
  const userPresets = (settings.savedGreetingPresets || []).filter(
    (p) => !p.category || p.category === 'general' || p.category === activeTab
  );

  const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none', outline: 'none' } as any) : {};

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Apple Sheet Grabber */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
          </View>

          {/* Authentic Apple Navigation Bar */}
          <View
            style={[
              styles.navHeader,
              { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.navSideSlot} />

            <Text style={[styles.navCenterTitle, { color: colors.textPrimary }]}>
              Greeting Templates
            </Text>

            <View style={styles.navSideSlot}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                  onClose();
                }}
                style={[
                  styles.closeCircleBtn,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' },
                ]}
              >
                <X size={15} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* Category Switcher Pills */}
            <View style={styles.categoryRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (e) {}
                  setActiveTab('student');
                  setActivePresetId('academic');
                }}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: activeTab === 'student' ? colors.accent : isDark ? '#2C2C2E' : '#E5E5EA',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color: activeTab === 'student' ? '#FFFFFF' : colors.textPrimary,
                      fontWeight: activeTab === 'student' ? '600' : '400',
                    },
                  ]}
                >
                  Student Wishes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (e) {}
                  setActiveTab('parent');
                  setActivePresetId('parent_academic');
                }}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: activeTab === 'parent' ? colors.accent : isDark ? '#2C2C2E' : '#E5E5EA',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color: activeTab === 'parent' ? '#FFFFFF' : colors.textPrimary,
                      fontWeight: activeTab === 'parent' ? '600' : '400',
                    },
                  ]}
                >
                  Parent Wishes
                </Text>
              </TouchableOpacity>
            </View>

            {/* Presets Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsContainer}
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
                          ? colors.accent
                          : isDark
                          ? '#2C2C2E'
                          : '#E5E5EA',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.presetPillText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {pr.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {userPresets.map((pr) => {
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
                          ? colors.accent
                          : isDark
                          ? '#2C2C2E'
                          : '#E5E5EA',
                        borderWidth: 0.5,
                        borderColor: colors.accent,
                      },
                    ]}
                  >
                    <Sparkles size={12} color={isSelected ? '#FFFFFF' : colors.accent} style={{ marginRight: 4 }} />
                    <Text
                      style={[
                        styles.presetPillText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textPrimary,
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

            {/* Hero Template Card */}
            <View style={[styles.templateCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <TextInput
                value={activeTab === 'student' ? studentTemplate : parentTemplate}
                onChangeText={activeTab === 'student' ? setStudentTemplate : setParentTemplate}
                onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
                multiline
                style={[styles.templateInput, { color: colors.textPrimary }, webNoOutline]}
                placeholderTextColor={colors.textSecondary}
                placeholder="Write your greeting template here..."
              />

              <View style={[styles.cardDivider, { backgroundColor: colors.surfaceBorder }]} />

              {/* Quick-Insert Token Bar */}
              <View style={styles.tokenShelf}>
                <Text style={[styles.tokenShelfLabel, { color: colors.textSecondary }]}>
                  Insert:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tokensScroll}
                  keyboardShouldPersistTaps="always"
                >
                  {[
                    { label: 'Name', token: '{name}' },
                    { label: 'Class', token: '{class}' },
                    { label: 'Age', token: '{age}' },
                    { label: 'Sender', token: '{sender_name}' },
                  ].map((tok) => (
                    <TouchableOpacity
                      key={tok.token}
                      activeOpacity={0.7}
                      onPress={() => insertToken(tok.token)}
                      style={[
                        styles.tokenChip,
                        {
                          backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
                        },
                      ]}
                    >
                      <Plus size={11} color={colors.accent} style={{ marginRight: 3 }} />
                      <Text style={[styles.tokenChipText, { color: colors.textPrimary }]}>
                        {tok.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Live Preview Card */}
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
                <Text style={styles.previewBadgeText}>WhatsApp Live Preview</Text>
              </View>

              <Text style={styles.previewBodyText}>
                {renderFormattedWhatsAppText(
                  livePreviewText,
                  isDark ? '#E9EDEF' : '#111B21'
                )}
              </Text>

              <View style={styles.previewMetaRow}>
                <Text style={[styles.previewMetaTime, { color: isDark ? '#8696A0' : '#667781' }]}>
                  09:00 AM
                </Text>
                <CheckCheck size={14} color="#53BDEB" style={{ marginLeft: 4 }} />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionsBox}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSave}
                style={[styles.primaryBtn, { backgroundColor: '#34C759' }]}
              >
                {savedSuccess ? (
                  <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                ) : null}
                <Text style={styles.primaryBtnText}>
                  {savedSuccess ? 'Saved Successfully!' : 'Save Template'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleResetDefaults}
                style={[styles.secBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
              >
                <RotateCcw size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.secBtnText, { color: colors.textPrimary }]}>
                  Restore Default Templates
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    maxHeight: '92%',
    overflow: 'hidden',
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
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navSideSlot: {
    width: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  navCenterTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  closeCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  categoryPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillText: {
    fontSize: 13,
  },
  presetsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  presetPillText: {
    fontSize: 13,
  },
  templateCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
    marginTop: 6,
  },
  templateInput: {
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  cardDivider: {
    height: 0.5,
  },
  tokenShelf: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  tokenShelfLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tokensScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  tokenChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginTop: 6,
  },
  previewMetaTime: {
    fontSize: 11,
  },
  actionsBox: {
    marginTop: 18,
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  secBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  secBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

