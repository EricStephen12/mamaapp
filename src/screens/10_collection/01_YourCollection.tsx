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
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { TactileToast } from '../../components/common';
import { BottomNavigation, NavTab } from '../../components/navigation/BottomNavigation';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { CountryCurrencyModal } from '../../components/common/CountryCurrencyModal';
import { KitchenPassModal } from '../../components/common/KitchenPassModal';
import {
  preferencesStore,
  UserKitchenPass,
  convertMealCost,
} from '../../services/preferencesStore';
import { savedMealsService } from '../../services/api/savedMealsService';
import { MealImageService } from '../../services/mealImageService';
import { SavedMealCard, SavedMealItem } from './components/SavedMealCard';
import { RegionalMamaAvatar } from '../../components/signature/RegionalMamaAvatar';
import { MamaCharacter } from '../../components/common/MamaCharacter';
import * as Haptics from 'expo-haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'YourCollection'>;

interface BaseMealEntry {
  id: string;
  title: string;
  subtitle?: string;
  type: 'home' | 'eating_out';
  cookTimeOrDistance: string;
  baseCostUsd: number;
  imageUrl?: string;
  targetScreen: 'AtHomeMealDetails' | 'EatingOutMealDetails';
  steps?: string[];
  ingredients?: { name: string; amount: string }[];
  spotName?: string;
  vibe?: string;
}

