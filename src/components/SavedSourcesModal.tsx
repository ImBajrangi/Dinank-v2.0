import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  FileSpreadsheet,
  Globe,
  Trash2,
  Edit3,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Plus,
  CheckCircle2,
  Layers,
  Calendar,
  X,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { useAlert } from '../context/AlertContext';
import { SavedSource, SourcesService } from '../services/sources';
import { ImporterService } from '../services/importer';

interface SavedSourcesModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenImport?: () => void;
}

export const SavedSourcesModal: React.FC<SavedSourcesModalProps> = ({
  visible,
  onClose,
  onOpenImport,
}) => {
  const {
    colors,
    isDark,
    savedSources,
    refreshSavedSources,
    deleteSourceAndContacts,
    addMultipleBirthdays,
    cleanDuplicateBirthdays,
    birthdays,
  } = useBirthdays();

  const { showAlert } = useAlert();

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [editingSource, setEditingSource] = useState<{
    visible: boolean;
    source: SavedSource | null;
    name: string;
    url: string;
  }>({
    visible: false,
    source: null,
    name: '',
    url: '',
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
      refreshSavedSources();
    }
  }, [visible, refreshSavedSources]);

  const handleSyncSource = async (source: SavedSource) => {
    if (source.type === 'sheet' && source.urlOrUri) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}

      try {
        setSyncingId(source.id);
        const parsed = await ImporterService.importFromGoogleSheetUrl(source.urlOrUri);
        if (parsed.successful.length > 0) {
          const added = await addMultipleBirthdays(parsed.successful, {
            id: source.id,
            name: source.name,
            type: source.type,
            urlOrUri: source.urlOrUri,
          });

          await SourcesService.updateSource(source.id, {
            importedCount: parsed.successful.length,
            lastSyncedAt: new Date().toISOString(),
          });
          await refreshSavedSources();

          showAlert({
            type: 'dialog',
            title: 'Sync Complete',
            message: `Processed ${parsed.successful.length} records. ${
              added > 0 ? `Added ${added} new contacts.` : 'All contacts are up to date.'
            }`,
            icon: 'success',
            actions: [{ text: 'Done', style: 'primary' }],
          });
        } else {
          showAlert({
            type: 'dialog',
            title: 'Sync Notice',
            message: 'No valid student contacts found in this sheet.',
            icon: 'info',
            actions: [{ text: 'OK', style: 'default' }],
          });
        }
      } catch (err: any) {
        showAlert({
          type: 'dialog',
          title: 'Sync Failed',
          message: err.message || 'Could not fetch latest data from Google Sheet.',
          icon: 'warning',
          actions: [{ text: 'Close', style: 'default' }],
        });
      } finally {
        setSyncingId(null);
      }
    }
  };

  const handlePromptDelete = (source: SavedSource) => {
    showAlert({
      type: 'action_sheet',
      title: `Delete '${source.name}'?`,
      message: 'Choose whether to remove only the saved link or permanently delete its contacts.',
      icon: 'trash',
      actions: [
        {
          text: 'Delete Source & All Contacts',
          style: 'destructive',
          subtitle: 'Removes source and deletes all imported contacts from reminders',
          icon: 'trash',
          onPress: async () => {
            await deleteSourceAndContacts(source.id, source.name, true);
            showAlert({
              type: 'dialog',
              title: 'Contacts Removed',
              message: `Deleted '${source.name}' and its imported contacts.`,
              icon: 'success',
              actions: [{ text: 'OK', style: 'primary' }],
            });
          },
        },
        {
          text: 'Remove Source Only',
          style: 'default',
          subtitle: 'Removes from saved list, keeping contacts in your reminders',
          icon: 'link',
          onPress: async () => {
            await deleteSourceAndContacts(source.id, source.name, false);
            showAlert({
              type: 'dialog',
              title: 'Source Removed',
              message: `Removed '${source.name}'. All contacts remain in your list.`,
              icon: 'success',
              actions: [{ text: 'OK', style: 'primary' }],
            });
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    });
  };

  const handleOpenEdit = (source: SavedSource) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setEditingSource({
      visible: true,
      source,
      name: source.name,
      url: source.urlOrUri || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSource.source) return;
    const name = editingSource.name.trim();
    const url = editingSource.url.trim();

    if (!name) {
      showAlert({
        type: 'dialog',
        title: 'Name Required',
        message: 'Please provide a name for this source.',
        icon: 'warning',
        actions: [{ text: 'OK', style: 'primary' }],
      });
      return;
    }

    await SourcesService.updateSource(editingSource.source.id, {
      name,
      urlOrUri: url,
    });
    await refreshSavedSources();
    setEditingSource({ visible: false, source: null, name: '', url: '' });

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  };

  const handleCleanDuplicates = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const removed = await cleanDuplicateBirthdays();
    if (removed > 0) {
      showAlert({
        type: 'dialog',
        title: 'Cleanup Complete',
        message: `Successfully merged and removed ${removed} duplicate contacts.`,
        icon: 'success',
        actions: [{ text: 'Done', style: 'primary' }],
      });
    } else {
      showAlert({
        type: 'dialog',
        title: 'Clean List',
        message: 'No duplicate contacts found! Your database is completely clean.',
        icon: 'info',
        actions: [{ text: 'OK', style: 'primary' }],
      });
    }
  };

  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const screenBg = isDark ? '#000000' : '#F2F2F7';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
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
              { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.navSideSlot} />

            <Text style={[styles.navCenterTitle, { color: colors.textPrimary }]}>
              Saved Sources
            </Text>

            <View style={styles.navSideSlot}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
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

          <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Quick Actions Row */}
            <View style={styles.topActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  onClose();
                  if (onOpenImport) onOpenImport();
                }}
                style={[styles.actionChip, { backgroundColor: colors.accent }]}
              >
                <Plus size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionChipText}>Add New Source</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCleanDuplicates}
                style={[
                  styles.actionChip,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
                    borderColor: borderColor,
                    borderWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <Sparkles size={15} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.actionChipText, { color: colors.textPrimary }]}>Clean Duplicates</Text>
              </TouchableOpacity>
            </View>

            {/* List of Saved Sources */}
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
              SAVED SPREADSHEETS & GOOGLE SHEETS ({savedSources.length})
            </Text>

            {savedSources.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
                <Globe size={36} color={colors.textMuted} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Saved Sources Yet</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  When you import Google Sheets or Excel files, they will be saved here so you can re-sync, update links, or remove data anytime.
                </Text>
              </View>
            ) : (
              <View style={[styles.groupedCard, { backgroundColor: cardBg, borderColor }]}>
                {savedSources.map((source, index) => {
                  const isSyncing = syncingId === source.id;
                  const isLast = index === savedSources.length - 1;

                  return (
                    <React.Fragment key={source.id}>
                      <View style={styles.sourceRow}>
                        <View
                          style={[
                            styles.sourceIconBox,
                            { backgroundColor: source.type === 'sheet' ? 'rgba(52, 199, 89, 0.15)' : 'rgba(0, 122, 255, 0.15)' },
                          ]}
                        >
                          {source.type === 'sheet' ? (
                            <Globe size={18} color="#34C759" />
                          ) : (
                            <FileSpreadsheet size={18} color="#007AFF" />
                          )}
                        </View>

                        <View style={styles.sourceInfo}>
                          <Text numberOfLines={1} style={[styles.sourceName, { color: colors.textPrimary }]}>
                            {source.name}
                          </Text>
                          {source.urlOrUri ? (
                            <Text numberOfLines={1} style={[styles.sourceUrl, { color: colors.textMuted }]}>
                              {source.urlOrUri}
                            </Text>
                          ) : null}
                          <Text style={[styles.sourceMeta, { color: colors.textSecondary }]}>
                            {source.importedCount || 0} contacts • Synced{' '}
                            {new Date(source.lastSyncedAt || source.createdAt).toLocaleDateString()}
                          </Text>
                        </View>

                        <View style={styles.sourceActions}>
                          {source.type === 'sheet' && (
                            <TouchableOpacity
                              activeOpacity={0.65}
                              onPress={() => handleSyncSource(source)}
                              disabled={isSyncing}
                              style={styles.iconBtn}
                            >
                              {isSyncing ? (
                                <ActivityIndicator size="small" color={colors.accent} />
                              ) : (
                                <RefreshCw size={17} color={colors.accent} />
                              )}
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            activeOpacity={0.65}
                            onPress={() => handleOpenEdit(source)}
                            style={styles.iconBtn}
                          >
                            <Edit3 size={17} color={colors.textSecondary} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.65}
                            onPress={() => handlePromptDelete(source)}
                            style={styles.iconBtn}
                          >
                            <Trash2 size={17} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {!isLast && <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />}
                    </React.Fragment>
                  );
                })}
              </View>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>

          {/* Edit Source Modal Sub-dialog */}
          {editingSource.visible && (
            <Modal visible={true} transparent animationType="fade">
              <View style={styles.editBackdrop}>
                <View style={[styles.editCard, { backgroundColor: cardBg, borderColor }]}>
                  <Text style={[styles.editTitle, { color: colors.textPrimary }]}>Edit Saved Source</Text>

                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Source Name</Text>
                  <TextInput
                    value={editingSource.name}
                    onChangeText={(val) => setEditingSource((prev) => ({ ...prev, name: val }))}
                    style={[styles.inputField, { color: colors.textPrimary, borderColor }]}
                    placeholder="Source Label"
                    placeholderTextColor={colors.textMuted}
                  />

                  {editingSource.source?.type === 'sheet' && (
                    <>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                        Google Sheet URL
                      </Text>
                      <TextInput
                        value={editingSource.url}
                        onChangeText={(val) => setEditingSource((prev) => ({ ...prev, url: val }))}
                        style={[styles.inputField, { color: colors.textPrimary, borderColor }]}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="none"
                      />
                    </>
                  )}

                  <View style={styles.editBtnRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setEditingSource({ visible: false, source: null, name: '', url: '' })}
                      style={[styles.modalBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
                    >
                      <Text style={[styles.modalBtnText, { color: colors.textPrimary }]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={handleSaveEdit}
                      style={[styles.modalBtn, { backgroundColor: colors.accent }]}
                    >
                      <Text style={[styles.modalBtnText, { color: '#FFFFFF', fontWeight: '600' }]}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
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
  topActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  groupedCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  sourceIconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sourceInfo: {
    flex: 1,
    marginRight: 8,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  sourceUrl: {
    fontSize: 12,
    marginTop: 2,
  },
  sourceMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  sourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 7,
    borderRadius: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 62,
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  editCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  editBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalBtnText: {
    fontSize: 15,
  },
});
