import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { MamaCharacter, MamaPose } from '../../components/common/MamaCharacter';
import { TactileToast } from '../../components/common/TactileToast';
import { mamaAlert } from '../../services/mamaAlert';
import {
  preferencesStore,
  convertMealCost,
} from '../../services/preferencesStore';
import { savedMealsService } from '../../services/api/savedMealsService';
import { decisionsService } from '../../services/api/decisionsService';
import { pantryService } from '../../services/api/pantryService';
import { MamaDialogueService } from '../../services/mamaDialogueService';
import { AiMamaService } from '../../services/aiMamaService';
import { getCurrentTimeOfDay } from '../../services/api/rollService';
import { MealImageService } from '../../services/mealImageService';
import { VideoService, MealVideoData } from '../../services/videoService';
import { MealVideoPlayer } from '../../components/MealVideoPlayer';
import { KitchenAtmosphere } from '../../components/signature/KitchenAtmosphere';
import { SteamWisps } from '../../components/signature/SteamWisps';
import { MamaSealStamp, KitchenTicketDivider } from '../../components/signature/MamaSealStamp';
import { MamaPlatePlaceholder } from '../../components/common/MamaPlatePlaceholder';
import { InteractiveCookModal } from './components/InteractiveCookModal';
import { MamaFamilyCelebrationModal } from '../../components/common/MamaFamilyCelebrationModal';

type Props = NativeStackScreenProps<RootStackParamList, 'AtHomeMealDetails'>;

const scaleIngredientAmount = (amount: string, portions: 1 | 2): string => {
  if (portions === 1 || !amount) return amount;
  if (/^1\/2\b/.test(amount.trim())) {
    return amount.replace(/^1\/2/, '1');
  }
  if (/^1\/4\b/.test(amount.trim())) {
    return amount.replace(/^1\/4/, '1/2');
  }
  return amount.replace(/(\d+(?:\.\d+)?)/, (match) => {
    const val = parseFloat(match);
    if (isNaN(val)) return match;
    const doubled = val * 2;
    return Number.isInteger(doubled) ? String(doubled) : doubled.toFixed(1);
  });
};

const getIngredientSubstituteTip = (ingredientName: string): string => {
  const lower = ingredientName.toLowerCase();
  if (lower.includes('plantain') || lower.includes('dodo')) {
    return 'No plantain? Boiled yam, sweet potato, or toasted bread works well on the side.';
  }
  if (lower.includes('egg')) {
    return 'Out of eggs? Canned sardines, tuna, or diced tofu can step in for protein.';
  }
  if (lower.includes('tomato')) {
    return 'No fresh tomatoes? A spoon of tomato paste with a splash of water works cleanly.';
  }
  if (lower.includes('pepper') || lower.includes('rodo')) {
    return 'Out of fresh pepper? Dry chili flakes or Cameroon pepper gives that same warm kick.';
  }
  if (lower.includes('onion')) {
    return 'No onion? A pinch of garlic powder or spring onion greens keeps the base savory.';
  }
  if (lower.includes('rice')) {
    return 'Out of rice? Spaghetti, couscous, or boiled yam pieces work with the same base.';
  }
  if (lower.includes('butter')) {
    return 'No butter? Regular vegetable or groundnut oil with a pinch of salt works just fine.';
  }
  return `Short on ${ingredientName.toLowerCase()}? Skip it or swap with whatever staple you have on hand.`;
};

interface CookingStepItem {
  id: number;
  timeHint: string;
  title: string;
  instruction: string;
}

interface ActiveTimer {
  stepId: number;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

const extractMinutes = (text: string): number | null => {
  if (!text) return null;
  const match = text.match(/(\d+)(?:\s*(?:-|to)\s*\d+)?\s*(?:min|mins|minute|minutes)\b/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      return parsed;
    }
  }
  return null;
};

