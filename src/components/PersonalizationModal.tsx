import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  User,
  MessageSquare,
  Users,
  Music,
  Check,
  RotateCcw,
  Palette,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';

interface PersonalizationModalProps {
  visible: boolean;
  onClose: () => void;
}

const SOUNDS = [
  { id: 'default', label: 'System Default', desc: 'Standard iOS & Android chime' },
  { id: 'chime', label: 'Celebration Bell', desc: 'Festive birthday bell tone' },
  { id: 'aurora', label: 'Apple Aurora', desc: 'Gentle synth harmony' },
  { id: 'harp', label: 'Gentle Harp', desc: 'Soft melodic arpeggio' },
  { id: 'pop', label: 'Pop Chord', desc: 'Crisp, energetic pop' },
  { id: 'silent', label: 'Vibrate Only', desc: 'No sound, haptic vibration' },
];

const DEFAULT_STUDENT_TEMPLATE =
  "Dear *{name}*, wishing you a very *Happy Birthday!* 🎂 May this year bring you wisdom, great success, and joy. Keep shining in *{class}*! 🎉\n\nBest regards,\n*{sender_name}*";

const DEFAULT_PARENT_TEMPLATE =
  "Dear Parent, heartfelt congratulations on *{name}*'s birthday today! 💐 Wishing your child a glorious year ahead filled with good health and academic excellence.\n\nWarm regards,\n*{sender_name}* (*{class}*)";

export const PersonalizationModal: React.FC<PersonalizationModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark, settings, updateSettings } = useBirthdays();

  const [senderName, setSenderName] = useState(settings.senderName || '');
  const [studentTemplate, setStudentTemplate] = useState(
    settings.customStudentTemplate || DEFAULT_STUDENT_TEMPLATE
  );
  const [parentTemplate, setParentTemplate] = useState(
    settings.customParentTemplate || DEFAULT_PARENT_TEMPLATE
  );
  const [selectedSound, setSelectedSound] = useState(settings.notificationSound || 'default');

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
          Animated.timing(panY, {
            toValue: 600,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            panY.setValue(0);
            onClose();
          });
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
      setStudentTemplate(settings.customStudentTemplate || DEFAULT_STUDENT_TEMPLATE);
      setParentTemplate(settings.customParentTemplate || DEFAULT_PARENT_TEMPLATE);
      setSelectedSound(settings.notificationSound || 'default');
    }
  }, [visible, settings]);

  const insertToken = (setter: React.Dispatch<React.SetStateAction<string>>, token: string) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setter((prev) => `${prev} ${token}`);
  };

  const handleSave = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    updateSettings({
      senderName: senderName.trim(),
      customStudentTemplate: studentTemplate.trim(),
      customParentTemplate: parentTemplate.trim(),
      notificationSound: selectedSound,
    });

    Alert.alert('Personalization Saved ✨', 'Your custom templates and sound preferences have been applied.', [
      { text: 'OK', onPress: onClose },
    ]);
  };

  const handleResetDefaults = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setStudentTemplate(DEFAULT_STUDENT_TEMPLATE);
    setParentTemplate(DEFAULT_PARENT_TEMPLATE);
    setSelectedSound('default');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Grab Handle */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#48484A' : '#D1D1D6' }]} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Personalization
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Templates, Sender Name & Sound
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section 1: Sender Profile */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
              YOUR SENDER NAME
            </Text>
            <View style={[styles.groupedCard, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', borderColor: colors.cardBorder }]}>
              <View style={styles.inputRow}>
                <User size={18} color={colors.accent} style={{ marginRight: 10 }} />
                <TextInput
                  value={senderName}
                  onChangeText={setSenderName}
                  placeholder="e.g. Prof. Sharma / Alex"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, { color: colors.textPrimary }]}
                />
              </View>
            </View>
            <Text style={[styles.hintText, { color: colors.textMuted }]}>
              Replaces {"{sender_name}"} in automated greetings and wishes.
            </Text>

            {/* Section 2: Custom Student / Contact Template */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginTop: 18 }]}>
                STUDENT / CONTACT GREETING TEMPLATE
              </Text>
            </View>
            <View style={[styles.groupedCard, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', borderColor: colors.cardBorder }]}>
              <TextInput
                value={studentTemplate}
                onChangeText={setStudentTemplate}
                multiline
                numberOfLines={4}
                style={[styles.templateTextArea, { color: colors.textPrimary }]}
                placeholderTextColor={colors.textMuted}
              />
              {/* Token Chips */}
              <View style={[styles.tokenBar, { borderTopColor: colors.surfaceBorder }]}>
                <Text style={[styles.tokenBarLabel, { color: colors.textSecondary }]}>Insert:</Text>
                {['{name}', '{age}', '{class}', '{sender_name}'].map((tok) => (
                  <TouchableOpacity
                    key={tok}
                    activeOpacity={0.7}
                    onPress={() => insertToken(setStudentTemplate, tok)}
                    style={[styles.tokenChip, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
                  >
                    <Text style={[styles.tokenChipText, { color: colors.accent }]}>{tok}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Section 3: Custom Parent Template */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginTop: 18 }]}>
                PARENT WHATSAPP GREETING TEMPLATE
              </Text>
            </View>
            <View style={[styles.groupedCard, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', borderColor: colors.cardBorder }]}>
              <TextInput
                value={parentTemplate}
                onChangeText={setParentTemplate}
                multiline
                numberOfLines={4}
                style={[styles.templateTextArea, { color: colors.textPrimary }]}
                placeholderTextColor={colors.textMuted}
              />
              {/* Token Chips */}
              <View style={[styles.tokenBar, { borderTopColor: colors.surfaceBorder }]}>
                <Text style={[styles.tokenBarLabel, { color: colors.textSecondary }]}>Insert:</Text>
                {['{name}', '{class}', '{sender_name}'].map((tok) => (
                  <TouchableOpacity
                    key={tok}
                    activeOpacity={0.7}
                    onPress={() => insertToken(setParentTemplate, tok)}
                    style={[styles.tokenChip, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
                  >
                    <Text style={[styles.tokenChipText, { color: colors.accent }]}>{tok}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Section 4: Notification Sound */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginTop: 18 }]}>
              NOTIFICATION SOUND & TUNE
            </Text>
            <View style={[styles.groupedCard, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', borderColor: colors.cardBorder }]}>
              {SOUNDS.map((snd, index) => {
                const isSelected = selectedSound === snd.id;
                return (
                  <TouchableOpacity
                    key={snd.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      setSelectedSound(snd.id);
                    }}
                    style={[
                      styles.soundRow,
                      index < SOUNDS.length - 1 && {
                        borderBottomWidth: 0.5,
                        borderBottomColor: colors.surfaceBorder,
                      },
                    ]}
                  >
                    <View style={styles.soundInfo}>
                      <Text
                        style={[
                          styles.soundLabel,
                          { color: colors.textPrimary, fontWeight: isSelected ? '600' : '400' },
                        ]}
                      >
                        {snd.label}
                      </Text>
                      <Text style={[styles.soundDesc, { color: colors.textSecondary }]}>
                        {snd.desc}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={colors.accent} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Reset to Defaults button */}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 4,
    marginTop: 10,
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 6,
  },
  groupedCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
  },
  templateTextArea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 85,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  tokenBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  tokenBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  tokenChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tokenChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  soundInfo: {
    flex: 1,
  },
  soundLabel: {
    fontSize: 15,
  },
  soundDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 10,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
