import React, { useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  Linking,
  Share,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  MessageCircle,
  Mail,
  Share2,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Zap,
  X,
  Heart,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { AppLogo } from './AppLogo';
import { VrindopnishadLogo } from './VrindopnishadLogo';
import { CURRENT_APP_VERSION } from '../services/updater';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ visible, onClose }) => {
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
          } catch (e) { }
          onClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible]);

  const handleWhatsAppContact = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) { }
    Linking.openURL('https://wa.me/?text=Hello%20Vrindopnishad,%20I%20am%20using%20the%20Dinank%20App!');
  };

  const handleEmailContact = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) { }
    Linking.openURL('mailto:vrinda.connect.us@gmail.com?subject=Dinank%20App%20Inquiry');
  };

  const handleShareApp = async () => {
    try {
      Haptics.selectionAsync();
      await Share.share({
        title: 'Dinank - Smart Birthday & Reminder Manager',
        message:
          'Check out Dinank — the smart offline-first birthday & student reminder manager app developed by Vrindopnishad!',
      });
    } catch (e) { }
  };

  const screenBg = isDark ? '#1C1C1E' : '#F2F2F7';
  const cardBg = isDark ? '#2C2C2E' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

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
              backgroundColor: screenBg,
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Apple Sheet Grabber */}
          <View style={styles.grabberWrapper} {...panResponder.panHandlers}>
            <View style={[styles.grabber, { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' }]} />
          </View>

          {/* Authentic Apple Navigation Bar */}
          <View
            style={[
              styles.navHeader,
              { borderBottomColor: borderColor },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.navSideSlot} />

            <Text style={[styles.navCenterTitle, { color: colors.textPrimary }]}>
              About Dinank
            </Text>

            <View style={styles.navSideSlot}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) { }
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
            style={styles.body}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* App Hero Branding Card with Glowing Halo */}
            <View
              style={[
                styles.heroCard,
                { backgroundColor: cardBg, borderColor: borderColor },
              ]}
            >
              <View
                style={[
                  styles.logoWrapper,
                  {
                    backgroundColor: colors.accent,
                    ...Platform.select({
                      web: { boxShadow: `0 8px 24px ${colors.accent}45` },
                      default: { elevation: 6 },
                    }),
                  },
                ]}
              >
                <AppLogo
                  size={50}
                  color="#FFFFFF"
                  eyeColor={colors.accent}
                />
              </View>

              <Text style={[styles.appName, { color: colors.textPrimary }]}>दिनांक वृंदा</Text>
              <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
                Smart Birthday & Student Reminder Manager
              </Text>
              <View style={[styles.versionBadge, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.versionText, { color: colors.accent }]}>
                  Version {CURRENT_APP_VERSION} • Offline-First
                </Text>
              </View>
            </View>

            {/* Developer Section (Apple Featured Creator Card) */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>DEVELOPED BY</Text>
            <View
              style={[
                styles.groupedCard,
                { backgroundColor: cardBg, borderColor: borderColor },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleEmailContact}
                style={styles.devRow}
              >
                <View
                  style={[
                    styles.devLogoSquircle,
                    {
                      backgroundColor: isDark ? '#0F172A' : '#0B132B',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                    },
                  ]}
                >
                  <VrindopnishadLogo size={30} color="#FFFFFF" dotColor="#FFDE00" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.devTitleRow}>
                    <Text style={[styles.devName, { color: colors.textPrimary }]}>
                      Vrindopnishad
                    </Text>
                    <View style={[styles.creatorBadge, { backgroundColor: colors.accentLight }]}>
                      <Text style={[styles.creatorBadgeText, { color: colors.accent }]}>OFFICIAL</Text>
                    </View>
                  </View>
                  <Text style={[styles.devSub, { color: colors.textSecondary }]}>
                    Crafting elegant & high-performance software solutions
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>

            {/* Contact & Support Section */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginTop: 22 }]}>
              GET IN TOUCH & SUPPORT
            </Text>
            <View
              style={[
                styles.groupedCard,
                { backgroundColor: cardBg, borderColor: borderColor },
              ]}
            >
              {/* WhatsApp Contact */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleWhatsAppContact}
                style={styles.actionRow}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: '#25D366' }]}>
                  <MessageCircle size={17} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                    WhatsApp Support
                  </Text>
                  <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                    Direct chat with Vrindopnishad
                  </Text>
                </View>
                <ExternalLink size={15} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              {/* Email Contact */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleEmailContact}
                style={styles.actionRow}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: '#007AFF' }]}>
                  <Mail size={17} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                    Email Inquiries
                  </Text>
                  <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                    vrinda.connect.us@gmail.com
                  </Text>
                </View>
                <ExternalLink size={15} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              {/* Share App */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleShareApp}
                style={styles.actionRow}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: '#AF52DE' }]}>
                  <Share2 size={17} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                    Share Dinank
                  </Text>
                  <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
                    Share with friends & colleagues
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Privacy & Highlights */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginTop: 22 }]}>
              APP HIGHLIGHTS
            </Text>
            <View
              style={[
                styles.groupedCard,
                { backgroundColor: cardBg, borderColor: borderColor },
              ]}
            >
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBadge, { backgroundColor: '#34C7591A' }]}>
                  <ShieldCheck size={16} color="#34C759" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                    100% Private & Offline-First
                  </Text>
                  <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                    All birthday data remains securely on your device.
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              <View style={styles.featureRow}>
                <View style={[styles.featureIconBadge, { backgroundColor: '#FF95001A' }]}>
                  <Sparkles size={16} color="#FF9500" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                    AI Multi-Tone Wish Composer
                  </Text>
                  <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                    Generates heartwarming student, family & friend wishes.
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              <View style={styles.featureRow}>
                <View style={[styles.featureIconBadge, { backgroundColor: '#007AFF1A' }]}>
                  <Zap size={16} color="#007AFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
                    Zero-Latency In-Memory Cache
                  </Text>
                  <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                    Instant synchronous reads on low-end and flagship phones alike.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.footerNote}>
              <Heart size={13} color="#FF2D55" fill="#FF2D55" style={{ marginRight: 6 }} />
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                <Text style={[styles.hindiBrand, { color: colors.textPrimary }]}>
                  वृन्दोपनिषद्
                </Text>
                {'  •  प्रेम, स्नेह और आत्मीयता का उत्सव'}
              </Text>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '88%',
    overflow: 'hidden',
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
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    marginBottom: 14,
  },
  logoWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.select({ web: 'Laila, serif', default: undefined }),
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  groupedCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  devLogoSquircle: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  devTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  devName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  creatorBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  creatorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  devSub: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  actionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  actionDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  featureIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  featureSubtitle: {
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    paddingHorizontal: 16,
  },
  hindiBrand: {
    fontFamily: Platform.select({
      web: 'Laila, Kalam, "Noto Serif Devanagari", serif',
      default: undefined,
    }),
    fontWeight: '700',
    fontSize: 13.5,
  },
  footerText: {
    fontFamily: Platform.select({
      web: 'Laila, Kalam, "Noto Serif Devanagari", serif',
      default: undefined,
    }),
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});
