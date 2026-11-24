import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
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
import { isMealDietCompliant, getCurrentTimeOfDay } from '../../services/api/rollService';
import { KitchenAtmosphere } from '../../components/signature/KitchenAtmosphere';
import { RegionalMamaAvatar } from '../../components/signature/RegionalMamaAvatar';
import { SteamWisps } from '../../components/signature/SteamWisps';
import { MamaPlatePlaceholder } from '../../components/common/MamaPlatePlaceholder';
import { VideoService, MealVideoData } from '../../services/videoService';
import { MealVideoPlayer } from '../../components/MealVideoPlayer';

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

export const DiscoverYourNextMeal: React.FC<Props> = ({ navigation }) => {
  const { isInsideTabs, activeTab, setActiveTab } = useTabNavigation();
  const isDiscoverVisible = !isInsideTabs || activeTab === 'discover';
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
  const [apiDeckState, setApiDeckState] = useState<{
    regionKey: string;
    meals: RawDiscoveryItem[];
    status: 'loading' | 'ready' | 'error';
  }>({ regionKey: '', meals: [], status: 'loading' });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [visiblePostId, setVisiblePostId] = useState<string | null>(null);
  const [postVideos, setPostVideos] = useState<Record<string, MealVideoData>>({});
  const inFlightVideoRef = useRef<Set<string>>(new Set());
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: { isViewable?: boolean | null; item?: FeedPostItem }[] }) => {
      const firstVisible = viewableItems.find((v) => v.isViewable && v.item?.id);
      if (firstVisible?.item?.id) {
        setVisiblePostId(firstVisible.item.id);
      }
    }
  ).current;

  const contentFade = useRef(new Animated.Value(0)).current;
  const hasActivatedRef = useRef<boolean>(isDiscoverVisible);
  useEffect(() => {
    if (isDiscoverVisible) {
      hasActivatedRef.current = true;
    }
  }, [isDiscoverVisible]);

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
  const regionKey = `${kitchenPass.country}|${kitchenPass.cuisineAnchor}|${retryNonce}`;

  useEffect(() => {
    // Do not hammer LLM from hidden tab during initial Home boot; wait until Discover is opened.
    if (!isDiscoverVisible && !hasActivatedRef.current) {
      return;
    }
    let isMounted = true;
    const requestRegionKey = `${kitchenPass.country}|${kitchenPass.cuisineAnchor}|${retryNonce}`;
    AiMamaService.generateDiscoverDeck(kitchenPass, pantryItems)
      .then((meals) => {
        if (!isMounted) return;
        if (Array.isArray(meals) && meals.length > 0) {
          setApiDeckState({ regionKey: requestRegionKey, meals, status: 'ready' });
        } else {
          setApiDeckState({ regionKey: requestRegionKey, meals: [], status: 'error' });
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiDeckState({ regionKey: requestRegionKey, meals: [], status: 'error' });
        }
      });
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDiscoverVisible,
    kitchenPass.timeLimitMinutes,
    kitchenPass.cookingGear,
    kitchenPass.cuisineAnchor,
    kitchenPass.country,
    kitchenPass.bodyGoal,
    dietKey,
    pantrySig,
    retryNonce,
  ]);

  const isFeedLoading = apiDeckState.regionKey !== regionKey || apiDeckState.status === 'loading';

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || isFeedLoading) return;
    setIsLoadingMore(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const existingTitles = apiDeckState.meals.map((m) => m.title);
      const moreMeals = await AiMamaService.generateDiscoverDeck(
        kitchenPass,
        pantryItems,
        existingTitles
      );
      if (Array.isArray(moreMeals) && moreMeals.length > 0) {
        setApiDeckState((prev) => {
          if (prev.regionKey !== regionKey) return prev;
          const seen = new Set(prev.meals.map((m) => m.title.toLowerCase()));
          const fresh = moreMeals.filter((m) => !seen.has(m.title.toLowerCase()));
          return {
            ...prev,
            meals: [...prev.meals, ...fresh],
            status: 'ready',
          };
        });
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [apiDeckState.meals, isFeedLoading, isLoadingMore, kitchenPass, pantryItems, regionKey]);

  const filteredRawDeck = useMemo<RawDiscoveryItem[]>(() => {
    const activeApiMeals = apiDeckState.regionKey === regionKey ? apiDeckState.meals : [];
    const neverShow = (kitchenPass.neverShowDishes || []).map((t) => t.toLowerCase());
    const seen = new Set<string>();
    const combined = activeApiMeals.filter((m) => {
      const key = m.title.toLowerCase();
      if (seen.has(key) || neverShow.includes(key)) return false;
      seen.add(key);
      return isMealDietCompliant(
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
      );
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
  }, [activeFilter, apiDeckState, regionKey, kitchenPass]);

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
        resolvedImage: item.imageUrl || deckPhotos[idx],
        formattedCost: convertMealCost(
          item.baseCostUsd,
          kitchenPass.currencyCode,
          kitchenPass.currencySymbol
        ),
        matchingPantryCount,
      };
    });
  }, [filteredRawDeck, kitchenPass.currencyCode, kitchenPass.currencySymbol, kitchenPass.cuisineAnchor, pantryItems]);

  const activePostId =
    visiblePostId && feedPosts.some((p) => p.id === visiblePostId)
      ? visiblePostId
      : feedPosts[0]?.id || null;

  // Debounced viewport-aware video lookup: only fetches for the single centered post when Discover is active
  useEffect(() => {
    if (!isDiscoverVisible || !activePostId) return;
    const activePost = feedPosts.find((p) => p.id === activePostId);
    const title = activePost?.title;
    if (!title) return;

    if (VideoService.getCachedVideo(title)) return;

    let isCancelled = false;
    const timer = setTimeout(() => {
      if (isCancelled || inFlightVideoRef.current.has(title)) return;
      inFlightVideoRef.current.add(title);

      VideoService.resolveCookingVideo(
        title,
        activePost.ingredients?.map((i) => i.name)
      )
        .then((videoData) => {
          if (!isCancelled && videoData) {
            setPostVideos((prev) => ({ ...prev, [title]: videoData }));
          }
        })
        .finally(() => {
          inFlightVideoRef.current.delete(title);
        });
    }, 450);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isDiscoverVisible, activePostId, feedPosts]);

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
    const isCardActive = isDiscoverVisible && item.id === activePostId;
    const videoData = postVideos[item.title] || VideoService.getCachedVideo(item.title);

    return (
      <TouchableOpacity
        style={styles.feedCard}
        activeOpacity={0.94}
        onPress={() => handleOpenPostDetails(item)}
      >
        {videoData?.videoUrl ? (
          <MealVideoPlayer
            videoId={videoData.id}
            videoUrl={videoData.videoUrl}
            posterUrl={
              !MealImageService.isPlaceholderImage(videoData.coverUrl)
                ? videoData.coverUrl
                : undefined
            }
            isActive={isCardActive}
            creator={videoData.author}
            soundPillTop={14}
            creatorPillBottom={108}
          />
        ) : MealImageService.isPlaceholderImage(item.resolvedImage) ? (
          <MamaPlatePlaceholder variant="dark" iconSize={104} />
        ) : (
          <Image
            source={{ uri: item.resolvedImage }}
            style={styles.feedImage}
            resizeMode="cover"
          />
        )}

        {/* Delicate rising steam on the centered post */}
        {isCardActive ? (
          <SteamWisps triggerKey={`discover-${item.id}`} style={styles.feedSteamOverlay} />
        ) : null}

        {/* Clean Bottom Scrim: Dish Title + Time/Cost + Heart Icon */}
        <View style={styles.feedBottomScrim}>
          <Text style={styles.feedTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.feedBottomMetaRow}>
            <Text style={styles.feedTimeCostText}>
              {item.cookTimeOrDistance} · {item.formattedCost}
            </Text>

            <TouchableOpacity
              style={[styles.heartCircleBtn, isLiked && styles.heartCircleBtnActive]}
              onPress={(e) => {
                e.stopPropagation();
                handleToggleLikePost(item);
              }}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel={isLiked ? 'Remove from saved' : 'Save meal'}
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <KitchenAtmosphere period={getCurrentTimeOfDay()} />

      {/* 1. CLEAN TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <RegionalMamaAvatar
            countryCode={kitchenPass.country}
            cuisineAnchor={kitchenPass.cuisineAnchor}
            size={36}
            onPress={() => setPassModalVisible(true)}
          />
          <Text style={styles.brandTitle}>Mama</Text>
          <Text style={styles.periodPillText}>Discover</Text>
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
            <Text style={styles.headerChipText}>
              {pantryItems.length > 0
                ? `${pantryItems.length} ${pantryItems.length === 1 ? 'item' : 'items'}`
                : 'Kitchen'}
            </Text>
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

      {/* 2. MINIMAL FILTER ROW */}
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
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. VERTICAL SCROLLING LIVE VIDEO FOOD FEED */}
      <Animated.View style={{ flex: 1, opacity: contentFade }}>
        <FlatList
          data={feedPosts}
          extraData={{ activePostId, postVideos, isDiscoverVisible, savedItemIds, isLoadingMore }}
          keyExtractor={(item) => item.id}
          renderItem={renderFeedPost}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.feedListContent,
            { paddingBottom: isInsideTabs ? 28 : 110 },
          ]}
          initialNumToRender={3}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListEmptyComponent={
            <View style={styles.emptyFeedBox}>
              {isFeedLoading ? (
                <>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.emptyFeedTitle}>
                    Finding fresh {kitchenPass.countryName} home ideas
                  </Text>
                  <Text style={styles.emptyFeedSub}>
                    Tailoring dishes to your kitchen and local ingredients...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="compass-outline" size={32} color={colors.primary} />
                  <Text style={styles.emptyFeedTitle}>
                    Couldn&apos;t load {kitchenPass.countryName} ideas
                  </Text>
                  <Text style={styles.emptyFeedSub}>
                    Check your connection and tap below to refresh.
                  </Text>
                  <TouchableOpacity
                    style={styles.retryFeedBtn}
                    onPress={() => setRetryNonce((n) => n + 1)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    <Text style={styles.retryFeedBtnText}>Try Again</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          }
          ListFooterComponent={
            feedPosts.length > 0 ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={handleLoadMore}
                activeOpacity={0.84}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
                    <Text style={styles.loadMoreBtnText}>
                      More {kitchenPass.countryName} Dishes
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : undefined
          }
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
    alignItems: 'center',
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
    fontSize: 14.5,
    fontWeight: '700',
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
    fontSize: 13.5,
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
    height: 410,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1E211B',
    justifyContent: 'flex-end',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  heartCircleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  feedSteamOverlay: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    zIndex: 15,
  },
  feedSealBadge: {
    position: 'absolute',
    top: 56,
    left: 16,
    zIndex: 15,
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
    fontSize: 14.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.92)',
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
  emptyFeedBox: {
    marginTop: 48,
    marginHorizontal: 18,
    paddingVertical: 44,
    paddingHorizontal: 26,
    borderRadius: 24,
    backgroundColor: colors.linen200,
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyFeedTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyFeedSub: {
    fontSize: 14.5,
    lineHeight: 20,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryFeedBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
  },
  retryFeedBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loadMoreBtn: {
    marginTop: 8,
    marginBottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(102, 112, 74, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.3)',
    minWidth: 210,
  },
  loadMoreBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.primary,
  },
});

export default DiscoverYourNextMeal;
