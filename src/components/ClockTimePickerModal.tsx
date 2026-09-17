import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Check, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';

interface ClockTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  initialTime?: string; // 'HH:mm' 24-hr format (e.g. '09:00', '18:30')
  onSaveTime: (timeStr: string) => void;
  title?: string;
}

export const ClockTimePickerModal: React.FC<ClockTimePickerModalProps> = ({
  visible,
  onClose,
  initialTime = '09:00',
  onSaveTime,
  title = 'Select Alert Time',
}) => {
  const { colors, isDark } = useBirthdays();

  // Parse initial 24h time into 12h + AM/PM
  const parseInitial = () => {
    const [hStr, mStr] = (initialTime || '09:00').split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) h = 9;
    let m = parseInt(mStr, 10);
    if (isNaN(m)) m = 0;

    const isPM = h >= 12;
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;

    return {
      hour: h12,
      minute: m,
      period: isPM ? 'PM' : 'AM',
    };
  };

  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (visible) {
      const init = parseInitial();
      setSelectedHour(init.hour);
      setSelectedMinute(init.minute);
      setPeriod(init.period as 'AM' | 'PM');
    }
  }, [visible, initialTime]);

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

  // Convert 12h + AM/PM back to 'HH:mm' 24-hr format
  const formatted24Hour = useMemo(() => {
    let h24 = selectedHour;
    if (period === 'AM') {
      if (h24 === 12) h24 = 0;
    } else {
      if (h24 < 12) h24 += 12;
    }
    const hPad = String(h24).padStart(2, '0');
    const mPad = String(selectedMinute).padStart(2, '0');
    return `${hPad}:${mPad}`;
  }, [selectedHour, selectedMinute, period]);

  const display12Hour = useMemo(() => {
    const hPad = String(selectedHour).padStart(2, '0');
    const mPad = String(selectedMinute).padStart(2, '0');
    return `${hPad}:${mPad} ${period}`;
  }, [selectedHour, selectedMinute, period]);

  const handleSave = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    onSaveTime(formatted24Hour);
    onClose();
  };

  const adjustHour = (delta: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSelectedHour((prev) => {
      let next = prev + delta;
      if (next > 12) next = 1;
      if (next < 1) next = 12;
      return next;
    });
  };

  const adjustMinute = (delta: number) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSelectedMinute((prev) => {
      let next = prev + delta;
      if (next > 59) next = 0;
      if (next < 0) next = 55;
      return next;
    });
  };

  const hoursArray = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutesPresets = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

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

          {/* Header */}
          <View {...panResponder.panHandlers} style={styles.navHeader}>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.navBtn}>
              <Text style={[styles.cancelText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {title}
            </Text>

            <TouchableOpacity activeOpacity={0.7} onPress={handleSave} style={styles.navBtn}>
              <Text style={[styles.doneText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Clock Big Time Display */}
            <View
              style={[
                styles.bigClockCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.timeDigitRow}>
                {/* Hours Column */}
                <View style={styles.columnStepper}>
                  <TouchableOpacity
                    onPress={() => adjustHour(1)}
                    style={[styles.stepperBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
                  >
                    <ChevronUp size={18} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text style={[styles.bigDigit, { color: colors.textPrimary }]}>
                    {String(selectedHour).padStart(2, '0')}
                  </Text>

                  <TouchableOpacity
                    onPress={() => adjustHour(-1)}
                    style={[styles.stepperBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
                  >
                    <ChevronDown size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.colonText, { color: colors.textPrimary }]}>:</Text>

                {/* Minutes Column */}
                <View style={styles.columnStepper}>
                  <TouchableOpacity
                    onPress={() => adjustMinute(5)}
                    style={[styles.stepperBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
                  >
                    <ChevronUp size={18} color={colors.textPrimary} />
                  </TouchableOpacity>

                  <Text style={[styles.bigDigit, { color: colors.textPrimary }]}>
                    {String(selectedMinute).padStart(2, '0')}
                  </Text>

                  <TouchableOpacity
                    onPress={() => adjustMinute(-5)}
                    style={[styles.stepperBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
                  >
                    <ChevronDown size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* AM / PM Toggle */}
                <View style={styles.ampmWrapper}>
                  <TouchableOpacity
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      setPeriod('AM');
                    }}
                    style={[
                      styles.ampmBtn,
                      {
                        backgroundColor:
                          period === 'AM'
                            ? colors.accent
                            : isDark
                            ? '#2C2C2E'
                            : '#E5E5EA',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ampmText,
                        { color: period === 'AM' ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      setPeriod('PM');
                    }}
                    style={[
                      styles.ampmBtn,
                      {
                        backgroundColor:
                          period === 'PM'
                            ? colors.accent
                            : isDark
                            ? '#2C2C2E'
                            : '#E5E5EA',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.ampmText,
                        { color: period === 'PM' ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.previewSubtext, { color: colors.textSecondary }]}>
                Alert scheduled for {display12Hour} ({formatted24Hour} 24h)
              </Text>
            </View>

            {/* Quick Hours Grid */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>SELECT HOUR</Text>
            <View
              style={[
                styles.gridCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.pillsGrid}>
                {hoursArray.map((h) => {
                  const isSelected = selectedHour === h;
                  return (
                    <TouchableOpacity
                      key={h}
                      activeOpacity={0.7}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch (e) {}
                        setSelectedHour(h);
                      }}
                      style={[
                        styles.gridPill,
                        {
                          backgroundColor:
                            isSelected ? colors.accent : isDark ? '#2C2C2E' : '#E5E5EA',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.gridPillText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textPrimary,
                            fontWeight: isSelected ? '700' : '400',
                          },
                        ]}
                      >
                        {h}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Quick Minutes Grid */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>SELECT MINUTE</Text>
            <View
              style={[
                styles.gridCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.pillsGrid}>
                {minutesPresets.map((m) => {
                  const isSelected = selectedMinute === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      activeOpacity={0.7}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch (e) {}
                        setSelectedMinute(m);
                      }}
                      style={[
                        styles.gridPill,
                        {
                          backgroundColor:
                            isSelected ? colors.accent : isDark ? '#2C2C2E' : '#E5E5EA',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.gridPillText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.textPrimary,
                            fontWeight: isSelected ? '700' : '400',
                          },
                        ]}
                      >
                        :{String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Set Time Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
            >
              <Check size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Set Time to {display12Hour}</Text>
            </TouchableOpacity>

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
    height: '80%',
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
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  navBtn: {
    paddingVertical: 4,
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '400',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bigClockCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  timeDigitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  columnStepper: {
    alignItems: 'center',
    width: 64,
  },
  stepperBtn: {
    width: 44,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  bigDigit: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  colonText: {
    fontSize: 34,
    fontWeight: '700',
    marginHorizontal: 4,
    marginBottom: 4,
  },
  ampmWrapper: {
    marginLeft: 14,
    gap: 6,
  },
  ampmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ampmText: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewSubtext: {
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  gridCard: {
    borderRadius: 14,
    borderWidth: 0.5,
    padding: 12,
    marginBottom: 16,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridPill: {
    flexBasis: '22%',
    flexGrow: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridPillText: {
    fontSize: 15,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
