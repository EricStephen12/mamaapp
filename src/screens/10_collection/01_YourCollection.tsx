import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { PrimaryButton, TactileToast } from '../../components/common';
import { BottomNavigation, NavTab } from '../../components/navigation/BottomNavigation';
import { MamaCharacter, MamaPose } from '../../components/common/MamaCharacter';
import { CountryCurrencyModal } from '../../components/common/CountryCurrencyModal';
import {
  preferencesStore,
  UserKitchenPass,
  convertMealCost,
} from '../../services/preferencesStore';
import { MamaDialogueService } from '../../services/mamaDialogueService';
import { apiClient } from '../../services/api/client';

import {
  SavedMealCard,
  SavedMealItem,
} from './components/SavedMealCard';
import {
  CollectionFilters,
  CollectionFilterType,
} from './components/CollectionFilters';
import { TasteLearningCard } from './components/TasteLearningCard';
import { YourEssentialsSection } from './components/YourEssentialsSection';

type Props = NativeStackScreenProps<RootStackParamList, 'YourCollection'>;

interface BaseMealEntry {
  id: string;
  title: string;
  type: 'home' | 'eating_out';
  cookTimeOrDistance: string;
  baseCostUsd: number;
  imageUrl: string;
  targetScreen: 'AtHomeMealDetails' | 'EatingOutMealDetails';
  steps?: string[];
  ingredients?: { name: string; amount: string }[];
  spotName?: string;
  vibe?: string;
}

const DEFAULT_SAVED_MEALS: BaseMealEntry[] = [
  {
    id: 'save-1',
    title: 'Lemon chickpea & couscous bowl',
    type: 'home',
    cookTimeOrDistance: '20 MIN',
    baseCostUsd: 2.8,
    imageUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    targetScreen: 'AtHomeMealDetails',
    steps: [
      'Toast couscous with olive oil in a skillet for 2 minutes.',
      'Steam couscous in hot broth for 5 minutes.',
      'Toss chickpeas with fresh lemon, cumin, and sea salt.',
      'Fluff couscous, fold in seasoned chickpeas, and serve warm.',
    ],
    ingredients: [
      { name: 'Couscous', amount: '1 cup' },
      { name: 'Chickpeas', amount: '1 can' },
      { name: 'Lemon & olive oil', amount: '2 tbsp' },
    ],
  },
  {
    id: 'save-2',
    title: 'Roasted veg & hummus pita',
    type: 'eating_out',
    cookTimeOrDistance: '10 MIN WALK',
    baseCostUsd: 8.5,
    imageUrl:
      'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
    targetScreen: 'EatingOutMealDetails',
    spotName: 'Greenery Fresh Deli',
    vibe: 'Warm pita packed with roasted seasonal veggies and house tahini.',
  },
  {
    id: 'save-3',
    title: 'Tomato & white bean pasta',
    type: 'home',
    cookTimeOrDistance: '25 MIN',
    baseCostUsd: 2.4,
    imageUrl:
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    targetScreen: 'AtHomeMealDetails',
    steps: [
      'Boil pasta in salted water until al dente.',
      'Simmer cannellini beans and crushed tomatoes with garlic.',
      'Combine pasta directly into the sauce and swirl with olive oil.',
    ],
    ingredients: [
      { name: 'Pasta of choice', amount: '150g' },
      { name: 'White beans', amount: '1 can' },
      { name: 'Crushed tomatoes', amount: '1 can' },
    ],
  },
  {
    id: 'save-4',
    title: 'Soft eggs & spinach toast',
    type: 'home',
    cookTimeOrDistance: '10 MIN',
    baseCostUsd: 1.9,
    imageUrl:
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    targetScreen: 'AtHomeMealDetails',
    steps: [
      'Toast sourdough or bread in butter until golden.',
      'Wilt fresh spinach in hot skillet for 1 minute.',
      'Cook eggs to soft medium and slide onto warm spinach toast.',
    ],
    ingredients: [
      { name: 'Crusty bread', amount: '2 slices' },
      { name: 'Fresh eggs', amount: '2 large' },
      { name: 'Baby spinach', amount: 'Handful' },
    ],
  },
  {
    id: 'disc-5',
    title: 'Sizzled pepper eggs & sweet plantains',
    type: 'home',
    cookTimeOrDistance: '10 MIN',
    baseCostUsd: 1.9,
    imageUrl:
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    targetScreen: 'AtHomeMealDetails',
    steps: [
      'Slice ripe plantains diagonally and pan-fry in hot oil until golden.',
      'In the same pan, saute diced red onions and scotch bonnet / chili.',
      'Pour in seasoned beaten eggs and fold gently into soft curds.',
    ],
    ingredients: [
      { name: 'Ripe sweet plantain', amount: '1 whole' },
      { name: 'Fresh eggs', amount: '2 large' },
      { name: 'Red onion & pepper', amount: '1 small diced' },
    ],
  },
];

