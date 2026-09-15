import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import {
  FileSpreadsheet,
  Globe,
  CheckCircle2,
  AlertCircle,
  FileUp,
  ClipboardList,
  Sparkles,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { ImporterService, ParsedImportResult } from '../services/importer';

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ visible, onClose }) => {
  const { colors, isDark, addBirthday } = useBirthdays();
  const [activeTab, setActiveTab] = useState<'file' | 'sheet' | 'text'>('file');
  const [csvText, setCsvText] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<ParsedImportResult | null>(null);

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
            handleClose();
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

  const handleClose = () => {
    setCsvText('');
    setSheetUrl('');
    setPickedFileName(null);
    setPreviewResult(null);
    onClose();
  };

  const handlePickDocument = async () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    try {
      setIsLoading(true);
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'text/comma-separated-values',
          'text/plain',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        setIsLoading(false);
        return;
      }

      const asset = res.assets[0];
      setPickedFileName(asset.name);

      // Fetch the file buffer from uri
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();

      const parsed = ImporterService.parseExcelOrCSVBuffer(arrayBuffer, asset.name);
      setPreviewResult(parsed);
    } catch (e: any) {
      Alert.alert('File Error', `Failed to open document: ${e.message || String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParse = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    if (activeTab === 'text') {
      if (!csvText.trim()) {
        Alert.alert('Empty Input', 'Please paste CSV data with columns: Name, Date of Birth');
        return;
      }
      const res = ImporterService.parseCSVText(csvText, 'Pasted Data');
      setPreviewResult(res);
    } else if (activeTab === 'sheet') {
      if (!sheetUrl.trim()) {
        Alert.alert('Empty URL', 'Please enter a valid Google Sheet URL');
        return;
      }
      setIsLoading(true);
      const res = await ImporterService.importFromGoogleSheetUrl(sheetUrl);
      setIsLoading(false);
      setPreviewResult(res);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewResult || previewResult.successful.length === 0) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    setIsLoading(true);
    let count = 0;
    for (const item of previewResult.successful) {
      await addBirthday({
        name: item.name,
        birthDate: item.birthDate,
        relationship: item.relationship,
        phone: item.phone,
        groupClass: item.groupClass,
        rollNo: item.rollNo,
        parentPhone: item.parentPhone,
        email: item.email,
        notes: item.notes,
        avatarColor: item.avatarColor,
        reminders: item.reminders || [
          { id: '1', timing: 'on_day', time: '09:00', enabled: true },
          { id: '2', timing: 'day_before', time: '09:00', enabled: true },
        ],
      });
      count++;
    }
    setIsLoading(false);

    Alert.alert(
      'Import Complete 🎉',
      `Successfully imported ${count} birthdays into your reminder list.`,
      [{ text: 'Great', onPress: handleClose }]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Grab Handle */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#48484A' : '#D1D1D6' }]} />
          </View>

          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Import Birthdays
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Excel (.xlsx), CSV or Google Sheets
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={handleClose}
              style={[styles.closePill, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
            >
              <Text style={[styles.closePillText, { color: colors.textPrimary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Apple Segmented Switcher */}
          <View style={[styles.segmentedControl, { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' }]}>
            {[
              { id: 'file', label: 'Excel / CSV File', icon: FileUp },
              { id: 'sheet', label: 'Google Sheet', icon: Globe },
              { id: 'text', label: 'Paste CSV', icon: ClipboardList },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch (e) {}
                    setActiveTab(tab.id as any);
                    setPreviewResult(null);
                  }}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor: isSelected ? (isDark ? '#2C2C2E' : '#FFFFFF') : 'transparent',
                    },
                  ]}
                >
                  <Icon
                    size={14}
                    color={isSelected ? colors.accent : colors.textSecondary}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: isSelected ? colors.textPrimary : colors.textSecondary,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'file' ? (
              <View style={styles.inputSection}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handlePickDocument}
                  style={[
                    styles.fileDropBox,
                    {
                      borderColor: pickedFileName ? colors.accent : colors.cardBorder,
                      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                    },
                  ]}
                >
                  <View style={[styles.fileIconCircle, { backgroundColor: colors.accentLight }]}>
                    <FileSpreadsheet size={32} color={colors.accent} />
                  </View>
                  <Text style={[styles.fileUploadTitle, { color: colors.textPrimary }]}>
                    {pickedFileName ? pickedFileName : 'Choose .xlsx, .xls or .csv'}
                  </Text>
                  <Text style={[styles.fileUploadSub, { color: colors.textSecondary }]}>
                    Auto-detects Name, DOB, Class, Phone, Parent & Notes
                  </Text>
                  <View style={[styles.chooseBtn, { backgroundColor: colors.accent }]}>
                    <Text style={styles.chooseBtnText}>
                      {pickedFileName ? 'Pick Another File' : 'Browse Files'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : activeTab === 'sheet' ? (
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  PUBLIC GOOGLE SHEETS LINK
                </Text>
                <TextInput
                  value={sheetUrl}
                  onChangeText={setSheetUrl}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.urlInput,
                    {
                      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                      color: colors.textPrimary,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                />
                <Text style={[styles.helperText, { color: colors.textMuted }]}>
                  Ensure sheet link sharing is set to "Anyone with the link can view".
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleParse}
                  style={[styles.parseButton, { backgroundColor: colors.accent }]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.parseButtonText}>Fetch & Parse Sheet</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  PASTE CSV OR TAB-SEPARATED ROWS
                </Text>
                <TextInput
                  value={csvText}
                  onChangeText={setCsvText}
                  placeholder={"Name, DateOfBirth, Relationship, Phone, Class\nAarav Sharma, 12/09/2004, friend, 9876543210, BCA-DS\nSophia Miller, 1998-04-15, work, , Team Lead"}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={6}
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
                      color: colors.textPrimary,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                />

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleParse}
                  style={[styles.parseButton, { backgroundColor: colors.accent }]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.parseButtonText}>Parse Pasted Data</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Preview Section */}
            {isLoading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Reading spreadsheet rows...
                </Text>
              </View>
            )}

            {previewResult && !isLoading && (
              <View style={styles.previewContainer}>
                {/* Stats Summary */}
                <View style={styles.previewHeaderRow}>
                  <View style={styles.statBadge}>
                    <CheckCircle2 size={16} color="#34C759" />
                    <Text style={[styles.statBadgeText, { color: colors.textPrimary }]}>
                      {previewResult.successful.length} Valid Rows
                    </Text>
                  </View>
                  {previewResult.errors.length > 0 && (
                    <View style={styles.statBadge}>
                      <AlertCircle size={16} color="#FF3B30" />
                      <Text style={[styles.statBadgeText, { color: '#FF3B30' }]}>
                        {previewResult.errors.length} Skipped
                      </Text>
                    </View>
                  )}
                </View>

                {/* Rows list */}
                {previewResult.successful.length > 0 && (
                  <View style={[styles.previewList, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                    {previewResult.successful.slice(0, 8).map((item, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.previewRow,
                          idx < previewResult.successful.length - 1 && {
                            borderBottomColor: colors.surfaceBorder,
                            borderBottomWidth: 0.5,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rowName, { color: colors.textPrimary }]}>
                            {item.name}
                          </Text>
                          <Text style={[styles.rowSub, { color: colors.textSecondary }]}>
                            {item.birthDate} • {item.relationship}
                            {item.groupClass ? ` • ${item.groupClass}` : ''}
                            {item.phone ? ` • 📞 ${item.phone}` : ''}
                          </Text>
                        </View>
                      </View>
                    ))}
                    {previewResult.successful.length > 8 && (
                      <Text style={[styles.moreRowsText, { color: colors.textMuted }]}>
                        + {previewResult.successful.length - 8} more contacts ready to import
                      </Text>
                    )}
                  </View>
                )}

                {/* Errors display */}
                {previewResult.errors.length > 0 && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorTitle}>Issues Detected:</Text>
                    {previewResult.errors.slice(0, 3).map((err, i) => (
                      <Text key={i} style={styles.errorText}>
                        • {err}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Import Action Button */}
                {previewResult.successful.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleConfirmImport}
                    style={[styles.confirmBtn, { backgroundColor: '#34C759' }]}
                  >
                    <Sparkles size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmBtnText}>
                      Import {previewResult.successful.length} Contacts
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  closePillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 3,
    borderRadius: 10,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 12,
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputSection: {
    marginBottom: 16,
  },
  fileDropBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 26,
    paddingHorizontal: 16,
  },
  fileIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  fileUploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  fileUploadSub: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  chooseBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  chooseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  urlInput: {
    borderWidth: 0.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 0.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 12,
  },
  parseButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parseButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
  },
  previewContainer: {
    marginTop: 10,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  previewList: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  previewRow: {
    paddingVertical: 9,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  moreRowsText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
