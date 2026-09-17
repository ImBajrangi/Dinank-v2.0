import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useBirthdays } from '../context/BirthdayContext';

interface AppleSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
  activeColor?: string;
  style?: ViewStyle;
}

const SWITCH_WIDTH = 51;
const SWITCH_HEIGHT = 31;
const THUMB_SIZE = 27;
const THUMB_OFFSET = 2;
const TRANSLATE_X_MAX = SWITCH_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2; // 20px

export const AppleSwitch: React.FC<AppleSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  activeColor = '#34C759',
  style,
}) => {
  const { isDark } = useBirthdays();
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      bounciness: 0,
      speed: 20,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const handlePress = () => {
    if (disabled) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    onValueChange(!value);
  };

  const offTrackColor = isDark ? '#39393D' : '#E9E9EB';

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [offTrackColor, activeColor],
  });

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_OFFSET, THUMB_OFFSET + TRANSLATE_X_MAX],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, style]}
    >
      <Animated.View style={[styles.track, { backgroundColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    borderRadius: SWITCH_HEIGHT / 2,
    justifyContent: 'center',
    padding: 0,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow:
          '0 3px 8px rgba(0, 0, 0, 0.15), 0 1px 1px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2.5,
        elevation: 2,
      },
    }),
  },
});
