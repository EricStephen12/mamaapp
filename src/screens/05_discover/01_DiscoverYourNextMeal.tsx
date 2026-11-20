import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import {
  preferencesStore,
  UserKitchenPass,
  convertMealCost,
} from '../../services/preferencesStore';
import { CountryCurrencyModal } from '../../components/common/CountryCurrencyModal';
import { KitchenPassModal } from '../../components/common/KitchenPassModal';
import { savedMealsService } from '../../services/api/savedMealsService';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { TactileToast } from '../../components/common';
import { AiMamaService, textMentionsPantryItem } from '../../services/aiMamaService';
import { MealImageService } from '../../services/mealImageService';
import { pantryService } from '../../services/api/pantryService';
import { isMealDietCompliant } from '../../services/api/rollService';

type Props = NativeStackScreenProps<RootStackParamList, 'DiscoverYourNextMeal'>;

type DiscoverFilterId = 'all' | 'clean_healthy' | 'high_protein' | 'light_night';

interface RawDiscoveryItem {
  id: string;
  categoryType: 'home';
  cookTimeOrDistance: string;
  title: string;
  nutrition: string;
  reason: string;
  imageUrl: string;
  baseCostUsd: number;
  cuisineTags: string[];
  steps?: string[];
  ingredients?: { name: string; amount: string }[];
  healthCategory?: DiscoverFilterId;
}

interface FeedPostItem extends RawDiscoveryItem {
  resolvedImage: string;
  formattedCost: string;
  matchingPantryCount: number;
}

const DISCOVER_FILTERS: {
  id: DiscoverFilterId;
  label: string;
  icon: 'flame-outline' | 'leaf-outline' | 'barbell-outline' | 'moon-outline';
}[] = [
  { id: 'all', label: 'For You', icon: 'flame-outline' },
  { id: 'clean_healthy', label: 'Clean & Healthy', icon: 'leaf-outline' },
  { id: 'high_protein', label: 'High Protein', icon: 'barbell-outline' },
  { id: 'light_night', label: 'Light (<400 cal)', icon: 'moon-outline' },
];

