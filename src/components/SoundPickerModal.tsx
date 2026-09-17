import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  Music,
  Check,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { SoundService } from '../services/sound';

interface SoundPickerModalProps {
  visible: boolean;
  selectedSound: string;
  onSelectSound: (soundId: string) => void;
  onClose: () => void;
}

export const SOUND_OPTIONS = [
  {
    id: 'default',
    label: 'System Default',
    desc: 'Standard Android & iOS reminder chime',
    icon: Bell,
    color: '#007AFF',
  },
  {
    id: 'chime',
    label: 'Celebration Bell',
    desc: 'Festive, cheerful birthday bell tone',
    icon: Sparkles,
    color: '#FF9500',
  },
  {
    id: 'aurora',
    label: 'Apple Aurora',
    desc: 'Gentle synth harmony',
    icon: Volume2,
    color: '#5856D6',
  },
  {
    id: 'harp',
    label: 'Melodic Harp',
    desc: 'Soft acoustic musical arpeggio',
    icon: Music,
    color: '#34C759',
  },
  {
    id: 'pop',
    label: 'Pop Accent',
    desc: 'Crisp, energetic notification pop',
    icon: Volume2,
    color: '#AF52DE',
  },
  {
    id: 'silent',
    label: 'Vibrate Only',
    desc: 'Silent alert with haptic vibration pattern',
    icon: VolumeX,
    color: '#8E8E93',
  },
];

export const SoundPickerModal: React.FC<SoundPickerModalProps> = ({
  visible,
  selectedSound,
  onSelectSound,
  onClose,
}) => {
  const { colors, isDark } = useBirthdays();

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

  const handleSelect = (soundId: string) => {
    onSelectSound(soundId);
    SoundService.playSound(soundId);
  };

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
          {/* Grab Handle */}
          <View style={styles.grabberWrapper} {...panResponder.panHandlers}>
            <View style={[styles.grabber, { backgroundColor: isDark ? '#48484A' : '#C7C7CC' }]} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Alert Sound</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Choose reminder chime & alarm sound
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.doneBtn}>
              <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Sound Options List */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>SOUNDS</Text>
            <View style={[styles.groupedBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {SOUND_OPTIONS.map((snd, index) => {
                const isSelected = selectedSound === snd.id;
                const IconComponent = snd.icon;
                return (
                  <TouchableOpacity
                    key={snd.id}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(snd.id)}
                    style={[
                      styles.soundRow,
                      index < SOUND_OPTIONS.length - 1 && {
                        borderBottomWidth: 0.5,
                        borderBottomColor: colors.surfaceBorder,
                      },
                    ]}
                  >
                    <View style={[styles.iconBadge, { backgroundColor: snd.color + '1A' }]}>
                      <IconComponent size={18} color={snd.color} />
                    </View>

                    <View style={styles.soundInfo}>
                      <Text
                        style={[
                          styles.soundLabel,
                          {
                            color: isSelected ? colors.accent : colors.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {snd.label}
                      </Text>
                      <Text style={[styles.soundDesc, { color: colors.textSecondary }]}>
                        {snd.desc}
                      </Text>
                    </View>

                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: colors.accent }]}>
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ height: 32 }} />
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
    height: '75%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  doneBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  groupedBox: {
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  soundInfo: {
    flex: 1,
  },
  soundLabel: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  soundDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
