import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { RolledMeal } from '../../../services/api/rollService';
import { UserKitchenPass, convertMealCost } from '../../../services/preferencesStore';
import { MealImageService } from '../../../services/mealImageService';
import { RollingDice } from '../../../components/common/RollingDice';

interface RollRevealModalProps {
  visible: boolean;
  meal: RolledMeal | null;
  deckMeals: RolledMeal[];
  isRolling: boolean;
  kitchenPass: UserKitchenPass;
  onClose: () => void;
  onCookNow: () => void;
  onSpinAgain: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = Math.min(SCREEN_WIDTH - 40, 356);

const MAMA_ROLL_HINTS = [
  'Mama is checking your kitchen...',
  'Balancing spices & quick cook time...',
  'Creating an authentic home recipe...',
  'Plating your dish...',
];

export const RollRevealModal: React.FC<RollRevealModalProps> = ({
  visible,
  meal,
  deckMeals,
  isRolling,
  kitchenPass,
  onClose,
  onCookNow,
  onSpinAgain,
}) => {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const diceOpacity = useRef(new Animated.Value(1)).current;
  const diceScale = useRef(new Animated.Value(0.88)).current;

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const cardTranslateY = useRef(new Animated.Value(28)).current;

  const [isRevealed, setIsRevealed] = useState(false);
  const [rollCycleKey, setRollCycleKey] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);
  const diceAnimFinishedRef = useRef(false);
  const hasTriggeredRevealRef = useRef(false);
  const isRollingRef = useRef(isRolling);
  const mealRef = useRef<RolledMeal | null>(meal);
  const isWaitingForAi = isRolling || !meal;

  useEffect(() => {
    isRollingRef.current = isRolling;
  }, [isRolling]);

  useEffect(() => {
    mealRef.current = meal;
  }, [meal]);