const formatCountdown = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const AtHomeMealDetails: React.FC<Props> = ({ navigation, route }) => {
  const params = route.params;
  const cookTime = params?.cookTime || '15 min';
  const dishTitle = params?.title || '';
  const initialTip = params?.mamaTip;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    if (!dishTitle) return false;
    const targetMealId = params?.id || `meal-${dishTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return savedMealsService
      .getCachedMeals()
      .some((m) => m.mealId === targetMealId || m.id === targetMealId || m.title.toLowerCase() === dishTitle.toLowerCase());
  });
  const [portions, setPortions] = useState<1 | 2>(1);
  const [isHealthyRemix, setIsHealthyRemix] = useState(false);
  const [healthyUnlocked, setHealthyUnlocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [tossedIngredients, setTossedIngredients] = useState<string[]>([]);
  const [cookModalVisible, setCookModalVisible] = useState(false);
  const [activeCookStepIdx, setActiveCookStepIdx] = useState(0);
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [lastXpAward, setLastXpAward] = useState<{
    awarded: number;
    reason?: 'daily_cap' | 'cooldown' | 'duplicate_dish';
  }>({ awarded: 50 });
  const [mamaPose, setMamaPose] = useState<MamaPose>('cooking');
  const [mamaNote, setMamaNote] = useState<string>(() => {
    if (initialTip) {
      return `"${initialTip}"`;
    }
    const currentPass = preferencesStore.getKitchenPass();
    const voice = MamaDialogueService.getSyncedMamaVoice({
      timeOfDay: getCurrentTimeOfDay(),
      pass: currentPass,
      activeDish: {
        title: dishTitle,
        cookTimeMinutes: extractMinutes(cookTime) || 15,
        gear: params?.gear || currentPass.cookingGearLabel,
        mamaTip: initialTip,
      },
      actionHint: 'cook_start',
    });
    return `"${voice.quote}"`;
  });
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const hasCookedRef = useRef<boolean>(false);

  const markCookingIntent = () => {
    if (hasCookedRef.current || !params?.title) return;
    const baseCost = typeof params.costNumeric === 'number' ? params.costNumeric : 2.0;
    preferencesStore.setPendingCookCheckIn({
      mealId: params.id || params.title,
      title: params.title,
      estCost: baseCost * portions,
    });
  };

  // Distinguish actual cooking from quick 5-second browsing:
  // if the user lingers on this recipe for 35s+, remember it so Mama can warmly check in later!
  useEffect(() => {
    if (!params?.title) return;
    const engageTimer = setTimeout(() => {
      if (!hasCookedRef.current && params?.title) {
        const baseCost = typeof params.costNumeric === 'number' ? params.costNumeric : 2.0;
        preferencesStore.setPendingCookCheckIn({
          mealId: params.id || params.title,
          title: params.title,
          estCost: baseCost * portions,
        });
      }
    }, 35000);
    return () => clearTimeout(engageTimer);
  }, [params?.id, params?.title, params?.costNumeric, portions]);

  // Countdown timer loop
  useEffect(() => {
    if (!activeTimer || !activeTimer.isRunning) return;

    const interval = setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev || !prev.isRunning) return prev;
        if (prev.remainingSeconds <= 1) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setToastMessage(`Step ${prev.stepId} timer finished!`);
          setCompletedSteps((c) => (c.includes(prev.stepId) ? c : [...c, prev.stepId]));
          return null;
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTimer?.isRunning]);

  const handleToggleTimer = (stepId: number, mins: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (activeTimer?.stepId === stepId) {
      setActiveTimer({
        ...activeTimer,
        isRunning: !activeTimer.isRunning,
      });
    } else {
      setActiveTimer({
        stepId,
        totalSeconds: mins * 60,
        remainingSeconds: mins * 60,
        isRunning: true,
      });
      setToastMessage(`Timer started: ${mins} minutes for Step ${stepId}`);
    }
  };

  const handleCancelTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveTimer(null);
  };

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;
  const finishScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [contentFade, contentY]);

  // Live Intelligence for dish-specific Mama tip in cooking mode (only if no initialTip was provided)
  useEffect(() => {
    if (!dishTitle || (initialTip && initialTip.length > 5)) return;
    const currentPass = preferencesStore.getKitchenPass();
    AiMamaService.getLiveMamaDialogue({
      timeOfDay: getCurrentTimeOfDay(),
      pass: currentPass,
      activeDish: {
        title: dishTitle,
        gear: params?.gear || currentPass.cookingGearLabel,
        cookTimeMinutes: extractMinutes(cookTime) || 15,
      },
      actionHint: 'cook_start',
    })
      .then((aiQuote) => {
        if (aiQuote && aiQuote.length > 5) {
          setMamaNote(`"${aiQuote}"`);
        }
      })
      .catch(() => {});
  }, [dishTitle, cookTime, params?.gear, initialTip]);

  // Resolve live cooking video (reuses cached video from card deck instantly if already loaded)
  const [mealVideo, setMealVideo] = useState<MealVideoData | null>(() =>
    dishTitle ? VideoService.getCachedVideo(dishTitle) : null
  );

  useEffect(() => {
    if (!dishTitle) return;
    let isMounted = true;
    const ingredientNames = params?.ingredients?.map((i) => i.name);
    VideoService.resolveCookingVideo(dishTitle, ingredientNames)
      .then((videoData) => {
        if (isMounted && videoData) {
          setMealVideo(videoData);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [dishTitle, params?.ingredients]);

  // Empty state guard: if screen opened without meal, don't invent mock egg data
  if (!params || !params.title) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.masthead}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={18} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}>
          <MamaCharacter pose="thinking" size={80} />
          <Text style={{ fontSize: 20, fontFamily: typography.fontFamily.serif, fontWeight: '700', color: colors.text.primary, textAlign: 'center' }}>
            No Recipe Selected
          </Text>
          <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center', lineHeight: 20 }}>
            Pick a meal from Home or Discover to view steps.
          </Text>
          <TouchableOpacity
            style={[styles.cookedButton, { marginTop: 12, paddingHorizontal: 24 }]}
            onPress={() => navigation.navigate('YourDailyEdit')}
          >
            <Text style={styles.cookedButtonText}>Go to Daily Edit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentPass = preferencesStore.getKitchenPass();

  const title = params.title;
  const gear = params.gear || '1 Pan';
  const costNumeric = typeof params.costNumeric === 'number' ? params.costNumeric : 2.5;
  const image =
    params.image ||
    MealImageService.getFallbackMealImage(
      title,
      params.ingredients,
      currentPass.cuisineAnchor
    );

  const mealId = params.id || `meal-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const rawIngredients = params.ingredients;
  const rawSteps = params.steps;

  // Dynamically resolve ingredients from params — with optional Healthy Remix (Low Oil & Greens)
  const baseIngredients =
    rawIngredients && rawIngredients.length > 0
      ? rawIngredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          inPantry: true,
        }))
      : [];

  const resolvedIngredients = isHealthyRemix
    ? [
        ...baseIngredients.map((ing) => {
          const lower = ing.name.toLowerCase();
          if (lower.includes('oil') || lower.includes('butter')) {
            return { ...ing, amount: '1 tsp (Low-Oil)' };
          }
          return ing;
        }),
        ...(baseIngredients.some((i) =>
          /spinach|greens|broccoli|kale|cabbage|vegetable/i.test(i.name)
        )
          ? []
          : [{ name: 'Fresh Spinach / Greens', amount: '1 handful', inPantry: true }]),
      ]
    : baseIngredients;

  // Dynamically resolve steps from params with distinct culinary phases
  const STEP_PHASES = ['Prep & Season', 'Sauté & Sear', 'Simmer & Cook', 'Finish & Plate'];
  const resolvedSteps: CookingStepItem[] =
    rawSteps && rawSteps.length > 0
      ? rawSteps.map((stepText, idx) => {
          const adaptedText = isHealthyRemix
            ? stepText
                .replace(/deep[- ]?fry/gi, 'light pan-sear')
                .replace(/\b[23]\s*tbsp\b/gi, '1 tsp')
            : stepText;
          const detectedMins = extractMinutes(adaptedText);
          const phase = STEP_PHASES[Math.min(idx, STEP_PHASES.length - 1)];
          const timeHint = detectedMins ? `${detectedMins} mins` : `Step ${idx + 1}`;
          return {
            id: idx + 1,
            timeHint,
            title: phase,
            instruction: adaptedText,
          };
        })
      : [];

  const toggleStep = (stepId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    let updated: number[];
    if (completedSteps.includes(stepId)) {
      updated = completedSteps.filter((id) => id !== stepId);
    } else {
      updated = [...completedSteps, stepId];
      markCookingIntent();
    }
    setCompletedSteps(updated);

    if (activeTimer?.stepId === stepId) {
      setActiveTimer(null);
    }

    if (updated.length === 0) {
      setMamaPose('cooking');
      setMamaNote(initialTip ? `"${initialTip}"` : `"Let's get cooking! The pan is waiting."`);
    } else if (updated.length === 1) {
      setMamaPose('writing');
      setMamaNote(`"Smells incredible already! Don't rush it, let the flavor build."`);
    } else if (updated.length === resolvedSteps.length && resolvedSteps.length > 0) {
      setMamaPose('delighted');
      setMamaNote(`"Magnificent! ${dishTitle || 'Dinner'} is served. Sit down, relax, and eat warm."`);
      // Effortless payoff: checking off the final step automatically triggers the Family Celebration!
      if (!cookModalVisible && !hasCookedRef.current) {
        setTimeout(() => {
          if (!hasCookedRef.current) {
            handleMarkAsCooked();
          }
        }, 420);
      }
    } else {
      setMamaPose('cooking');
      setMamaNote(`"Almost there! Just assembling your hot comfort bowl."`);
    }
  };

  const handleTapMamaTip = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const currentPass = preferencesStore.getKitchenPass();
    const voice = MamaDialogueService.getSyncedMamaVoice({
      timeOfDay: getCurrentTimeOfDay(),
      pass: currentPass,
      activeDish: {
        title: dishTitle,
        cookTimeMinutes: extractMinutes(cookTime) || 15,
        gear: params?.gear || currentPass.cookingGearLabel,
        mamaTip: params?.mamaTip,
      },
      actionHint: 'tap_advice',
    });
    setMamaNote(`"${voice.quote}"`);
    setMamaPose(voice.pose);
  };

  const handleTapIngredient = (ingredientName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    markCookingIntent();
    setTossedIngredients((prev) =>
      prev.includes(ingredientName)
        ? prev.filter((item) => item !== ingredientName)
        : [...prev, ingredientName]
    );
    setMamaPose('thinking');
    setMamaNote(`"${getIngredientSubstituteTip(ingredientName)}"`);
  };

  const finishAndNavigateBack = () => {
    Animated.sequence([
      Animated.timing(finishScale, { toValue: 0.94, duration: 100, useNativeDriver: true }),
      Animated.timing(finishScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('YourDailyEdit');
        }
      }, 350);
    });
  };

  const handleMarkAsCooked = () => {
    hasCookedRef.current = true;
    preferencesStore.clearPendingCookCheckIn();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (activeTimer) {
      setActiveTimer(null);
    }
    setCookModalVisible(false);
    const effectiveCost = costNumeric * portions;
    // 1. Update local preference store with human-readable dish title (anti-spam XP rules applied)
    preferencesStore.recordMealDecision(title, 'cooked', effectiveCost);
    setLastXpAward(preferencesStore.getLastCookXpOutcome());
    // 2. Persist decision to Neon DB
    decisionsService.log(mealId, title, 'cooked', effectiveCost);

    setMamaPose('delighted');
    setRewardModalVisible(true);
  };

  const handleClaimRewardAndExit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRewardModalVisible(false);

    // Check if any non-basic pantry items were used and offer 1-tap cleanup
    const stemToken = (w: string) =>
      w
        .toLowerCase()
        .trim()
        .replace(/ies$/, 'y')
        .replace(/oes$/, 'o')
        .replace(/s$/, '');
    const basicStaples = ['oil', 'cooking oil', 'salt', 'water', 'pepper', 'onions', 'onion'];
    const currentPantry = pantryService.getCachedPantry();
    const usedIdsToClear = currentPantry
      .filter((pItem) => {
        const pLower = pItem.name.toLowerCase().trim();
        if (basicStaples.includes(pLower)) return false;
        const pStem = stemToken(pLower);
        if (pStem.length < 3) return false;
        return resolvedIngredients.some((rIng) => {
          const rLower = rIng.name.toLowerCase();
          const rWords = rLower.split(/[^a-z]+/).map(stemToken);
          return rLower.includes(pStem) || rWords.includes(pStem);
        });
      })
      .map((p) => p.id);

    if (usedIdsToClear.length > 0) {
      const usedNames = currentPantry
        .filter((p) => usedIdsToClear.includes(p.id))
        .map((p) => p.name)
        .join(', ');
      mamaAlert.alert(
        'Update Kitchen Pantry?',
        `Did you finish your ${usedNames}, or do you still have some left?`,
        [
          {
            text: 'Still have some',
            style: 'cancel',
            onPress: finishAndNavigateBack,
          },
          {
            text: 'Finished — Remove',
            style: 'destructive',
            onPress: async () => {
              const remaining = currentPantry.filter((p) => !usedIdsToClear.includes(p.id));
              await pantryService.syncItems(
                remaining.map((p) => ({
                  name: p.name,
                  category: p.category,
                  quantity: p.quantity || undefined,
                }))
              );
              finishAndNavigateBack();
            },
          },
        ]
      );
      return;
    }

    finishAndNavigateBack();
  };

  const handleToggleBookmark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const next = !isBookmarked;
    setIsBookmarked(next);
    if (next) {
      // Save to Neon DB collection
      savedMealsService.saveMeal({
        mealId,
        title,
        type: 'home',
        cookTime,
        cost: convertMealCost(costNumeric, currentPass.currencyCode, currentPass.currencySymbol),
        costNumeric,
        imageUrl: image,
        recipeSteps: resolvedSteps.map((s) => s.instruction),
        ingredients: resolvedIngredients.map((i) => ({ name: i.name, amount: i.amount })),
      });
      setToastMessage('Saved to your personal collection!');
    } else {
      savedMealsService.removeMeal(mealId);
      const matchingByTitle = savedMealsService
        .getCachedMeals()
        .filter((m) => m.title.toLowerCase() === title.toLowerCase());
      matchingByTitle.forEach((m) => savedMealsService.removeMeal(m.id || m.mealId));
      setToastMessage('Removed from collection');
    }
  };

  // Localized Cost (scaled by 1x / 2x portions)
  const homeCostFormatted = convertMealCost(
    costNumeric * portions,
    currentPass.currencyCode,
    currentPass.currencySymbol
  );

  const handleShareIngredients = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const itemsText =
      resolvedIngredients.length > 0
        ? resolvedIngredients
            .map((i) => `- ${i.name} (${scaleIngredientAmount(i.amount, portions)})`)
            .join('\n')
        : '- Standard kitchen staples & seasoning';
    const message = `${title} (${portions}x · ${cookTime} · ${homeCostFormatted})\n\nIngredients:\n${itemsText}`;
    try {
      await Share.share({ message });
    } catch {}
  };

  const handleShareRecipe = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const itemsText =
      resolvedIngredients.length > 0
        ? resolvedIngredients
            .map((i) => `- ${i.name} (${scaleIngredientAmount(i.amount, portions)})`)
            .join('\n')
        : '- Standard kitchen staples & seasoning';
    const stepsText =
      resolvedSteps.length > 0
        ? resolvedSteps.map((s) => `${s.id}. ${s.instruction}`).join('\n')
        : '';
    const message = `${title} (${portions}x · ${cookTime} · ${homeCostFormatted})\n\nIngredients:\n${itemsText}${
      stepsText ? `\n\nSteps:\n${stepsText}` : ''
    }`;
    try {
      await Share.share({ message });
    } catch {}
  };

  const handleConfirmNeverShow = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    mamaAlert.alert(
      `Hide ${title}?`,
      `We won't suggest this again. Unhide anytime in Settings → Taste.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Never show again',
          style: 'destructive',
          onPress: () => {
            preferencesStore.addNeverShowDish(title);
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KitchenAtmosphere period={getCurrentTimeOfDay()} />

      {/* Masthead Header */}
      <View style={styles.masthead}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Cooking Guide</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={handleConfirmNeverShow}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            accessibilityLabel="Never suggest this dish"
          >
            <Ionicons name="eye-off-outline" size={18} color={colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShareRecipe}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={18} color={colors.text.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleBookmark}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isBookmarked ? colors.primary : colors.text.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, { opacity: contentFade, transform: [{ translateY: contentY }] }]}>
          {/* Hero Banner: live cooking video with minimal SVG plate placeholder */}
          <View style={styles.heroWrap}>
            {mealVideo?.videoUrl ? (
              <MealVideoPlayer
                videoId={mealVideo.id}
                videoUrl={mealVideo.videoUrl}
                posterUrl={
                  !MealImageService.isPlaceholderImage(mealVideo.coverUrl)
                    ? mealVideo.coverUrl
                    : undefined
                }
                isActive={true}
                creator={mealVideo.author}
                creatorPillBottom={52}
              />
            ) : MealImageService.isPlaceholderImage(image) ? (
              <MamaPlatePlaceholder variant="linen" iconSize={192} />
            ) : (
              <Image
                source={{ uri: image }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            )}
            <SteamWisps triggerKey={title} style={styles.heroSteam} />
            <MamaSealStamp size={48} variant="frosted" style={styles.heroSeal} />
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={styles.timeTagText}>{cookTime}</Text>
            </View>
            <View style={styles.gearTag}>
              <Ionicons name="disc-outline" size={14} color={colors.snow100} />
              <Text style={styles.gearTagText}>{gear}</Text>
            </View>
          </View>

          {/* Dish Title & Price Row */}
          <View style={styles.titleRow}>
            <View style={styles.titleTextWrap}>
              <Text style={styles.mealTitle}>{title}</Text>
              <Text style={styles.mealSubtitle}>{cookTime} · {gear}</Text>
            </View>
            <View style={styles.pricePill}>
              <Text style={styles.priceValue}>{homeCostFormatted}</Text>
              <Text style={styles.priceLabel}>est. cost</Text>
            </View>
          </View>

          {/* Mama Cooking Coach Stage */}
          <TouchableOpacity
            style={styles.mamaCoachCard}
            onPress={handleTapMamaTip}
            activeOpacity={0.85}
          >
            <MamaCharacter
              pose={mamaPose}
              size={56}
              isSpeaking={true}
              reactionKey={completedSteps.length}
            />
            <View style={styles.mamaCoachTextWrap}>
              <Text style={styles.mamaCoachName}>MAMA&apos;S TIP</Text>
              <Text style={styles.mamaCoachBody}>{mamaNote}</Text>
            </View>
          </TouchableOpacity>

          <KitchenTicketDivider label="MAMA DISH" />

          {/* Section: Minimal Tactile Ingredient Tiles */}
          <View style={styles.sectionCard}>
            <View style={styles.stepsHeader}>
              <Text style={styles.sectionHeading}>Ingredients</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    if (healthyUnlocked || preferencesStore.isMamaPlus()) {
                      const nextVal = !isHealthyRemix;
                      setHealthyUnlocked(true);
                      setIsHealthyRemix(nextVal);
                      if (nextVal && preferencesStore.isMamaPlus()) {
                        setToastMessage('Healthy Remix on — low oil & greens.');
                      }
                      return;
                    }
                    const spent = preferencesStore.spendXp(50);
                    if (!spent) {
                      setToastMessage('Need 50 XP — cook a meal (+50 XP) or unlock Pro.');
                      return;
                    }
                    setHealthyUnlocked(true);
                    setIsHealthyRemix(true);
                    setToastMessage('Healthy Remix unlocked (-50 XP).');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    backgroundColor: isHealthyRemix ? '#15803D' : 'rgba(21, 128, 61, 0.1)',
                  }}
                  activeOpacity={0.78}
                >
                  <Ionicons
                    name="leaf"
                    size={12}
                    color={isHealthyRemix ? '#FFFFFF' : '#15803D'}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: isHealthyRemix ? '#FFFFFF' : '#15803D',
                    }}
                  >
                    {isHealthyRemix
                      ? 'Healthy ✓'
                      : healthyUnlocked || preferencesStore.isMamaPlus()
                      ? 'Healthy · Plus'
                      : 'Healthy · 50 XP'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setPortions((prev) => (prev === 1 ? 2 : 1));
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 12,
                    backgroundColor: portions === 2 ? colors.primary : colors.snow200,
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: portions === 2 ? colors.snow100 : colors.primary,
                    }}
                  >
                    {portions === 1 ? '1x' : '2x'}
                  </Text>
                </TouchableOpacity>

                {resolvedIngredients.length > 0 && (
                  <TouchableOpacity
                    onPress={handleShareIngredients}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-social-outline" size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.ingredientTileGrid}>
              {resolvedIngredients.length > 0 ? (
                resolvedIngredients.map((item, idx) => {
                  const isTossed = tossedIngredients.includes(item.name);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.ingredientTile,
                        isTossed && styles.ingredientTileTossed,
                      ]}
                      onPress={() => handleTapIngredient(item.name)}
                      activeOpacity={0.82}
                    >
                      <View style={styles.ingredientTileTopRow}>
                        <Text
                          style={[
                            styles.ingredientTileName,
                            isTossed && styles.ingredientTileNameActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        <View
                          style={[
                            styles.ingredientTileCheck,
                            isTossed && styles.ingredientTileCheckActive,
                          ]}
                        >
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color={isTossed ? '#FFFFFF' : colors.primary}
                          />
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.ingredientTileAmount,
                          isTossed && styles.ingredientTileAmountActive,
                        ]}
                      >
                        {scaleIngredientAmount(item.amount, portions)}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={{ fontSize: 13, color: colors.text.secondary, fontStyle: 'italic', paddingVertical: 4 }}>
                  Uses your confirmed kitchen staples and seasoning to taste.
                </Text>
              )}
            </View>
          </View>

          {/* Section: Scannable Cooking Steps Preview on Page */}
          {resolvedSteps.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.stepsHeader}>
                <Text style={styles.sectionHeading}>How to Cook</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.secondary }}>
                  {completedSteps.length}/{resolvedSteps.length} done
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                {resolvedSteps.map((step) => {
                  const isDone = completedSteps.includes(step.id);
                  return (
                    <TouchableOpacity
                      key={step.id}
                      onPress={() => toggleStep(step.id)}
                      activeOpacity={0.82}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: 12,
                        borderRadius: 14,
                        backgroundColor: isDone ? 'rgba(46, 61, 43, 0.08)' : colors.snow100,
                        borderWidth: 1,
                        borderColor: isDone ? colors.primary : 'rgba(36, 40, 32, 0.08)',
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: isDone ? colors.primary : colors.snow200,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 1,
                        }}
                      >
                        {isDone ? (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        ) : (
                          <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>
                            {step.id}
                          </Text>
                        )}
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: colors.primary,
                            textTransform: 'uppercase',
                            letterSpacing: 0.4,
                          }}
                        >
                          {step.title} · {step.timeHint}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            lineHeight: 20,
                            color: colors.text.primary,
                            textDecorationLine: isDone ? 'line-through' : 'none',
                            opacity: isDone ? 0.65 : 1,
                          }}
                        >
                          {step.instruction}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Preserve timer helpers for future inline use */}
          {false && (
            <TouchableOpacity
              onPress={() => {
                handleToggleTimer(1, 5);
                handleCancelTimer();
              }}
            >
              <Text>{formatCountdown(0)}</Text>
            </TouchableOpacity>
          )}

          {/* Primary Action: Launch Focus Mode Step-by-Step Cooking Guide or 1-Tap Log Cooked */}
          <Animated.View style={{ transform: [{ scale: finishScale }], gap: 10 }}>
            <TouchableOpacity
              style={styles.cookedButton}
              onPress={() => {
                if (resolvedSteps.length > 0) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  markCookingIntent();
                  setActiveCookStepIdx(0);
                  setCookModalVisible(true);
                } else {
                  handleMarkAsCooked();
                }
              }}
              activeOpacity={0.88}
            >
              <Ionicons
                name={resolvedSteps.length > 0 ? 'play' : 'restaurant'}
                size={18}
                color={colors.snow100}
              />
              <Text style={styles.cookedButtonText}>
                {resolvedSteps.length > 0
                  ? `Start Cooking (${resolvedSteps.length} steps)`
                  : `I Cooked This (+${currentPass.planTier === 'plus' ? 100 : 50} XP)`}
              </Text>
            </TouchableOpacity>

            {resolvedSteps.length > 0 && (
              <TouchableOpacity
                style={{
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: colors.snow100,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                onPress={handleMarkAsCooked}
                activeOpacity={0.82}
              >
                <Ionicons name="restaurant" size={17} color={colors.primary} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: colors.primary,
                  }}
                >
                  I Cooked This (+{currentPass.planTier === 'plus' ? 100 : 50} XP)
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Interactive Step-by-Step Flashcard Cook-Along Pop-Up */}
      <InteractiveCookModal
        visible={cookModalVisible}
        dishTitle={title}
        steps={resolvedSteps}
        currentStepIndex={activeCookStepIdx}
        completedStepIds={completedSteps}
        onSelectStepIndex={setActiveCookStepIdx}
        onCompleteCurrentStep={() => {
          const stepObj = resolvedSteps[activeCookStepIdx];
          if (stepObj && !completedSteps.includes(stepObj.id)) {
            toggleStep(stepObj.id);
          }
        }}
        onFinishCooking={handleMarkAsCooked}
        onClose={() => setCookModalVisible(false)}
      />

      {/* 3-Character Mama Family Overfed Celebration Modal */}
      <MamaFamilyCelebrationModal
        visible={rewardModalVisible}
        dishTitle={title}
        homeCostFormatted={homeCostFormatted}
        savedVsTakeoutFormatted={convertMealCost(
          Math.max(1.8, Number((costNumeric * portions * 1.6).toFixed(2))),
          currentPass.currencyCode,
          currentPass.currencySymbol
        )}
        mealsCookedCount={currentPass.likedDishes.length + 1}
        xpAwarded={lastXpAward.awarded}
        xpSkipReason={lastXpAward.reason}
        onClaimReward={handleClaimRewardAndExit}
      />

      {/* Tactile Toast */}
      <TactileToast
        visible={!!toastMessage}
        message={toastMessage || ''}
        onDismiss={() => setToastMessage(null)}
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
    height: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(36, 40, 32, 0.08)',
  },
  headerTitle: {
    fontSize: typography.fontSize.sub,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.snow200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 42,
  },
  container: {
    gap: 16,
  },
  heroWrap: {
    height: 250,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.snow200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroAiOverlayImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  placeholderHero: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  placeholderIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(51, 83, 56, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  timeTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timeTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  gearTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(36, 40, 32, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  gearTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.snow100,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleTextWrap: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 30,
  },
  mealSubtitle: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 3,
  },
  pricePill: {
    alignItems: 'flex-end',
    backgroundColor: colors.snow200,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceValue: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.primary,
  },
  priceLabel: {
    fontSize: 11.5,
    color: colors.text.muted,
  },
  mamaCoachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FAF6EF',
    borderWidth: 1,
    borderColor: '#ECE4D4',
    borderRadius: 18,
    padding: 14,
  },
  mamaCoachTextWrap: {
    flex: 1,
    gap: 3,
  },
  mamaCoachName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  mamaCoachBody: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.snow100,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  savingsCol: {
    flex: 1,
  },
  savingsLabel: {
    fontSize: 10,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savingsValHome: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  savingsValOut: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.muted,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  savingsDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(36, 40, 32, 0.08)',
    marginHorizontal: 12,
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.snow100,
  },
  sectionCard: {
    backgroundColor: colors.snow100,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    padding: 18,
    gap: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
  },
  prepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prepCountBadge: {
    backgroundColor: 'rgba(102, 112, 74, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  prepCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  ingredientTileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ingredientTile: {
    width: '48%',
    backgroundColor: colors.snow200,
    borderRadius: 16,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
  },
  ingredientTileTossed: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  ingredientTileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  ingredientTileCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(102, 112, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientTileCheckActive: {
    backgroundColor: '#15803D',
  },
  ingredientTileStatus: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 0.4,
  },
  ingredientTileStatusActive: {
    color: '#15803D',
  },
  ingredientTileName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  ingredientTileNameActive: {
    color: '#14532D',
  },
  ingredientTileAmount: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  ingredientTileAmountActive: {
    color: '#166534',
  },
  launchCookModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  launchCookIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchCookTextCol: {
    flex: 1,
    gap: 2,
  },
  launchCookTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  launchCookSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  launchCookGoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  launchCookGoText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  ingredientList: {
    gap: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ingredientBullet: {
    width: 18,
    alignItems: 'center',
  },
  ingredientName: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontWeight: '500',
  },
  ingredientAmount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepsCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.snow200,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepItemDone: {
    backgroundColor: '#F5FAF3',
    borderColor: 'rgba(46, 125, 50, 0.2)',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.snow100,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  stepBody: {
    flex: 1,
    gap: 3,
  },
  stepTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.text.primary,
  },
  stepTitleDone: {
    color: colors.primary,
  },
  stepTimeHint: {
    fontSize: 10,
    color: colors.text.muted,
  },
  stepInstruction: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  stepInstructionDone: {
    color: 'rgba(36, 40, 32, 0.6)',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5ECE3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(217, 85, 36, 0.2)',
  },
  timerPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  timerPillTextActive: {
    color: colors.snow100,
  },
  timerCancelBtn: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cookedButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  cookedButtonText: {
    fontSize: typography.fontSize.sub,
    fontWeight: '700',
    color: colors.snow100,
  },
  heroSteam: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    zIndex: 15,
  },
  heroSeal: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 25,
  },
});

export default AtHomeMealDetails;
