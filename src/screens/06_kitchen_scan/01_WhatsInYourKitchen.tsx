import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
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
import {
  AiMamaService,
  AIRecipeResult,
  buildIntelligentPantryRecipe,
} from '../../services/aiMamaService';
import { MealImageService } from '../../services/mealImageService';
import { KitchenPassModal } from '../../components/common/KitchenPassModal';
import { TactileToast } from '../../components/common/TactileToast';
import { preferencesStore } from '../../services/preferencesStore';
import { pantryService } from '../../services/api/pantryService';

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
  const matchCardScale = useRef(new Animated.Value(1)).current;

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

  const instantRecipe = useMemo(() => {
    return buildIntelligentPantryRecipe(kitchenItems, pass);
  }, [kitchenItems, pass]);

  const pantryKey = useMemo(
    () =>
      `${[...kitchenItems]
        .map((i) => i.toLowerCase().trim())
        .sort()
        .join(',')}|${pass.cuisineAnchor}|${pass.bodyGoal}`,
    [kitchenItems, pass.cuisineAnchor, pass.bodyGoal]
  );

  const [aiMatchedEntry, setAiMatchedEntry] = useState<{
    key: string;
    recipe: AIRecipeResult;
  } | null>(null);
  const [aiSettledKey, setAiSettledKey] = useState<string>('');
  const [aiMatchedPhoto, setAiMatchedPhoto] = useState<{ title: string; url: string } | null>(null);

  useEffect(() => {
    if (kitchenItems.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      AiMamaService.generateRecipeFromPantry(kitchenItems, pass)
        .then(async (res) => {
          if (cancelled) return;
          if (res && res.title) {
            const photoPromise = MealImageService.generateMealImage(
              res.title,
              res.ingredients,
              pass.cuisineAnchor
            ).catch(() => null);
            const fastPhotoUrl = await Promise.race([
              photoPromise,
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
            ]);
            if (cancelled) return;
            if (fastPhotoUrl) {
              setAiMatchedPhoto({ title: res.title, url: fastPhotoUrl });
            } else {
              photoPromise.then((lateUrl) => {
                if (!cancelled && lateUrl) {
                  setAiMatchedPhoto({ title: res.title, url: lateUrl });
                }
              });
            }
            setAiMatchedEntry({ key: pantryKey, recipe: res });
          }
          setAiSettledKey(pantryKey);
        })
        .catch(() => {
          if (!cancelled) {
            setAiSettledKey(pantryKey);
          }
        });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [kitchenItems, pass, pantryKey]);

  const isAiMatching = kitchenItems.length > 0 && aiSettledKey !== pantryKey;
  const activeAiRecipe =
    aiMatchedEntry && aiMatchedEntry.key === pantryKey ? aiMatchedEntry.recipe : null;
  const matchedRecipe =
    activeAiRecipe && kitchenItems.length > 0 ? activeAiRecipe : instantRecipe;

  useEffect(() => {
    if (isAiMatching) return;
    let isMounted = true;
    MealImageService.generateMealImage(
      matchedRecipe.title,
      matchedRecipe.ingredients,
      pass.cuisineAnchor
    )
      .then((url) => {
        if (isMounted && url) {
          setAiMatchedPhoto({ title: matchedRecipe.title, url });
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isAiMatching, matchedRecipe.title, matchedRecipe.ingredients, pass.cuisineAnchor]);

  const matchedImage = useMemo(() => {
    if (aiMatchedPhoto && aiMatchedPhoto.title === matchedRecipe.title) {
      return aiMatchedPhoto.url;
    }
    return MealImageService.resolveMealImage(
      matchedRecipe.title,
      matchedRecipe.ingredients,
      pass.cuisineAnchor
    );
  }, [aiMatchedPhoto, matchedRecipe.title, matchedRecipe.ingredients, pass.cuisineAnchor]);

  const pulseMatchCard = () => {
    matchCardScale.setValue(0.97);
    Animated.spring(matchCardScale, {
      toValue: 1,
      friction: 6,
      tension: 110,
      useNativeDriver: true,
    }).start();
  };

  const toggleItem = (item: string) => {
    Haptics.selectionAsync().catch(() => {});
    pulseMatchCard();

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
    pulseMatchCard();

    const updated = [formatted, ...kitchenItems];
    setKitchenItems(updated);
    pantryService.syncItems(updated.map((name) => ({ name, category: 'pantryStaples' })));
    setToastMessage(`Added ${formatted}`);
    setCustomItemInput('');
    Keyboard.dismiss();
  };

  const handleClearKitchen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    pulseMatchCard();
    setKitchenItems([]);
    setAiMatchedEntry(null);
    setAiSettledKey('');
    pantryService.syncItems([]);
    setToastMessage('Kitchen cleared · Showing 3-staple market run');
  };

  const handleCookMatchedMeal = () => {
    if (isAiMatching) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    navigation.navigate('AtHomeMealDetails', {
      id: `pantry-meal-${matchedRecipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: matchedRecipe.title,
      subtitle: matchedRecipe.subtitle,
      cookTime: matchedRecipe.cookTime,
      gear: matchedRecipe.gear || pass.cookingGearLabel || '1 Pan',
      estCost: matchedRecipe.estCost,
      costNumeric: 1.8,
      image: matchedImage,
      steps: matchedRecipe.steps,
      ingredients: matchedRecipe.ingredients,
      mamaTip: matchedRecipe.chefTip,
    });
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

      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.brandGroup}>
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
            {/* 1. LIVE VISUAL DISH MATCH HERO CARD */}
            <Animated.View style={{ transform: [{ scale: matchCardScale }] }}>
              <TouchableOpacity
                style={styles.heroMatchCard}
                onPress={handleCookMatchedMeal}
                disabled={isAiMatching}
                activeOpacity={0.93}
              >
                {!isAiMatching && (
                  <Image
                    source={{ uri: matchedImage }}
                    style={styles.heroMatchImage}
                    resizeMode="cover"
                  />
                )}

                {/* Top Floating Pills */}
                <View style={styles.heroTopRow}>
                  <View style={styles.heroBadgeDark}>
                    <Ionicons
                      name={
                        isAiMatching
                          ? 'sparkles'
                          : kitchenItems.length > 0
                          ? 'flame'
                          : 'cart-outline'
                      }
                      size={12}
                      color="#FBBF24"
                    />
                    <Text style={styles.heroBadgeDarkText}>
                      {isAiMatching
                        ? 'MAMA AI IS MATCHING...'
                        : kitchenItems.length > 0
                        ? 'INSTANT MATCH'
                        : 'MARKET RUN · 3 STAPLES'}
                    </Text>
                  </View>

                  <View style={styles.heroBadgeCost}>
                    <Text style={styles.heroBadgeCostText}>
                      {isAiMatching
                        ? `${kitchenItems.length} ${kitchenItems.length === 1 ? 'ITEM' : 'ITEMS'}`
                        : `${matchedRecipe.cookTime} · ${matchedRecipe.estCost}`}
                    </Text>
                  </View>
                </View>

                {/* Bottom Scrim + Title + Action */}
                <View style={styles.heroBottomScrim}>
                  <Text style={styles.heroMatchTitle} numberOfLines={2}>
                    {isAiMatching
                      ? `Matching your ${kitchenItems.slice(0, 3).join(', ')}...`
                      : matchedRecipe.title}
                  </Text>

                  <View style={styles.heroActionRow}>
                    <View style={styles.heroMetaPill}>
                      <Ionicons
                        name={isAiMatching ? 'hourglass-outline' : 'time-outline'}
                        size={13}
                        color="rgba(255, 255, 255, 0.85)"
                      />
                      <Text style={styles.heroMetaText}>
                        {isAiMatching
                          ? 'Mama AI is creating a fresh recipe'
                          : `${matchedRecipe.cookTime} · ${matchedRecipe.gear || pass.cookingGearLabel || '1 Pan'}`}
                      </Text>
                    </View>

                    {!isAiMatching && (
                      <View style={styles.heroCtaBtn}>
                        <Text style={styles.heroCtaText}>Cook now</Text>
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* 2. UNIFIED KITCHEN INGREDIENTS STUDIO */}
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
    backgroundColor: colors.snow100,
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
    alignItems: 'baseline',
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

  /* 1. HERO VISUAL DISH MATCH CARD */
  heroMatchCard: {
    height: 256,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#1E211B',
    justifyContent: 'space-between',
    shadowColor: '#181512',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 8,
  },
  heroMatchImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroBadgeDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(18, 20, 16, 0.72)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  heroBadgeDarkText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  heroBadgeCost: {
    backgroundColor: 'rgba(18, 20, 16, 0.72)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  heroBadgeCostText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroBottomScrim: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 18,
    backgroundColor: 'rgba(18, 20, 16, 0.74)',
    gap: 12,
  },
  heroMatchTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroCtaBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* 2. UNIFIED PANTRY STUDIO */
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
