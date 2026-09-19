import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Link,
  HelpCircle,
  X,
  Phone,
  Mail,
  FileSpreadsheet,
  Share2,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';

export type AlertIconType =
  | 'trash'
  | 'warning'
  | 'info'
  | 'success'
  | 'sync'
  | 'sparkles'
  | 'link'
  | 'help'
  | 'phone'
  | 'mail'
  | 'file'
  | 'export';

export interface AlertAction {
  text: string;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
  subtitle?: string;
  icon?: AlertIconType;
  onPress?: () => void | Promise<void>;
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: AlertIconType;
  type?: 'dialog' | 'action_sheet';
  actions: AlertAction[];
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const CustomAlertModal: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  icon,
  type = 'dialog',
  actions = [],
  onClose,
}) => {
  const { colors, isDark } = useBirthdays();

  const animValue = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      try {
        if (icon === 'trash' || actions.some((a) => a.style === 'destructive')) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch (e) {}

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(animValue, {
          toValue: 1,
          friction: 9,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const renderIcon = (iconName?: AlertIconType, size = 26) => {
    switch (iconName) {
      case 'trash':
        return <Trash2 size={size} color="#FF3B30" strokeWidth={2.2} />;
      case 'warning':
        return <AlertTriangle size={size} color="#FF9500" strokeWidth={2.2} />;
      case 'success':
        return <CheckCircle2 size={size} color="#34C759" strokeWidth={2.2} />;
      case 'sync':
        return <RefreshCw size={size} color="#007AFF" strokeWidth={2.2} />;
      case 'sparkles':
        return <Sparkles size={size} color="#AF52DE" strokeWidth={2.2} />;
      case 'link':
        return <Link size={size} color="#007AFF" strokeWidth={2.2} />;
      case 'phone':
        return <Phone size={size} color="#34C759" strokeWidth={2.2} />;
      case 'mail':
        return <Mail size={size} color="#007AFF" strokeWidth={2.2} />;
      case 'file':
        return <FileSpreadsheet size={size} color="#007AFF" strokeWidth={2.2} />;
      case 'export':
        return <Share2 size={size} color="#AF52DE" strokeWidth={2.2} />;
      case 'info':
      default:
        return <Info size={size} color={isDark ? '#FFFFFF' : '#000000'} strokeWidth={2.2} />;
    }
  };

  const getIconBg = (iconName?: AlertIconType) => {
    switch (iconName) {
      case 'trash':
        return isDark ? 'rgba(255, 69, 58, 0.18)' : 'rgba(255, 59, 48, 0.12)';
      case 'warning':
        return isDark ? 'rgba(255, 159, 10, 0.18)' : 'rgba(255, 149, 0, 0.12)';
      case 'success':
      case 'phone':
        return isDark ? 'rgba(48, 209, 88, 0.18)' : 'rgba(52, 199, 89, 0.12)';
      case 'sync':
      case 'link':
      case 'mail':
      case 'file':
        return isDark ? 'rgba(10, 132, 255, 0.18)' : 'rgba(0, 122, 255, 0.12)';
      case 'sparkles':
      case 'export':
        return isDark ? 'rgba(191, 90, 242, 0.18)' : 'rgba(175, 82, 222, 0.12)';
      default:
        return isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
    }
  };

  const cancelAction = actions.find((a) => a.style === 'cancel');
  const nonCancelActions = actions.filter((a) => a.style !== 'cancel');

  const isActionSheet = type === 'action_sheet';

  // Backdrop animated opacity
  const backdropOpacity = backdropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isDark ? 0.75 : 0.45],
  });

  // Modal / Action Sheet transforms
  const containerTransform = isActionSheet
    ? {
        transform: [
          {
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [300, 0],
            }),
          },
        ],
      }
    : {
        transform: [
          {
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.85, 1],
            }),
          },
        ],
        opacity: animValue,
      };

  const handleActionPress = async (action: AlertAction) => {
    try {
      if (action.style === 'destructive') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.selectionAsync();
      }
    } catch (e) {}

    onClose();
    if (action.onPress) {
      setTimeout(() => {
        action.onPress?.();
      }, 50);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Animated Dark / Blurred Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Action Sheet Presentation */}
        {isActionSheet ? (
          <Animated.View style={[styles.actionSheetContainer, containerTransform]}>
            {/* Main Action Card */}
            <View
              style={[
                styles.actionSheetCard,
                {
                  backgroundColor: isDark ? 'rgba(30, 30, 32, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              {/* Header */}
              <View style={styles.sheetHeader}>
                {icon && (
                  <View style={[styles.iconBadge, { backgroundColor: getIconBg(icon) }]}>
                    {renderIcon(icon, 22)}
                  </View>
                )}
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{title}</Text>
                {message ? (
                  <Text style={[styles.sheetMessage, { color: colors.textSecondary }]}>{message}</Text>
                ) : null}
              </View>

              {/* Action Buttons List */}
              <View style={styles.sheetActionsList}>
                {nonCancelActions.map((action, index) => {
                  const isDestructive = action.style === 'destructive';
                  const isPrimary = action.style === 'primary';

                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      style={[
                        styles.sheetActionButton,
                        index > 0 && {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                        },
                      ]}
                      onPress={() => handleActionPress(action)}
                    >
                      <View style={styles.sheetActionContent}>
                        {action.icon && (
                          <View
                            style={[
                              styles.actionButtonIcon,
                              { backgroundColor: getIconBg(action.icon) },
                            ]}
                          >
                            {renderIcon(action.icon, 18)}
                          </View>
                        )}
                        <View style={styles.sheetActionTextContainer}>
                          <Text
                            style={[
                              styles.sheetActionText,
                              isDestructive
                                ? styles.destructiveText
                                : isPrimary
                                ? { color: colors.accent, fontWeight: '700' }
                                : { color: colors.textPrimary },
                            ]}
                          >
                            {action.text}
                          </Text>
                          {action.subtitle ? (
                            <Text style={[styles.sheetActionSubtitle, { color: colors.textSecondary }]}>
                              {action.subtitle}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Cancel Button */}
            {cancelAction ? (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.cancelCard,
                  {
                    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
                onPress={() => handleActionPress(cancelAction)}
              >
                <Text style={[styles.cancelText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  {cancelAction.text}
                </Text>
              </TouchableOpacity>
            ) : null}
          </Animated.View>
        ) : (
          /* Centered Apple Dialog Alert Presentation */
          <Animated.View style={[styles.dialogContainer, containerTransform]}>
            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              {/* Close Button top right */}
              <TouchableOpacity
                style={[styles.closeIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Icon */}
              {icon && (
                <View style={[styles.dialogIconCircle, { backgroundColor: getIconBg(icon) }]}>
                  {renderIcon(icon, 30)}
                </View>
              )}

              {/* Title & Body */}
              <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>{title}</Text>
              {message ? (
                <Text style={[styles.dialogMessage, { color: colors.textSecondary }]}>{message}</Text>
              ) : null}

              {/* Button Actions */}
              <View
                style={[
                  styles.dialogButtonsContainer,
                  actions.length > 2 ? styles.dialogButtonsVertical : styles.dialogButtonsHorizontal,
                ]}
              >
                {actions.map((action, idx) => {
                  const isCancel = action.style === 'cancel';
                  const isDestructive = action.style === 'destructive';
                  const isPrimary = action.style === 'primary' || (!isCancel && !isDestructive && idx === actions.length - 1);

                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      style={[
                        styles.dialogButton,
                        actions.length > 2 ? styles.dialogButtonFullWidth : styles.dialogButtonFlex,
                        isPrimary && { backgroundColor: isDark ? '#FFFFFF' : '#000000' },
                        isDestructive && { backgroundColor: isDark ? 'rgba(255, 69, 58, 0.2)' : 'rgba(255, 59, 48, 0.12)' },
                        isCancel && {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}
                      onPress={() => handleActionPress(action)}
                    >
                      <Text
                        style={[
                          styles.dialogButtonText,
                          isPrimary && { color: isDark ? '#000000' : '#FFFFFF', fontWeight: '700' },
                          isDestructive && { color: '#FF3B30', fontWeight: '700' },
                          isCancel && { color: colors.textPrimary, fontWeight: '600' },
                        ]}
                      >
                        {action.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  // --- Action Sheet Layout ---
  actionSheetContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    width: Math.min(SCREEN_WIDTH - 24, 420),
    alignSelf: 'center',
  },
  actionSheetCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  sheetHeader: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sheetMessage: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  sheetActionsList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  sheetActionButton: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  sheetActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sheetActionTextContainer: {
    flex: 1,
  },
  sheetActionText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sheetActionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  destructiveText: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  cancelCard: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // --- Centered Dialog Layout ---
  dialogContainer: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    alignSelf: 'center',
  },
  dialogCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  closeIconBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  dialogMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  dialogButtonsContainer: {
    width: '100%',
    gap: 10,
  },
  dialogButtonsHorizontal: {
    flexDirection: 'row',
  },
  dialogButtonsVertical: {
    flexDirection: 'column',
  },
  dialogButton: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogButtonFlex: {
    flex: 1,
  },
  dialogButtonFullWidth: {
    width: '100%',
  },
  dialogButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