  useEffect(() => {
    if (!visible || !isWaitingForAi) return;
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % MAMA_ROLL_HINTS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [visible, isWaitingForAi]);

  const runLuxuryRevealTransition = useCallback(() => {
    if (hasTriggeredRevealRef.current) return;
    hasTriggeredRevealRef.current = true;
    setIsRevealed(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.timing(diceOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(diceScale, {
        toValue: 0.72,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(70),
        Animated.parallel([
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(cardScale, {
            toValue: 1,
            damping: 16,
            stiffness: 140,
            mass: 0.85,
            useNativeDriver: true,
          }),
          Animated.spring(cardTranslateY, {
            toValue: 0,
            damping: 16,
            stiffness: 140,
            mass: 0.85,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [diceOpacity, diceScale, cardOpacity, cardScale, cardTranslateY]);

  useEffect(() => {
    if (!visible) {
      backdropOpacity.setValue(0);
      diceOpacity.setValue(1);
      diceScale.setValue(0.88);
      cardOpacity.setValue(0);
      cardScale.setValue(0.88);
      cardTranslateY.setValue(28);
      diceAnimFinishedRef.current = false;
      hasTriggeredRevealRef.current = false;
      return;
    }

    diceAnimFinishedRef.current = false;
    hasTriggeredRevealRef.current = false;
    diceOpacity.setValue(1);
    diceScale.setValue(0.88);
    cardOpacity.setValue(0);
    cardScale.setValue(0.88);
    cardTranslateY.setValue(28);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(diceScale, {
        toValue: 1,
        damping: 14,
        stiffness: 140,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    visible,
    rollCycleKey,
    backdropOpacity,
    diceOpacity,
    diceScale,
    cardOpacity,
    cardScale,
    cardTranslateY,
  ]);

  useEffect(() => {
    if (visible && !isRevealed && !isRolling && meal && diceAnimFinishedRef.current) {
      runLuxuryRevealTransition();
    }
  }, [visible, isRevealed, isRolling, meal, runLuxuryRevealTransition]);

  const handleDiceComplete = useCallback(() => {
    diceAnimFinishedRef.current = true;
    if (!isRollingRef.current && mealRef.current) {
      runLuxuryRevealTransition();
    }
    // Otherwise the AI is still generating: the effect above reveals the card the moment
    // isRolling flips to false and meal arrives.
  }, [runLuxuryRevealTransition]);

  const handleClose = () => {
    setIsRevealed(false);
    onClose();
  };

  const handleRollAgainPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.9,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsRevealed(false);
      diceAnimFinishedRef.current = false;
      hasTriggeredRevealRef.current = false;
      setRollCycleKey((prev) => prev + 1);
      onSpinAgain();
    });
  };

  if (!visible) return null;

  const deckImages = MealImageService.getCarouselDeckImages(
    deckMeals,
    kitchenPass.cuisineAnchor
  );
  const mealIdx = meal ? deckMeals.findIndex((m) => m.title === meal.title) : -1;
  const imageUri = meal
    ? meal.imageUrl ||
      (mealIdx >= 0 ? deckImages[mealIdx] : undefined) ||
      MealImageService.getFallbackMealImage(
        meal.title,
        meal.ingredients,
        kitchenPass.cuisineAnchor
      )
    : '';

  const formattedHomeCost = meal
    ? convertMealCost(
        meal.estCost,
        kitchenPass.currencyCode,
        kitchenPass.currencySymbol
      )
    : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          style={styles.backdropDismissArea}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* STAGE 1: PURE MINIMAL 3D DICE & LIVE MAMA HINTS */}
        <Animated.View
          pointerEvents={isRevealed ? 'none' : 'auto'}
          style={[
            styles.diceStageOverlay,
            {
              opacity: diceOpacity,
              transform: [{ scale: diceScale }],
            },
          ]}
        >
          {/* Always accessible close button so the user is never trapped */}
          <TouchableOpacity
            style={styles.stageOneCloseBtn}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.85)" />
          </TouchableOpacity>

          <RollingDice
            key={`luxury-dice-${rollCycleKey}`}
            size={156}
            isRolling={isWaitingForAi}
            onRollComplete={handleDiceComplete}
          />
          {isWaitingForAi && (
            <View style={styles.rollingHintWrap}>
              <Text style={styles.rollingHintText}>{MAMA_ROLL_HINTS[hintIndex]}</Text>
            </View>
          )}
        </Animated.View>

        {/* STAGE 2: MINIMAL LUXURY EDITORIAL CARD */}
        <Animated.View
          pointerEvents={isRevealed && meal ? 'auto' : 'none'}
          style={[
            styles.luxuryCard,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }, { scale: cardScale }],
            },
          ]}
        >
          {meal ? (
            <>
              {/* Full-Bleed Portrait Food Photography */}
              <View style={styles.imagePosterWrap}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.posterImage}
                  resizeMode="cover"
                />

                {/* Subtle Close Circle */}
                <TouchableOpacity
                  style={styles.closeIconBtn}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Minimal Editorial Title & Meta Line */}
              <View style={styles.editorialBody}>
                <Text style={styles.dishTitle} numberOfLines={2}>
                  {meal.title}
                </Text>
                <Text style={styles.metaLine}>
                  {meal.cookTimeMinutes} min  ·  {formattedHomeCost}
                </Text>
                {meal.pantryNote ? (
                  <View style={styles.pantryBadgeWrap}>
                    <Ionicons name="basket-outline" size={12} color={colors.primary} />
                    <Text style={styles.pantryBadgeText} numberOfLines={1}>
                      {meal.pantryNote}
                    </Text>
                  </View>
                ) : null}
                {meal.source === 'catalog' ? (
                  <Text style={styles.offlineNote}>Mama AI was unreachable · showing a house classic</Text>
                ) : null}
              </View>

              {/* Clean Action Bar: Re-Roll Icon Button + Single Primary CTA */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.rerollCircleBtn}
                  onPress={handleRollAgainPress}
                  activeOpacity={0.8}
                >
                  <Ionicons name="dice-outline" size={22} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewRecipeBtn}
                  onPress={() => {
                    setIsRevealed(false);
                    onCookNow();
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={styles.viewRecipeBtnText}>View Recipe</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 17, 13, 0.84)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdropDismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  diceStageOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageOneCloseBtn: {
    position: 'absolute',
    top: -70,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  rollingHintWrap: {
    marginTop: 22,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  rollingHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FAF7F2',
    letterSpacing: 0.3,
  },
  luxuryCard: {
    width: '100%',
    maxWidth: MODAL_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 18,
    gap: 14,
  },
  imagePosterWrap: {
    width: '100%',
    height: 340,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.snow200,
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  closeIconBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(18, 22, 16, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorialBody: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 4,
  },
  dishTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  metaLine: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.2,
  },
  pantryBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(46, 61, 43, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  pantryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  offlineNote: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  rerollCircleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.snow200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewRecipeBtn: {
    flex: 1,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewRecipeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
});
