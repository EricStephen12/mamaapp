import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { BottomNavigation, NavTab } from '../../components/navigation/BottomNavigation';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { TactileToast } from '../../components/common/TactileToast';
import { MamaCharacter, MamaPose } from '../../components/common/MamaCharacter';
import {
  preferencesStore,
  UserKitchenPass,
  convertMealCost,
  FREE_DAILY_ROLL_LIMIT,
} from '../../services/preferencesStore';
import { subscriptionService } from '../../services/subscriptionService';
import { CountryCurrencyModal } from '../../components/common/CountryCurrencyModal';
import { KitchenPassModal } from '../../components/common/KitchenPassModal';
import { MamaPaywallModal } from '../../components/common/MamaPaywallModal';
import { MamaDialogueService, MealPeriod } from '../../services/mamaDialogueService';
import { AiMamaService } from '../../services/aiMamaService';
import { decisionsService } from '../../services/api/decisionsService';
import { pantryService } from '../../services/api/pantryService';
import {
  rollService,
  RolledMeal,
  getCurrentTimeOfDay,
  getTimeOfDayHeading,
  getInitialMeal,
  getInitialMealDeck,
} from '../../services/api/rollService';
import { useShake } from '../../hooks/useShake';
import { useUserDataBank } from '../../context/UserDataBankContext';
import { WeeklyBalanceCard } from './components/WeeklyBalanceCard';
import { KitchenAtmosphere } from '../../components/signature/KitchenAtmosphere';
import { SimmerDot } from '../../components/signature/SteamWisps';
import { RegionalMamaAvatar } from '../../components/signature/RegionalMamaAvatar';
import { MealCardDeck } from './components/MealCardDeck';
import { RollRevealModal } from './components/RollRevealModal';
import { MamaPopUpModal } from './components/MamaPopUpModal';
import { MealImageService } from '../../services/mealImageService';

type Props = NativeStackScreenProps<RootStackParamList, 'YourDailyEdit'>;