export const YourCollection: React.FC<Props> = ({ navigation }) => {
  const [kitchenPass, setKitchenPass] = useState<UserKitchenPass>(
    preferencesStore.getKitchenPass()
  );
  const [selectedFilter, setSelectedFilter] =
    useState<CollectionFilterType>('all');
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<
    { label: string; onPress: () => void } | undefined
  >(undefined);

  // Real data from API with default fallback
  const [apiMeals, setApiMeals] = useState<BaseMealEntry[]>(DEFAULT_SAVED_MEALS);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadMeals = async () => {
      try {
        const meals = await apiClient<any[]>('/api/saved-meals');
        if (!isMounted) return;
        if (Array.isArray(meals) && meals.length > 0) {
          const mapped: BaseMealEntry[] = meals.map((m) => ({
            id: m.id || m.mealId,
            title: m.title,
            type: m.type === 'eating_out' ? 'eating_out' : 'home',
            cookTimeOrDistance: m.cookTime || '15 MIN',
            baseCostUsd: typeof m.costNumeric === 'number' ? m.costNumeric : 2.5,
            imageUrl: m.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
            targetScreen: m.type === 'eating_out' ? 'EatingOutMealDetails' : 'AtHomeMealDetails',
            steps: m.recipeSteps,
            ingredients: Array.isArray(m.ingredients) ? m.ingredients : undefined,
            spotName: m.spotName,
            vibe: m.vibe,
          }));
          setApiMeals(mapped);
        }
      } catch {
        // Fallback remains active
      } finally {
        if (isMounted) setLoadingMeals(false);
      }
    };

    loadMeals();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const meals = await apiClient<any[]>('/api/saved-meals');
      if (Array.isArray(meals) && meals.length > 0) {
        const mapped: BaseMealEntry[] = meals.map((m) => ({
          id: m.id || m.mealId,
          title: m.title,
          type: m.type === 'eating_out' ? 'eating_out' : 'home',
          cookTimeOrDistance: m.cookTime || '15 MIN',
          baseCostUsd: typeof m.costNumeric === 'number' ? m.costNumeric : 2.5,
          imageUrl: m.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
          targetScreen: m.type === 'eating_out' ? 'EatingOutMealDetails' : 'AtHomeMealDetails',
          steps: m.recipeSteps,
          ingredients: Array.isArray(m.ingredients) ? m.ingredients : undefined,
          spotName: m.spotName,
          vibe: m.vibe,
        }));
        setApiMeals(mapped);
      }
    } catch {
      // Keep active list on network error
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Mama voice interaction
  const [mamaQuote, setMamaQuote] = useState<string>(
    "Look at your collection! Every meal here was chosen by you."
  );
  const [mamaPose, setMamaPose] = useState<MamaPose>('delighted');
  const mamaBounceAnim = useRef(new Animated.Value(1)).current;

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const unsubscribe = preferencesStore.subscribe((pass) => {
      setKitchenPass(pass);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(contentY, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const triggerMamaBounce = () => {
    Animated.sequence([
      Animated.timing(mamaBounceAnim, {
        toValue: 0.94,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(mamaBounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTapMama = () => {
    triggerMamaBounce();
    const interactive = MamaDialogueService.getRandomInteractiveLine(kitchenPass);
    setMamaQuote(interactive.quote);
    setMamaPose(interactive.pose);
  };

  // Build active saved meals list from API (real data) with currency localization
  const activeEntries = useMemo(() => {
    return apiMeals.filter((item) => !removedIds.includes(item.id));
  }, [apiMeals, removedIds]);

  const savedMeals: SavedMealItem[] = useMemo(() => {
    return activeEntries.map((item: BaseMealEntry) => {
      const localCost = convertMealCost(
        item.baseCostUsd,
        kitchenPass.currencyCode,
        kitchenPass.currencySymbol
      );
      const typeLabel =
        item.type === 'home'
          ? `AT HOME · ${item.cookTimeOrDistance}`
          : `EATING OUT · ${item.cookTimeOrDistance}`;

      return {
        id: item.id,
        title: item.title,
        type: item.type,
        typeLabel,
        cost: `${localCost} est. / ${item.type === 'home' ? 'serving' : 'meal'}`,
        imageUrl: item.imageUrl,
        targetScreen: item.targetScreen || (item.type === 'home' ? 'AtHomeMealDetails' : 'EatingOutMealDetails'),
      };
    });
  }, [activeEntries, kitchenPass.currencyCode, kitchenPass.currencySymbol]);

  const counts = {
    all: savedMeals.length,
    home: savedMeals.filter((m) => m.type === 'home').length,
    eating_out: savedMeals.filter((m) => m.type === 'eating_out').length,
  };

  const filteredMeals = savedMeals.filter((meal) => {
    if (selectedFilter === 'all') return true;
    return meal.type === selectedFilter;
  });

  const handleUnsave = (item: SavedMealItem) => {
    triggerMamaBounce();
    setRemovedIds((prev) => [...prev, item.id]);
    setMamaQuote(`Removed "${item.title}". No problem, keep only what you love!`);
    setMamaPose('writing');
    setToastMessage(`Removed "${item.title}"`);
    setToastAction({
      label: 'Undo',
      onPress: () => {
        setRemovedIds((prev) => prev.filter((id) => id !== item.id));
        setMamaQuote("Restored! It's right back in your collection.");
        setMamaPose('delighted');
      },
    });
  };

  const handleOpenMeal = (item: SavedMealItem) => {
    const raw = activeEntries.find((e) => e.id === item.id);
    if (!raw) return;

    if (raw.type === 'eating_out') {
      navigation.navigate('EatingOutMealDetails', {
        spotName: raw.spotName || 'Local Kitchen Pick',
        dishName: raw.title,
        distance: raw.cookTimeOrDistance,
        price: item.cost.split(' est.')[0] || '$8.50',
        vibe: raw.vibe || 'Cozy neighborhood kitchen within your budget.',
        image: raw.imageUrl,
      });
    } else {
      navigation.navigate('AtHomeMealDetails', {
        id: raw.id,
        title: raw.title,
        subtitle: 'From your personal recipe collection.',
        cookTime: raw.cookTimeOrDistance,
        gear: '1 Pan & Skillet',
        estCost: item.cost.split(' est.')[0] || '$2.50',
        costNumeric: raw.baseCostUsd,
        image: raw.imageUrl,
        steps: raw.steps || [
          'Warm your skillet on medium heat with cooking oil.',
          'Cook all ingredients until golden and fragrant.',
          'Plate warm and enjoy your homemade comfort.',
        ],
        ingredients: raw.ingredients || [
          { name: 'Core staple', amount: '1 portion' },
          { name: 'Seasonings', amount: 'To taste' },
        ],
      });
    }
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'edit') {
      navigation.navigate('YourDailyEdit');
    } else if (tab === 'discover') {
      navigation.navigate('DiscoverYourNextMeal');
    }
  };

  // Group filtered meals in pairs for 2-column grid
  const mealPairs: SavedMealItem[][] = [];
  for (let i = 0; i < filteredMeals.length; i += 2) {
    mealPairs.push(filteredMeals.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* Screen Masthead with Country Switcher */}
      <View style={styles.masthead}>
        <View style={styles.brandGroup}>
          <Ionicons name="leaf-outline" size={20} color={colors.primary} />
          <Text style={styles.brandTitle}>MAMA KITCHEN</Text>
        </View>

        <TouchableOpacity
          style={styles.countryBadge}
          onPress={() => setCountryModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.countryBadgeFlag}>{kitchenPass.country}</Text>
          <Text style={styles.countryBadgeCurrency}>{kitchenPass.currencySymbol}</Text>
          <Feather name="chevron-down" size={13} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: contentFade,
              transform: [{ translateY: contentY }],
            },
          ]}
        >
          {/* Section 1: Collection Introduction */}
          <View style={styles.introBlock}>
            <Text style={styles.eyebrow}>
              GOOD IDEAS, KEPT CLOSE · {kitchenPass.countryName.toUpperCase()}
            </Text>
            <Text style={styles.heading}>Your collection.</Text>
            <Text style={styles.supportingCopy}>
              Saved meals, ready when you are.
            </Text>
          </View>

          {/* Section 2: Mama Live Voice Coaching Banner */}
          <TouchableOpacity
            style={styles.mamaGreetingCard}
            onPress={handleTapMama}
            activeOpacity={0.85}
          >
            <MamaCharacter
              pose={mamaPose}
              size={54}
              isSpeaking={true}
              onPress={handleTapMama}
            />

            <View style={styles.mamaBubbleWrap}>
              <View style={styles.mamaBadgeRow}>
                <Text style={styles.mamaName}>Mama</Text>
                <View style={styles.tapPill}>
                  <Ionicons name="chatbubble-ellipses-outline" size={11} color={colors.primary} />
                  <Text style={styles.tapPillText}>Tap to chat</Text>
                </View>
              </View>

              <Animated.View style={{ transform: [{ scale: mamaBounceAnim }] }}>
                <Text style={styles.mamaBubbleText}>&ldquo;{mamaQuote}&rdquo;</Text>
              </Animated.View>
            </View>
          </TouchableOpacity>

          {/* Section 3: Collection Filter Chips */}
          <CollectionFilters
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            counts={counts}
          />

          {loadingMeals && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          {/* Section 4: Saved Meals Grid */}
          <View style={styles.savedMealsContainer}>
            {mealPairs.length > 0 ? (
              mealPairs.map((pair, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.mealRow}>
                  {pair.map((meal) => (
                    <SavedMealCard
                      key={meal.id}
                      item={meal}
                      onPress={() => handleOpenMeal(meal)}
                      onUnsave={() => handleUnsave(meal)}
                    />
                  ))}
                  {/* Empty placeholder spacer if uneven row */}
                  {pair.length === 1 && <View style={styles.spacer} />}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="bookmark-outline"
                  size={36}
                  color={colors.text.secondary}
                />
                <Text style={styles.emptyTitle}>No meals saved in this filter</Text>
                <Text style={styles.emptySubtitle}>
                  Explore meals and tap save to keep them handy for later.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Section 5: Taste Learning Card */}
          <TasteLearningCard />

          {/* Section 6: Profile Essentials */}
          <YourEssentialsSection
            onEdit={() => navigation.navigate('MakeItYours')}
          />

          {/* Section 7: Action Button */}
          <PrimaryButton
            title="Discover more meals"
            onPress={() => navigation.navigate('DiscoverYourNextMeal')}
          />
        </Animated.View>
      </ScrollView>

      {/* Country & Currency Switcher Modal */}
      <CountryCurrencyModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
      />

      {/* Floating In-App Toast */}
      <TactileToast
        visible={!!toastMessage}
        message={toastMessage || ''}
        actionLabel={toastAction?.label}
        onAction={toastAction?.onPress}
        onDismiss={() => {
          setToastMessage(null);
          setToastAction(undefined);
        }}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="collection"
        onTabChange={handleTabChange}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  masthead: {
    height: 56,
    paddingHorizontal: 24,
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
    fontSize: 24,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryBadgeFlag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  countryBadgeCurrency: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  animatedContainer: {
    gap: 20,
  },
  introBlock: {
    gap: 6,
  },
  eyebrow: {
    fontSize: typography.fontSize.label,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 40,
    lineHeight: 44,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
  },
  supportingCopy: {
    fontSize: typography.fontSize.sub,
    lineHeight: 20,
    color: colors.text.secondary,
  },

  // Mama Live Voice Coaching Card
  mamaGreetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.snow100,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  mamaBubbleWrap: {
    flex: 1,
    gap: 4,
  },
  mamaBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mamaName: {
    fontSize: 12,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.linen100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tapPillText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
  },
  mamaBubbleText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    fontStyle: 'italic',
    color: colors.text.primary,
  },

  savedMealsContainer: {
    gap: 24,
    width: '100%',
  },
  mealRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  spacer: {
    flex: 1,
  },
  emptyState: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.snow100,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 18,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },
  loadingWrap: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default YourCollection;
