import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
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
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  Search,
  Layers,
  GraduationCap,
  Calendar,
  Users,
  FolderOpen,
  X,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { useAlert } from '../context/AlertContext';
import { RelationshipType } from '../types/birthday';
import {
  ImporterService,
  ImportedBirthdayItem,
  ParsedImportResult,
  SegregationDimension,
  SegregatedGroup,
} from '../services/importer';

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FileItem {
  id: string;
  name: string;
  uri: string;
}

interface SheetLinkItem {
  id: string;
  url: string;
  label?: string;
}

const TARGET_CATEGORIES: { id: RelationshipType; label: string; icon: any }[] = [
  { id: 'student', label: 'Students', icon: GraduationCap },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'friend', label: 'Friends', icon: Users },
  { id: 'work', label: 'Work', icon: Layers },
  { id: 'other', label: 'Other', icon: Users },
];

const SEGREGATION_OPTIONS: { id: SegregationDimension; label: string; icon: any }[] = [
  { id: 'session', label: 'Session', icon: Calendar },
  { id: 'class', label: 'Class / Course', icon: GraduationCap },
  { id: 'section', label: 'Batch / Section', icon: Layers },
  { id: 'relationship', label: 'Relationship', icon: Users },
  { id: 'source', label: 'File / Source', icon: FolderOpen },
];

