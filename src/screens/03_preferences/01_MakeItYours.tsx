import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInput,
  ScrollView,
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
import {
  preferencesStore,
  SUPPORTED_COUNTRIES,
  BodyGoal,
} from '../../services/preferencesStore';
import { pantryService } from '../../services/api/pantryService';
import { getCurrentTimeOfDay, rollService } from '../../services/api/rollService';
import { useUserDataBank } from '../../context/UserDataBankContext';
import { KitchenAtmosphere } from '../../components/signature/KitchenAtmosphere';
import { MamaCharacter } from '../../components/common/MamaCharacter';
import { MamaPaywallModal } from '../../components/common/MamaPaywallModal';
import { SteamWisps } from '../../components/signature/SteamWisps';
import { playRevealThudHaptics } from '../../utils/mamaHaptics';

function getWelcomeHomeLine(countryId: string, budgetLabel: string): string {
  switch (countryId) {
    case 'NG':
      return `Your ${budgetLabel} week is set. Let's pick tonight's meal.`;
    case 'GH':
      return `Akwaaba! Your ${budgetLabel} week is ready.`;
    case 'KE':
      return `Karibu! Your ${budgetLabel} week is set.`;
    case 'ZA':
      return `Your ${budgetLabel} week is ready — good food, zero waste.`;
    case 'GB':
      return `Kettle on. Your ${budgetLabel} week is all set.`;
    case 'US':
      return `Skip delivery tonight — your ${budgetLabel} week is set.`;
    case 'CA':
      return `Your ${budgetLabel} week is set. Something warm awaits.`;
    case 'EU':
      return `Simple ingredients, warm table. Your ${budgetLabel} week is set.`;
    case 'AU':
      return `Fresh, easy meals ahead — your ${budgetLabel} week is set.`;
    default:
      return `Your ${budgetLabel} week is set. Let's eat.`;
  }
}

type Props = NativeStackScreenProps<RootStackParamList, 'MakeItYours'>;

const BODY_GOAL_OPTIONS: {
  id: BodyGoal;
  title: string;
  icon: 'body-outline' | 'leaf-outline' | 'restaurant-outline' | 'fitness-outline';
}[] = [
  { id: 'curves_glutes', title: 'Curves & Glutes', icon: 'body-outline' },
  { id: 'reduce_weight', title: 'Lose Weight', icon: 'leaf-outline' },
  { id: 'add_weight', title: 'Gain Weight', icon: 'restaurant-outline' },
  { id: 'balanced', title: 'Balanced', icon: 'fitness-outline' },
];

const COMMON_PANTRY_STAPLES = [
  'Eggs',
  'Onions',
  'Tomatoes',
  'Rice',
  'Cooking Oil',
  'Chicken',
  'Pasta',
  'Bread',
  'Potatoes',
];

const TOTAL_STEPS = 3;

