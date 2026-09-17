import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Animated,
  PanResponder,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles, Copy, Send, RefreshCw, Check, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react-native';
import { CalculatedBirthday } from '../types/birthday';
import { useBirthdays } from '../context/BirthdayContext';
import { WishTone, generateAIWish, generateLocalWish } from '../services/aiWishes';
import { ActionService } from '../services/actions';

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

const SUGGESTIONS = [
  'In Hindi / Hinglish',
  'Add Shayari',
  'Academic blessing',
  'Fun & playful',
];

export const AIWishModal: React.FC<AIWishModalProps> = ({
  visible,
  onClose,
  birthday,
}) => {
  const { colors, isDark, settings } = useBirthdays();
  const [selectedTone, setSelectedTone] = useState<WishTone>('heartfelt');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentWish, setCurrentWish] = useState<string>('');

  useEffect(() => {
    if (birthday && visible) {
      setCustomPrompt('');
      setShowCustomPrompt(false);
      regenerate(selectedTone, '');
    }
  }, [birthday, visible]);

  const regenerate = async (tone: WishTone, promptOverride?: string) => {
    if (!birthday) return;
    setIsGenerating(true);
    const promptToUse = promptOverride !== undefined ? promptOverride : customPrompt;
    try {
      const generated = await generateAIWish({
        name: birthday.name,
        relationship: birthday.relationship,
        tone,
        turningAge: birthday.nextAge,
        groupClass: birthday.groupClass,
        section: birthday.section,
        session: birthday.session,
        senderName: settings.senderName,
        customPrompt: promptToUse,
      });
      setCurrentWish(generated);
    } catch (e) {
      const fallback = generateLocalWish({
        name: birthday.name,
        relationship: birthday.relationship,
        tone,
        turningAge: birthday.nextAge,
      });
      setCurrentWish(fallback);
    } finally {
      setIsGenerating(false);
      setCopied(false);
    }
  };

  const handleToneChange = (tone: WishTone) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSelectedTone(tone);
    regenerate(tone);
  };

  const handleApplySuggestion = (sug: string) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setCustomPrompt(sug);
    regenerate(selectedTone, sug);
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
    await ActionService.sendWhatsApp(birthday?.phone, currentWish, birthday?.name);
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Birthday Wish
              </Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                {birthday.name} {birthday.nextAge ? `• Turning ${birthday.nextAge}` : ''}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.doneBtn}>
              <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Tone Selector Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.toneScroll}
            >
              {TONES.map((t) => {
                const isSelected = selectedTone === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    activeOpacity={0.7}
                    onPress={() => handleToneChange(t.id)}
                    style={[
                      styles.tonePill,
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
                        styles.tonePillText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: isSelected ? '600' : '400',
                        },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Hero Message Card */}
            <View style={[styles.wishCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {isGenerating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Writing heartfelt wish...
                  </Text>
                </View>
              ) : (
                <TextInput
                  style={[
                    styles.wishInput,
                    { color: colors.textPrimary },
                    Platform.OS === 'web' ? ({ outlineStyle: 'none', outline: 'none' } as any) : {},
                  ]}
                  value={currentWish}
                  onChangeText={setCurrentWish}
                  multiline
                  placeholder="Your birthday message will appear here..."
                  placeholderTextColor={colors.textSecondary}
                />
              )}

              <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

              {/* Bottom Card Bar: Regenerate & Optional Custom Prompt Toggle */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  activeOpacity={0.65}
                  disabled={isGenerating}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    regenerate(selectedTone);
                  }}
                  style={styles.regenBtn}
                >
                  <RefreshCw size={13} color={colors.accent} style={{ marginRight: 5 }} />
                  <Text style={[styles.regenBtnText, { color: colors.accent }]}>
                    Regenerate
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.65}
                  onPress={() => setShowCustomPrompt(!showCustomPrompt)}
                  style={styles.customToggleBtn}
                >
                  <Sparkles size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.customToggleText, { color: colors.textSecondary }]}>
                    {showCustomPrompt ? 'Hide instructions' : 'Add custom prompt'}
                  </Text>
                  {showCustomPrompt ? (
                    <ChevronUp size={13} color={colors.textSecondary} />
                  ) : (
                    <ChevronDown size={13} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Collapsed/Expanded Custom Prompt Box */}
            {showCustomPrompt && (
              <View style={[styles.customPromptCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <TextInput
                  style={[
                    styles.promptInput,
                    { color: colors.textPrimary },
                    Platform.OS === 'web' ? ({ outlineStyle: 'none', outline: 'none' } as any) : {},
                  ]}
                  placeholder="e.g. In Hindi, add blessing for exams..."
                  placeholderTextColor={colors.textSecondary}
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {SUGGESTIONS.map((sug) => (
                    <TouchableOpacity
                      key={sug}
                      activeOpacity={0.7}
                      onPress={() => handleApplySuggestion(sug)}
                      style={[
                        styles.sugChip,
                        {
                          backgroundColor: customPrompt === sug ? colors.accentLight : isDark ? '#2C2C2E' : '#E5E5EA',
                          borderColor: customPrompt === sug ? colors.accent : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[styles.sugText, { color: customPrompt === sug ? colors.accent : colors.textPrimary }]}>
                        {sug}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  activeOpacity={0.75}
                  disabled={isGenerating}
                  onPress={() => regenerate(selectedTone)}
                  style={[styles.applyPromptBtn, { backgroundColor: colors.accent }]}
                >
                  <Sparkles size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <Text style={styles.applyPromptText}>Generate with instructions</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Apple Action Buttons */}
            <View style={styles.actionsBox}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleWhatsApp}
                style={[styles.primaryBtn, { backgroundColor: '#34C759' }]}
              >
                <Send size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Send on WhatsApp</Text>
              </TouchableOpacity>

              <View style={styles.dualRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleCopy}
                  style={[styles.secBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  {copied ? (
                    <Check size={16} color={colors.success} style={{ marginRight: 6 }} />
                  ) : (
                    <Copy size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  )}
                  <Text style={[styles.secBtnText, { color: copied ? colors.success : colors.textPrimary }]}>
                    {copied ? 'Copied to Clipboard' : 'Copy'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleShare}
                  style={[styles.secBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <Text style={[styles.secBtnText, { color: colors.textPrimary }]}>Share...</Text>
                </TouchableOpacity>
              </View>
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
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '90%',
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
    paddingTop: 6,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 1,
  },
  doneBtn: {
    paddingVertical: 4,
    paddingLeft: 12,
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
  toneScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 10,
  },
  tonePill: {
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 16,
  },
  tonePillText: {
    fontSize: 13,
  },
  wishCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    overflow: 'hidden',
    marginTop: 4,
  },
  loadingContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
  wishInput: {
    padding: 16,
    fontSize: 15,
    lineHeight: 23,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  divider: {
    height: 0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  regenBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  customToggleText: {
    fontSize: 13,
  },
  customPromptCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 12,
    marginTop: 10,
    gap: 10,
  },
  promptInput: {
    fontSize: 14,
    paddingVertical: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sugChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  sugText: {
    fontSize: 12,
    fontWeight: '500',
  },
  applyPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyPromptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  actionsBox: {
    marginTop: 16,
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
