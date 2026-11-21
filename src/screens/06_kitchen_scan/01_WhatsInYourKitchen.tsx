import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { BottomNavigation, NavTab } from '../../components/navigation/BottomNavigation';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { KitchenPassModal } from '../../components/common/KitchenPassModal';
import { TactileToast } from '../../components/common/TactileToast';
import { preferencesStore } from '../../services/preferencesStore';
import { pantryService } from '../../services/api/pantryService';
import { getCurrentTimeOfDay } from '../../services/api/rollService';
import { KitchenAtmosphere } from '../../components/signature/KitchenAtmosphere';
import { RegionalMamaAvatar } from '../../components/signature/RegionalMamaAvatar';

type Props = NativeStackScreenProps<RootStackParamList, 'WhatsInYourKitchen'>;

interface CategoryStaples {
  category: string;
  items: string[];
}

const STAPLE_CATEGORIES: CategoryStaples[] = [
  {
    category: 'Produce',
    items: ['Tomatoes', 'Onions', 'Plantains', 'Garlic', 'Scotch Bonnet', 'Spinach', 'Potatoes'],
  },
  {
    category: 'Proteins',
    items: ['Eggs', 'Chicken', 'Cheddar', 'Tuna', 'Black Beans', 'Sausage'],
  },
  {
    category: 'Carbs',
    items: ['Rice', 'Bread', 'Pasta', 'Indomie', 'Yam', 'Oats'],
  },
  {
    category: 'Seasonings',
    items: ['Cooking Oil', 'Curry Powder', 'Thyme', 'Bouillon Cube', 'Soy Sauce', 'Black Pepper'],
  },
];

const ALL_DEFAULT_STAPLES = STAPLE_CATEGORIES.flatMap((c) => c.items);

