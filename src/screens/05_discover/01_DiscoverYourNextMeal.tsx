import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import {
  preferencesStore,
  UserKitchenPass,
  convertMealCost,
} from '../../services/preferencesStore';
import { MamaDialogueService } from '../../services/mamaDialogueService';
import { MamaCharacter, MamaPose } from '../../components/common/MamaCharacter';
import { CountryCurrencyModal } from '../../components/common/CountryCurrencyModal';
import { AiMamaService } from '../../services/aiMamaService';
import { savedMealsService } from '../../services/api/savedMealsService';
import { decisionsService } from '../../services/api/decisionsService';

import { MealFilters, MealFilterType } from './components/MealFilters';
import {
  FeaturedDiscoveryCard,
  DiscoveryItem,
} from './components/FeaturedDiscoveryCard';
import { SwipeActions } from './components/SwipeActions';
import { OtherOptionsSection } from './components/OtherOptionsSection';
import { MealOptionData } from './components/MealOptionRow';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { TactileToast } from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'DiscoverYourNextMeal'>;

interface RawDiscoveryItem {
  id: string;
  categoryType: 'home' | 'eating_out';
  cookTimeOrDistance: string;
  title: string;
  nutrition: string;
  reason: string;
  imageUrl: string;
  baseCostUsd: number;
  cuisineTags: string[];
  spotName?: string;
  steps?: string[];
  ingredients?: { name: string; amount: string }[];
}

