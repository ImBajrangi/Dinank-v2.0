import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  PanResponder,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, X, Sparkles } from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { AppLogo } from './AppLogo';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const TITLE_PRESETS = [
  'Class Teacher',
  'Principal',
  'HOD',
  'Admin',
  'Coordinator',
  'Teacher',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { colors, isDark, settings, updateSettings } = useBirthdays();
  const [senderName, setSenderName] = useState(settings.senderName || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

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
      setSavedSuccess(false);
    }
  }, [visible, settings]);

  const handleSave = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { }

    updateSettings({
      senderName: senderName.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const handleClear = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) { }
    setSenderName('');
  };

  const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none', outline: 'none' } as any) : {};

  const initials = senderName.trim()
    ? senderName
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
    : '';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Apple Sheet Grabber Bar */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
          </View>

          {/* Authentic Apple Navigation Bar: Cancel | Title | Done */}
          <View
            style={[
              styles.navHeader,
              { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
            {...panResponder.panHandlers}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.navSideSlot}
            >
              <Text style={[styles.cancelText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>

            <Text style={[styles.navCenterTitle, { color: colors.textPrimary }]}>
              Sender Profile
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSave}
              style={[styles.navSideSlot, { alignItems: 'flex-end' }]}
            >
              <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
            contentContainerStyle={styles.scrollBody}
          >
            {/* Apple Hero Avatar & Headline */}
            <View style={styles.heroSection}>
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: colors.accent,
                    ...Platform.select({
                      web: { boxShadow: `0 6px 20px ${colors.accent}45` },
                      default: { elevation: 6 },
                    }),
                  },
                ]}
              >
                {initials ? (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                ) : (
                  <AppLogo size={38} color="#FFFFFF" eyeColor={colors.accent} />
                )}
              </View>

              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
                {senderName.trim() ? senderName : 'Set Your Name'}
              </Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                Appears as your sign-off signature on WhatsApp wishes and greeting cards
              </Text>
            </View>

            {/* Inset Grouped Section */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              DISPLAY NAME & SIGNATURE
            </Text>
            <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <TextInput
                value={senderName}
                onChangeText={setSenderName}
                placeholder="e.g. Prof. Haridas"
                placeholderTextColor={colors.textSecondary}
                style={[styles.textInput, { color: colors.textPrimary }, webNoOutline]}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />

              {senderName.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClear}
                  style={styles.clearBtn}
                >
                  <View
                    style={[
                      styles.clearIconCircle,
                      { backgroundColor: isDark ? '#3A3A3C' : '#C7C7CC' },
                    ]}
                  >
                    <X size={11} color={isDark ? '#FFFFFF' : '#000000'} />
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Role Presets */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 18 }]}>
              QUICK ROLE PRESETS
            </Text>
            <View style={styles.presetsRow}>
              {TITLE_PRESETS.map((title) => {
                const isSelected = senderName.trim().toLowerCase() === title.toLowerCase();
                return (
                  <TouchableOpacity
                    key={title}
                    activeOpacity={0.7}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) { }
                      setSenderName(title);
                    }}
                    style={[
                      styles.presetChip,
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
                        styles.presetChipText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Primary Action Button */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSave}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: savedSuccess ? '#34C759' : colors.accent,
                    ...Platform.select({
                      web: { boxShadow: `0 4px 14px ${savedSuccess ? '#34C75950' : colors.accent + '50'}` },
                      default: { elevation: 3 },
                    }),
                  },
                ]}
              >
                {savedSuccess ? (
                  <Check size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                ) : (
                  <Sparkles size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
                )}
                <Text style={styles.primaryButtonText}>
                  {savedSuccess ? 'Profile Saved' : 'Save Name'}
                </Text>
              </TouchableOpacity>
            </View>
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
    height: '88%',
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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navSideSlot: {
    minWidth: 60,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  navCenterTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    height: 44,
  },
  clearBtn: {
    padding: 6,
  },
  clearIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  presetChipText: {
    fontSize: 13,
  },
  actionContainer: {
    marginTop: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