export const WhatsInYourKitchen: React.FC<Props> = ({ navigation }) => {
  const { isInsideTabs, setActiveTab } = useTabNavigation();
  const [kitchenItems, setKitchenItems] = useState<string[]>(() => {
    const cached = pantryService.getCachedPantry();
    return cached.map((i) => i.name);
  });
  const [customItemInput, setCustomItemInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const pass = preferencesStore.getKitchenPass();

  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start();

    const unsub = pantryService.subscribe((items) => {
      setKitchenItems(items.map((i) => i.name));
    });

    pantryService
      .fetchAll()
      .then((dbItems) => {
        if (Array.isArray(dbItems)) {
          setKitchenItems(dbItems.map((i) => i.name));
        }
      })
      .catch(() => {});

    return unsub;
  }, [contentFade, contentY]);

  const toggleItem = (item: string) => {
    Haptics.selectionAsync().catch(() => {});

    setKitchenItems((prev) => {
      const updated = prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item];
      pantryService.syncItems(updated.map((name) => ({ name, category: 'pantryStaples' })));
      return updated;
    });
  };

  const handleAddCustomItem = () => {
    const trimmed = customItemInput.trim();
    if (!trimmed) return;

    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const alreadyExists = kitchenItems.some(
      (i) => i.toLowerCase() === formatted.toLowerCase()
    );

    if (alreadyExists) {
      setToastMessage(`${formatted} is already in your kitchen`);
      setCustomItemInput('');
      Keyboard.dismiss();
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const updated = [formatted, ...kitchenItems];
    setKitchenItems(updated);
    pantryService.syncItems(updated.map((name) => ({ name, category: 'pantryStaples' })));
    setToastMessage(`Added ${formatted}`);
    setCustomItemInput('');
    Keyboard.dismiss();
  };

  const handleClearKitchen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setKitchenItems([]);
    pantryService.syncItems([]);
    setToastMessage('Kitchen cleared');
  };

  const displayedItems = useMemo(() => {
    if (activeCategory === 'All') {
      return Array.from(new Set([...kitchenItems, ...ALL_DEFAULT_STAPLES]));
    }
    const cat = STAPLE_CATEGORIES.find((c) => c.category === activeCategory);
    return cat ? cat.items : ALL_DEFAULT_STAPLES;
  }, [activeCategory, kitchenItems]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KitchenAtmosphere period={getCurrentTimeOfDay()} />

      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.brandGroup}>
          <RegionalMamaAvatar
            countryCode={pass.country}
            cuisineAnchor={pass.cuisineAnchor}
            size={34}
          />
          <Text style={styles.brandTitle}>Mama</Text>
          <Text style={styles.periodPillText}>Kitchen</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.countPill}>
            <Ionicons name="basket-outline" size={13} color={colors.primary} />
            <Text style={styles.countPillText}>
              {kitchenItems.length > 0 ? `${kitchenItems.length} in house` : 'Empty kitchen'}
            </Text>
          </View>

          {kitchenItems.length > 0 && (
            <TouchableOpacity
              style={styles.countPill}
              onPress={handleClearKitchen}
              activeOpacity={0.75}
            >
              <Text style={styles.countPillText}>Clear</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.profileBadge}
            onPress={() => setPassModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={15} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.animatedContainer,
              { opacity: contentFade, transform: [{ translateY: contentY }] },
            ]}
          >
            {/* UNIFIED KITCHEN INGREDIENTS STUDIO */}
            <View style={styles.pantryCard}>
              {/* Quick Add Input */}
              <View style={styles.inputRow}>
                <Ionicons name="search-outline" size={16} color={colors.text.muted} />
                <TextInput
                  style={styles.customTextInput}
                  placeholder="Add anything in your house (e.g. Sardines, Gari)..."
                  placeholderTextColor={colors.text.muted}
                  value={customItemInput}
                  onChangeText={setCustomItemInput}
                  onSubmitEditing={handleAddCustomItem}
                  returnKeyType="done"
                />
                {customItemInput.trim().length > 0 && (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={handleAddCustomItem}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Filter Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {['All', ...STAPLE_CATEGORIES.map((c) => c.category)].map((catName) => {
                  const isActive = activeCategory === catName;
                  return (
                    <TouchableOpacity
                      key={catName}
                      style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setActiveCategory(catName);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.categoryTabText,
                          isActive && styles.categoryTabTextActive,
                        ]}
                      >
                        {catName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Unified Tactile Ingredient Grid */}
              <View style={styles.chipsGrid}>
                {displayedItems.map((item) => {
                  const isInKitchen = kitchenItems.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.stapleChip,
                        isInKitchen && styles.stapleChipActive,
                      ]}
                      onPress={() => toggleItem(item)}
                      activeOpacity={0.78}
                    >
                      <Ionicons
                        name={isInKitchen ? 'checkmark-circle' : 'add-outline'}
                        size={15}
                        color={isInKitchen ? '#FFFFFF' : colors.primary}
                      />
                      <Text
                        style={[
                          styles.stapleChipText,
                          isInKitchen && styles.stapleChipTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Kitchen Pass Modal */}
      <KitchenPassModal
        visible={passModalVisible}
        onClose={() => setPassModalVisible(false)}
      />

      {/* Tactile Toast Notification */}
      <TactileToast
        message={toastMessage || ''}
        visible={!!toastMessage}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Bottom Tab Navigation */}
      {!isInsideTabs && (
        <BottomNavigation
          activeTab="kitchen"
          onTabChange={(tab: NavTab) => {
            if (isInsideTabs) {
              setActiveTab(tab);
            } else {
              if (tab === 'edit') navigation.navigate('YourDailyEdit');
              if (tab === 'discover') navigation.navigate('DiscoverYourNextMeal');
              if (tab === 'collection') navigation.navigate('YourCollection');
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  periodPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3EFE6',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  profileBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3EFE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
  },
  animatedContainer: {
    gap: 16,
  },
  pantryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
    shadowColor: '#181512',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6F3EC',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  customTextInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text.primary,
  },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: {
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F6F3EC',
  },
  categoryTabActive: {
    backgroundColor: '#1E211B',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stapleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F6F3EC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  stapleChipActive: {
    backgroundColor: colors.primary,
  },
  stapleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stapleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default WhatsInYourKitchen;
