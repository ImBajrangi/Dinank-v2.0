import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  PanResponder,
  Share,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Share2,
  Check,
  CheckCircle2,
  Circle,
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { Birthday } from '../types/birthday';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose }) => {
  const { colors, isDark, birthdays, customCategories } = useBirthdays();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isColumnsExpanded, setIsColumnsExpanded] = useState(false);

  // Configurable export columns
  const [columns, setColumns] = useState<Record<string, boolean>>({
    name: true,
    birthDate: true,
    relationship: true,
    groupClass: true,
    section: true,
    session: true,
    rollNo: true,
    phone: true,
    parentPhone: true,
    email: true,
    notes: false,
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
      setSearchQuery('');
      setIsColumnsExpanded(false);
      // Select all by default
      setSelectedContactIds(new Set(birthdays.map((b) => b.id)));
    }
  }, [visible, birthdays]);

  // All category tabs
  const categoryTabs = useMemo(() => {
    const base = [
      { id: 'all', label: `All (${birthdays.length})` },
      { id: 'student', label: 'Students' },
      { id: 'family', label: 'Family' },
      { id: 'friend', label: 'Friends' },
      { id: 'work', label: 'Work' },
    ];
    const custom = (customCategories || []).map((cat) => ({
      id: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    }));
    return [...base, ...custom];
  }, [birthdays.length, customCategories]);

  // Filtered contacts based on selected category tab AND search query
  const filteredContacts = useMemo(() => {
    let result = birthdays;
    if (activeCategory !== 'all') {
      result = result.filter(
        (b) => (b.relationship || '').toLowerCase().trim() === activeCategory.toLowerCase().trim()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.groupClass?.toLowerCase().includes(q) ||
          b.section?.toLowerCase().includes(q) ||
          b.session?.toLowerCase().includes(q) ||
          b.rollNo?.toLowerCase().includes(q) ||
          b.phone?.includes(q) ||
          b.parentPhone?.includes(q) ||
          b.email?.toLowerCase().includes(q) ||
          b.notes?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [birthdays, activeCategory, searchQuery]);

  const toggleSelectAll = () => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(filteredContacts.map((b) => b.id)));
    }
  };

  const toggleContact = (id: string) => {
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

  const toggleColumn = (colId: string) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setColumns((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  const handleExecuteExport = async () => {
    const targets = birthdays.filter((b) => selectedContactIds.has(b.id));
    if (targets.length === 0) {
      Alert.alert('No Contacts Selected', 'Please select at least one contact to export.');
      return;
    }

    const activeCols = [
      { id: 'name', label: 'Name', get: (b: Birthday) => b.name },
      { id: 'birthDate', label: 'BirthDate', get: (b: Birthday) => b.birthDate },
      { id: 'relationship', label: 'Category / Relationship', get: (b: Birthday) => b.relationship },
      { id: 'groupClass', label: 'Class/Grade', get: (b: Birthday) => b.groupClass || '' },
      { id: 'section', label: 'Section', get: (b: Birthday) => b.section || '' },
      { id: 'session', label: 'Session', get: (b: Birthday) => b.session || '' },
      { id: 'rollNo', label: 'RollNo', get: (b: Birthday) => b.rollNo || '' },
      { id: 'phone', label: 'Phone', get: (b: Birthday) => b.phone || '' },
      { id: 'parentPhone', label: 'ParentPhone', get: (b: Birthday) => b.parentPhone || '' },
      { id: 'email', label: 'Email', get: (b: Birthday) => b.email || '' },
      { id: 'notes', label: 'Notes', get: (b: Birthday) => b.notes || '' },
    ].filter((c) => columns[c.id]);

    if (activeCols.length === 0) {
      Alert.alert('No Columns Selected', 'Please select at least one field/column to include.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const headers = activeCols.map((c) => c.label);
    const rows = targets.map((b) =>
      activeCols.map((c) => `"${(c.get(b) || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');

    try {
      await Share.share({
        title: 'Dinank_Contacts_Export.csv',
        message: csvContent,
      });
      onClose();
    } catch (e) {
      Alert.alert('Export Failed', 'Could not share CSV data.');
    }
  };

  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const screenBg = isDark ? '#000000' : '#F2F2F7';

  const COLUMN_DEFS = [
    { id: 'name', label: 'Name' },
    { id: 'birthDate', label: 'Date of Birth' },
    { id: 'relationship', label: 'Category / Relationship' },
    { id: 'groupClass', label: 'Class / Course' },
    { id: 'section', label: 'Section / Batch' },
    { id: 'session', label: 'Session' },
    { id: 'rollNo', label: 'Roll No' },
    { id: 'phone', label: 'Student Phone' },
    { id: 'parentPhone', label: 'Parent Phone' },
    { id: 'email', label: 'Email' },
    { id: 'notes', label: 'Notes / Remarks' },
  ];

  const activeColumnsCount = Object.values(columns).filter(Boolean).length;
  const webNoOutline =
    Platform.OS === 'web' ? ({ outlineStyle: 'none', outline: 'none' } as any) : {};

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
          {/* Grabber */}
          <View style={styles.grabberWrapper} {...panResponder.panHandlers}>
            <View style={[styles.grabber, { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' }]} />
          </View>

          {/* Navigation Bar */}
          <View style={styles.navHeader} {...panResponder.panHandlers}>
            <TouchableOpacity activeOpacity={0.7} onPress={onClose} style={styles.navBtn}>
              <Text style={[styles.cancelText, { color: colors.accent }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Export Contacts</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={handleExecuteExport} style={styles.navBtn}>
              <Text style={[styles.doneText, { color: colors.accent }]}>Export</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Section 1: Collapsible Export Columns Header (Compact by default) */}
            <View style={[styles.compactColumnsCard, { backgroundColor: cardBg, borderColor }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch (e) {}
                  setIsColumnsExpanded(!isColumnsExpanded);
                }}
                style={styles.compactColumnsHeader}
              >
                <View style={styles.compactColumnsLeft}>
                  <View style={[styles.columnsIconBadge, { backgroundColor: colors.accentLight }]}>
                    <SlidersHorizontal size={14} color={colors.accent} />
                  </View>
                  <View>
                    <Text style={[styles.compactColumnsTitle, { color: colors.textPrimary }]}>
                      Export Columns
                    </Text>
                    <Text style={[styles.compactColumnsSub, { color: colors.textSecondary }]}>
                      {activeColumnsCount} of {COLUMN_DEFS.length} fields included
                    </Text>
                  </View>
                </View>

                <View style={[styles.toggleExpandPill, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                  <Text style={[styles.toggleExpandText, { color: colors.accent }]}>
                    {isColumnsExpanded ? 'Hide' : 'Customize'}
                  </Text>
                  {isColumnsExpanded ? (
                    <ChevronUp size={14} color={colors.accent} style={{ marginLeft: 2 }} />
                  ) : (
                    <ChevronDown size={14} color={colors.accent} style={{ marginLeft: 2 }} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Expanded Columns Grid */}
              {isColumnsExpanded && (
                <View style={[styles.chipGrid, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor }]}>
                  {COLUMN_DEFS.map((col) => {
                    const isChecked = !!columns[col.id];
                    return (
                      <TouchableOpacity
                        key={col.id}
                        activeOpacity={0.7}
                        onPress={() => toggleColumn(col.id)}
                        style={[
                          styles.columnPill,
                          {
                            backgroundColor: isChecked ? colors.accent : isDark ? '#2C2C2E' : '#E5E5EA',
                          },
                        ]}
                      >
                        {isChecked && <Check size={13} color="#FFFFFF" style={{ marginRight: 4 }} />}
                        <Text
                          style={[
                            styles.columnPillText,
                            { color: isChecked ? '#FFFFFF' : colors.textPrimary },
                          ]}
                        >
                          {col.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Candidate Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' }]}>
              <Search size={15} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search candidate name, class, roll no..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.textPrimary }, webNoOutline]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={15} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Section 2: Filter by Category (Horizontal Scrollable Pills for Standard + Custom) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {categoryTabs.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch (e) {}
                      setActiveCategory(tab.id);
                    }}
                    style={[
                      styles.filterTab,
                      {
                        backgroundColor: isActive
                          ? colors.accent
                          : isDark
                          ? '#1C1C1E'
                          : '#E5E5EA',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        {
                          color: isActive ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: isActive ? '600' : '400',
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Section 3: Select Individual Contacts */}
            <View style={styles.listHeaderRow}>
              <Text style={[styles.sectionHeader, { color: colors.textSecondary, marginBottom: 0 }]}>
                RECORDS TO EXPORT ({selectedContactIds.size} / {filteredContacts.length})
              </Text>
              <TouchableOpacity activeOpacity={0.7} onPress={toggleSelectAll}>
                <Text style={[styles.toggleAllText, { color: colors.accent }]}>
                  {selectedContactIds.size === filteredContacts.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.groupedCard, { backgroundColor: cardBg, borderColor }]}>
              {filteredContacts.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {searchQuery ? `No candidates matching "${searchQuery}"` : 'No contacts in this category'}
                  </Text>
                </View>
              ) : (
                filteredContacts.map((contact, index) => {
                  const isSelected = selectedContactIds.has(contact.id);
                  const isLast = index === filteredContacts.length - 1;

                  return (
                    <React.Fragment key={contact.id}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleContact(contact.id)}
                        style={styles.contactRow}
                      >
                        <View style={styles.checkCircle}>
                          {isSelected ? (
                            <CheckCircle2 size={20} color={colors.accent} />
                          ) : (
                            <Circle size={20} color={colors.textMuted} />
                          )}
                        </View>

                        <View style={styles.contactInfo}>
                          <Text numberOfLines={1} style={[styles.contactName, { color: colors.textPrimary }]}>
                            {contact.name}
                          </Text>
                          <Text numberOfLines={1} style={[styles.contactSub, { color: colors.textSecondary }]}>
                            {contact.birthDate}
                            {contact.relationship ? ` • ${contact.relationship}` : ''}
                            {contact.groupClass ? ` • ${contact.groupClass}` : ''}
                            {contact.section ? ` (${contact.section})` : ''}
                            {contact.session ? ` • ${contact.session}` : ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {!isLast && <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />}
                    </React.Fragment>
                  );
                })
              )}
            </View>

            {/* Bottom Floating Export Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleExecuteExport}
              style={[styles.exportMainBtn, { backgroundColor: colors.accent }]}
            >
              <Share2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.exportMainBtnText}>
                Share & Export {selectedContactIds.size} Contacts
              </Text>
            </TouchableOpacity>

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
    height: '90%',
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
  navBtn: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 17,
    letterSpacing: -0.4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
    textAlign: 'right',
  },
  body: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  compactColumnsCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 12,
  },
  compactColumnsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  compactColumnsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  columnsIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactColumnsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  compactColumnsSub: {
    fontSize: 12,
    marginTop: 1,
  },
  toggleExpandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  toggleExpandText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
  },
  columnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  columnPillText: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  filterTabText: {
    fontSize: 13,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  groupedCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  toggleAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkCircle: {
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  contactSub: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 46,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  exportMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 18,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)' },
      default: { elevation: 3 },
    }),
  },
  exportMainBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
