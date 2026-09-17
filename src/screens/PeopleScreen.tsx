import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  RefreshControl,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Plus } from 'lucide-react-native';
import { useBirthdays } from '../context/BirthdayContext';
import { BirthdayCard } from '../components/BirthdayCard';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { CalculatedBirthday } from '../types/birthday';

interface PeopleScreenProps {
  onOpenAdd: () => void;
  onSelectBirthday: (bday: CalculatedBirthday) => void;
  onOpenAIWish: (bday: CalculatedBirthday) => void;
}

export const PeopleScreen: React.FC<PeopleScreenProps> = ({
  onOpenAdd,
  onSelectBirthday,
  onOpenAIWish,
}) => {
  const { colors, isDark, calculatedBirthdays, customCategories, refreshNotifications } =
    useBirthdays();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Apple-style collapsible top bar animation
  const headerAnim = useRef(new Animated.Value(1)).current; // 1 = fully open, 0 = collapsed
  const lastScrollY = useRef(0);
  const isHeaderHidden = useRef(false);

  const categories = useMemo(() => {
    const base = [
      { id: 'all', label: 'All' },
      { id: 'student', label: 'Students' },
      { id: 'family', label: 'Family' },
      { id: 'friend', label: 'Friends' },
      { id: 'work', label: 'Work' },
    ];
    const custom = (customCategories || []).map((c) => ({
      id: c,
      label: c.charAt(0).toUpperCase() + c.slice(1),
    }));
    return [...base, ...custom];
  }, [customCategories]);

  const onRefresh = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 20
  );

  // Available unique sessions and sections for student segregation
  const studentList = useMemo(() => {
    return calculatedBirthdays.filter((b) => (b.relationship || '').toLowerCase() === 'student');
  }, [calculatedBirthdays]);

  const availableSessions = useMemo(() => {
    const set = new Set<string>();
    studentList.forEach((b) => {
      if (b.session && b.session.trim()) set.add(b.session.trim());
    });
    return Array.from(set).sort();
  }, [studentList]);

  const availableSections = useMemo(() => {
    const set = new Set<string>();
    studentList.forEach((b) => {
      const cls = [b.groupClass, b.section ? `Sec ${b.section}` : null].filter(Boolean).join(' - ');
      if (cls.trim()) set.add(cls.trim());
    });
    return Array.from(set).sort();
  }, [studentList]);

  const filteredList = useMemo(() => {
    let result = [...calculatedBirthdays];

    if (activeCategory !== 'all') {
      result = result.filter(
        (b) => (b.relationship || '').toLowerCase().trim() === activeCategory.toLowerCase().trim()
      );
    }

    // Student segregation filters
    if (activeCategory === 'student') {
      if (selectedSession !== 'all') {
        result = result.filter((b) => b.session?.trim() === selectedSession);
      }
      if (selectedSection !== 'all') {
        result = result.filter((b) => {
          const cls = [b.groupClass, b.section ? `Sec ${b.section}` : null].filter(Boolean).join(' - ');
          return cls.trim() === selectedSection;
        });
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.notes?.toLowerCase().includes(q) ||
          b.relationship?.toLowerCase().includes(q) ||
          b.phone?.toLowerCase().includes(q) ||
          b.parentPhone?.toLowerCase().includes(q) ||
          b.groupClass?.toLowerCase().includes(q) ||
          b.section?.toLowerCase().includes(q) ||
          b.session?.toLowerCase().includes(q) ||
          b.rollNo?.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [calculatedBirthdays, activeCategory, selectedSession, selectedSection, searchQuery]);

  const handleCategoryChange = (id: string) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setActiveCategory(id);
    setSelectedSession('all');
    setSelectedSection('all');
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    // When near the top, always show header
    if (currentY <= 15) {
      if (isHeaderHidden.current) {
        isHeaderHidden.current = false;
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    } else if (diff > 12 && currentY > 50) {
      // User is scrolling down: collapse header to maximize content visibility
      if (!isHeaderHidden.current) {
        isHeaderHidden.current = true;
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: false,
        }).start();
      }
    } else if (diff < -12) {
      // User is scrolling up: reveal header smoothly
      if (isHeaderHidden.current) {
        isHeaderHidden.current = false;
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 240,
          useNativeDriver: false,
        }).start();
      }
    }
    lastScrollY.current = currentY;
  };

  // Interpolations for Apple HIG navigation bar & collapsible filter bar
  const collapsibleMaxHeight = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
  });

  const collapsibleOpacity = headerAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.2, 1],
  });

  const collapsibleTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const compactTitleOpacity = headerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const largeTitleOpacity = headerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.3, 1],
  });

  const borderBottomOpacity = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky Apple Top Header */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: topInset + 6,
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Apple Navigation Bar */}
        <View style={styles.navBarRow}>
          <View style={styles.titleWrapper}>
            <Animated.Text
              style={[
                styles.largeTitle,
                {
                  color: colors.textPrimary,
                  opacity: largeTitleOpacity,
                },
              ]}
              numberOfLines={1}
            >
              People
            </Animated.Text>
            {/* Inline compact title shown when header collapses */}
            <Animated.Text
              style={[
                styles.compactTitle,
                {
                  color: colors.textPrimary,
                  opacity: compactTitleOpacity,
                },
              ]}
              numberOfLines={1}
            >
              People
            </Animated.Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenAdd}
            style={[styles.addIconBtn, { backgroundColor: colors.accent }]}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Collapsible Search & Filters Area */}
        <Animated.View
          style={[
            styles.collapsibleArea,
            {
              maxHeight: collapsibleMaxHeight,
              opacity: collapsibleOpacity,
              transform: [{ translateY: collapsibleTranslateY }],
            },
          ]}
        >
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

          {/* Apple iOS Category Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isSelected = activeCategory.toLowerCase() === cat.id.toLowerCase();
              return (
                <TouchableOpacity
                  key={cat.id}
                  activeOpacity={0.7}
                  onPress={() => handleCategoryChange(cat.id)}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isSelected
                        ? colors.accent
                        : isDark
                        ? '#1C1C1E'
                        : '#E5E5EA',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      {
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Student Segregation Filters (Sessions & Sections) */}
          {activeCategory === 'student' && (availableSessions.length > 0 || availableSections.length > 0) && (
            <View style={styles.subFiltersContainer}>
              {availableSessions.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subFilterRow}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedSession('all')}
                    style={[
                      styles.subFilterChip,
                      {
                        backgroundColor:
                          selectedSession === 'all'
                            ? colors.accent
                            : isDark
                            ? '#2C2C2E'
                            : '#E5E5EA',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.subFilterText,
                        { color: selectedSession === 'all' ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      All Sessions
                    </Text>
                  </TouchableOpacity>

                  {availableSessions.map((sess) => (
                    <TouchableOpacity
                      key={sess}
                      activeOpacity={0.7}
                      onPress={() => setSelectedSession(sess === selectedSession ? 'all' : sess)}
                      style={[
                        styles.subFilterChip,
                        {
                          backgroundColor:
                            selectedSession === sess
                              ? colors.accent
                              : isDark
                              ? '#2C2C2E'
                              : '#E5E5EA',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subFilterText,
                          { color: selectedSession === sess ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {sess}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {availableSections.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.subFilterRow, { marginTop: 6 }]}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setSelectedSection('all')}
                    style={[
                      styles.subFilterChip,
                      {
                        backgroundColor:
                          selectedSection === 'all'
                            ? colors.accent
                            : isDark
                            ? '#2C2C2E'
                            : '#E5E5EA',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.subFilterText,
                        { color: selectedSection === 'all' ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      All Sections
                    </Text>
                  </TouchableOpacity>

                  {availableSections.map((sec) => (
                    <TouchableOpacity
                      key={sec}
                      activeOpacity={0.7}
                      onPress={() => setSelectedSection(sec === selectedSection ? 'all' : sec)}
                      style={[
                        styles.subFilterChip,
                        {
                          backgroundColor:
                            selectedSection === sec
                              ? colors.accent
                              : isDark
                              ? '#2C2C2E'
                              : '#E5E5EA',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.subFilterText,
                          { color: selectedSection === sec ? '#FFFFFF' : colors.textSecondary },
                        ]}
                      >
                        {sec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {filteredList.length} {filteredList.length === 1 ? 'CONTACT' : 'CONTACTS'}
            </Text>
          </View>
        </Animated.View>

        {/* Subtle separator hairline when collapsed */}
        <Animated.View
          style={[
            styles.separator,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              opacity: borderBottomOpacity,
            },
          ]}
        />
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BirthdayCard
            birthday={item}
            onPress={() => onSelectBirthday(item)}
            onWishPress={() => onOpenAIWish(item)}
          />
        )}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <EmptyState
            title="No Contacts"
            subtitle={
              searchQuery
                ? `No people matched "${searchQuery}".`
                : 'No birthdays in this category yet.'
            }
            onAction={onOpenAdd}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 100 + insets.bottom, paddingTop: 4 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={topInset + 40}
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    zIndex: 10,
  },
  navBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 4,
  },
  titleWrapper: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    height: 44,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    position: 'absolute',
    left: 0,
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
    position: 'absolute',
    left: 0,
  },
  addIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0, 122, 255, 0.35)' },
      default: { elevation: 3 },
    }),
  },
  collapsibleArea: {
    overflow: 'hidden',
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
  },
  categoryPillText: {
    fontSize: 13,
  },
  sectionHeaderRow: {
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  subFiltersContainer: {
    marginBottom: 10,
  },
  subFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  subFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
