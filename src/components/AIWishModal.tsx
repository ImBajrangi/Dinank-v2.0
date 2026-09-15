import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Linking,
  Animated,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles, Copy, Send, RefreshCw, Check } from 'lucide-react-native';
import { CalculatedBirthday } from '../types/birthday';
import { useBirthdays } from '../context/BirthdayContext';
import { WishTone, generateLocalWish } from '../services/aiWishes';

interface AIWishModalProps {
  visible: boolean;
  onClose: () => void;
  birthday: CalculatedBirthday | null;
}

const TONES: { id: WishTone; label: string }[] = [
  { id: 'heartfelt', label: 'Heartfelt' },
  { id: 'funny', label: 'Funny' },
  { id: 'poetic', label: 'Poetic' },
  { id: 'short_sms', label: 'Short' },
  { id: 'formal', label: 'Formal' },
];

export const AIWishModal: React.FC<AIWishModalProps> = ({
  visible,
  onClose,
  birthday,
}) => {
  const { colors, isDark } = useBirthdays();
  const [selectedTone, setSelectedTone] = useState<WishTone>('heartfelt');
  const [copied, setCopied] = useState(false);
  const [currentWish, setCurrentWish] = useState<string>('');

  React.useEffect(() => {
    if (birthday && visible) {
      regenerate(selectedTone);
    }
  }, [birthday, visible]);

  const regenerate = (tone: WishTone) => {
    if (!birthday) return;
    const generated = generateLocalWish({
      name: birthday.name,
      relationship: birthday.relationship,
      tone,
      turningAge: birthday.nextAge,
    });
    setCurrentWish(generated);
    setCopied(false);
  };

  const handleToneChange = (tone: WishTone) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSelectedTone(tone);
    regenerate(tone);
  };

  const handleCopy = () => {
    if (!currentWish) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = async () => {
    if (!currentWish) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    const url = `whatsapp://send?text=${encodeURIComponent(currentWish)}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Share.share({ message: currentWish });
    }
  };

  const handleShare = async () => {
    if (!currentWish) return;
    try {
      await Share.share({
        message: currentWish,
        title: `Wish for ${birthday?.name}`,
      });
    } catch (error) {}
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
    }
  }, [visible]);

  if (!birthday) return null;

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
          {/* Apple Sheet Grabber */}
          <View {...panResponder.panHandlers} style={styles.grabberWrapper}>
            <View style={[styles.grabber, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
          </View>

          {/* Navigation Bar */}
          <View {...panResponder.panHandlers} style={styles.navHeader}>
            <View style={{ width: 60 }} />
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Wish Composer
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.doneBtn}>
              <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Tone Selector */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>TONE</Text>
            <View
              style={[
                styles.segmentedControl,
                { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' },
              ]}
            >
              {TONES.map((t) => {
                const isSelected = selectedTone === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    activeOpacity={0.7}
                    onPress={() => handleToneChange(t.id)}
                    style={[
                      styles.segmentBtn,
                      isSelected && {
                        backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.15,
                        shadowRadius: 2,
                        elevation: 2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        {
                          color: isSelected ? colors.textPrimary : colors.textSecondary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Inset Grouped Generated Message Card */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>PREVIEW</Text>
            <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.wishText, { color: colors.textPrimary }]}>
                {currentWish}
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

              <TouchableOpacity
                activeOpacity={0.65}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (e) {}
                  regenerate(selectedTone);
                }}
                style={styles.regenRow}
              >
                <RefreshCw size={14} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.regenText, { color: colors.accent }]}>
                  Generate Another Variation
                </Text>
              </TouchableOpacity>
            </View>

            {/* Apple Actions */}
            <View style={styles.actionsBox}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleWhatsApp}
                style={[styles.primaryBtn, { backgroundColor: '#34C759' }]}
              >
                <Send size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Send via WhatsApp</Text>
              </TouchableOpacity>

              <View style={styles.dualRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleShare}
                  style={[styles.secBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <Text style={[styles.secBtnText, { color: colors.textPrimary }]}>Share...</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCopy}
                  style={[styles.secBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  {copied ? (
                    <Check size={16} color={colors.success} style={{ marginRight: 4 }} />
                  ) : (
                    <Copy size={16} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  )}
                  <Text style={[styles.secBtnText, { color: copied ? colors.success : colors.textPrimary }]}>
                    {copied ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 36 }} />
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '88%',
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
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  doneBtn: {
    paddingVertical: 4,
    width: 60,
    alignItems: 'flex-end',
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  body: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
    marginBottom: 10,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  groupedBox: {
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  wishText: {
    padding: 16,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  divider: {
    height: 0.5,
  },
  regenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  regenText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsBox: {
    marginTop: 20,
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
  dualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  secBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