export const ImportModal: React.FC<ImportModalProps> = ({ visible, onClose }) => {
  const { colors, isDark, addBirthday, addMultipleBirthdays, customCategories, addCustomCategory } =
    useBirthdays();
  const { showWarning, showError, showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<'file' | 'sheet' | 'text'>('file');
  const [csvText, setCsvText] = useState('');
  const [pickedFiles, setPickedFiles] = useState<FileItem[]>([]);
  const [sheetLinks, setSheetLinks] = useState<SheetLinkItem[]>([]);
  const [newSheetUrlInput, setNewSheetUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<ParsedImportResult | null>(null);

  // Target Category for zero-effort bulk assignment
  const [targetCategory, setTargetCategory] = useState<RelationshipType>('student');

  // Custom Category Creation Dialog
  const [newCategoryModalVisible, setNewCategoryModalVisible] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Segregation & Selection state
  const [activeDimension, setActiveDimension] = useState<SegregationDimension>('class');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Target categories list (Standard + User Created)
  const availableTargetCategories = useMemo(() => {
    const base = [
      { id: 'student', label: 'Students', icon: GraduationCap },
      { id: 'family', label: 'Family', icon: Users },
      { id: 'friend', label: 'Friends', icon: Users },
      { id: 'work', label: 'Work', icon: Layers },
    ];
    const custom = (customCategories || []).map((cat) => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      icon: Users,
    }));
    return [...base, ...custom];
  }, [customCategories]);

  // Source Rename Dialog State
  const [editingSourceModal, setEditingSourceModal] = useState<{
    visible: boolean;
    oldName: string;
    newName: string;
  }>({
    visible: false,
    oldName: '',
    newName: '',
  });

  // Source File/Link Edit State
  const [editingItemModal, setEditingItemModal] = useState<{
    visible: boolean;
    type: 'file' | 'sheet';
    id: string;
    currentValue: string;
  }>({
    visible: false,
    type: 'file',
    id: '',
    currentValue: '',
  });

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
    }
  }, [visible]);

  const handleClose = () => {
    setCsvText('');
    setSheetLinks([]);
    setNewSheetUrlInput('');
    setPickedFiles([]);
    setPreviewResult(null);
    setSelectedContactIds(new Set());
    setSearchQuery('');
    onClose();
  };

  /**
   * Multi-file document picker
   */
  const handlePickDocuments = async () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'text/comma-separated-values',
          'text/plain',
          '*/*',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        return;
      }

      const newFiles: FileItem[] = res.assets.map((a) => ({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: a.name,
        uri: a.uri,
      }));

      setPickedFiles((prev) => [...prev, ...newFiles]);
    } catch (e: any) {
      showError('File Error', `Failed to open document: ${e.message || String(e)}`);
    }
  };

  const removePickedFile = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setPickedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const promptEditFileName = (file: FileItem) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setEditingItemModal({
      visible: true,
      type: 'file',
      id: file.id,
      currentValue: file.name,
    });
  };

  /**
   * Google Sheet Links Management
   */
  const handleAddSheetLink = () => {
    const url = newSheetUrlInput.trim();
    if (!url || url.length < 5) {
      showWarning('Invalid URL', 'Please enter a valid Google Sheets URL.');
      return;
    }

    try {
      Haptics.selectionAsync();
    } catch (e) {}

    const index = sheetLinks.length + 1;
    setSheetLinks((prev) => [
      ...prev,
      {
        id: `sheet_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        url,
        label: `Google Sheet #${index}`,
      },
    ]);
    setNewSheetUrlInput('');
  };

  const removeSheetLink = (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setSheetLinks((prev) => prev.filter((s) => s.id !== id));
  };

  const promptEditSheetLink = (link: SheetLinkItem) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setEditingItemModal({
      visible: true,
      type: 'sheet',
      id: link.id,
      currentValue: link.url,
    });
  };

  const handleSaveItemEdit = (newVal: string) => {
    const val = newVal.trim();
    if (!val) return;

    if (editingItemModal.type === 'file') {
      setPickedFiles((prev) =>
        prev.map((f) => (f.id === editingItemModal.id ? { ...f, name: val } : f))
      );
    } else {
      setSheetLinks((prev) =>
        prev.map((s) => (s.id === editingItemModal.id ? { ...s, url: val } : s))
      );
    }

    setEditingItemModal({ visible: false, type: 'file', id: '', currentValue: '' });
  };

  /**
   * Parse picked multi-files
   */
  const handleParseFiles = async () => {
    if (pickedFiles.length === 0) {
      showWarning('No Files Selected', 'Please select one or more spreadsheet files.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    try {
      setIsLoading(true);
      const buffers: { name: string; buffer: ArrayBuffer }[] = [];

      for (const f of pickedFiles) {
        const response = await fetch(f.uri);
        const arrayBuffer = await response.arrayBuffer();
        buffers.push({ name: f.name, buffer: arrayBuffer });
      }

      const parsed = ImporterService.parseMultipleFilesOrBuffers(buffers);
      setPreviewResult(parsed);

      const allIds = new Set(parsed.successful.map((item) => item.id));
      setSelectedContactIds(allIds);
    } catch (e: any) {
      showError('Parsing Error', `Failed to parse files: ${e.message || String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Parse Google Sheet URLs
   */
  const handleParseSheets = async () => {
    let urlsToFetch = sheetLinks.map((s) => s.url);
    if (newSheetUrlInput.trim().length > 5) {
      urlsToFetch.push(newSheetUrlInput.trim());
    }

    if (urlsToFetch.length === 0) {
      showWarning('Empty URL', 'Please add at least one public Google Sheet URL.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    try {
      setIsLoading(true);
      const parsed = await ImporterService.importFromMultipleGoogleSheetUrls(urlsToFetch);
      setPreviewResult(parsed);

      const allIds = new Set(parsed.successful.map((item) => item.id));
      setSelectedContactIds(allIds);
    } catch (e: any) {
      showError('Import Error', `Failed to fetch sheets: ${e.message || String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Parse Pasted Text / CSV
   */
  const handleParsePastedData = () => {
    if (!csvText.trim()) {
      showWarning('Empty Input', 'Please paste CSV data with columns: Name, Date of Birth');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const parsed = ImporterService.parseCSVText(csvText, 'Pasted Data');
    setPreviewResult(parsed);

    const allIds = new Set(parsed.successful.map((item) => item.id));
    setSelectedContactIds(allIds);
  };

  /**
   * Source Modification in Preview Stage (Rename & Delete)
   */
  const openRenameSourceDialog = (sourceName: string) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setEditingSourceModal({
      visible: true,
      oldName: sourceName,
      newName: sourceName,
    });
  };

  const handleConfirmRenameSource = () => {
    const { oldName, newName } = editingSourceModal;
    const cleanNew = newName.trim();
    if (!cleanNew || cleanNew === oldName || !previewResult) {
      setEditingSourceModal({ visible: false, oldName: '', newName: '' });
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const updatedSuccessful = previewResult.successful.map((item) =>
      item.sourceFile === oldName ? { ...item, sourceFile: cleanNew } : item
    );

    const updatedFileNames = previewResult.fileNames.map((fn) =>
      fn === oldName ? cleanNew : fn
    );

    setPreviewResult({
      ...previewResult,
      successful: updatedSuccessful,
      fileNames: updatedFileNames,
    });

    setEditingSourceModal({ visible: false, oldName: '', newName: '' });
  };

  const handleDeleteSource = (sourceName: string) => {
    showAlert({
      title: 'Delete Source Batch?',
      message: `Remove all contacts originating from '${sourceName}'?`,
      icon: 'trash',
      type: 'action_sheet',
      actions: [
        {
          text: `Delete '${sourceName}' Contacts`,
          style: 'destructive',
          icon: 'trash',
          onPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (e) {}

            if (!previewResult) return;
            const updatedSuccessful = previewResult.successful.filter(
              (item) => item.sourceFile !== sourceName
            );
            const updatedFileNames = previewResult.fileNames.filter((fn) => fn !== sourceName);

            setPreviewResult({
              ...previewResult,
              successful: updatedSuccessful,
              fileNames: updatedFileNames,
            });

            // Clean selected IDs
            const remainingIds = new Set(updatedSuccessful.map((i) => i.id));
            setSelectedContactIds((prev) => {
              const next = new Set<string>();
              prev.forEach((id) => {
                if (remainingIds.has(id)) next.add(id);
              });
              return next;
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    });
  };

  const handleDeleteIndividualContact = (id: string, name: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    if (!previewResult) return;
    const updatedSuccessful = previewResult.successful.filter((item) => item.id !== id);
    setPreviewResult({
      ...previewResult,
      successful: updatedSuccessful,
    });
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  /**
   * Segregated groups calculation based on active dimension & search filter
   */
  const segregatedGroups: SegregatedGroup[] = useMemo(() => {
    if (!previewResult || previewResult.successful.length === 0) return [];

    let filtered = previewResult.successful;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.groupClass?.toLowerCase().includes(q) ||
          item.section?.toLowerCase().includes(q) ||
          item.session?.toLowerCase().includes(q) ||
          item.phone?.includes(q) ||
          item.sourceFile?.toLowerCase().includes(q)
      );
    }

    return ImporterService.groupParsedItems(filtered, activeDimension);
  }, [previewResult, activeDimension, searchQuery]);

  // Group selection toggling
  const toggleSelectGroup = (group: SegregatedGroup) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}

    const groupItemIds = group.items.map((i) => i.id);
    const allSelected = groupItemIds.every((id) => selectedContactIds.has(id));

    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupItemIds.forEach((id) => next.delete(id));
      } else {
        groupItemIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectIndividual = (id: string) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setSelectedContactIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandGroup = (groupId: string) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  /**
   * Final batch commit to BirthdayContext
   */
  const handleConfirmImport = async () => {
    if (!previewResult || previewResult.successful.length === 0) return;

    const itemsToImport = previewResult.successful.filter((item) =>
      selectedContactIds.has(item.id)
    );

    if (itemsToImport.length === 0) {
      showWarning('No Contacts Selected', 'Please select at least one contact to import.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    setIsLoading(true);
    
    // Prepare items for batch import
    const batchPayload = itemsToImport.map((item) => ({
      name: item.name,
      birthDate: item.birthDate,
      relationship: targetCategory,
      phone: item.phone,
      groupClass: targetCategory === 'student' ? item.groupClass : undefined,
      section: targetCategory === 'student' ? item.section : undefined,
      session: targetCategory === 'student' ? item.session : undefined,
      rollNo: targetCategory === 'student' ? item.rollNo : undefined,
      parentPhone: item.parentPhone,
      email: item.email,
      notes: item.notes,
      avatarColor: item.avatarColor,
      reminders: item.reminders || [
        { id: '1', timing: 'on_day', time: '09:00', enabled: true },
        { id: '2', timing: 'day_before', time: '09:00', enabled: true },
      ],
    }));

    let sourceMeta: { name: string; type: 'sheet' | 'file'; urlOrUri: string } | undefined;
    if (activeTab === 'sheet') {
      const sheetUrl = (sheetLinks[0]?.url || newSheetUrlInput).trim();
      const sheetName = sheetLinks[0]?.label || previewResult.fileNames[0] || 'Google Sheet';
      if (sheetUrl) {
        sourceMeta = {
          name: sheetName,
          type: 'sheet',
          urlOrUri: sheetUrl,
        };
      }
    } else if (activeTab === 'file' && pickedFiles.length > 0) {
      sourceMeta = {
        name: pickedFiles.map((f) => f.name).join(', ') || 'Spreadsheet File',
        type: 'file',
        urlOrUri: pickedFiles[0]?.name || '',
      };
    }

    const addedCount = await addMultipleBirthdays(batchPayload, sourceMeta);
    setIsLoading(false);

    showAlert({
      title: 'Import Successful',
      message:
        addedCount > 0
          ? `Successfully added ${addedCount} ${targetCategory} birthdays into your reminder list.`
          : 'Selected contacts are already in your reminder list (no duplicates created).',
      icon: 'success',
      type: 'dialog',
      actions: [
        {
          text: 'Done',
          style: 'primary',
          onPress: handleClose,
        },
      ],
    });
  };

  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const screenBg = isDark ? '#000000' : '#F2F2F7';
  const segmentedBg = isDark ? '#1C1C1E' : '#E3E3E8';
  const segmentActiveBg = isDark ? '#3A3A3C' : '#FFFFFF';

  const webNoOutline =
    Platform.OS === 'web' ? ({ outlineStyle: 'none', outline: 'none' } as any) : {};

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: screenBg,
              transform: [{ translateY: panY }],
            },
          ]}
        >
          {/* Apple Sheet Grabber */}
          <View style={styles.handleContainer} {...panResponder.panHandlers}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' }]} />
          </View>

          {/* Apple iOS Navigation Bar */}
          <View style={styles.navHeader} {...panResponder.panHandlers}>
            <TouchableOpacity activeOpacity={0.7} onPress={handleClose} style={styles.navBtnLeft}>
              <Text style={[styles.navCancelText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.navTitleContainer}>
              <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Import Birthdays</Text>
            </View>

            <TouchableOpacity activeOpacity={0.7} onPress={handleClose} style={styles.navBtnRight}>
              <Text style={[styles.navSaveText, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >
            {/* iOS Segmented Control */}
            <View style={[styles.segmentedControl, { backgroundColor: segmentedBg }]}>
              {[
                { id: 'file', label: 'Files', icon: FileUp },
                { id: 'sheet', label: 'Sheets', icon: Globe },
                { id: 'text', label: 'Paste', icon: ClipboardList },
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
                      webNoOutline,
                      isSelected && [styles.segmentBtnActive, { backgroundColor: segmentActiveBg }],
                    ]}
                  >
                    <Icon
                      size={14}
                      color={isSelected ? colors.accent : colors.textSecondary}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={[
                        styles.segmentText,
                        {
                          color: isSelected ? (isDark ? '#FFFFFF' : '#000000') : colors.textSecondary,
                          fontWeight: isSelected ? '600' : '500',
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* TAB 1: Multi-Files */}
            {activeTab === 'file' && (
              <View style={styles.inputSection}>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  SELECT SPREADSHEETS (.XLSX, .XLS, .CSV)
                </Text>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handlePickDocuments}
                  style={[styles.fileDropCard, { backgroundColor: cardBg, borderColor: borderColor }]}
                >
                  <View style={[styles.fileIconCircle, { backgroundColor: colors.accentLight }]}>
                    <FileSpreadsheet size={28} color={colors.accent} />
                  </View>
                  <Text style={[styles.fileUploadTitle, { color: colors.textPrimary }]}>
                    {pickedFiles.length > 0
                      ? `${pickedFiles.length} File${pickedFiles.length > 1 ? 's' : ''} Selected`
                      : 'Choose One or Multiple Files'}
                  </Text>
                  <Text style={[styles.fileUploadSub, { color: colors.textSecondary }]}>
                    Batch-parses and auto-segregates all sheets seamlessly
                  </Text>
                  <View style={[styles.chooseBtn, { backgroundColor: colors.accent }]}>
                    <Plus size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.chooseBtnText}>Add Files</Text>
                  </View>
                </TouchableOpacity>

                {/* Selected Files List with Edit and Delete Options */}
                {pickedFiles.length > 0 && (
                  <View style={styles.fileBadgeList}>
                    <Text style={[styles.subHeaderMini, { color: colors.textSecondary }]}>
                      UPLOADED FILES ({pickedFiles.length})
                    </Text>
                    {pickedFiles.map((f) => (
                      <View
                        key={f.id}
                        style={[
                          styles.sourceRowCard,
                          { backgroundColor: cardBg, borderColor: borderColor },
                        ]}
                      >
                        <FileSpreadsheet size={16} color={colors.accent} style={{ marginRight: 8 }} />
                        <Text
                          style={[styles.sourceRowText, { color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {f.name}
                        </Text>

                        <View style={styles.sourceActionRow}>
                          <TouchableOpacity
                            onPress={() => promptEditFileName(f)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.sourceIconBtn}
                          >
                            <Edit3 size={15} color={colors.accent} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => removePickedFile(f.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.sourceIconBtn}
                          >
                            <Trash2 size={15} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleParseFiles}
                      style={[styles.primaryActionBtn, { backgroundColor: colors.accent, marginTop: 10 }]}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryActionBtnText}>
                            Parse {pickedFiles.length} Selected File{pickedFiles.length > 1 ? 's' : ''}
                          </Text>
                          <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: Multi-Google Sheets */}
            {activeTab === 'sheet' && (
              <View style={styles.inputSection}>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  ADD GOOGLE SHEETS LINK
                </Text>

                <View
                  style={[
                    styles.addLinkRow,
                    { backgroundColor: cardBg, borderColor: borderColor },
                  ]}
                >
                  <TextInput
                    value={newSheetUrlInput}
                    onChangeText={setNewSheetUrlInput}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.linkInput, { color: colors.textPrimary }, webNoOutline]}
                  />
                  <TouchableOpacity
                    onPress={handleAddSheetLink}
                    style={[styles.addLinkBtn, { backgroundColor: colors.accent }]}
                  >
                    <Plus size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                {/* Entered Google Sheet Links List */}
                {sheetLinks.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.subHeaderMini, { color: colors.textSecondary }]}>
                      ADDED LINKS ({sheetLinks.length})
                    </Text>
                    {sheetLinks.map((link) => (
                      <View
                        key={link.id}
                        style={[
                          styles.sourceRowCard,
                          { backgroundColor: cardBg, borderColor: borderColor },
                        ]}
                      >
                        <Globe size={16} color={colors.accent} style={{ marginRight: 8 }} />
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text
                            style={[styles.sourceRowText, { color: colors.textPrimary }]}
                            numberOfLines={1}
                          >
                            {link.url}
                          </Text>
                        </View>

                        <View style={styles.sourceActionRow}>
                          <TouchableOpacity
                            onPress={() => promptEditSheetLink(link)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.sourceIconBtn}
                          >
                            <Edit3 size={15} color={colors.accent} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => removeSheetLink(link.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={styles.sourceIconBtn}
                          >
                            <Trash2 size={15} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={[styles.sectionFooter, { color: colors.textSecondary }]}>
                  Ensure sheet link sharing is set to "Anyone with the link can view". You can add
                  multiple Google Sheets.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleParseSheets}
                  style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryActionBtnText}>Fetch & Parse All Sheets</Text>
                      <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 3: Paste CSV / Tabular */}
            {activeTab === 'text' && (
              <View style={styles.inputSection}>
                <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
                  PASTE CSV OR TAB-SEPARATED ROWS
                </Text>
                <View style={[styles.insetCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
                  <TextInput
                    value={csvText}
                    onChangeText={setCsvText}
                    placeholder={
                      'Name, DateOfBirth, Class, Section, Session, RollNo, Phone, ParentPhone\nAarav Sharma, 12/09/2008, 10th, A, 2024-25, 12, 9876543210, 9812345678\nPriya Verma, 15/04/2009, 9th, B, 2024-25, 05, 9123456780, 9988776655'
                    }
                    placeholderTextColor={colors.textMuted}
                    multiline
                    scrollEnabled={false}
                    style={[styles.textArea, { color: colors.textPrimary }, webNoOutline]}
                  />
                </View>
                <Text style={[styles.sectionFooter, { color: colors.textSecondary }]}>
                  Auto-detects headers, dates, classes, batches, sessions, and contacts.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleParsePastedData}
                  style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryActionBtnText}>Parse Pasted Data</Text>
                      <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Ingesting and categorizing spreadsheet records...
                </Text>
              </View>
            )}

            {/* SEGREGATED DATA PREVIEW */}
            {previewResult && !isLoading && (
              <View style={styles.previewContainer}>
                {/* Stats Summary Bar */}
                <View style={styles.previewHeaderRow}>
                  <View style={styles.statBadge}>
                    <CheckCircle2 size={16} color="#34C759" />
                    <Text style={[styles.statBadgeText, { color: colors.textPrimary }]}>
                      {previewResult.successful.length} Contacts Found
                    </Text>
                  </View>
                  {previewResult.fileNames && previewResult.fileNames.length > 0 && (
                    <View style={styles.statBadge}>
                      <FolderOpen size={14} color={colors.textSecondary} />
                      <Text style={[styles.statBadgeText, { color: colors.textSecondary }]}>
                        {previewResult.fileNames.length} Source{previewResult.fileNames.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                  {previewResult.errors.length > 0 && (
                    <View style={styles.statBadge}>
                      <AlertCircle size={16} color="#FF3B30" />
                      <Text style={[styles.statBadgeText, { color: '#FF3B30' }]}>
                        {previewResult.errors.length} Skipped
                      </Text>
                    </View>
                  )}
                </View>

                {/* Direct Category Assignment Selector */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginTop: 14 }]}>
                  ASSIGN THIS BATCH TO CATEGORY
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dimensionScroll}
                >
                  {availableTargetCategories.map((cat) => {
                    const isSelected = targetCategory.toLowerCase() === cat.id.toLowerCase();
                    const Icon = cat.icon || Users;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          try {
                            Haptics.selectionAsync();
                          } catch (e) {}
                          setTargetCategory(cat.id);
                        }}
                        style={[
                          styles.dimensionPill,
                          {
                            backgroundColor: isSelected
                              ? colors.accent
                              : isDark
                              ? '#1C1C1E'
                              : '#FFFFFF',
                            borderColor: isSelected ? colors.accent : borderColor,
                          },
                        ]}
                      >
                        <Icon
                          size={13}
                          color={isSelected ? '#FFFFFF' : colors.textSecondary}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.dimensionPillText,
                            {
                              color: isSelected ? '#FFFFFF' : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* + New Category Button */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      setNewCategoryModalVisible(true);
                    }}
                    style={[
                      styles.dimensionPill,
                      {
                        backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
                        borderColor: borderColor,
                        borderStyle: 'dashed',
                      },
                    ]}
                  >
                    <Plus size={13} color={colors.accent} style={{ marginRight: 4 }} />
                    <Text
                      style={[
                        styles.dimensionPillText,
                        { color: colors.accent, fontWeight: '600' },
                      ]}
                    >
                      New Category
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

                {/* Segregation Filter Dimension Selector */}
                <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginTop: 14 }]}>
                  SEGREGATE & VIEW BY
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.dimensionScroll}
                >
                  {SEGREGATION_OPTIONS.map((dim) => {
                    const isSelected = activeDimension === dim.id;
                    const Icon = dim.icon;
                    return (
                      <TouchableOpacity
                        key={dim.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          try {
                            Haptics.selectionAsync();
                          } catch (e) {}
                          setActiveDimension(dim.id);
                          setExpandedGroups(new Set());
                        }}
                        style={[
                          styles.dimensionPill,
                          {
                            backgroundColor: isSelected
                              ? colors.accentLight
                              : isDark
                              ? '#1C1C1E'
                              : '#FFFFFF',
                            borderColor: isSelected ? colors.accent : borderColor,
                          },
                        ]}
                      >
                        <Icon
                          size={13}
                          color={isSelected ? colors.accent : colors.textSecondary}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.dimensionPillText,
                            {
                              color: isSelected ? colors.accent : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {dim.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Real-Time Filter Search Input */}
                <View
                  style={[
                    styles.searchBox,
                    { backgroundColor: cardBg, borderColor: borderColor, marginTop: 10 },
                  ]}
                >
                  <Search size={15} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search in segregated contacts..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.searchInput, { color: colors.textPrimary }, webNoOutline]}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <X size={15} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Group Summary & Expand All / Collapse All Bar */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 12,
                    marginBottom: 4,
                    paddingHorizontal: 2,
                  }}
                >
                  <Text style={[styles.sectionHeader, { marginBottom: 0, paddingHorizontal: 0, color: colors.textSecondary }]}>
                    {segregatedGroups.length} {segregatedGroups.length === 1 ? 'GROUP' : 'GROUPS'} (TAP TO EXPAND)
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      if (expandedGroups.size === segregatedGroups.length) {
                        setExpandedGroups(new Set());
                      } else {
                        setExpandedGroups(new Set(segregatedGroups.map((g) => g.id)));
                      }
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.accent }}>
                      {expandedGroups.size === segregatedGroups.length && segregatedGroups.length > 0
                        ? 'Collapse All'
                        : 'Expand All'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Segregated Accordion Cards */}
                <View style={styles.groupsContainer}>
                  {segregatedGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const groupItemIds = group.items.map((i) => i.id);
                    const selectedCount = groupItemIds.filter((id) =>
                      selectedContactIds.has(id)
                    ).length;
                    const isAllSelected = selectedCount === group.items.length;
                    const isPartiallySelected = selectedCount > 0 && !isAllSelected;
                    const isSourceDimension = activeDimension === 'source';

                    return (
                      <View
                        key={group.id}
                        style={[
                          styles.groupCard,
                          { backgroundColor: cardBg, borderColor: borderColor },
                        ]}
                      >
                        {/* Group Header */}
                        <View style={styles.groupHeaderRow}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => toggleSelectGroup(group)}
                            style={[
                              styles.checkbox,
                              {
                                backgroundColor: isAllSelected
                                  ? colors.accent
                                  : isPartiallySelected
                                  ? colors.accentLight
                                  : 'transparent',
                                borderColor:
                                  isAllSelected || isPartiallySelected ? colors.accent : borderColor,
                              },
                            ]}
                          >
                            {isAllSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                            {isPartiallySelected && (
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  backgroundColor: colors.accent,
                                  borderRadius: 2,
                                }}
                              />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => toggleExpandGroup(group.id)}
                            style={styles.groupTitleTouch}
                          >
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text
                                style={[styles.groupLabel, { color: colors.textPrimary }]}
                                numberOfLines={2}
                              >
                                {group.label.replace(/^Google\s*Sheet\s*#?\d*\s*[•\-–:]\s*/i, '').replace(/^Spreadsheet\s*[•\-–:]\s*/i, '')}
                              </Text>
                              <Text style={[styles.groupSubLabel, { color: colors.textSecondary }]}>
                                {selectedCount} of {group.count} selected
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.groupCountBadge,
                                { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' },
                              ]}
                            >
                              <Text style={[styles.groupCountText, { color: colors.textPrimary }]}>
                                {group.count}
                              </Text>
                            </View>
                          </TouchableOpacity>

                          {/* Source Action Buttons (Rename & Delete Source Batch) */}
                          {isSourceDimension && (
                            <View style={styles.groupActionBtnRow}>
                              <TouchableOpacity
                                onPress={() => openRenameSourceDialog(group.id)}
                                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                style={styles.groupActionBtn}
                              >
                                <Edit3 size={15} color={colors.accent} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeleteSource(group.id)}
                                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                style={styles.groupActionBtn}
                              >
                                <Trash2 size={15} color="#FF3B30" />
                              </TouchableOpacity>
                            </View>
                          )}

                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => toggleExpandGroup(group.id)}
                            style={{ padding: 4 }}
                          >
                            {isExpanded ? (
                              <ChevronUp size={18} color={colors.textMuted} />
                            ) : (
                              <ChevronDown size={18} color={colors.textMuted} />
                            )}
                          </TouchableOpacity>
                        </View>

                        {/* Group Items (Collapsible - Minimized by default) */}
                        {isExpanded && (
                          <View
                            style={[
                              styles.groupItemList,
                              { borderTopColor: borderColor, borderTopWidth: StyleSheet.hairlineWidth },
                            ]}
                          >
                            {group.items.map((item, idx) => {
                              const isSelected = selectedContactIds.has(item.id);
                              return (
                                <View
                                  key={item.id}
                                  style={[
                                    styles.itemRow,
                                    idx < group.items.length - 1 && {
                                      borderBottomColor: borderColor,
                                      borderBottomWidth: StyleSheet.hairlineWidth,
                                    },
                                  ]}
                                >
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => toggleSelectIndividual(item.id)}
                                    style={styles.itemSelectTouch}
                                  >
                                    <View
                                      style={[
                                        styles.checkboxSmall,
                                        {
                                          backgroundColor: isSelected ? colors.accent : 'transparent',
                                          borderColor: isSelected ? colors.accent : borderColor,
                                        },
                                      ]}
                                    >
                                      {isSelected && <Check size={10} color="#FFFFFF" strokeWidth={3} />}
                                    </View>

                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                      <Text style={[styles.itemName, { color: colors.textPrimary }]}>
                                        {item.name}
                                      </Text>
                                      <Text style={[styles.itemDetails, { color: colors.textSecondary }]}>
                                        {item.birthDate}
                                        {item.groupClass ? ` • ${item.groupClass}` : ''}
                                        {item.section ? ` (${item.section})` : ''}
                                        {item.session ? ` • ${item.session}` : ''}
                                        {item.phone ? ` • ${item.phone}` : ''}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>

                                  {item.sourceFile && activeDimension !== 'source' && (
                                    <Text
                                      style={[styles.sourceBadge, { color: colors.textMuted }]}
                                      numberOfLines={1}
                                    >
                                      {item.sourceFile}
                                    </Text>
                                  )}

                                  <TouchableOpacity
                                    onPress={() => handleDeleteIndividualContact(item.id, item.name)}
                                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                                    style={{ padding: 6 }}
                                  >
                                    <Trash2 size={14} color={colors.textMuted} />
                                  </TouchableOpacity>
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Import Confirmation Button */}
                {selectedContactIds.size > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleConfirmImport}
                    style={[styles.confirmBtn, { backgroundColor: '#34C759' }]}
                    disabled={isLoading}
                  >
                    <Sparkles size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmBtnText}>
                      Import Selected ({selectedContactIds.size} Contacts)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* RENAME SOURCE DIALOG MODAL */}
      <Modal
        visible={editingSourceModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingSourceModal({ visible: false, oldName: '', newName: '' })}
      >
        <View style={styles.dialogOverlay}>
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: cardBg, borderColor: borderColor },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>
              Rename Source Batch
            </Text>
            <Text style={[styles.dialogSub, { color: colors.textSecondary }]}>
              Update the source label for all records originating from '{editingSourceModal.oldName}'
            </Text>
            <TextInput
              value={editingSourceModal.newName}
              onChangeText={(text) =>
                setEditingSourceModal((prev) => ({ ...prev, newName: text }))
              }
              autoFocus
              placeholder="e.g. Class 10th Attendance"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.dialogInput,
                { color: colors.textPrimary, borderColor: borderColor, backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                webNoOutline,
              ]}
            />
            <View style={styles.dialogBtnRow}>
              <TouchableOpacity
                onPress={() => setEditingSourceModal({ visible: false, oldName: '', newName: '' })}
                style={[styles.dialogBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
              >
                <Text style={[styles.dialogBtnText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmRenameSource}
                style={[styles.dialogBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.dialogBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT FILE/LINK VALUE MODAL */}
      <Modal
        visible={editingItemModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setEditingItemModal({ visible: false, type: 'file', id: '', currentValue: '' })
        }
      >
        <View style={styles.dialogOverlay}>
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: cardBg, borderColor: borderColor },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>
              {editingItemModal.type === 'file' ? 'Rename File' : 'Edit Google Sheet URL'}
            </Text>
            <TextInput
              value={editingItemModal.currentValue}
              onChangeText={(text) =>
                setEditingItemModal((prev) => ({ ...prev, currentValue: text }))
              }
              autoFocus
              autoCapitalize="none"
              placeholder={editingItemModal.type === 'file' ? 'filename.xlsx' : 'https://...'}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.dialogInput,
                { color: colors.textPrimary, borderColor: borderColor, backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' },
                webNoOutline,
              ]}
            />
            <View style={styles.dialogBtnRow}>
              <TouchableOpacity
                onPress={() =>
                  setEditingItemModal({ visible: false, type: 'file', id: '', currentValue: '' })
                }
                style={[styles.dialogBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
              >
                <Text style={[styles.dialogBtnText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSaveItemEdit(editingItemModal.currentValue)}
                style={[styles.dialogBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.dialogBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                  Update
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE NEW CATEGORY MODAL */}
      <Modal
        visible={newCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setNewCategoryModalVisible(false);
          setNewCategoryInput('');
        }}
      >
        <View style={styles.dialogOverlay}>
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: cardBg, borderColor: borderColor },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>
              Create Category
            </Text>
            <Text style={[styles.dialogSub, { color: colors.textSecondary }]}>
              Enter a name for this category (e.g. Alumni, Faculty, Lab Batch). It will be saved for all future imports and reminders.
            </Text>
            <TextInput
              value={newCategoryInput}
              onChangeText={setNewCategoryInput}
              autoFocus
              placeholder="e.g. Alumni, Faculty, Staff"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.dialogInput,
                {
                  color: colors.textPrimary,
                  borderColor: borderColor,
                  backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
                },
                webNoOutline,
              ]}
            />
            <View style={styles.dialogBtnRow}>
              <TouchableOpacity
                onPress={() => {
                  setNewCategoryModalVisible(false);
                  setNewCategoryInput('');
                }}
                style={[styles.dialogBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
              >
                <Text style={[styles.dialogBtnText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const trimmed = newCategoryInput.trim();
                  if (!trimmed) {
                    setNewCategoryModalVisible(false);
                    return;
                  }
                  try {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } catch (e) {}
                  const created = await addCustomCategory(trimmed);
                  if (created) {
                    setTargetCategory(created);
                  }
                  setNewCategoryInput('');
                  setNewCategoryModalVisible(false);
                }}
                style={[styles.dialogBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.dialogBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                  Add & Select
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: '92%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handleBar: {
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
  navBtnLeft: {
    minWidth: 60,
    alignItems: 'flex-start',
  },
  navCancelText: {
    fontSize: 17,
    letterSpacing: -0.4,
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  navBtnRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  navSaveText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
    height: 36,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    height: 32,
    paddingHorizontal: 4,
  },
  segmentBtnActive: {
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)' },
      default: { elevation: 2 },
    }),
  },
  segmentText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 120 : 80,
  },
  inputSection: {
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  subHeaderMini: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
    paddingHorizontal: 2,
    textTransform: 'uppercase',
  },
  sectionFooter: {
    fontSize: 13,
    marginTop: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  insetCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  fileDropCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  fileIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  fileUploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  fileUploadSub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  chooseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  chooseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fileBadgeList: {
    marginTop: 10,
    gap: 6,
  },
  sourceRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 6,
  },
  sourceRowText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  sourceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sourceIconBtn: {
    padding: 4,
  },
  addLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    height: 48,
  },
  linkInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 4,
  },
  addLinkBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 13,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 19,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    marginTop: 4,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  previewContainer: {
    marginTop: 10,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
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
  dimensionScroll: {
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  dimensionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  dimensionPillText: {
    fontSize: 13,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  groupsContainer: {
    gap: 10,
    marginBottom: 14,
  },
  groupCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  groupTitleTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  groupSubLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  groupCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  groupCountText: {
    fontSize: 12,
    fontWeight: '600',
  },
  groupActionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 8,
  },
  groupActionBtn: {
    padding: 5,
  },
  groupItemList: {
    paddingHorizontal: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemSelectTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxSmall: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  itemDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  sourceBadge: {
    fontSize: 11,
    maxWidth: 90,
    marginRight: 6,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)' },
      default: { elevation: 8 },
    }),
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  dialogSub: {
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  dialogInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  dialogBtnRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  dialogBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  dialogBtnText: {
    fontSize: 14,
  },
});