export const YourCollection: React.FC<Props> = ({ navigation }) => {
  const { isInsideTabs, setActiveTab, setInjectedDailyMeal } = useTabNavigation();
  const [kitchenPass, setKitchenPass] = useState<UserKitchenPass>(
    preferencesStore.getKitchenPass()
  );
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real data from Neon DB
  const [apiMeals, setApiMeals] = useState<BaseMealEntry[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    const unsub = preferencesStore.subscribe((updated) => setKitchenPass(updated));
    return unsub;
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(contentY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentFade, contentY]);

  useEffect(() => {
    let isMounted = true;
    const unsub = savedMealsService.subscribe((meals) => {
      if (!isMounted) return;
      const mapped: BaseMealEntry[] = meals.map((m) => ({
        id: m.id || m.mealId,
        title: m.title,
        type: m.type === 'eating_out' ? 'eating_out' : 'home',
        cookTimeOrDistance: m.cookTime || '15 MIN',
        baseCostUsd: typeof m.costNumeric === 'number' ? m.costNumeric : 2.5,
        imageUrl: m.imageUrl || undefined,
        targetScreen: m.type === 'eating_out' ? 'EatingOutMealDetails' : 'AtHomeMealDetails',
        steps: m.recipeSteps,
        ingredients: Array.isArray(m.ingredients) ? m.ingredients : undefined,
        spotName: m.spotName || undefined,
        vibe: m.vibe || undefined,
      }));
      setApiMeals(mapped);
      setLoadingMeals(false);
    });

    savedMealsService.fetchAll();

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await savedMealsService.fetchAll();
    setRefreshing(false);
  }, []);

  // Active entries from savedMealsService
  const activeEntries = apiMeals;

  const savedMeals: SavedMealItem[] = useMemo(() => {
    const deckPhotos = MealImageService.getCarouselDeckImages(
      activeEntries.map((e) => ({ title: e.title, ingredients: e.ingredients })),
      kitchenPass.cuisineAnchor
    );
    return activeEntries.map((entry, idx) => {
      const costStr = convertMealCost(
        entry.baseCostUsd,
        kitchenPass.currencyCode,
        kitchenPass.currencySymbol
      );

      return {
        id: entry.id,
        title: entry.title,
        type: entry.type,
        typeLabel: entry.cookTimeOrDistance,
        cost: costStr,
        imageUrl: entry.imageUrl || deckPhotos[idx],
        targetScreen: entry.targetScreen,
      };
    });
  }, [activeEntries, kitchenPass.currencyCode, kitchenPass.currencySymbol, kitchenPass.cuisineAnchor]);

  const handleUnsave = (item: SavedMealItem) => {
    setToastMessage(`Removed from collection`);
    savedMealsService.removeMeal(item.id);
  };

  const handleOpenMeal = (item: SavedMealItem) => {
    const raw = activeEntries.find((e) => e.id === item.id);
    if (!raw) return;

    if (raw.type === 'eating_out' || raw.targetScreen === 'EatingOutMealDetails') {
      navigation.navigate('EatingOutMealDetails', {
        dishName: raw.title,
        spotName: raw.spotName || 'Local spot',
        distance: raw.cookTimeOrDistance,
        price: item.cost,
        vibe: raw.vibe || 'Cozy neighbourhood spot',
        image: item.imageUrl || raw.imageUrl,
      });
      return;
    }

    navigation.navigate('AtHomeMealDetails', {
      id: raw.id,
      title: raw.title,
      subtitle: 'From your saved collection',
      cookTime: raw.cookTimeOrDistance,
      gear: kitchenPass.cookingGearLabel || '1 Pan',
      estCost: item.cost.split(' est.')[0] || '$2.50',
      costNumeric: raw.baseCostUsd,
      image: item.imageUrl || raw.imageUrl,
      steps: raw.steps || [
        'Warm your pan over medium heat with cooking oil.',
        'Cook ingredients until golden and fragrant.',
        'Plate warm and enjoy.',
      ],
      ingredients: raw.ingredients || [
        { name: 'Core staple', amount: '1 portion' },
        { name: 'Seasonings', amount: 'To taste' },
      ],
      mamaTip: `One of your saved favorites! Let's get your ${kitchenPass.cookingGearLabel || '1 pan'} sizzling.`,
    });
  };

  const handleRollToday = (item: SavedMealItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const raw = activeEntries.find((e) => e.id === item.id);

    const meal = {
      id: item.id,
      title: item.title,
      subtitle: raw?.subtitle || 'From your saved collection',
      cookTime: raw?.cookTimeOrDistance || '20 min',
      gear: kitchenPass.cookingGearLabel || '1 Pan',
      costNumeric: raw?.baseCostUsd || 2.5,
      imageUrl: item.imageUrl,
      steps: raw?.steps || [
        'Warm your pan over medium heat with cooking oil.',
        'Cook ingredients until golden and fragrant.',
        'Plate warm and enjoy.',
      ],
      ingredients: raw?.ingredients || [
        { name: 'Core staple', amount: '1 portion' },
        { name: 'Seasonings', amount: 'To taste' },
      ],
      mamaTip: `Pulled from your saved collection. Perfect choice for today.`,
    };

    if (isInsideTabs) {
      setInjectedDailyMeal(meal);
      setActiveTab('edit');
    } else {
      navigation.navigate('YourDailyEdit', { injectedMeal: meal });
    }
  };

  const handleTabChange = (tab: NavTab) => {
    if (isInsideTabs) {
      setActiveTab(tab);
    } else {
      if (tab === 'edit') {
        navigation.navigate('YourDailyEdit');
      } else if (tab === 'kitchen') {
        navigation.navigate('WhatsInYourKitchen');
      } else if (tab === 'discover') {
        navigation.navigate('DiscoverYourNextMeal');
      }
    }
  };

  // Group meals in pairs for 2-column grid
  const mealPairs: SavedMealItem[][] = [];
  for (let i = 0; i < savedMeals.length; i += 2) {
    mealPairs.push(savedMeals.slice(i, i + 2));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* 1. UNIFIED STATUS TOP BAR (Matches YourDailyEdit & Discover) */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <RegionalMamaAvatar
            countryCode={kitchenPass.country}
            cuisineAnchor={kitchenPass.cuisineAnchor}
            size={36}
            onPress={() => setPassModalVisible(true)}
          />
          <Text style={styles.brandTitle}>Mama</Text>
          <Text style={styles.periodPillText}>Collection</Text>
        </View>

        <View style={styles.iconCluster}>
          <TouchableOpacity
            style={styles.headerChip}
            onPress={() => {
              if (isInsideTabs) setActiveTab('kitchen');
              else navigation.navigate('WhatsInYourKitchen');
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="basket-outline" size={15} color={colors.primary} />
            <Text style={styles.headerChipText}>Kitchen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerChip}
            onPress={() => setPassModalVisible(true)}
            activeOpacity={0.75}
            accessibilityLabel="Profile and Settings"
          >
            <Ionicons name="person-outline" size={15} color={colors.primary} />
            <Text style={styles.headerChipText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isInsideTabs ? 28 : 100 },
        ]}
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
          {loadingMeals ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading your collection...</Text>
            </View>
          ) : (
            <>
              {/* Saved Meals 2-Column Grid */}
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
                          onRollToday={() => handleRollToday(meal)}
                        />
                      ))}
                      {pair.length === 1 && <View style={styles.spacer} />}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <MamaCharacter pose="hungry" size={96} isSpeaking={false} />
                    <Text style={styles.emptyTitle}>Plate&apos;s empty...</Text>
                    <Text style={styles.emptySubtitle}>
                      Save meals you love so Mama remembers them.
                    </Text>
                    <TouchableOpacity
                      style={styles.rollButton}
                      onPress={() => {
                        if (isInsideTabs) setActiveTab('edit');
                        else navigation.navigate('YourDailyEdit');
                      }}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.rollButtonText}>Roll a meal</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.snow100} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Country Modal */}
      <CountryCurrencyModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
      />

      {/* Kitchen Pass Modal */}
      <KitchenPassModal
        visible={passModalVisible}
        onClose={() => setPassModalVisible(false)}
      />

      {/* Tactile Toast */}
      <TactileToast
        visible={!!toastMessage}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Bottom Navigation (rendered only when screen is standalone) */}
      {!isInsideTabs && (
        <BottomNavigation
          activeTab="collection"
          onTabChange={handleTabChange}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  periodPillText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  iconCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(36, 40, 32, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  headerChipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  animatedContainer: {
    gap: 16,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: colors.text.muted,
  },
  savedMealsContainer: {
    gap: 14,
  },
  mealRow: {
    flexDirection: 'row',
    gap: 12,
  },
  spacer: {
    flex: 1,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 240,
  },
  rollButton: {
    marginTop: 12,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rollButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.snow100,
  },
});

export default YourCollection;