export const YourDailyEdit: React.FC<Props> = ({ navigation, route }) => {
  const { user, isLoggedIn } = useUserDataBank();
  const { isInsideTabs, activeTab, setActiveTab, injectedDailyMeal, setInjectedDailyMeal } = useTabNavigation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [paywallModalVisible, setPaywallModalVisible] = useState(false);
  const [rollRevealVisible, setRollRevealVisible] = useState(false);
  const [pendingRolledMeal, setPendingRolledMeal] = useState<RolledMeal | null>(null);
  const [mamaModalVisible, setMamaModalVisible] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [passModalInitialTab, setPassModalInitialTab] = useState<
    'gear' | 'time' | 'flavor' | 'diet' | 'goal' | 'account'
  >('gear');

  // User preferences
  const [kitchenPass, setKitchenPass] = useState<UserKitchenPass>(
    preferencesStore.getKitchenPass()
  );

  // Time of day (tappable to switch between Morning, Lunch, Dinner, and Late Night)
  const [mealPeriod, setMealPeriod] = useState<MealPeriod>(() => getCurrentTimeOfDay());
  const periodTitle = useMemo(() => getTimeOfDayHeading(mealPeriod), [mealPeriod]);

  const [pantryItems, setPantryItems] = useState<string[]>(() =>
    pantryService.getCachedPantry().map((i) => i.name)
  );

  // Dynamic multi-meal deck for buttery-smooth swipeable carousel
  const [mealsDeck, setMealsDeck] = useState<RolledMeal[]>(() =>
    getInitialMealDeck(mealPeriod, kitchenPass)
  );
  const [activeMealIndex, setActiveMealIndex] = useState<number>(0);
  const rolledMeal = mealsDeck[activeMealIndex] || mealsDeck[0];
  const [isRolling, setIsRolling] = useState(false);
  const [lastRolledMeal, setLastRolledMeal] = useState<RolledMeal | null>(null);
  const [showUndoBanner, setShowUndoBanner] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Mama Live Dialogue — directly synchronized with pantry, budget, and active dish
  const [mamaQuote, setMamaQuote] = useState<string>(() => {
    const initial = getInitialMeal(mealPeriod, kitchenPass);
    const cachedPantry = pantryService.getCachedPantry().map((i) => i.name);
    const voice = MamaDialogueService.getSyncedMamaVoice({
      timeOfDay: mealPeriod,
      pass: kitchenPass,
      pantryItems: cachedPantry,
      activeDish: {
        title: initial.title,
        cookTimeMinutes: initial.cookTimeMinutes,
        estCost: initial.estCost,
        gear: kitchenPass.cookingGearLabel,
        mamaTip: initial.mamaTip,
      },
      actionHint: 'init',
    });
    return voice.quote;
  });
  const [mamaPose, setMamaPose] = useState<MamaPose>('cooking');

  const handleCycleMealPeriod = () => {
    Haptics.selectionAsync().catch(() => {});
    const order: MealPeriod[] = ['morning', 'lunch', 'dinner', 'late_night'];
    const nextPeriod = order[(order.indexOf(mealPeriod) + 1) % order.length];
    setMealPeriod(nextPeriod);
    const newDeck = getInitialMealDeck(nextPeriod, kitchenPass);
    setMealsDeck(newDeck);
    setActiveMealIndex(0);
    const nextMeal = newDeck[0];
    const voice = MamaDialogueService.getSyncedMamaVoice({
      timeOfDay: nextPeriod,
      pass: kitchenPass,
      pantryItems,
      activeDish: {
        title: nextMeal.title,
        cookTimeMinutes: nextMeal.cookTimeMinutes,
        estCost: nextMeal.estCost,
        gear: kitchenPass.cookingGearLabel,
        mamaTip: nextMeal.mamaTip,
      },
      actionHint: 'init',
    });
    setMamaQuote(voice.quote);
    setMamaPose(voice.pose);
  };

  const handleSelectMealIndex = useCallback(
    (index: number) => {
      setActiveMealIndex(index);
      const selected = mealsDeck[index];
      if (selected) {
        const voice = MamaDialogueService.getSyncedMamaVoice({
          timeOfDay: mealPeriod,
          pass: kitchenPass,
          pantryItems,
          activeDish: {
            title: selected.title,
            cookTimeMinutes: selected.cookTimeMinutes,
            estCost: selected.estCost,
            gear: kitchenPass.cookingGearLabel,
            mamaTip: selected.mamaTip,
          },
          actionHint: 'init',
        });
        setMamaQuote(voice.quote);
        setMamaPose(voice.pose);
      }
    },
    [mealsDeck, mealPeriod, kitchenPass, pantryItems]
  );

  // Entrance & card reaction animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(15)).current;

  // Automatically hydrate the visible carousel cards with dish-accurate AI photography
  useEffect(() => {
    let cancelled = false;
    const indicesToHydrate = [activeMealIndex, activeMealIndex + 1].filter(
      (idx) => idx >= 0 && idx < mealsDeck.length
    );

    indicesToHydrate.forEach((idx) => {
      const targetMeal = mealsDeck[idx];
      if (!targetMeal || !MealImageService.isCatalogImage(targetMeal.imageUrl)) {
        return;
      }
      MealImageService.generateMealImage(
        targetMeal.title,
        targetMeal.ingredients,
        kitchenPass.cuisineAnchor
      )
        .then((aiPhotoUrl) => {
          if (!cancelled && aiPhotoUrl && !MealImageService.isCatalogImage(aiPhotoUrl)) {
            setMealsDeck((prev) =>
              prev.map((m) =>
                m.title === targetMeal.title ? { ...m, imageUrl: aiPhotoUrl } : m
              )
            );
          }
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [activeMealIndex, mealsDeck, kitchenPass.cuisineAnchor]);

  // Subscribe to kitchen pass preferences and keep meal synced when culinary preferences change
  const prevPrefsKeyRef = useRef<string>(
    `${kitchenPass.cuisineAnchor}|${kitchenPass.bodyGoal}|${kitchenPass.timeLimitMinutes}|${(kitchenPass.dietaryRestrictions || []).join(',')}`
  );

  useEffect(() => {
    const unsub = preferencesStore.subscribe((updated) => {
      setKitchenPass(updated);
      const nextPrefsKey = `${updated.cuisineAnchor}|${updated.bodyGoal}|${updated.timeLimitMinutes}|${(updated.dietaryRestrictions || []).join(',')}`;
      if (nextPrefsKey !== prevPrefsKeyRef.current) {
        prevPrefsKeyRef.current = nextPrefsKey;
        const newDeck = getInitialMealDeck(mealPeriod, updated);
        setMealsDeck(newDeck);
        setActiveMealIndex(0);
        const matchedMeal = newDeck[0];
        const currentPantry = pantryService.getCachedPantry().map((i) => i.name);
        const voice = MamaDialogueService.getSyncedMamaVoice({
          timeOfDay: mealPeriod,
          pass: updated,
          pantryItems: currentPantry,
          activeDish: {
            title: matchedMeal.title,
            cookTimeMinutes: matchedMeal.cookTimeMinutes,
            estCost: matchedMeal.estCost,
            gear: updated.cookingGearLabel,
            mamaTip: matchedMeal.mamaTip,
          },
          actionHint: 'init',
        });
        setMamaQuote(voice.quote);
        setMamaPose(voice.pose);

        setPendingRolledMeal(null);
        setIsRolling(true);
        rollService
          .rollNextMeal(mealPeriod, matchedMeal.title)
          .then(async (aiMeal) => {
            const photoPromise = MealImageService.generateMealImage(
              aiMeal.title,
              aiMeal.ingredients,
              updated.cuisineAnchor
            ).catch(() => null);
            const fastPhotoUrl = await Promise.race([
              photoPromise,
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 3200)),
            ]);
            const hydratedMeal: RolledMeal = fastPhotoUrl
              ? { ...aiMeal, imageUrl: fastPhotoUrl }
              : aiMeal;

            setMealsDeck((prev) => [
              hydratedMeal,
              ...prev.filter((m) => m.title !== hydratedMeal.title),
            ]);
            setActiveMealIndex(0);

            if (!fastPhotoUrl) {
              photoPromise.then((lateUrl) => {
                if (lateUrl) {
                  setMealsDeck((prev) =>
                    prev.map((m) => (m.title === aiMeal.title ? { ...m, imageUrl: lateUrl } : m))
                  );
                }
              });
            }
            const aiSyncVoice = MamaDialogueService.getSyncedMamaVoice({
              timeOfDay: mealPeriod,
              pass: updated,
              pantryItems: currentPantry,
              activeDish: {
                title: aiMeal.title,
                cookTimeMinutes: aiMeal.cookTimeMinutes,
                estCost: aiMeal.estCost,
                gear: updated.cookingGearLabel,
                mamaTip: aiMeal.mamaTip,
              },
              actionHint: 'init',
            });
            setMamaQuote(aiSyncVoice.quote);
            setMamaPose(aiSyncVoice.pose);

            AiMamaService.getLiveMamaDialogue({
              timeOfDay: mealPeriod,
              pass: updated,
              pantryItems: currentPantry,
              activeDish: {
                title: aiMeal.title,
                cookTimeMinutes: aiMeal.cookTimeMinutes,
                estCost: aiMeal.estCost,
                gear: updated.cookingGearLabel,
              },
              actionHint: 'init',
            })
              .then((aiQuote) => {
                if (aiQuote && aiQuote.length > 5) {
                  setMamaQuote(aiQuote);
                }
              })
              .catch(() => {});
          })
          .catch(() => {})
          .finally(() => {
            setIsRolling(false);
          });
      }
    });
    return unsub;
  }, [mealPeriod]);

  // Initial meal roll & pantry load
  useEffect(() => {
    let cancelled = false;
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    pantryService
      .fetchAll()
      .then(async (items) => {
        if (cancelled) return;
        const itemNames = items.map((i) => i.name);
        setPantryItems(itemNames);

        const currentPass = preferencesStore.getKitchenPass();
        const initialDeck = getInitialMealDeck(mealPeriod, currentPass);
        setMealsDeck(initialDeck);
        setActiveMealIndex(0);
        const initialDish = initialDeck[0];
        const voice = MamaDialogueService.getSyncedMamaVoice({
          timeOfDay: mealPeriod,
          pass: currentPass,
          pantryItems: itemNames,
          activeDish: {
            title: initialDish.title,
            cookTimeMinutes: initialDish.cookTimeMinutes,
            estCost: initialDish.estCost,
            gear: currentPass.cookingGearLabel,
            mamaTip: initialDish.mamaTip,
          },
          actionHint: 'init',
        });
        setMamaQuote(voice.quote);
        setMamaPose(voice.pose);
      })
      .catch(() => {
        // Keep initial dish if offline
      });

    return () => {
      cancelled = true;
    };
  }, [mealPeriod, contentFade, contentY]);

  // Listen for meals chosen from Discover or Kitchen Match
  useEffect(() => {
    const injected = injectedDailyMeal || route.params?.injectedMeal;
    if (injected && injected.title) {
      const formattedMeal: RolledMeal = {
        id: injected.id || `injected-${Date.now()}`,
        title: injected.title,
        subtitle: injected.subtitle || `Cooks in ${injected.cookTime || '15 mins'}`,
        timeOfDay: mealPeriod,
        cookTimeMinutes: parseInt(injected.cookTime || '15', 10) || 15,
        estCost: typeof injected.costNumeric === 'number' ? injected.costNumeric : 2.0,
        imageUrl: injected.imageUrl || injected.image || injected.resolvedImage,
        pantryNote: injected.pantryNote || 'Chosen for tonight',
        mamaTip: injected.mamaTip || `Wonderful choice tonight, my child! Let's cook ${injected.title}.`,
        ingredients: Array.isArray(injected.ingredients) ? injected.ingredients : [],
        steps: Array.isArray(injected.steps) ? injected.steps : [],
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMealsDeck((prev) => [formattedMeal, ...prev.filter((m) => m.title !== formattedMeal.title)]);
      setActiveMealIndex(0);
      setMamaQuote(`I love this choice! Let's cook ${formattedMeal.title} tonight.`);
      setMamaPose('delighted');
      setToastMessage(`Set ${formattedMeal.title} as today's meal!`);
      if (injectedDailyMeal) {
        setInjectedDailyMeal(null);
      }
    }
  }, [injectedDailyMeal, route.params?.injectedMeal, mealPeriod, setInjectedDailyMeal]);

  // Subscribe to pantry inventory changes & re-roll when inventory changes
  const prevPantrySigRef = useRef<string>(
    pantryService
      .getCachedPantry()
      .map((i) => i.name.toLowerCase().trim())
      .sort()
      .join(',')
  );

  useEffect(() => {
    const unsubPantry = pantryService.subscribe((items) => {
      const names = items.map((i) => i.name);
      setPantryItems(names);

      const nextSig = names
        .map((n) => n.toLowerCase().trim())
        .sort()
        .join(',');
      if (nextSig !== prevPantrySigRef.current) {
        prevPantrySigRef.current = nextSig;
        const currentPass = preferencesStore.getKitchenPass();
        setPendingRolledMeal(null);
        setIsRolling(true);
        rollService
          .rollNextMeal(mealPeriod)
          .then(async (aiMeal) => {
            const photoPromise = MealImageService.generateMealImage(
              aiMeal.title,
              aiMeal.ingredients,
              currentPass.cuisineAnchor
            ).catch(() => null);
            const fastPhotoUrl = await Promise.race([
              photoPromise,
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 3200)),
            ]);
            const hydratedMeal: RolledMeal = fastPhotoUrl
              ? { ...aiMeal, imageUrl: fastPhotoUrl }
              : aiMeal;

            setMealsDeck((prev) => [
              hydratedMeal,
              ...prev.filter((m) => m.title !== hydratedMeal.title),
            ]);
            setActiveMealIndex(0);

            if (!fastPhotoUrl) {
              photoPromise.then((lateUrl) => {
                if (lateUrl) {
                  setMealsDeck((prev) =>
                    prev.map((m) => (m.title === aiMeal.title ? { ...m, imageUrl: lateUrl } : m))
                  );
                }
              });
            }
            if (aiMeal.mamaTip && aiMeal.mamaTip.length > 5) {
              setMamaQuote(aiMeal.mamaTip);
              setMamaPose('delighted');
            } else {
              const syncVoice = MamaDialogueService.getSyncedMamaVoice({
                timeOfDay: mealPeriod,
                pass: currentPass,
                pantryItems: names,
                activeDish: {
                  title: aiMeal.title,
                  cookTimeMinutes: aiMeal.cookTimeMinutes,
                  estCost: aiMeal.estCost,
                  gear: currentPass.cookingGearLabel,
                  mamaTip: aiMeal.mamaTip,
                },
                actionHint: 'init',
              });
              setMamaQuote(syncVoice.quote);
              setMamaPose(syncVoice.pose);
            }
          })
          .catch(() => {})
          .finally(() => {
            setIsRolling(false);
          });
      }
    });
    return unsubPantry;
  }, [mealPeriod]);

  // Refresh pantry count & items whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      if (!isInsideTabs) {
        setActiveTab('edit');
      }
      pantryService
        .fetchAll()
        .then((items) => {
          const names = items.map((i) => i.name);
          setPantryItems(names);
        })
        .catch(() => {});
      return () => {
        setIsScreenFocused(false);
      };
    }, [isInsideTabs, setActiveTab, setPantryItems])
  );

  const executeRoll = useCallback(async () => {
    if (isRolling) return;
    setPendingRolledMeal(null);
    setIsRolling(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics optional
    }

    const previousMeal = rolledMeal;
    const previousTitle = previousMeal ? previousMeal.title : undefined;

    // 1. Silent feedback loop: log pass for undo & pattern learning
    if (previousMeal) {
      setLastRolledMeal(previousMeal);
      setShowUndoBanner(true);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setShowUndoBanner(false);
      }, 7500);

      rollService.addSessionPass(previousMeal.title);
      decisionsService.log(previousMeal.id, previousMeal.title, 'passed', previousMeal.estCost);
      preferencesStore.recordMealDecision(previousMeal.title, 'passed', previousMeal.estCost);
    }

    setMamaQuote(MamaDialogueService.getPassReaction(previousTitle));
    setMamaPose('writing');

    // 2. Fetch the fresh AI meal (pantry + goal + time-of-day aware) and LAND on it
    try {
      const nextMeal = await rollService.rollNextMeal(mealPeriod, previousTitle);
      if (nextMeal) {
        // Generate real dish-accurate AI food image and wait up to 3.2s so recipe + photo reveal together
        const photoPromise = MealImageService.generateMealImage(
          nextMeal.title,
          nextMeal.ingredients,
          kitchenPass.cuisineAnchor
        ).catch(() => null);

        const fastPhotoUrl = await Promise.race([
          photoPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3200)),
        ]);

        const hydratedMeal: RolledMeal = fastPhotoUrl
          ? { ...nextMeal, imageUrl: fastPhotoUrl }
          : nextMeal;

        setPendingRolledMeal(hydratedMeal);
        setMealsDeck((prev) => [
          hydratedMeal,
          ...prev.filter((m) => m.title !== hydratedMeal.title),
        ]);
        setActiveMealIndex(0);

        if (!fastPhotoUrl) {
          photoPromise.then((latePhotoUrl) => {
            if (latePhotoUrl) {
              setPendingRolledMeal((prev) =>
                prev && prev.title === nextMeal.title ? { ...prev, imageUrl: latePhotoUrl } : prev
              );
              setMealsDeck((prev) =>
                prev.map((m) => (m.title === nextMeal.title ? { ...m, imageUrl: latePhotoUrl } : m))
              );
            }
          });
        }

        if (nextMeal.mamaTip && nextMeal.mamaTip.length > 5) {
          setMamaQuote(nextMeal.mamaTip);
          setMamaPose('delighted');
        } else {
          const voice = MamaDialogueService.getSyncedMamaVoice({
            timeOfDay: mealPeriod,
            pass: kitchenPass,
            pantryItems,
            activeDish: {
              title: nextMeal.title,
              cookTimeMinutes: nextMeal.cookTimeMinutes,
              estCost: nextMeal.estCost,
              gear: kitchenPass.cookingGearLabel,
              mamaTip: nextMeal.mamaTip,
            },
            actionHint: 'pass_meal',
            lastPassedDishTitle: previousTitle,
          });
          setMamaQuote(voice.quote);
          setMamaPose(voice.pose);
        }
      }
    } catch (err) {
      console.warn('[YourDailyEdit] Roll error:', err);
    } finally {
      setIsRolling(false);
    }
  }, [isRolling, rolledMeal, mealPeriod, kitchenPass, pantryItems]);

  // Roll again handler (triggered by physical shake or tapping the hero dice)
  const handleRollAgain = useCallback(() => {
    if (isRolling) return;

    if (!preferencesStore.consumeDailyRoll()) {
      subscriptionService.getPlusPriceString().then((price) => {
        Alert.alert(
          `${FREE_DAILY_ROLL_LIMIT} Daily Rolls Used Today`,
          `You've used your ${FREE_DAILY_ROLL_LIMIT} free daily rolls today! Spend 50 XP for a bonus roll or unlock Mama Plus (${price}) for Unlimited Rolls, Free Healthy Remixes, and 2x XP.`,
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Bonus Roll (-50 XP)',
              onPress: () => {
                if (preferencesStore.spendXp(50)) {
                  setToastMessage('Bonus Roll unlocked (-50 XP)!');
                  setPendingRolledMeal(null);
                  setRollRevealVisible(true);
                  executeRoll();
                } else {
                  setToastMessage('Need 50 XP! Cook a meal at home (+50 XP) or unlock Mama Plus.');
                }
              },
            },
            {
              text: `Unlock Mama Pro (${price})`,
              onPress: async () => {
                const outcome = await subscriptionService.presentPaywallIfNeeded();
                if (outcome === 'purchased' || outcome === 'restored') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                  setToastMessage('Welcome to Mama Kitchen Pro! Unlimited rolls unlocked.');
                  setPendingRolledMeal(null);
                  setRollRevealVisible(true);
                  executeRoll();
                } else if (outcome === 'unavailable') {
                  setPaywallModalVisible(true);
                }
              },
            },
          ]
        );
      });
      return;
    }

    setPendingRolledMeal(null);
    setRollRevealVisible(true);
    executeRoll();
  }, [isRolling, executeRoll]);

  // Undo accidental roll / brings back previous meal instantly
  const handleUndoRoll = useCallback(() => {
    if (!lastRolledMeal) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const restoredMeal = lastRolledMeal;
    const currentDish = rolledMeal;

    // Remove from passed tracking
    rollService.removeSessionPass(restoredMeal.title);
    preferencesStore.undoMealDecision(restoredMeal.title, 'passed', restoredMeal.estCost);

    if (currentDish) {
      rollService.removeSessionPass(currentDish.title);
      preferencesStore.undoMealDecision(currentDish.title, 'passed', currentDish.estCost);
    }

    const existingIdx = mealsDeck.findIndex((m) => m.title === restoredMeal.title);
    if (existingIdx !== -1) {
      setActiveMealIndex(existingIdx);
    } else {
      setMealsDeck((prev) => [restoredMeal, ...prev]);
      setActiveMealIndex(0);
    }
    setLastRolledMeal(null);
    setShowUndoBanner(false);

    setMamaQuote(`"Restored! Let's make ${restoredMeal.title}."`);
    setMamaPose('delighted');
  }, [lastRolledMeal, mealsDeck, rolledMeal]);

  // Explicit confirmation to never suggest a dish (user actually dislikes it)
  const handleConfirmNeverShow = (dishTitle: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    Alert.alert(
      `Never suggest ${dishTitle}?`,
      `Mama will stop suggesting this meal. You can unhide it anytime in your Kitchen Pass under Diet.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Never show again',
          style: 'destructive',
          onPress: () => {
            preferencesStore.addNeverShowDish(dishTitle);
            setShowUndoBanner(false);
            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
            setToastMessage(`Mama won't suggest ${dishTitle} again`);
          },
        },
      ]
    );
  };

  // Accelerometer shake detection with walking & jostle filter (only active when Home tab is visible and no modal is open)
  useShake(() => {
    handleRollAgain();
  }, {
    threshold: 1.55,
    minReversals: 3,
    shakeWindowMs: 650,
    timeout: 900,
    enabled:
      kitchenPass.shakeToRollEnabled !== false &&
      isScreenFocused &&
      (!isInsideTabs || activeTab === 'edit') &&
      !passModalVisible &&
      !countryModalVisible &&
      !rollRevealVisible,
  });

  // Cook meal handler — opens recipe details so user can inspect ingredients & instructions
  const handleCookMeal = () => {
    if (!rolledMeal) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics optional
    }

    // Note: Do NOT deduct from budget or log as cooked here!
    // The user has not decided yet; they are simply reviewing the recipe.
    // Budget deduction and cooked logging strictly occurs in AtHomeMealDetails when they tap "I Cooked This Tonight!".

    navigation.navigate('AtHomeMealDetails', {
      id: rolledMeal.id,
      title: rolledMeal.title,
      subtitle: rolledMeal.subtitle,
      cookTime: `${rolledMeal.cookTimeMinutes} min`,
      gear: kitchenPass.cookingGearLabel || '1 Pan',
      estCost: convertMealCost(rolledMeal.estCost, kitchenPass.currencyCode, kitchenPass.currencySymbol),
      costNumeric: rolledMeal.estCost,
      steps: rolledMeal.steps,
      ingredients: rolledMeal.ingredients,
      mamaTip: rolledMeal.mamaTip,
      image:
        MealImageService.getCarouselDeckImages(mealsDeck, kitchenPass.cuisineAnchor)[
          activeMealIndex
        ] ||
        MealImageService.getFallbackMealImage(
          rolledMeal.title,
          rolledMeal.ingredients,
          kitchenPass.cuisineAnchor
        ),
    });
  };

  // Interactive dialogue tap — shares dish-specific advice
  const handleTapMama = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const voice = MamaDialogueService.getSyncedMamaVoice({
      timeOfDay: mealPeriod,
      pass: kitchenPass,
      pantryItems,
      activeDish: rolledMeal ? {
        title: rolledMeal.title,
        cookTimeMinutes: rolledMeal.cookTimeMinutes,
        estCost: rolledMeal.estCost,
        gear: kitchenPass.cookingGearLabel,
        mamaTip: rolledMeal.mamaTip,
      } : undefined,
      actionHint: 'tap_advice',
    });
    setMamaQuote(voice.quote);
    setMamaPose(voice.pose);

    AiMamaService.getLiveMamaDialogue({
      timeOfDay: mealPeriod,
      pass: kitchenPass,
      pantryItems,
      activeDish: rolledMeal ? {
        title: rolledMeal.title,
        cookTimeMinutes: rolledMeal.cookTimeMinutes,
        estCost: rolledMeal.estCost,
        gear: kitchenPass.cookingGearLabel,
      } : undefined,
      actionHint: 'tap_advice',
    }).then((aiQuote) => {
      if (aiQuote && aiQuote.length > 5) {
        setMamaQuote(aiQuote);
      }
    }).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <KitchenAtmosphere period={mealPeriod} />

      {/* 1. COMPACT TOP STATUS BAR (Regional Mama Medallion + Brand + Icons cluster) */}
      <View style={styles.topBar}>
        <View style={styles.brandGroup}>
          <RegionalMamaAvatar
            countryCode={kitchenPass.country}
            cuisineAnchor={kitchenPass.cuisineAnchor}
            size={36}
            onPress={() => setCountryModalVisible(true)}
          />
          <Text style={styles.brandTitle}>Mama</Text>
          <TouchableOpacity
            onPress={handleCycleMealPeriod}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <SimmerDot period={mealPeriod} />
            <Text style={styles.periodPillText}>{periodTitle}</Text>
            <Ionicons name="chevron-down" size={11} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.iconCluster}>
          {/* Single Profile / Settings button */}
          <TouchableOpacity
            style={styles.headerChipMuted}
            onPress={() => {
              setPassModalInitialTab('account');
              setPassModalVisible(true);
            }}
            activeOpacity={0.75}
            accessibilityLabel="Account"
          >
            {(isLoggedIn && user) || user ? (
              <Text style={[styles.headerChipText, { fontWeight: '700' }]}>
                {(user?.name?.trim() || user?.email || 'M').charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person-outline" size={14} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: contentFade,
              transform: [{ translateY: contentY }],
            },
          ]}
        >
          {/* 1. HERO CAROUSEL & ROLL ACTION (Tactile Curated 3-Poster Deck) */}
          <MealCardDeck
            meals={mealsDeck}
            activeIndex={activeMealIndex}
            onSelectMealIndex={handleSelectMealIndex}
            kitchenPass={kitchenPass}
            isRolling={isRolling}
            onPressCard={handleCookMeal}
            onRollPress={handleRollAgain}
            onCyclePeriod={handleCycleMealPeriod}
            headerTitle={periodTitle}
          />

          {/* 3. WEEKLY BUDGET & SAVINGS TRACKER */}
          <WeeklyBalanceCard
            remainingAmount={kitchenPass.weeklyBudget - kitchenPass.spentThisWeek}
            remainingDays={kitchenPass.remainingDaysInWeek || 5}
            spentAmount={kitchenPass.spentThisWeek}
            totalBudget={kitchenPass.weeklyBudget}
            currencySymbol={kitchenPass.currencySymbol}
            currencyCode={kitchenPass.currencyCode}
            countryName={kitchenPass.countryName}
            mealsCookedCount={kitchenPass.likedDishes.length}
            onPressManage={() => setCountryModalVisible(true)}
          />

          {/* 4. CROSS-SCREEN INSPIRATION & KITCHEN BRIDGE */}
          <View style={styles.hubContainer}>
            <TouchableOpacity
              style={styles.hubCard}
              onPress={() => {
                if (isInsideTabs) {
                  setActiveTab('kitchen');
                } else {
                  navigation.navigate('WhatsInYourKitchen');
                }
              }}
              activeOpacity={0.84}
            >
              <View style={styles.hubIconCircle}>
                <Ionicons name="basket-outline" size={17} color={colors.primary} />
              </View>
              <View style={styles.hubTextWrap}>
                <Text style={styles.hubTitle}>In Your Kitchen</Text>
                <Text style={styles.hubSubtitle} numberOfLines={1}>
                  {pantryItems.length > 0
                    ? `${pantryItems.length} items on hand · Match food →`
                    : 'Tap to add staples →'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.hubCard}
              onPress={() => {
                if (isInsideTabs) {
                  setActiveTab('discover');
                } else {
                  navigation.navigate('DiscoverYourNextMeal');
                }
              }}
              activeOpacity={0.84}
            >
              <View style={styles.hubIconCircle}>
                <Ionicons name="compass-outline" size={17} color={colors.primary} />
              </View>
              <View style={styles.hubTextWrap}>
                <Text style={styles.hubTitle}>Discover Feed</Text>
                <Text style={styles.hubSubtitle} numberOfLines={1}>
                  Healthy ideas →
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* Preserved for future Mama placement */}
          {false && (
            <TouchableOpacity onPress={handleTapMama}>
              <MamaCharacter pose={mamaPose} size={36} />
              <Text>{mamaQuote}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      {/* Minimal Luxury Dish Pop-Up Reveal Modal */}
      <RollRevealModal
        visible={rollRevealVisible}
        meal={pendingRolledMeal}
        deckMeals={mealsDeck}
        isRolling={isRolling}
        kitchenPass={kitchenPass}
        onClose={() => {
          setRollRevealVisible(false);
          setPendingRolledMeal(null);
        }}
        onCookNow={() => {
          setRollRevealVisible(false);
          setPendingRolledMeal(null);
          handleCookMeal();
        }}
        onSpinAgain={() => handleRollAgain()}
      />

      {/* Interactive Mama Kitchen Secret Pop-Up Modal */}
      <MamaPopUpModal
        visible={mamaModalVisible}
        pose={mamaPose}
        quote={mamaQuote}
        activeMeal={rolledMeal}
        onClose={() => setMamaModalVisible(false)}
        onAskNewAdvice={handleTapMama}
        onTriggerRoll={() => {
          setRollRevealVisible(true);
          handleRollAgain();
        }}
        onOpenRecipe={handleCookMeal}
      />

      {/* Country & Currency Modal */}
      <CountryCurrencyModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
      />

      {/* Kitchen Pass / Equipment Modal */}
      <KitchenPassModal
        visible={passModalVisible}
        onClose={() => setPassModalVisible(false)}
        initialTab={passModalInitialTab}
      />

      {/* Mama Kitchen Pro Paywall Modal */}
      <MamaPaywallModal
        visible={paywallModalVisible}
        onClose={() => setPaywallModalVisible(false)}
        onSubscribed={() => {
          setToastMessage('Welcome to Mama Kitchen Pro! Unlimited rolls unlocked.');
          setPendingRolledMeal(null);
          setRollRevealVisible(true);
          executeRoll();
        }}
      />

      {/* Preserved undo handlers for reference */}
      {false && showUndoBanner && (
        <View style={styles.floatingUndoBanner}>
          <TouchableOpacity onPress={() => handleConfirmNeverShow(lastRolledMeal?.title || '')} />
          <TouchableOpacity onPress={handleUndoRoll} />
        </View>
      )}

      {/* Bottom Tab Navigation (rendered only when screen is standalone) */}
      {!isInsideTabs && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={(tab: NavTab) => {
            setActiveTab(tab);
            if (tab === 'kitchen') navigation.navigate('WhatsInYourKitchen');
            if (tab === 'discover') navigation.navigate('DiscoverYourNextMeal');
            if (tab === 'collection') navigation.navigate('YourCollection');
          }}
        />
      )}

      {/* Tactile Toast Notification */}
      <TactileToast
        message={toastMessage || ''}
        visible={!!toastMessage}
        onDismiss={() => setToastMessage(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.snow100,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 40, 32, 0.05)',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.4,
  },
  periodPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  iconCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(46, 61, 43, 0.08)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
  },
  headerChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  headerChipMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(36, 40, 32, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  headerChipTextMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 100,
  },
  container: {
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 2,
    paddingBottom: 8,
    gap: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  mamaVoicePill: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.snow200,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
    marginBottom: 4,
  },
  floatingMamaOrb: {
    position: 'absolute',
    right: 16,
    bottom: 92,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
    zIndex: 20,
  },
  floatingMamaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  floatingMamaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  mamaVoiceText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.primary,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  mamaHeroCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.snow200,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  mamaAvatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mamaAuraGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(205, 162, 88, 0.16)',
  },
  mamaSpeechBubble: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  mamaSpeechHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mamaNameTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  mamaNameText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  mamaTapHint: {
    fontSize: 11,
    color: colors.text.muted,
  },
  mamaQuoteText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.primary,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  rollActionGroup: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 22,
    marginTop: 6,
    marginBottom: 16,
    gap: 8,
  },
  bigRollButton: {
    width: '100%',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  bigRollButtonDisabled: {
    opacity: 0.72,
  },
  diceIconWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigRollButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.snow100,
    letterSpacing: -0.2,
  },
  secondaryCookLink: {
    paddingVertical: 4,
  },
  secondaryCookLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  diceHeroStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  diceHintText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.secondary,
    letterSpacing: 0.4,
    marginTop: -2,
  },
  hubContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  hubCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  hubIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(217, 85, 36, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTextWrap: {
    flex: 1,
    gap: 2,
  },
  hubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
  },
  hubSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  dishSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  dishTitleBlock: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  dishTitle: {
    fontFamily: typography.fontFamily.serif,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: -0.4,
    textAlign: 'center',
    lineHeight: 34,
  },
  dishHint: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  makeButton: {
    width: '100%',
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  makeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.snow100,
  },
  // Visible Learning Observation Badge
  mamaObservationBadge: {
    width: '100%',
    backgroundColor: 'rgba(46, 61, 43, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(46, 61, 43, 0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    marginTop: -4,
  },
  mamaObservationTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mamaObservationTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.2,
  },
  mamaObservationTag: {
    backgroundColor: 'rgba(46, 61, 43, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  mamaObservationTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  mamaObservationDetail: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  // Backup roll button (for quiet / walking situations)
  rollBackupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(46, 61, 43, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    marginTop: 2,
  },
  rollBackupButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  // Floating Undo Banner
  floatingUndoBanner: {
    position: 'absolute',
    bottom: 82,
    left: 16,
    right: 16,
    backgroundColor: colors.snow100,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(46, 61, 43, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 999,
  },
  undoTextGroup: {
    flex: 1,
    gap: 2,
  },
  undoEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 0.6,
  },
  undoMealTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  undoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  undoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.snow100,
  },
  neverShowButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  neverShowButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  undoDismissButton: {
    padding: 3,
  },
});

export default YourDailyEdit;
