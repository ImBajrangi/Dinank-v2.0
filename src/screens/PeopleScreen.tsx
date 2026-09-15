import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  RefreshControl,
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

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'family', label: 'Family' },
  { id: 'friend', label: 'Friends' },
  { id: 'love', label: 'Love' },
  { id: 'work', label: 'Work' },
];

export const PeopleScreen: React.FC<PeopleScreenProps> = ({
  onOpenAdd,
  onSelectBirthday,
  onOpenAIWish,
}) => {
  const { colors, isDark, calculatedBirthdays, refreshNotifications } = useBirthdays();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

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

  const filteredList = useMemo(() => {
    let result = [...calculatedBirthdays];

    if (activeCategory !== 'all') {
      result = result.filter((b) => b.relationship === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.notes?.toLowerCase().includes(q) ||
          b.relationship.toLowerCase().includes(q) ||
          b.phone?.toLowerCase().includes(q) ||
          b.parentPhone?.toLowerCase().includes(q) ||
          b.groupClass?.toLowerCase().includes(q) ||
          b.rollNo?.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [calculatedBirthdays, activeCategory, searchQuery]);

  const handleCategoryChange = (id: string) => {
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    setActiveCategory(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        {/* Apple Navigation Header */}
        <View style={styles.navBarRow}>
          <Text style={[styles.largeTitle, { color: colors.textPrimary }]}>People</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenAdd}
            style={[styles.addIconBtn, { backgroundColor: colors.accent }]}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

        {/* Apple iOS Segmented Control */}
        <View
          style={[
            styles.segmentedControl,
            { backgroundColor: isDark ? '#1C1C1E' : '#E5E5EA' },
          ]}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.7}
                onPress={() => handleCategoryChange(cat.id)}
                style={[
                  styles.segmentBtn,
                  isSelected && {
                    backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: isSelected ? colors.textPrimary : colors.textSecondary,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {filteredList.length} {filteredList.length === 1 ? 'CONTACT' : 'CONTACTS'}
          </Text>
        </View>
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
          { paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
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
  header: {
    paddingHorizontal: 16,
  },
  navBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  addIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  listContent: {
    paddingHorizontal: 16,
  },
});