const RAW_DECK: RawDiscoveryItem[] = [
  {
    id: 'disc-1',
    categoryType: 'home',
    cookTimeOrDistance: '20 min',
    title: 'Lemon chickpea & couscous bowl',
    nutrition: 'Vegetarian · 540 kcal · 20g protein · 13g fibre*',
    reason: 'Mediterranean flavours using pantry staples you already have.',
    imageUrl:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    baseCostUsd: 2.8,
    cuisineTags: ['mediterranean_european', 'comfort_classics'],
    steps: [
      'Toast couscous with olive oil in a skillet for 2 minutes.',
      'Pour hot water or broth over couscous, cover and steam 5 minutes.',
      'Rinse chickpeas and toss with lemon juice, salt, and cumin.',
      'Fluff couscous, fold in chickpeas and fresh greens, and serve warm.',
    ],
    ingredients: [
      { name: 'Couscous or quinoa', amount: '1 cup' },
      { name: 'Canned chickpeas', amount: '1 can' },
      { name: 'Lemon juice & olive oil', amount: '2 tbsp' },
      { name: 'Fresh parsley or herbs', amount: 'Handful' },
    ],
  },
  {
    id: 'disc-2',
    categoryType: 'home',
    cookTimeOrDistance: '15 min',
    title: 'Crispy tofu sesame noodle bowl',
    nutrition: 'Vegan · 480 kcal · 18g protein · 7g fibre*',
    reason: 'Fast, comforting, and uses soy sauce and sesame oil on hand.',
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    baseCostUsd: 3.1,
    cuisineTags: ['asian_comfort'],
    steps: [
      'Boil quick noodles in salted water for 3 minutes and drain.',
      'Sear cubed tofu in hot sesame oil until golden and crisp.',
      'Whisk soy sauce, chili crisp, and a touch of vinegar in the pan.',
      'Toss noodles directly into skillet, coat in glaze, and top with scallions.',
    ],
    ingredients: [
      { name: 'Noodles of choice', amount: '1 bundle' },
      { name: 'Firm tofu or protein', amount: '150g' },
      { name: 'Soy sauce & sesame oil', amount: '2 tbsp' },
      { name: 'Chili flakes or crisp', amount: '1 tsp' },
    ],
  },
  {
    id: 'disc-3',
    categoryType: 'eating_out',
    cookTimeOrDistance: '10 min walk',
    title: 'Warm grain bowl with wild mushrooms',
    nutrition: 'Vegetarian · 510 kcal · 16g protein · 9g fibre*',
    reason: 'Handcrafted by Harvest Table nearby. Within your weekly balance.',
    imageUrl:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    baseCostUsd: 9.2,
    cuisineTags: ['mediterranean_european', 'comfort_classics'],
    spotName: 'Harvest Table Cafe',
  },
  {
    id: 'disc-4',
    categoryType: 'home',
    cookTimeOrDistance: '25 min',
    title: 'Charred salmon & garlic greens',
    nutrition: 'High Protein · 610 kcal · 36g protein · 8g fibre*',
    reason: 'Rich in omega-3 and pairs beautifully with fresh citrus and leafy greens.',
    imageUrl:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    baseCostUsd: 4.5,
    cuisineTags: ['mediterranean_european', 'comfort_classics'],
    steps: [
      'Season salmon fillet with salt, black pepper, and garlic powder.',
      'Sear skin-side down in a hot skillet for 5 minutes until crisp.',
      'Flip salmon and toss in greens (spinach or kale) around the fillet.',
      'Squeeze fresh lemon juice over everything and serve directly.',
    ],
    ingredients: [
      { name: 'Salmon fillet', amount: '1 fillet (180g)' },
      { name: 'Fresh leafy greens', amount: '2 cups' },
      { name: 'Garlic cloves', amount: '2 minced' },
      { name: 'Lemon wedge', amount: 'Half' },
    ],
  },
  {
    id: 'disc-5',
    categoryType: 'home',
    cookTimeOrDistance: '10 min',
    title: 'Sizzled pepper eggs & sweet plantains',
    nutrition: 'Comfort · 420 kcal · 22g protein · 5g fibre*',
    reason: "Mama's signature combo — golden sweet plantains with velvety pepper eggs.",
    imageUrl:
      'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    baseCostUsd: 1.9,
    cuisineTags: ['african_caribbean'],
    steps: [
      'Slice ripe plantains diagonally and pan-fry in hot oil until golden.',
      'In the same pan, saute diced red onions and scotch bonnet / chili.',
      'Pour in seasoned beaten eggs and fold gently into soft curds.',
      'Plate sweet plantains with hot eggs and dig in immediately.',
    ],
    ingredients: [
      { name: 'Ripe sweet plantain', amount: '1 whole' },
      { name: 'Fresh eggs', amount: '2 large' },
      { name: 'Red onion & pepper', amount: '1 small diced' },
      { name: 'Vegetable oil', amount: '2 tbsp' },
    ],
  },
  {
    id: 'disc-6',
    categoryType: 'eating_out',
    cookTimeOrDistance: '5 min walk',
    title: 'Smoky jollof rice with suya skewers',
    nutrition: 'High Protein · 580 kcal · 28g protein · 6g fibre*',
    reason: 'Authentic firewood aroma from a local kitchen. Pure nostalgia.',
    imageUrl:
      'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
    baseCostUsd: 10.5,
    cuisineTags: ['african_caribbean'],
    spotName: 'Mama Boma West African Grill',
  },
  {
    id: 'disc-7',
    categoryType: 'home',
    cookTimeOrDistance: '12 min',
    title: 'Creamy garlic pasta with chili oil',
    nutrition: 'Comfort · 560 kcal · 16g protein · 4g fibre*',
    reason: 'Five ingredients, one pan, zero stress. The ultimate late-evening plate.',
    imageUrl:
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    baseCostUsd: 2.2,
    cuisineTags: ['mediterranean_european', 'comfort_classics'],
    steps: [
      'Boil pasta in salted water for 8 minutes; reserve 1/4 cup pasta water.',
      'Gently simmer minced garlic and chili flakes in olive oil until fragrant.',
      'Toss drained pasta with reserved water, grated cheese, and butter.',
      'Swirl vigorously until a glossy, creamy sauce wraps every noodle.',
    ],
    ingredients: [
      { name: 'Spaghetti or rigatoni', amount: '120g' },
      { name: 'Garlic cloves', amount: '4 sliced' },
      { name: 'Parmesan or cheese', amount: '3 tbsp' },
      { name: 'Chili oil or flakes', amount: '1 tsp' },
    ],
  },
  {
    id: 'disc-8',
    categoryType: 'home',
    cookTimeOrDistance: '8 min',
    title: 'Soft chapati with spiced scrambled eggs',
    nutrition: 'Comfort · 390 kcal · 19g protein · 3g fibre*',
    reason: 'Warm flatbread rolled around spiced eggs and sweet sauteed onions.',
    imageUrl:
      'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80',
    baseCostUsd: 1.6,
    cuisineTags: ['african_caribbean'],
    steps: [
      'Warm chapati or flatbread in a dry skillet for 1 minute per side.',
      'Crack eggs with diced tomato, onion, and a pinch of curry spice.',
      'Scramble in hot butter until creamy and soft.',
      'Spoon eggs onto the warm chapati, roll up, and enjoy.',
    ],
    ingredients: [
      { name: 'Chapati or flatbread', amount: '1 piece' },
      { name: 'Eggs', amount: '2 large' },
      { name: 'Diced tomato & onion', amount: '2 tbsp' },
      { name: 'Butter', amount: '1 tsp' },
    ],
  },
];