const CURATED_HEALTHY_DECK: RawDiscoveryItem[] = [
  {
    id: 'healthy-grilled-tilapia-greens',
    categoryType: 'home',
    cookTimeOrDistance: '14 MIN',
    title: 'Grilled Pepper Tilapia & Steamed Greens',
    nutrition: 'LOW OIL · 340 KCAL',
    reason: 'Lean fish seared with fresh pepper, onions, and crisp leafy greens.',
    imageUrl: '',
    baseCostUsd: 2.6,
    cuisineTags: ['clean_healthy', 'high_protein'],
    healthCategory: 'clean_healthy',
    ingredients: [
      { name: 'Tilapia / White Fish Fillet', amount: '1 fillet' },
      { name: 'Fresh Spinach or Ugu', amount: '2 cups' },
      { name: 'Scotch Bonnet & Onion', amount: '1/2 sliced' },
      { name: 'Light Olive / Vegetable Oil', amount: '1 tsp' },
    ],
    steps: [
      'Season fish fillet lightly with thyme, garlic, salt, and pepper.',
      'Pan-sear with 1 tsp oil over medium-high heat for 4 mins per side until golden.',
      'Toss fresh greens and sliced onions in the warm pan for 2 mins until tender-crisp.',
    ],
  },
  {
    id: 'protein-suya-chicken-beans-power',
    categoryType: 'home',
    cookTimeOrDistance: '15 MIN',
    title: 'Suya-Spiced Chicken & Honey Beans',
    nutrition: '42g PROTEIN · CURVES & MUSCLE',
    reason: 'Double protein from smoky suya chicken breast and slow-energy honey beans.',
    imageUrl: '',
    baseCostUsd: 2.5,
    cuisineTags: ['high_protein'],
    healthCategory: 'high_protein',
    ingredients: [
      { name: 'Chicken Breast', amount: '200g cubed' },
      { name: 'Cooked Honey / Black Beans', amount: '1 cup' },
      { name: 'Suya Yaji Spice', amount: '1 tbsp' },
      { name: 'Red Onion & Tomato', amount: '1/2 sliced' },
    ],
    steps: [
      'Toss cubed chicken breast in suya spice and a pinch of salt.',
      'Sear in a hot skillet for 7 mins until charred and juicy.',
      'Warm the beans alongside and top with crisp raw red onion and tomato.',
    ],
  },
  {
    id: 'healthy-efo-spinach-chicken-bowl',
    categoryType: 'home',
    cookTimeOrDistance: '15 MIN',
    title: 'Light Efo Spinach & Seared Chicken',
    nutrition: 'CLEAN · 370 KCAL',
    reason: 'Zero heavy palm oil—bright tomatoes, peppers, and iron-rich spinach with lean chicken.',
    imageUrl: '',
    baseCostUsd: 2.4,
    cuisineTags: ['clean_healthy', 'high_protein'],
    healthCategory: 'clean_healthy',
    ingredients: [
      { name: 'Chicken Breast Strips', amount: '180g' },
      { name: 'Fresh Spinach', amount: '3 cups' },
      { name: 'Plum Tomatoes & Bell Pepper', amount: '2 diced' },
      { name: 'Onions & Garlic', amount: '1/2 bulb' },
    ],
    steps: [
      'Sear seasoned chicken strips in a hot non-stick skillet for 6 mins until golden.',
      'Add diced tomatoes, bell pepper, and onions; simmer 4 mins until saucy.',
      'Fold in fresh spinach for 2 mins until wilted and serve warm.',
    ],
  },
  {
    id: 'light-catfish-pepper-soup',
    categoryType: 'home',
    cookTimeOrDistance: '15 MIN',
    title: 'Aromatic Fish Pepper Soup',
    nutrition: 'LIGHT · 280 KCAL',
    reason: 'Zero oil, soothing warm spices, and lean fish—perfect for a light, bloat-free night.',
    imageUrl: '',
    baseCostUsd: 2.5,
    cuisineTags: ['light_night', 'clean_healthy'],
    healthCategory: 'light_night',
    ingredients: [
      { name: 'Fresh Fish Steaks', amount: '2 pieces' },
      { name: 'Pepper Soup Spice', amount: '1 tbsp' },
      { name: 'Scent Leaf / Parsley', amount: '1 handful' },
      { name: 'Scotch Bonnet & Onion', amount: 'To taste' },
    ],
    steps: [
      'Bring 2 cups of water to a boil with diced onions, pepper soup spice, and seasoning.',
      'Gently lower fish pieces into the broth and simmer for 9 mins.',
      'Scatter torn scent leaves on top and enjoy hot.',
    ],
  },
  {
    id: 'healthy-avocado-egg-plantain-plate',
    categoryType: 'home',
    cookTimeOrDistance: '12 MIN',
    title: 'Roasted Plantain, Boiled Eggs & Avocado',
    nutrition: 'GUT FRIENDLY · LOW OIL',
    reason: 'Oven/air-charred sweet plantain paired with protein-rich boiled eggs and fresh avocado.',
    imageUrl: '',
    baseCostUsd: 1.9,
    cuisineTags: ['clean_healthy'],
    healthCategory: 'clean_healthy',
    ingredients: [
      { name: 'Ripe Plantain', amount: '1 medium' },
      { name: 'Eggs', amount: '2 large' },
      { name: 'Fresh Avocado', amount: '1/2 sliced' },
      { name: 'Black Pepper & Sea Salt', amount: 'To taste' },
    ],
    steps: [
      'Boil eggs for 8 minutes, peel, and halve.',
      'Pan-roast or air-fry plantain slices with just a brush of oil for 8 mins.',
      'Plate with sliced avocado and cracked black pepper.',
    ],
  },
  {
    id: 'protein-pepper-steak-egg-skillet',
    categoryType: 'home',
    cookTimeOrDistance: '12 MIN',
    title: 'Peppered Beef Strips & 3-Egg Scramble',
    nutrition: '39g PROTEIN · HIGH ENERGY',
    reason: 'Fast, high-protein skillet built for recovery and fullness without heavy carbs.',
    imageUrl: '',
    baseCostUsd: 2.8,
    cuisineTags: ['high_protein'],
    healthCategory: 'high_protein',
    ingredients: [
      { name: 'Lean Beef Strips', amount: '150g' },
      { name: 'Eggs', amount: '3 large' },
      { name: 'Spring Onions & Bell Pepper', amount: '1/2 cup' },
      { name: 'Cooking Oil', amount: '1 tsp' },
    ],
    steps: [
      'Flash-sear seasoned beef strips in a hot pan for 4 mins with bell peppers.',
      'Push to one side and scramble the eggs softly for 2 mins.',
      'Garnish with chopped spring onions and serve immediately.',
    ],
  },
  {
    id: 'light-veggie-egg-drop-stirfry',
    categoryType: 'home',
    cookTimeOrDistance: '10 MIN',
    title: 'Crisp Cabbage, Carrot & Egg Stir-Fry',
    nutrition: 'LIGHT · 310 KCAL',
    reason: 'Crunchy ribbons of cabbage and sweet carrot tossed with fluffy eggs for a light evening.',
    imageUrl: '',
    baseCostUsd: 1.5,
    cuisineTags: ['light_night', 'clean_healthy'],
    healthCategory: 'light_night',
    ingredients: [
      { name: 'Shredded Cabbage & Carrot', amount: '2 cups' },
      { name: 'Eggs', amount: '2 large' },
      { name: 'Garlic & Ginger', amount: '1 tsp minced' },
      { name: 'Light Soy Sauce / Salt', amount: '1 tsp' },
    ],
    steps: [
      'Scramble 2 eggs in a hot skillet for 1 min and set aside.',
      'Stir-fry garlic, ginger, cabbage, and carrot on high heat for 3 mins so they stay crisp.',
      'Return eggs to the pan, toss with a splash of soy sauce or salt, and plate.',
    ],
  },
];

