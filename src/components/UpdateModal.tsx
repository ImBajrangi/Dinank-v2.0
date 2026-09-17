import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Download,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { AppLogo } from './AppLogo';
import {
  AppUpdateInfo,
  DownloadProgress,
  AutoUpdateService,
  CURRENT_APP_VERSION,
} from '../services/updater';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: AppUpdateInfo | null;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  updateInfo,
  onClose,
}) => {
  const { colors, isDark } = useBirthdays();

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    percent: 0,
    downloadedMB: '0',
    totalMB: '0',
  });
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);

  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !downloading,
      onMoveShouldSetPanResponder: (_, gestureState) => !downloading && gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 70 || gestureState.vy > 0.5) {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (e) {}
          handleClose();
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
      setDownloading(false);
      setDownloadProgress({ percent: 0, downloadedMB: '0', totalMB: '0' });
      setDownloadError(null);
      setDownloadComplete(false);
    }
  }, [visible]);

  const handleClose = () => {
    if (downloading) {
      AutoUpdateService.cancelDownload();
      setDownloading(false);
    }
    onClose();
  };

  const handleStartUpdate = async () => {
    if (!updateInfo || !updateInfo.downloadUrl) return;

    try {
      Haptics.selectionAsync();
    } catch (e) {}

    setDownloading(true);
    setDownloadError(null);
    setDownloadComplete(false);

    try {
      const success = await AutoUpdateService.downloadAndInstall(
        updateInfo.downloadUrl,
        (progress) => {
          setDownloadProgress(progress);
        }
      );

      if (success) {
        setDownloadComplete(true);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      } else {
        setDownloadError('Could not launch Android package installer.');
      }
    } catch (err: any) {
      setDownloadError(err?.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  if (!updateInfo) return null;

  const screenBg = isDark ? '#000000' : '#F2F2F7';
  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={downloading ? undefined : handleClose}
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
          {/* Apple Grabber */}
          <View style={styles.grabberWrapper} {...panResponder.panHandlers}>
            <View style={[styles.grabber, { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' }]} />
          </View>

          {/* Navigation Bar */}
          <View style={styles.navHeader} {...panResponder.panHandlers}>
            <View style={styles.navSpacer} />
            <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Software Update</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              style={styles.doneBtn}
              disabled={downloading}
            >
              <Text
                style={[
                  styles.doneText,
                  { color: downloading ? colors.textMuted : colors.accent },
                ]}
              >
                {downloading ? '' : 'Later'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* App Branding Card */}
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
                    backgroundColor: isDark ? '#1C2433' : '#F0F6FF',
                    borderColor: isDark ? '#2D3B55' : '#DCE8FA',
                  },
                ]}
              >
                <AppLogo
                  size={46}
                  color={colors.accent}
                  eyeColor={isDark ? '#1C2433' : '#FFFFFF'}
                />
              </View>

              <Text style={[styles.appName, { color: colors.textPrimary }]}>
                Dinank v{updateInfo.latestVersion}
              </Text>

              {/* Version Comparison Pill */}
              <View style={styles.versionFlowRow}>
                <View
                  style={[
                    styles.versionPill,
                    { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' },
                  ]}
                >
                  <Text style={[styles.versionPillText, { color: colors.textSecondary }]}>
                    v{CURRENT_APP_VERSION}
                  </Text>
                </View>
                <ArrowRight size={14} color={colors.textMuted} style={{ marginHorizontal: 8 }} />
                <View
                  style={[
                    styles.versionPill,
                    { backgroundColor: colors.accentLight },
                  ]}
                >
                  <Text style={[styles.versionPillText, { color: colors.accent, fontWeight: '700' }]}>
                    v{updateInfo.latestVersion}
                  </Text>
                </View>
              </View>

              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
                An updated version is ready with performance improvements and new features.
              </Text>
            </View>

            {/* What's New Section */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
              WHAT'S NEW
            </Text>
            <View
              style={[
                styles.groupedCard,
                { backgroundColor: cardBg, borderColor: borderColor, padding: 14 },
              ]}
            >
              <View style={styles.releaseHeaderRow}>
                <Sparkles size={16} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.releaseTitle, { color: colors.textPrimary }]}>
                  {updateInfo.releaseTitle || `Version ${updateInfo.latestVersion}`}
                </Text>
              </View>

              <Text style={[styles.releaseNotesText, { color: colors.textPrimary }]}>
                {updateInfo.releaseNotes?.trim() ||
                  '• Stability enhancements & bug fixes\n• Optimized offline caching & 60fps responsiveness\n• Improved reminder scheduling'}
              </Text>

              <View
                style={[
                  styles.dataSafetyBox,
                  {
                    backgroundColor: isDark ? 'rgba(52, 199, 89, 0.12)' : '#EAF9ED',
                    borderColor: isDark ? 'rgba(52, 199, 89, 0.25)' : '#C9EED0',
                  },
                ]}
              >
                <ShieldCheck size={16} color="#34C759" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={[styles.dataSafetyText, { color: isDark ? '#75D78B' : '#1E7E34' }]}>
                  Your saved birthdays, message templates, and settings will remain completely safe.
                </Text>
              </View>
            </View>

            {/* Error Banner if any */}
            {downloadError && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : '#FDECEA',
                    borderColor: '#FF3B30',
                  },
                ]}
              >
                <AlertCircle size={16} color="#FF3B30" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{downloadError}</Text>
              </View>
            )}

            {/* Download Progress Bar Card */}
            {downloading && (
              <View
                style={[
                  styles.progressCard,
                  { backgroundColor: cardBg, borderColor: borderColor },
                ]}
              >
                <View style={styles.progressHeaderRow}>
                  <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>
                    Downloading Update...
                  </Text>
                  <Text style={[styles.progressPercent, { color: colors.accent }]}>
                    {downloadProgress.percent}%
                  </Text>
                </View>

                <View style={[styles.progressBarTrack, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: colors.accent,
                        width: `${Math.max(4, downloadProgress.percent)}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.progressDetail, { color: colors.textSecondary }]}>
                  {downloadProgress.downloadedMB} MB of {downloadProgress.totalMB} MB
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionContainer}>
              {!downloading && !downloadComplete && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleStartUpdate}
                  style={[styles.mainButton, { backgroundColor: colors.accent }]}
                >
                  <Download size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.mainButtonText}>Download & Install</Text>
                </TouchableOpacity>
              )}

              {downloading && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClose}
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
                    },
                  ]}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>
                    Cancel Download
                  </Text>
                </TouchableOpacity>
              )}

              {downloadComplete && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleStartUpdate}
                  style={[styles.mainButton, { backgroundColor: '#34C759' }]}
                >
                  <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.mainButtonText}>Launch Installer</Text>
                </TouchableOpacity>
              )}
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
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: '88%',
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120, 120, 128, 0.2)',
  },
  navSpacer: {
    width: 50,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  doneBtn: {
    width: 50,
    alignItems: 'flex-end',
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
    marginBottom: 14,
  },
  logoWrapper: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  versionFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  versionPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subTitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  groupedCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  releaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  releaseTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  releaseNotesText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  dataSafetyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dataSafetyText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    color: '#FF3B30',
    flex: 1,
  },
  progressCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressDetail: {
    fontSize: 12,
    textAlign: 'right',
  },
  actionContainer: {
    marginTop: 4,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