const PASS_REASONS = [
  'Too expensive',
  'Too much effort',
  "Don't like it",
  'Not in the mood',
  'Missing ingredients',
];

export const DiscoverYourNextMeal: React.FC<Props> = ({ navigation }) => {
  const [kitchenPass, setKitchenPass] = useState<UserKitchenPass>(
    preferencesStore.getKitchenPass()
  );
  const [activeFilter, setActiveFilter] = useState<MealFilterType>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedItemIds, setSavedItemIds] = useState<string[]>(kitchenPass.likedDishes);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  // Mama live dialogue state
  const [mamaQuote, setMamaQuote] = useState<string>(
    MamaDialogueService.getDiscoverQuote(kitchenPass)
  );
  const [mamaPose, setMamaPose] = useState<MamaPose>('delighted');
  const [showPassReasons, setShowPassReasons] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;

  // Card swipe animations
  const swipeAnim = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // Mama bounce animation
  const mamaBounceAnim = useRef(new Animated.Value(1)).current;

  // Subscribe to preferencesStore
  useEffect(() => {
    const unsubscribe = preferencesStore.subscribe((pass) => {
      setKitchenPass(pass);
      setSavedItemIds(pass.likedDishes);
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

  // Filter and sort deck according to user's culinary anchor
  const filteredRawItems = useMemo(() => {
    const subset = RAW_DECK.filter((item) => {
      if (activeFilter === 'home') return item.categoryType === 'home';
      if (activeFilter === 'eating_out') return item.categoryType === 'eating_out';
      return true;
    });

    // Sort matching user's cuisine anchor first
    return [...subset].sort((a, b) => {
      const aMatches = a.cuisineTags.includes(kitchenPass.cuisineAnchor);
      const bMatches = b.cuisineTags.includes(kitchenPass.cuisineAnchor);
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }, [activeFilter, kitchenPass.cuisineAnchor]);

  // Convert to localized DiscoveryItem format
  const discoveryDeck: DiscoveryItem[] = useMemo(() => {
    return filteredRawItems.map((item, idx) => {
      const localizedCost = convertMealCost(
        item.baseCostUsd,
        kitchenPass.currencyCode,
        kitchenPass.currencySymbol
      );
      const categoryLabel =
        item.categoryType === 'home'
          ? `At home · ${item.cookTimeOrDistance}`
          : `Eating out · ${item.cookTimeOrDistance}`;

      return {
        id: item.id,
        positionLabel: `${String(idx + 1).padStart(2, '0')} / ${String(
          filteredRawItems.length
        ).padStart(2, '0')}`,
        category: categoryLabel,
        cost: `${localizedCost} est. / ${
          item.categoryType === 'home' ? 'serving' : 'meal'
        }`,
        title: item.title,
        nutrition: item.nutrition,
        reason: item.reason,
        imageUrl: item.imageUrl,
      };
    });
  }, [filteredRawItems, kitchenPass.currencyCode, kitchenPass.currencySymbol]);

  const activeRawItem = filteredRawItems[currentIndex % Math.max(filteredRawItems.length, 1)];
  const currentItem = discoveryDeck[currentIndex % Math.max(discoveryDeck.length, 1)];
  const isSaved = currentItem ? savedItemIds.includes(currentItem.id) : false;

  // Localized "A different direction" options
  const localizedQuickOptions: MealOptionData[] = useMemo(() => {
    const costOpt1 = convertMealCost(8.5, kitchenPass.currencyCode, kitchenPass.currencySymbol);
    const costOpt2 = convertMealCost(2.4, kitchenPass.currencyCode, kitchenPass.currencySymbol);

    return [
      {
        id: 'opt-1',
        eyebrow: 'EATING OUT · 10 MIN WALK',
        mealName: 'Roasted veg & hummus pita',
        estimatedCost: `${costOpt1} est. / meal`,
        imageUrl:
          'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=400&q=80',
      },
      {
        id: 'opt-2',
        eyebrow: 'AT HOME · 25 MIN',
        mealName: 'Tomato & white bean pasta',
        estimatedCost: `${costOpt2} est. / serving`,
        imageUrl:
          'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80',
      },
    ];
  }, [kitchenPass.currencyCode, kitchenPass.currencySymbol]);

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

    AiMamaService.getLiveMamaDialogue(kitchenPass, 'discover')
      .then((aiQuote) => {
        if (aiQuote && aiQuote.length > 5) {
          setMamaQuote(aiQuote);
        }
      })
      .catch(() => {});
  };

  const transitionCard = (direction: 'left' | 'right', callback?: () => void) => {
    const toX = direction === 'right' ? 380 : -380;
    Animated.parallel([
      Animated.timing(swipeAnim.x, {
        toValue: toX,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
      setCurrentIndex((prev) => (prev + 1) % Math.max(discoveryDeck.length, 1));
      swipeAnim.setValue({ x: 0, y: 0 });
      setShowPassReasons(false);
      setSelectedReasons([]);
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePass = () => {
    triggerMamaBounce();
    const reaction = MamaDialogueService.getPassReaction();
    setMamaQuote(reaction);
    setMamaPose('thinking');
    setShowPassReasons(true);

    if (activeRawItem) {
      preferencesStore.recordMealDecision(activeRawItem.id, 'passed', activeRawItem.baseCostUsd);
      // Log to Neon DB (fire-and-forget)
      decisionsService.log(activeRawItem.id, activeRawItem.title, 'passed', activeRawItem.baseCostUsd);
    }

    transitionCard('left');
  };

  const handleLikeAndSave = () => {
    triggerMamaBounce();
    const reaction = MamaDialogueService.getCookReaction();
    setMamaQuote(reaction);
    setMamaPose('delighted');

    if (activeRawItem) {
      preferencesStore.recordMealDecision(activeRawItem.id, 'cooked', activeRawItem.baseCostUsd);
      // Log decision to Neon DB
      decisionsService.log(activeRawItem.id, activeRawItem.title, 'cooked', activeRawItem.baseCostUsd);
      // Save meal to Neon DB so it appears in the Collection screen
      savedMealsService.saveMeal({
        mealId: activeRawItem.id,
        title: activeRawItem.title,
        type: activeRawItem.categoryType,
        cookTime: activeRawItem.cookTimeOrDistance,
        cost: currentItem?.cost || '$2.50',
        costNumeric: activeRawItem.baseCostUsd,
        imageUrl: activeRawItem.imageUrl,
        recipeSteps: activeRawItem.steps,
        ingredients: activeRawItem.ingredients,
        spotName: activeRawItem.spotName,
        vibe: activeRawItem.reason,
      });
    }

    transitionCard('right', () => {
      if (currentItem) {
        setSavedItemIds((prev) =>
          prev.includes(currentItem.id) ? prev : [...prev, currentItem.id]
        );
        setToastMessage(`"${currentItem.title}" saved to your collection ✨`);
      }
    });
  };

  const handleSelectFilter = (filter: MealFilterType) => {
    setActiveFilter(filter);
    setCurrentIndex(0);
    swipeAnim.setValue({ x: 0, y: 0 });
    cardOpacity.setValue(1);
    setShowPassReasons(false);
    setSelectedReasons([]);

    const reaction = MamaDialogueService.getDiscoverFilterReaction(filter);
    setMamaQuote(reaction);
    setMamaPose(filter === 'home' ? 'cooking' : filter === 'eating_out' ? 'welcoming' : 'delighted');
    triggerMamaBounce();
  };

  const handleOpenActiveDetails = () => {
    if (!activeRawItem || !currentItem) return;

    if (activeRawItem.categoryType === 'eating_out') {
      navigation.navigate('EatingOutMealDetails', {
        spotName: activeRawItem.spotName || 'Local Kitchen Pick',
        dishName: activeRawItem.title,
        distance: activeRawItem.cookTimeOrDistance,
        price: currentItem.cost.split(' est.')[0] || '$8.50',
        vibe: activeRawItem.reason,
        image: activeRawItem.imageUrl,
      });
    } else {
      navigation.navigate('AtHomeMealDetails', {
        id: activeRawItem.id,
        title: activeRawItem.title,
        subtitle: activeRawItem.reason,
        cookTime: activeRawItem.cookTimeOrDistance,
        gear: '1 Pan & Skillet',
        estCost: currentItem.cost.split(' est.')[0] || '$2.50',
        costNumeric: activeRawItem.baseCostUsd,
        image: activeRawItem.imageUrl,
        steps: activeRawItem.steps || [
          'Warm your skillet on medium heat with olive oil or butter.',
          'Cook the ingredients until fragrant and golden brown.',
          'Season with fresh pepper, plate warm, and enjoy immediately.',
        ],
        ingredients: activeRawItem.ingredients || [
          { name: 'Core staple', amount: '1 portion' },
          { name: 'Aromatics & seasonings', amount: 'To taste' },
          { name: 'Cooking oil', amount: '1 tbsp' },
        ],
      });
    }
  };

  const handleTogglePassReason = (reason: string) => {
    setSelectedReasons((prev) => {
      const exists = prev.includes(reason);
      const updated = exists ? prev.filter((r) => r !== reason) : [...prev, reason];
      if (!exists) {
        setMamaQuote(`Understood! I'll remember you don't like meals with "${reason}".`);
        setMamaPose('writing');
        triggerMamaBounce();
      }
      return updated;
    });
  };

  const handleTabChange = (tab: 'edit' | 'discover' | 'collection') => {
    if (tab === 'edit') {
      navigation.navigate('YourDailyEdit');
    } else if (tab === 'collection') {
      navigation.navigate('YourCollection');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* Masthead Header with Country Switcher */}
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

      {/* Scrollable Feed */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          {/* Section 1: Discover Introduction */}
          <View style={styles.introductionBlock}>
            <View style={styles.introHeaderRow}>
              <Text style={styles.eyebrow}>
                A LITTLE INSPIRATION · {kitchenPass.countryName.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.heading}>Follow your{'\n'}appetite.</Text>
            <Text style={styles.supportingCopy}>
              Swipe right to save, left to pass. Mama learns what you love.
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

          {/* Section 3: Meal Filters */}
          <MealFilters
            activeFilter={activeFilter}
            onSelectFilter={handleSelectFilter}
          />

          {/* Section 4: Featured Discovery Card */}
          {currentItem ? (
            <FeaturedDiscoveryCard
              item={currentItem}
              swipeAnim={swipeAnim}
              cardOpacity={cardOpacity}
              onOpenDetails={handleOpenActiveDetails}
            />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySubtitle}>
                You&apos;ve reviewed all meals in this category. Switch filters to explore more ideas.
              </Text>
            </View>
          )}

          {/* Section 5: Swipe Actions & Gesture Hints */}
          {currentItem && (
            <SwipeActions
              onPass={handlePass}
              onLikeAndSave={handleLikeAndSave}
              isSaved={isSaved}
            />
          )}

          {/* Section 6: Optional Pass Reasons (appears when user passes) */}
          {showPassReasons && (
            <View style={styles.passReasonsContainer}>
              <Text style={styles.passReasonsTitle}>Not today? Tell Mama why (optional)</Text>
              <View style={styles.reasonsChipsRow}>
                {PASS_REASONS.map((reason) => {
                  const isSelected = selectedReasons.includes(reason);
                  return (
                    <Pressable
                      key={reason}
                      onPress={() => handleTogglePassReason(reason)}
                      style={[
                        styles.reasonChip,
                        isSelected ? styles.chipSelected : styles.chipUnselected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color={colors.primary}
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[
                          styles.reasonLabel,
                          isSelected ? styles.labelSelected : styles.labelUnselected,
                        ]}
                      >
                        {reason}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.divider} />

          {/* Section 7: Other Options ("A different direction") */}
          <OtherOptionsSection
            options={localizedQuickOptions}
            onSelectOption={(option) => {
              if (option.id === 'opt-1') {
                navigation.navigate('EatingOutMealDetails', {
                  spotName: 'Greenery Fresh Deli',
                  dishName: option.mealName,
                  distance: '10 min walk',
                  price: option.estimatedCost.split(' est.')[0] || '$8.50',
                  vibe: 'Warm pita packed with roasted seasonal veggies and house tahini.',
                  image: option.imageUrl,
                });
              } else {
                navigation.navigate('AtHomeMealDetails', {
                  id: 'opt-2-recipe',
                  title: option.mealName,
                  subtitle: 'Hearty Italian staple made with cannellini beans and crushed tomatoes.',
                  cookTime: '25 min',
                  gear: '1 Saucepan',
                  estCost: option.estimatedCost.split(' est.')[0] || '$2.40',
                  costNumeric: 2.4,
                  image: option.imageUrl,
                  steps: [
                    'Cook pasta in a pot of boiling salted water until al dente.',
                    'Simmer canned white beans and crushed tomatoes with garlic.',
                    'Combine pasta directly into the sauce and top with olive oil.',
                  ],
                  ingredients: [
                    { name: 'Rigatoni or penne', amount: '150g' },
                    { name: 'White cannellini beans', amount: '1 can' },
                    { name: 'Crushed tomatoes', amount: '1 can' },
                    { name: 'Garlic & oregano', amount: 'To taste' },
                  ],
                });
              }
            }}
          />

          {/* Section 8: Localized Budget Awareness Pill */}
          <TouchableOpacity
            style={styles.budgetPill}
            onPress={() => setCountryModalVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.budgetPillLeft}>
              <Ionicons name="wallet-outline" size={16} color={colors.primary} />
              <Text style={styles.budgetPillText}>
                Weekly Balance:{' '}
                <Text style={styles.budgetPillBold}>
                  {kitchenPass.currencySymbol}
                  {(kitchenPass.weeklyBudget - kitchenPass.spentThisWeek).toLocaleString()}
                </Text>{' '}
                left · {kitchenPass.remainingDaysInWeek} days
              </Text>
            </View>
            <Feather name="settings" size={14} color={colors.text.secondary} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Country & Currency Modal */}
      <CountryCurrencyModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
      />

      {/* Floating In-App Toast */}
      <TactileToast
        visible={!!toastMessage}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="discover"
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
  introductionBlock: {
    gap: 6,
  },
  introHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  emptyCard: {
    padding: 32,
    borderRadius: 20,
    backgroundColor: colors.snow100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Pass Reasons
  passReasonsContainer: {
    gap: 10,
    padding: 14,
    backgroundColor: colors.snow100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  passReasonsTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  reasonsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: colors.linen100,
    borderColor: colors.primary,
  },
  chipUnselected: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  reasonLabel: {
    fontSize: typography.fontSize.reassurance,
    lineHeight: 14,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  labelUnselected: {
    color: colors.text.secondary,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },

  // Budget Pill
  budgetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.linen100,
    borderWidth: 1,
    borderColor: colors.linen200,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  budgetPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  budgetPillText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  budgetPillBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default DiscoverYourNextMeal;
