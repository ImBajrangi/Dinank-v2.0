import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

interface AppLogoBadgeProps {
  size?: number;
  showTitle?: boolean;
}

export const AppLogoBadge: React.FC<AppLogoBadgeProps> = ({ size = 42, showTitle = false }) => {
  const iconRadius = Math.round(size * 0.22);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            width: size,
            height: size,
            borderRadius: iconRadius,
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            {/* Apple Vibrant Birthday Gradient */}
            <LinearGradient id="appleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FF2D55" />
              <Stop offset="50%" stopColor="#FF375F" />
              <Stop offset="100%" stopColor="#FF9500" />
            </LinearGradient>

            <LinearGradient id="candleGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#FFE600" />
              <Stop offset="100%" stopColor="#FF9500" />
            </LinearGradient>
          </Defs>

          {/* Background Rounded Apple Squircle */}
          <Rect x="0" y="0" width="100" height="100" rx="22" fill="url(#appleGradient)" />

          {/* Cake Base */}
          <Rect x="24" y="52" width="52" height="28" rx="8" fill="#FFFFFF" fillOpacity="0.95" />
          <Rect x="20" y="66" width="60" height="14" rx="7" fill="#FFFFFF" fillOpacity="0.8" />

          {/* Cake Frosting Waves */}
          <Path
            d="M24 58 Q30 64 37 58 Q44 64 50 58 Q57 64 63 58 Q70 64 76 58"
            stroke="#FF2D55"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Birthday Candles */}
          <Rect x="36" y="32" width="6" height="20" rx="3" fill="#FFFFFF" />
          <Rect x="47" y="28" width="6" height="24" rx="3" fill="#FFFFFF" />
          <Rect x="58" y="32" width="6" height="20" rx="3" fill="#FFFFFF" />

          {/* Candle Flames */}
          <Path
            d="M39 22 C37 26 36 28 39 31 C42 28 41 26 39 22 Z"
            fill="url(#candleGlow)"
          />
          <Path
            d="M50 17 C48 21 47 24 50 27 C53 24 52 21 50 17 Z"
            fill="url(#candleGlow)"
          />
          <Path
            d="M61 22 C59 26 58 28 61 31 C64 28 63 26 61 22 Z"
            fill="url(#candleGlow)"
          />

          {/* Sparkles / Confetti */}
          <Circle cx="20" cy="24" r="2.5" fill="#FFFFFF" fillOpacity="0.8" />
          <Circle cx="80" cy="28" r="2" fill="#FFFFFF" fillOpacity="0.8" />
          <Circle cx="82" cy="46" r="2.5" fill="#FFFFFF" fillOpacity="0.8" />
        </Svg>
      </View>

      {showTitle && (
        <View style={styles.textCol}>
          <Text style={styles.appTitle}>Birthday Reminder</Text>
          <Text style={styles.appSubtitle}>Apple HIG Edition</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  textCol: {
    marginLeft: 12,
  },
  appTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
});