export const MakeItYours: React.FC<Props> = ({ navigation }) => {
  const { user } = useUserDataBank();
  const [step, setStep] = useState<number>(1);
  const [showWelcomeHandoff, setShowWelcomeHandoff] = useState<boolean>(false);
  const [showWelcomePaywall, setShowWelcomePaywall] = useState<boolean>(false);
  const [welcomeBudgetLabel, setWelcomeBudgetLabel] = useState<string>('');
  const hasNavigatedRef = useRef<boolean>(false);
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const welcomeScale = useRef(new Animated.Value(0.86)).current;

  const existingPass = preferencesStore.getKitchenPass();
  const [selectedCountryId, setSelectedCountryId] = useState<string>(existingPass.country || 'NG');
  const [customBudgetInput, setCustomBudgetInput] = useState<string>('');
  const [selectedDiets, setSelectedDiets] = useState<string[]>(
    existingPass.dietaryRestrictions && existingPass.dietaryRestrictions.length > 0
      ? existingPass.dietaryRestrictions
      : ['none']
  );
  const [customDietInput, setCustomDietInput] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<BodyGoal>(
    existingPass.bodyGoal || 'balanced'
  );

  // Step 3: Starting Kitchen Inventory + Custom Ingredients
  const [kitchenItems, setKitchenItems] = useState<string[]>(() => {
    const cached = pantryService.getCachedPantry().map((i) => i.name);
    return cached.length > 0
      ? cached
      : ['Eggs', 'Onions', 'Tomatoes', 'Cooking Oil', 'Rice'];
  });
  const [customPantryInput, setCustomPantryInput] = useState<string>('');

  // Animation values
  const stepFade = useRef(new Animated.Value(1)).current;
  const stepTranslateY = useRef(new Animated.Value(0)).current;
  const primaryButtonScale = useRef(new Animated.Value(1)).current;

  const selectedCountry =
    SUPPORTED_COUNTRIES.find((c) => c.id === selectedCountryId) || SUPPORTED_COUNTRIES[0];

  const transitionToStep = useCallback(
    (nextStep: number, direction: 'forward' | 'backward') => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      const outY = direction === 'forward' ? -10 : 10;
      const inY = direction === 'forward' ? 10 : -10;

      Animated.parallel([
        Animated.timing(stepFade, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(stepTranslateY, {
          toValue: outY,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(nextStep);
        stepTranslateY.setValue(inY);

        Animated.parallel([
          Animated.timing(stepFade, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
          Animated.timing(stepTranslateY, {
            toValue: 0,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [stepFade, stepTranslateY]
  );

  const handleButtonPressIn = () => {
    Animated.spring(primaryButtonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 220,
      friction: 10,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(primaryButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 160,
      friction: 7,
    }).start();
  };

  const handleAddCustomDiet = () => {
    const trimmed = customDietInput.trim();
    if (!trimmed) return;
    setSelectedDiets((prev) => {
      const withoutNone = prev.filter((d) => d !== 'none');
      if (withoutNone.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
        return withoutNone;
      }
      return [...withoutNone, trimmed];
    });
    setCustomDietInput('');
    Keyboard.dismiss();
  };

  const handleToggleKitchenItem = (item: string) => {
    Haptics.selectionAsync().catch(() => {});
    setKitchenItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustomPantryItem = () => {
    const trimmed = customPantryInput.trim();
    if (!trimmed) return;
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    setKitchenItems((prev) => {
      if (prev.some((i) => i.toLowerCase() === formatted.toLowerCase())) {
        return prev;
      }
      return [formatted, ...prev];
    });
    setCustomPantryInput('');
    Keyboard.dismiss();
  };

  const enterKitchen = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    setShowWelcomePaywall(false);
    navigation.replace('YourDailyEdit');
  }, [navigation]);

  const proceedFromWelcome = useCallback(() => {
    if (preferencesStore.isMamaPlus()) {
      enterKitchen();
      return;
    }
    setShowWelcomePaywall(true);
  }, [enterKitchen]);

  useEffect(() => {
    if (!showWelcomeHandoff) return;
    Animated.parallel([
      Animated.timing(welcomeOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.spring(welcomeScale, {
        toValue: 1,
        friction: 6,
        tension: 85,
        useNativeDriver: true,
      }),
    ]).start();

    const autoTimer = setTimeout(() => {
      proceedFromWelcome();
    }, 1800);
    return () => clearTimeout(autoTimer);
  }, [showWelcomeHandoff, welcomeOpacity, welcomeScale, proceedFromWelcome]);

  const handleComplete = () => {
    Keyboard.dismiss();
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const chosenGoal = BODY_GOAL_OPTIONS.find((g) => g.id === selectedGoalId);

    const parsedBudget = Number(customBudgetInput.replace(/[^0-9.]/g, ''));
    const customBudget =
      Number.isFinite(parsedBudget) && parsedBudget > 0 ? parsedBudget : undefined;

    // Commit any typed allergy or pantry item that the user didn't press '+' on yet
    const baseDiets = selectedDiets.filter((d) => d !== 'none');
    const pendingDiet = customDietInput.trim();
    const finalDiets =
      pendingDiet && !baseDiets.some((d) => d.toLowerCase() === pendingDiet.toLowerCase())
        ? [...baseDiets, pendingDiet]
        : baseDiets;

    const pendingPantryRaw = customPantryInput.trim();
    const pendingPantry = pendingPantryRaw
      ? pendingPantryRaw.charAt(0).toUpperCase() + pendingPantryRaw.slice(1)
      : '';
    const finalKitchenItems =
      pendingPantry && !kitchenItems.some((i) => i.toLowerCase() === pendingPantry.toLowerCase())
        ? [pendingPantry, ...kitchenItems]
        : kitchenItems;

    // Reset cached AI meals & sync the new Mama's pantry BEFORE notifying preference subscribers
    rollService.resetForRegionChange();
    pantryService
      .syncItems(finalKitchenItems.map((name) => ({ name, category: 'pantryStaples' })))
      .catch(() => {});

    preferencesStore.updateCountryAndCurrency(selectedCountryId, undefined, customBudget, true);

    // Gear, time and flavor keep their smart defaults (editable later in settings)
    const updatedPass = preferencesStore.updateKitchenPass({
      dietaryRestrictions: finalDiets,
      bodyGoal: selectedGoalId,
      bodyGoalLabel: chosenGoal ? chosenGoal.title : 'Balanced',
      hasCompletedOnboarding: true,
    });

    preferencesStore.completeOnboarding();
    playRevealThudHaptics();

    // Pre-warm live AI dishes for this exact country while Mama welcomes the user home!
    rollService
      .generateLiveDailyDeck(getCurrentTimeOfDay(), updatedPass, finalKitchenItems)
      .catch(() => {});

    const budgetNum = updatedPass.weeklyBudget || selectedCountry.defaultWeeklyBudget;
    setWelcomeBudgetLabel(
      `${updatedPass.currencySymbol}${Math.round(budgetNum).toLocaleString()}`
    );
    setShowWelcomeHandoff(true);
  };

  const handleNext = () => {
    if (step === 2 && customDietInput.trim()) {
      handleAddCustomDiet();
    }
    if (step < TOTAL_STEPS) {
      transitionToStep(step + 1, 'forward');
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      transitionToStep(step - 1, 'backward');
    }
  };

  const countryStaples = selectedCountry.popularStaples || [];
  const allDisplayedStaples = Array.from(
    new Set([...kitchenItems, ...countryStaples, ...COMMON_PANTRY_STAPLES])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="dark" />
      <KitchenAtmosphere period={getCurrentTimeOfDay()} />

      {/* Top Header Bar: Back + 3 Step Dots + Instant Skip */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          {step > 1 ? (
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
        </View>

        <View style={styles.stepIndicators}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                step === i + 1 && styles.stepDotActive,
                step > i + 1 && styles.stepDotCompleted,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleComplete}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            styles.contentWrapper,
          {
            opacity: stepFade,
            transform: [{ translateY: stepTranslateY }],
          },
        ]}
      >
        {/* ================= STEP 1: LOCATION & WEEKLY BUDGET ================= */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.titleSection}>
              <View style={styles.onboardingMamaStage}>
                <MamaCharacter pose="welcoming" size={82} isSpeaking={false} reactionKey={selectedCountryId} />
              </View>
              <Text style={styles.serifTitle}>Where are you?</Text>
              <Text style={styles.countryGreeting} numberOfLines={2}>
                {selectedCountry.mamaGreeting}
              </Text>
            </View>

            <View style={styles.centerStage}>
              <View style={styles.countryGrid}>
                {SUPPORTED_COUNTRIES.map((country) => {
                  const isSelected = country.id === selectedCountryId;
                  return (
                    <TouchableOpacity
                      key={country.id}
                      style={[
                        styles.countryPill,
                        isSelected && styles.countryPillSelected,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedCountryId(country.id);
                        setCustomBudgetInput('');
                        if (country.popularStaples && country.popularStaples.length > 0) {
                          setKitchenItems([...country.popularStaples]);
                        }
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.countrySymbol,
                          isSelected && styles.countrySymbolSelected,
                        ]}
                      >
                        {country.currencySymbol}
                      </Text>
                      <Text
                        style={[
                          styles.countryLabel,
                          isSelected && styles.countryLabelSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {country.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Weekly Budget Pill + Optional Custom Budget Input */}
              <View style={styles.customBudgetRow}>
                <Text style={styles.budgetText}>
                  Weekly budget {selectedCountry.currencySymbol}
                </Text>
                <TextInput
                  value={customBudgetInput}
                  onChangeText={setCustomBudgetInput}
                  keyboardType="numeric"
                  placeholder={String(selectedCountry.defaultWeeklyBudget)}
                  placeholderTextColor={colors.primary}
                  style={styles.customBudgetInput}
                />
              </View>
            </View>

            <View style={styles.bottomBar}>
              <Animated.View style={{ transform: [{ scale: primaryButtonScale }] }}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleNext}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  activeOpacity={0.92}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={17} color={colors.snow100} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        )}

        {/* ================= STEP 2: BODY GOAL + QUICK CUSTOM RULES ================= */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.titleSection}>
                <Text style={styles.serifTitle}>Your goal</Text>
              </View>

              <View style={[styles.centerStageOptions, { marginTop: 14 }]}>
                {BODY_GOAL_OPTIONS.map((goal) => {
                  const isSelected = goal.id === selectedGoalId;
                  return (
                    <TouchableOpacity
                      key={goal.id}
                      style={[
                        styles.optionCard,
                        isSelected && styles.optionCardSelected,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedGoalId(goal.id);
                      }}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.optionIconWrap,
                          isSelected && styles.optionIconWrapSelected,
                        ]}
                      >
                        <Ionicons
                          name={goal.icon}
                          size={20}
                          color={isSelected ? colors.snow100 : colors.primary}
                        />
                      </View>

                      <View style={styles.optionTextGroup}>
                        <Text
                          style={[
                            styles.optionTitle,
                            isSelected && styles.optionTitleSelected,
                          ]}
                        >
                          {goal.title}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Optional custom allergy / diet rule */}
              <View style={styles.smartDefaultsBox}>
                <View style={styles.customInputRow}>
                  <TextInput
                    value={customDietInput}
                    onChangeText={setCustomDietInput}
                    onSubmitEditing={handleAddCustomDiet}
                    returnKeyType="done"
                    placeholder="Allergies? (optional)"
                    placeholderTextColor={colors.text.muted}
                    style={styles.customTextInput}
                  />
                  <TouchableOpacity
                    onPress={handleAddCustomDiet}
                    style={styles.customAddBtn}
                    accessibilityLabel="Add allergy"
                  >
                    <Ionicons name="add" size={18} color={colors.snow100} />
                  </TouchableOpacity>
                </View>

                {selectedDiets.filter((d) => d !== 'none').length > 0 && (
                  <View style={[styles.quickChipRow, { marginTop: 8 }]}>
                    {selectedDiets
                      .filter((d) => d !== 'none')
                      .map((rule) => (
                        <TouchableOpacity
                          key={rule}
                          style={[styles.quickChip, styles.quickChipActive]}
                          onPress={() =>
                            setSelectedDiets((prev) => {
                              const next = prev.filter((item) => item !== rule);
                              return next.length > 0 ? next : ['none'];
                            })
                          }
                        >
                          <Text style={[styles.quickChipText, styles.quickChipTextActive]}>
                            {rule} ×
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.bottomBar}>
              <Animated.View style={{ transform: [{ scale: primaryButtonScale }] }}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleNext}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  activeOpacity={0.92}
                >
                  <Text style={styles.primaryButtonText}>Next</Text>
                  <Ionicons name="arrow-forward" size={17} color={colors.snow100} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        )}

        {/* ================= STEP 3: STARTING KITCHEN INVENTORY + CUSTOM ITEMS ================= */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 12 }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.titleSection}>
                <Text style={styles.serifTitle}>Your kitchen</Text>
                {kitchenItems.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setKitchenItems([]);
                    }}
                    style={{ marginTop: 6 }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
                      {kitchenItems.length} selected · Clear all
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Custom Ingredient Input */}
              <View style={[styles.customInputRow, { marginTop: 16 }]}>
                <TextInput
                  value={customPantryInput}
                  onChangeText={setCustomPantryInput}
                  onSubmitEditing={handleAddCustomPantryItem}
                  returnKeyType="done"
                  placeholder="Add an item"
                  placeholderTextColor={colors.text.muted}
                  style={styles.customTextInput}
                />
                <TouchableOpacity
                  onPress={handleAddCustomPantryItem}
                  style={styles.customAddBtn}
                  accessibilityLabel="Add item"
                >
                  <Ionicons name="add" size={18} color={colors.snow100} />
                </TouchableOpacity>
              </View>

              {/* Staple & Custom Pills Grid */}
              <View style={styles.staplesWrap}>
                {allDisplayedStaples.map((item) => {
                  const isSelected = kitchenItems.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.stapleChip,
                        isSelected && styles.stapleChipSelected,
                      ]}
                      onPress={() => handleToggleKitchenItem(item)}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark-circle' : 'add-outline'}
                        size={15}
                        color={isSelected ? colors.snow100 : colors.primary}
                      />
                      <Text
                        style={[
                          styles.stapleChipText,
                          isSelected && styles.stapleChipTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.bottomBar}>
              <Animated.View style={{ transform: [{ scale: primaryButtonScale }] }}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleComplete}
                  onPressIn={handleButtonPressIn}
                  onPressOut={handleButtonPressOut}
                  activeOpacity={0.92}
                >
                  <Text style={styles.primaryButtonText}>Start cooking</Text>
                  <Ionicons name="arrow-forward" size={17} color={colors.snow100} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>

    {/* Warm "Welcome Home" Mama Hand-off Moment */}
    {showWelcomeHandoff ? (
      <Animated.View style={[styles.welcomeOverlay, { opacity: welcomeOpacity }]}>
        <KitchenAtmosphere period={getCurrentTimeOfDay()} />
        <Animated.View
          style={[styles.welcomeContent, { transform: [{ scale: welcomeScale }] }]}
        >
          <View style={styles.welcomeAvatarStage}>
            <SteamWisps triggerKey={selectedCountry.id} style={styles.welcomeSteam} />
            <MamaCharacter pose="delighted" size={118} isSpeaking={true} />
          </View>

          <Text style={styles.welcomeTitle}>
            {user?.name?.trim()
              ? `Welcome home, ${user.name.trim().split(' ')[0]}.`
              : 'Welcome home, my child.'}
          </Text>

          <Text style={styles.welcomeMessage}>
            {getWelcomeHomeLine(
              selectedCountry.id,
              welcomeBudgetLabel || `${selectedCountry.currencySymbol}${selectedCountry.defaultWeeklyBudget}`
            )}
          </Text>

          <TouchableOpacity
            style={styles.welcomeCta}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              proceedFromWelcome();
            }}
            activeOpacity={0.88}
          >
            <Text style={styles.welcomeCtaText}>Step into the kitchen</Text>
            <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    ) : null}

    {/* Soft FOMO Welcome Offer (always includes 1-tap "Continue free") */}
    <MamaPaywallModal
      visible={showWelcomePaywall}
      context="onboarding"
      countryName={selectedCountry.name}
      budgetLabel={
        welcomeBudgetLabel || `${selectedCountry.currencySymbol}${selectedCountry.defaultWeeklyBudget}`
      }
      onClose={enterKitchen}
      onSubscribed={enterKitchen}
    />
  </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    height: 44,
  },
  headerLeft: {
    width: 36,
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 4,
  },
  backButtonPlaceholder: {
    width: 24,
  },
  skipButton: {
    width: 44,
    alignItems: 'flex-end',
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  stepIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 14,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(36, 40, 32, 0.12)',
  },
  stepDotActive: {
    width: 28,
    backgroundColor: colors.primary,
  },
  stepDotCompleted: {
    backgroundColor: 'rgba(30, 58, 47, 0.45)',
  },
  contentWrapper: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  titleSection: {
    alignItems: 'center',
    paddingTop: 12,
  },
  serifTitle: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  serifSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerStageOptions: {
    gap: 10,
    justifyContent: 'center',
  },
  countryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    maxWidth: 330,
  },
  countryPill: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  countryPillSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F3F6F1',
  },
  countrySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  countrySymbolSelected: {
    color: colors.primary,
  },
  countryLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  countryLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  customBudgetRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 58, 47, 0.07)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  budgetText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  customBudgetInput: {
    minWidth: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F3F6F1',
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 58, 47, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconWrapSelected: {
    backgroundColor: colors.primary,
  },
  optionTextGroup: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.text.primary,
  },
  optionTitleSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 12,
    color: colors.text.muted,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(36, 40, 32, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  smartDefaultsBox: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    padding: 12,
  },
  smartDefaultsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  quickChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.linen100,
  },
  quickChipActive: {
    backgroundColor: colors.primary,
  },
  quickChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  quickChipTextActive: {
    color: colors.snow100,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  customTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: colors.text.primary,
  },
  customAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  customAddBtnText: {
    color: colors.snow100,
    fontSize: 13,
    fontWeight: '700',
  },
  staplesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  stapleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(36, 40, 32, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stapleChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stapleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  stapleChipTextSelected: {
    color: colors.snow100,
  },
  bottomBar: {
    paddingTop: 8,
  },
  primaryButton: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.snow100,
    letterSpacing: 0.2,
  },
  onboardingMamaStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  onboardingSeal: {
    position: 'absolute',
    right: -22,
    bottom: -4,
  },
  countryGreeting: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 14,
  },
  welcomeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    zIndex: 50,
  },
  welcomeContent: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  welcomeAvatarStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  welcomeSteam: {
    marginBottom: -4,
  },
  welcomeSeal: {
    position: 'absolute',
    right: -18,
    bottom: -4,
  },
  welcomeTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeMessage: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  welcomeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 999,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeCtaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default MakeItYours;