export const DiscoverYourNextMeal: React.FC<Props> = ({ navigation }) => {
  const { isInsideTabs, setActiveTab } = useTabNavigation();
  const [kitchenPass, setKitchenPass] = useState<UserKitchenPass>(
    preferencesStore.getKitchenPass()
  );
  const [pantryItems, setPantryItems] = useState<string[]>(() =>
    pantryService.getCachedPantry().map((i) => i.name)
  );
  const [activeFilter, setActiveFilter] = useState<DiscoverFilterId>('all');
  const [savedItemIds, setSavedItemIds] = useState<string[]>(() => {
    const saved = savedMealsService.getCachedMeals();
    return Array.from(
      new Set([
        ...kitchenPass.likedDishes,
        ...saved.map((m) => m.mealId || m.id),
        ...saved.map((m) => m.title.toLowerCase()),
      ])
    );
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [apiRawDeck, setApiRawDeck] = useState<RawDiscoveryItem[]>([]);
  const [aiPhotosMap, setAiPhotosMap] = useState<Record<string, string>>({});

  const contentFade = useRef(new Animated.Value(0)).current;
  const remainingBudget = kitchenPass.weeklyBudget - kitchenPass.spentThisWeek;
  const formattedBudget = useMemo(() => {
    if (remainingBudget >= 1000) {
      const kVal = Math.round(remainingBudget / 1000);
      return `${kitchenPass.currencySymbol}${kVal}k`;
    }
    return `${kitchenPass.currencySymbol}${Math.max(0, Math.round(remainingBudget))}`;
  }, [remainingBudget, kitchenPass.currencySymbol]);

  useEffect(() => {
    const unsubscribe = preferencesStore.subscribe((pass) => {
      setKitchenPass(pass);
    });
    const unsubSaved = savedMealsService.subscribe((meals) => {
      setSavedItemIds(
        Array.from(
          new Set([
            ...meals.map((m) => m.mealId || m.id),
            ...meals.map((m) => m.title.toLowerCase()),
          ])
        )
      );
    });
    const unsubPantry = pantryService.subscribe((items) => {
      setPantryItems(items.map((i) => i.name));
    });
    pantryService.fetchAll().then((items) => {
      setPantryItems(items.map((i) => i.name));
    }).catch(() => {});

    return () => {
      unsubscribe();
      unsubSaved();
      unsubPantry();
    };
  }, []);

  useEffect(() => {
    Animated.timing(contentFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [contentFade]);

  const dietKey = (kitchenPass.dietaryRestrictions || []).join(',');
  const pantrySig = [...pantryItems].sort().join(',');

  useEffect(() => {
    let isMounted = true;
    AiMamaService.generateDiscoverDeck(kitchenPass, pantryItems)
      .then((meals) => {
        if (isMounted && Array.isArray(meals) && meals.length > 0) {
          setApiRawDeck(meals);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    kitchenPass.timeLimitMinutes,
    kitchenPass.cookingGear,
    kitchenPass.cuisineAnchor,
    kitchenPass.country,
    kitchenPass.bodyGoal,
    dietKey,
    pantrySig,
  ]);

  const filteredRawDeck = useMemo<RawDiscoveryItem[]>(() => {
    // Dietary and permanent ban filter applied to curated list
    const dietCompliantCurated = CURATED_HEALTHY_DECK.filter((m) =>
      isMealDietCompliant(
        {
          id: m.id,
          title: m.title,
          subtitle: m.reason,
          timeOfDay: 'dinner',
          cookTimeMinutes: 15,
          estCost: m.baseCostUsd,
          ingredients: m.ingredients || [],
          steps: m.steps || [],
        },
        kitchenPass
      )
    );

    const seen = new Set<string>();
    const combined = [...apiRawDeck, ...dietCompliantCurated].filter((m) => {
      const key = m.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (activeFilter === 'all') {
      return combined;
    }
    const matching = combined.filter(
      (item) =>
        item.healthCategory === activeFilter ||
        (Array.isArray(item.cuisineTags) && item.cuisineTags.includes(activeFilter))
    );
    return matching.length > 0 ? matching : combined;
  }, [activeFilter, apiRawDeck, kitchenPass]);

  // Auto-hydrate top Discover feed cards with real dish-accurate AI photography
  useEffect(() => {
    let cancelled = false;
    filteredRawDeck.slice(0, 4).forEach((item) => {
      if (aiPhotosMap[item.title]) return;
      MealImageService.generateMealImage(
        item.title,
        item.ingredients,
        kitchenPass.cuisineAnchor
      )
        .then((url) => {
          if (!cancelled && url && !MealImageService.isCatalogImage(url)) {
            setAiPhotosMap((prev) => ({ ...prev, [item.title]: url }));
          }
        })
        .catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [filteredRawDeck, kitchenPass.cuisineAnchor, aiPhotosMap]);

  const feedPosts = useMemo<FeedPostItem[]>(() => {
    const deckPhotos = MealImageService.getCarouselDeckImages(
      filteredRawDeck.map((m) => ({ title: m.title, ingredients: m.ingredients })),
      kitchenPass.cuisineAnchor
    );
    return filteredRawDeck.map((item, idx) => {
      const itemText = `${item.title} ${(item.ingredients || []).map((i) => i.name).join(' ')}`;
      const matchingPantryCount = pantryItems.filter((p) =>
        textMentionsPantryItem(itemText, p)
      ).length;

      return {
        ...item,
        resolvedImage: aiPhotosMap[item.title] || item.imageUrl || deckPhotos[idx],
        formattedCost: convertMealCost(
          item.baseCostUsd,
          kitchenPass.currencyCode,
          kitchenPass.currencySymbol
        ),
        matchingPantryCount,
      };
    });
  }, [aiPhotosMap, filteredRawDeck, kitchenPass.currencyCode, kitchenPass.currencySymbol, kitchenPass.cuisineAnchor, pantryItems]);

  const handleToggleLikePost = (post: FeedPostItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const titleKey = post.title.toLowerCase();
    const alreadySaved =
      savedItemIds.includes(post.id) || savedItemIds.includes(titleKey);

    if (alreadySaved) {
      setSavedItemIds((prev) => prev.filter((id) => id !== post.id && id !== titleKey));
      savedMealsService.removeMeal(post.id);
      setToastMessage('Removed from collection');
      return;
    }

    setSavedItemIds((prev) => [...prev, post.id, titleKey]);
    preferencesStore.recordMealDecision(post.id, 'saved', post.baseCostUsd);
    savedMealsService.saveMeal({
      mealId: post.id,
      title: post.title,
      type: post.categoryType,
      cookTime: post.cookTimeOrDistance,
      cost: post.formattedCost,
      costNumeric: post.baseCostUsd,
      imageUrl: post.resolvedImage,
      recipeSteps: post.steps,
      ingredients: post.ingredients,
      vibe: post.reason,
    });
    setToastMessage('Saved to Collection');
  };

  const handleOpenPostDetails = (post: FeedPostItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('AtHomeMealDetails', {
      id: post.id,
      title: post.title,
      subtitle: post.reason,
      cookTime: post.cookTimeOrDistance,
      gear: kitchenPass.cookingGearLabel || '1 Pan',
      estCost: post.formattedCost,
      costNumeric: post.baseCostUsd,
      image: post.resolvedImage,
      steps: post.steps,
      ingredients: post.ingredients,
      mamaTip: post.reason,
    });
  };

  const handleTabChange = (tab: 'edit' | 'kitchen' | 'discover' | 'collection') => {
    if (isInsideTabs) {
      setActiveTab(tab);
    } else {
      if (tab === 'edit') navigation.navigate('YourDailyEdit');
      if (tab === 'kitchen') navigation.navigate('WhatsInYourKitchen');
      if (tab === 'collection') navigation.navigate('YourCollection');
    }
  };

  const renderFeedPost = ({ item }: { item: FeedPostItem }) => {
    const isLiked =
      savedItemIds.includes(item.id) || savedItemIds.includes(item.title.toLowerCase());
    return (
      <TouchableOpacity
        style={styles.feedCard}
        activeOpacity={0.94}
        onPress={() => handleOpenPostDetails(item)}
      >
        <Image
          source={{ uri: item.resolvedImage }}
          style={styles.feedImage}
          resizeMode="cover"
        />

        {/* Top Row: Health Badge + Pantry Match (Left) + Dopamine Heart Button (Right) */}
        <View style={styles.feedTopRow}>
          <View style={styles.topBadgesCluster}>
            <View style={styles.healthGlassBadge}>
              <Ionicons name="leaf" size={12} color="#4ADE80" />
              <Text style={styles.healthGlassText}>
                {item.nutrition || 'FRESH HOME PICK'}
              </Text>
            </View>

            {item.matchingPantryCount > 0 && (
              <View style={styles.pantryGlassBadge}>
                <Ionicons name="basket" size={11} color="#4ADE80" />
                <Text style={styles.pantryGlassText}>
                  {item.matchingPantryCount} in kitchen
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.heartCircleBtn, isLiked && styles.heartCircleBtnActive]}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleLikePost(item);
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Scrim Overlay: Dish Title + Time/Cost + Check Food Pill */}
        <View style={styles.feedBottomScrim}>
          <Text style={styles.feedTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.feedBottomMetaRow}>
            <View style={styles.feedTimeCostRow}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.feedTimeCostText}>
                {item.cookTimeOrDistance} · {item.formattedCost}
              </Text>
            </View>

            <View style={styles.checkFoodPill}>
              <Text style={styles.checkFoodPillText}>Cook</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* 1. TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <Text style={styles.brandTitle}>Mama</Text>
          <Text style={styles.periodPillText}>Discover</Text>
        </View>

        <View style={styles.iconCluster}>
          <TouchableOpacity
            style={styles.headerChip}
            onPress={() => setCountryModalVisible(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="wallet-outline" size={13} color={colors.primary} />
            <Text style={styles.headerChipText}>{formattedBudget}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerChip}
            onPress={() => {
              if (isInsideTabs) setActiveTab('kitchen');
              else navigation.navigate('WhatsInYourKitchen');
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="basket-outline" size={13} color={colors.primary} />
            <Text style={styles.headerChipText}>
              {pantryItems.length > 0 ? `${pantryItems.length} in house` : 'Kitchen'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerChip}
            onPress={() => setPassModalVisible(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="options-outline" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. HEALTHY & CRAVING FILTER BAR */}
      <View style={styles.filterBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {DISCOVER_FILTERS.map((filter) => {
            const active = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setActiveFilter(filter.id);
                }}
                activeOpacity={0.82}
              >
                <Ionicons
                  name={filter.icon}
                  size={14}
                  color={active ? '#FFFFFF' : colors.primary}
                />
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. VERTICAL SCROLLING DOPAMINE FOOD INSTAGRAM FEED */}
      <Animated.View style={{ flex: 1, opacity: contentFade }}>
        <FlatList
          data={feedPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedPost}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedListContent}
          initialNumToRender={4}
        />
      </Animated.View>

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

      {/* Bottom Navigation */}
      {!isInsideTabs && (
        <BottomNavigation
          activeTab="discover"
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
    paddingBottom: 6,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.4,
  },
  periodPillText: {
    fontSize: 13,
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
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  filterBarWrap: {
    paddingVertical: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 18,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  feedListContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 110,
    gap: 18,
  },
  feedCard: {
    height: 395,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1E211B',
    justifyContent: 'space-between',
    shadowColor: '#181512',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  feedImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  feedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topBadgesCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 10,
  },
  healthGlassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 20, 16, 0.74)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  healthGlassText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pantryGlassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(21, 128, 61, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
  },
  pantryGlassText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  heartCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(18, 20, 16, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  heartCircleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  feedBottomScrim: {
    paddingHorizontal: 18,
    paddingTop: 32,
    paddingBottom: 18,
    backgroundColor: 'rgba(18, 20, 16, 0.72)',
    gap: 10,
  },
  feedTitle: {
    fontSize: 25,
    lineHeight: 30,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedBottomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedTimeCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedTimeCostText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  checkFoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 14,
  },
  checkFoodPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default DiscoverYourNextMeal;
