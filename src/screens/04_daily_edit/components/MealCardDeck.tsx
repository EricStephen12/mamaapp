import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { RolledMeal } from '../../../services/api/rollService';
import { UserKitchenPass, convertMealCost } from '../../../services/preferencesStore';
import { MealImageService } from '../../../services/mealImageService';
import { VideoService, MealVideoData } from '../../../services/videoService';
import { MealVideoPlayer } from '../../../components/MealVideoPlayer';

interface MealCardDeckProps {
  meals: RolledMeal[];
  activeIndex: number;
  onSelectMealIndex: (index: number) => void;
  kitchenPass: UserKitchenPass;
  isRolling: boolean;
  onPressCard: () => void;
  onRollPress: () => void;
  onCyclePeriod?: () => void;
  headerTitle?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_WIDTH = Math.min(SCREEN_WIDTH - 20, 440);

// Extra-large, full-bleed center poster card dimensions
const CARD_WIDTH = Math.min(Math.round(CONTAINER_WIDTH * 0.84), 344);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.44); // ~460-495px tall
const CARD_GAP = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;
const SIDE_PADDING = Math.round((CONTAINER_WIDTH - CARD_WIDTH) / 2);

export const MealCardDeck: React.FC<MealCardDeckProps> = ({
  meals,
  activeIndex,
  onSelectMealIndex,
  kitchenPass,
  isRolling,
  onPressCard,
  onRollPress,
}) => {
  const flatListRef = useRef<FlatList<RolledMeal>>(null);
  const scrollX = useRef(new Animated.Value(activeIndex * SNAP_INTERVAL)).current;
  const isUserScrollingRef = useRef(false);
  const lastUserTouchRef = useRef<number>(0);

  const activeIndexRef = useRef(activeIndex);
  const mealsLengthRef = useRef(meals.length);
  const onSelectMealIndexRef = useRef(onSelectMealIndex);
  const isRollingRef = useRef(isRolling);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    mealsLengthRef.current = meals.length;
  }, [meals.length]);

  useEffect(() => {
    onSelectMealIndexRef.current = onSelectMealIndex;
  }, [onSelectMealIndex]);

  useEffect(() => {
    isRollingRef.current = isRolling;
  }, [isRolling]);

  const activeMeal = meals[activeIndex] || meals[0];
  const topMealTitle = meals[0]?.title || '';
  const deckImages = MealImageService.getCarouselDeckImages(
    meals,
    kitchenPass.cuisineAnchor
  );

  const [deckVideos, setDeckVideos] = useState<Record<string, MealVideoData | null>>({});
  const inFlightTitlesRef = useRef<Set<string>>(new Set());

  // Debounced active-card-only video resolution (450ms):
  // Prevents API spam when swiping rapidly across cards; only fetches the card the user actually settles on.
  useEffect(() => {
    const currentMeal = meals[activeIndex];
    const title = currentMeal?.title;
    if (!title || currentMeal.videoUrl || isRolling) return;

    // Instant 0ms hit if already in shared VideoService cache (rendered directly via getCachedVideo)
    if (VideoService.getCachedVideo(title)) {
      return;
    }

    let isCancelled = false;
    const debounceTimer = setTimeout(() => {
      if (isCancelled || inFlightTitlesRef.current.has(title)) return;
      inFlightTitlesRef.current.add(title);

      VideoService.resolveCookingVideo(title, currentMeal.ingredients?.map((i) => i.name))
        .then((videoData) => {
          if (!isCancelled && videoData) {
            setDeckVideos((prev) => ({ ...prev, [title]: videoData }));
          }
        })
        .finally(() => {
          inFlightTitlesRef.current.delete(title);
        });
    }, 450);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [activeIndex, meals, isRolling]);

  // Sync scroll position when activeIndex changes externally or when a new meal lands at index 0
  useEffect(() => {
    if (
      flatListRef.current &&
      activeIndex >= 0 &&
      activeIndex < meals.length &&
      (!isUserScrollingRef.current || activeIndex === 0)
    ) {
      isUserScrollingRef.current = false;
      activeIndexRef.current = activeIndex;
      flatListRef.current.scrollToOffset({
        offset: activeIndex * SNAP_INTERVAL,
        animated: true,
      });
    }
  }, [activeIndex, meals.length, topMealTitle]);

  const handleCardPress = (index: number) => {
    if (isRolling) return;
    lastUserTouchRef.current = Date.now();
    if (index === activeIndex) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      onPressCard();
    } else {
      // Tap on peeking side card glides it into center
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      activeIndexRef.current = index;
      flatListRef.current?.scrollToOffset({
        offset: index * SNAP_INTERVAL,
        animated: true,
      });
      onSelectMealIndex(index);
    }
  };

  const handleScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    setTimeout(() => {
      if (isUserScrollingRef.current) {
        isUserScrollingRef.current = false;
        const settledIndex = Math.max(
          0,
          Math.min(mealsLengthRef.current - 1, Math.round(offsetX / SNAP_INTERVAL))
        );
        if (settledIndex !== activeIndexRef.current) {
          activeIndexRef.current = settledIndex;
          onSelectMealIndexRef.current(settledIndex);
        }
      }
    }, 180);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserScrollingRef.current = false;
    lastUserTouchRef.current = Date.now();
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.max(
      0,
      Math.min(meals.length - 1, Math.round(contentOffsetX / SNAP_INTERVAL))
    );
    if (newIndex !== activeIndexRef.current) {
      activeIndexRef.current = newIndex;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      onSelectMealIndex(newIndex);
    }
  };

  const formattedCost = activeMeal
    ? convertMealCost(activeMeal.estCost, kitchenPass.currencyCode, kitchenPass.currencySymbol)
    : '';

  const renderCardItem = ({ item, index }: { item: RolledMeal; index: number }) => {
    // Strictly match image to dish title and ingredients (or item.imageUrl if present)
    const catalogImageUrl =
      item.imageUrl ||
      deckImages[index] ||
      MealImageService.resolveMealImage(
        item.title,
        item.ingredients,
        kitchenPass.cuisineAnchor
      );

    // Native Driver Interpolation for 60/120 FPS Tilt, Depth & Overlap
    const inputRange = [
      (index - 1) * SNAP_INTERVAL,
      index * SNAP_INTERVAL,
      (index + 1) * SNAP_INTERVAL,
    ];

    // THE TILT: +2.5deg when peeking on right -> 0deg in center -> -2.5deg when peeking on left
    const rotate = scrollX.interpolate({
      inputRange,
      outputRange: ['2.5deg', '0deg', '-2.5deg'],
      extrapolate: 'clamp',
    });

    // DEPTH SCALE: 0.91 when peeking -> 1.0 when active in center
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.91, 1.0, 0.91],
      extrapolate: 'clamp',
    });

    // TUCK TRANSLATION: subtle horizontal shift to hug the active card
    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [-10, 0, 10],
      extrapolate: 'clamp',
    });

    // OVERALL OPACITY: slightly faded when on sides
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.82, 1.0, 0.82],
      extrapolate: 'clamp',
    });

    // DARK TRANSLUCENT OVERLAY: matches the cinematic dimming in reference photo
    const dimOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.42, 0.0, 0.42],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.cardSlideWrapper,
          {
            transform: [{ translateX }, { scale }, { rotate }],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.centerPosterCard}
          onPress={() => handleCardPress(index)}
          activeOpacity={0.92}
        >
          {(() => {
            const videoData =
              deckVideos[item.title] ||
              VideoService.getCachedVideo(item.title) ||
              (item.videoUrl
                ? {
                    id: item.id || item.title,
                    videoUrl: item.videoUrl,
                    coverUrl: item.videoCover || catalogImageUrl,
                    title: item.title,
                    duration: 0,
                    author: item.videoAuthor || { nickname: 'Chef', unique_id: 'chef' },
                  }
                : null);

            if (videoData?.videoUrl) {
              return (
                <MealVideoPlayer
                  videoId={videoData.id}
                  videoUrl={videoData.videoUrl}
                  posterUrl={videoData.coverUrl || catalogImageUrl}
                  isActive={index === activeIndex && !isRolling}
                  creator={videoData.author}
                />
              );
            }

            return (
              <Image
                key={`${item.title}-${catalogImageUrl.slice(-36)}`}
                source={{ uri: catalogImageUrl }}
                style={styles.centerPosterImage}
                resizeMode="cover"
              />
            );
          })()}

          {/* Dark translucent overlay that fades away when card centers */}
          <Animated.View style={[styles.cardDimOverlay, { opacity: dimOpacity }]} pointerEvents="none" />

          {/* Time Pill (Top Left) */}
          <View style={styles.posterTimePill}>
            <Ionicons name="time" size={12} color="#FFFFFF" />
            <Text style={styles.posterTimeText}>{item.cookTimeMinutes} MIN</Text>
          </View>

          {/* Check This Food CTA Badge (Bottom Right) */}
          <View style={styles.posterTapPill}>
            <Text style={styles.posterTapText}>Check this food</Text>
            <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
          </View>

          {/* Live AI Processing Scrim when rolling a new meal */}
          {isRolling && index === activeIndex && (
            <View style={styles.rollingCardOverlay}>
              <View style={styles.rollingBadgePill}>
                <Ionicons name="dice-outline" size={14} color="#FBBF24" />
                <Text style={styles.rollingBadgeText}>MAMA AI IS COOKING</Text>
              </View>
              <Text style={styles.rollingOverlayTitle}>
                Creating a fresh meal for you...
              </Text>
              <Text style={styles.rollingOverlaySub}>
                Checking your kitchen & preferences
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.modalCardContainer}>
      {/* 1. THE FULL-SPACE AUTO-SCROLLING TILTED CAROUSEL */}
      <View style={styles.carouselStage}>
        <Animated.FlatList
          ref={flatListRef}
          data={meals}
          extraData={{ deckVideos, activeIndex, isRolling }}
          keyExtractor={(item, index) => `${item.id || item.title}-${index}`}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SNAP_INTERVAL}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.flatListContent}
          getItemLayout={(_, index) => ({
            length: SNAP_INTERVAL,
            offset: SNAP_INTERVAL * index,
            index,
          })}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={false}
          onScrollBeginDrag={() => {
            isUserScrollingRef.current = true;
            lastUserTouchRef.current = Date.now();
          }}
          onScrollEndDrag={handleScrollEndDrag}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={renderCardItem}
        />
      </View>

      {/* 2. DISH TITLE & INGREDIENT HINT */}
      {isRolling ? (
        <View style={styles.titleSection}>
          <Text style={styles.dishTitleText} numberOfLines={2}>
            Mama is cooking up a fresh idea...
          </Text>
          <View style={styles.pantryNoteBadge}>
            <Ionicons name="sparkles-outline" size={11} color={colors.primary} />
            <Text style={styles.pantryNoteText} numberOfLines={1}>
              Wait a moment while Mama plates your new meal
            </Text>
          </View>
        </View>
      ) : activeMeal ? (
        <View style={styles.titleSection}>
          <Text style={styles.dishTitleText} numberOfLines={2}>
            {activeMeal.title}
          </Text>

          {/* 3. STATS / METADATA PILLS ROW (Directly beneath title) */}
          <View style={styles.metaRow}>
            {/* Cook Time */}
            <View style={styles.metaPill}>
              <Ionicons name="play" size={10} color={colors.primary} />
              <Text style={styles.metaPillText}>{activeMeal.cookTimeMinutes} MIN</Text>
            </View>

            {/* Price / Budget */}
            <View style={styles.metaPill}>
              <Ionicons name="trending-up" size={11} color={colors.primary} />
              <Text style={styles.metaPillText}>{formattedCost}</Text>
            </View>

            {/* Goal / Gear */}
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>
                {kitchenPass.bodyGoalLabel || kitchenPass.cookingGearLabel || '1 PAN'}
              </Text>
            </View>
          </View>

          {/* Pantry / Market Match Pill */}
          {activeMeal.pantryNote ? (
            <View style={styles.pantryNoteBadge}>
              <Ionicons name="basket-outline" size={11} color={colors.primary} />
              <Text style={styles.pantryNoteText} numberOfLines={1}>
                {activeMeal.pantryNote}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* 4. PRIMARY ACTION BUTTON (Roll Dice) */}
      <View style={styles.bottomActionsWrap}>
        <TouchableOpacity
          style={[styles.bigRollPillButton, isRolling && styles.bigRollPillDisabled]}
          onPress={onRollPress}
          disabled={isRolling}
          activeOpacity={0.88}
        >
          <Ionicons name="dice" size={20} color="#FFFFFF" />
          <Text style={styles.bigRollPillText}>
            {isRolling ? 'Mama is rolling...' : 'Roll Dice'}
          </Text>
          <Ionicons name="shuffle" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalCardContainer: {
    width: '100%',
    maxWidth: CONTAINER_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 10,
    paddingBottom: 14,
    marginVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  headerTitleGroup: {
    gap: 1,
  },
  headerTitleText: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  headerSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  headerCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(36, 40, 32, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselStage: {
    width: '100%',
    height: CARD_HEIGHT + 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  flatListContent: {
    paddingHorizontal: SIDE_PADDING,
    alignItems: 'center',
  },
  cardSlideWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_GAP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPosterCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.snow200,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 9,
    position: 'relative',
  },
  imageFillLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerPosterImage: {
    width: '100%',
    height: '100%',
  },
  cardDimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(24, 28, 22, 0.45)',
  },
  posterTimePill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18, 22, 16, 0.72)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  posterTimeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  posterTapPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(18, 22, 16, 0.76)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  posterTapText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rollingCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 22, 16, 0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  rollingBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  rollingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.8,
  },
  rollingOverlayTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
  },
  rollingOverlaySub: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.78)',
    textAlign: 'center',
  },
  titleSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 18,
    gap: 8,
  },
  dishTitleText: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 19,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(102, 112, 74, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  pantryNoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(46, 61, 43, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 2,
  },
  pantryNoteText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomActionsWrap: {
    width: '100%',
    paddingHorizontal: 18,
  },
  bigRollPillButton: {
    width: '100%',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  bigRollPillDisabled: {
    opacity: 0.72,
  },
  diceHolder: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigRollPillText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  recipeStepLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  recipeStepLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
