import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { MamaCharacter, MamaPose } from '../../components/common/MamaCharacter';
import { preferencesStore, SUPPORTED_COUNTRIES } from '../../services/preferencesStore';
import { userPreferencesService } from '../../services/api/userPreferencesService';
import { WeeklyBudgetCard } from './components/WeeklyBudgetCard';

type Props = NativeStackScreenProps<RootStackParamList, 'MakeItYours'>;

interface ConversationalStep {
  step: number;
  mamaPose: MamaPose;
  dialogue: string;
  options: {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    mamaReaction: string;
    reactionPose: MamaPose;
  }[];
  isMultiSelect?: boolean;
  otherPlaceholder: string;
}

const STEPS: ConversationalStep[] = [
  {
    step: 1,
    mamaPose: 'welcoming',
    dialogue: "Where are you cooking from? Tell me your location so I know your local market, staples, and currency.",
    otherPlaceholder: 'Type your country or currency...',
    options: [
      {
        id: 'NG',
        label: 'Nigeria (₦ NGN)',
        icon: 'location-outline',
        mamaReaction: "Ah, my Nigerian child! Jollof, plantains, and proper pepper seasoning.",
        reactionPose: 'delighted',
      },
      {
        id: 'GB',
        label: 'United Kingdom (£ GBP)',
        icon: 'location-outline',
        mamaReaction: "London & UK! Hearty comfort without Tesco meal-deal boredom.",
        reactionPose: 'welcoming',
      },
      {
        id: 'US',
        label: 'United States ($ USD)',
        icon: 'location-outline',
        mamaReaction: "State-side! We'll beat the $30 DoorDash trap together.",
        reactionPose: 'writing',
      },
      {
        id: 'GH',
        label: 'Ghana (GH₵ GHS)',
        icon: 'location-outline',
        mamaReaction: "Akwaaba! Delicious waakye, shito, and golden plantains.",
        reactionPose: 'delighted',
      },
      {
        id: 'KE',
        label: 'Kenya (KSh KES)',
        icon: 'location-outline',
        mamaReaction: "Karibu! Soft chapati, savory sukuma wiki, and warm home comfort.",
        reactionPose: 'delighted',
      },
      {
        id: 'EU',
        label: 'Europe (€ EUR)',
        icon: 'location-outline',
        mamaReaction: "Magnificent olive oil, crusty bread, and effortless flavor.",
        reactionPose: 'cooking',
      },
      {
        id: 'CA',
        label: 'Canada (CA$ CAD)',
        icon: 'location-outline',
        mamaReaction: "Warm comfort for cold days. Fast, hearty, and cozy.",
        reactionPose: 'cooking',
      },
    ],
  },
  {
    step: 2,
    mamaPose: 'writing',
    dialogue: "What is your weekly food budget? Let's set your number so everything I show you stays within your pocket.",
    otherPlaceholder: 'Type custom weekly budget amount...',
    options: [
      {
        id: 'lean',
        label: 'Lean & Smart Saver',
        icon: 'wallet-outline',
        mamaReaction: "A smart budget! We will stretch every single penny with zero waste.",
        reactionPose: 'writing',
      },
      {
        id: 'balanced',
        label: 'Balanced Home Cooking',
        icon: 'basket-outline',
        mamaReaction: "The sweet spot! Fresh proteins, hearty staples, and great comfort.",
        reactionPose: 'delighted',
      },
      {
        id: 'abundant',
        label: 'Abundant Feasts & Treats',
        icon: 'restaurant-outline',
        mamaReaction: "Living well! We will cook vibrant, abundant bowls every single evening.",
        reactionPose: 'cooking',
      },
    ],
  },
  {
    step: 3,
    mamaPose: 'welcoming',
    dialogue: "Look at you, working all day. What kind of food feels like home to your stomach?",
    otherPlaceholder: 'Type your custom cuisine or country...',
    options: [
      {
        id: 'african_caribbean',
        label: 'African & Caribbean',
        icon: 'flame-outline',
        mamaReaction: "Now you're talking my language! Rich flavor, proper seasoning.",
        reactionPose: 'delighted',
      },
      {
        id: 'asian_comfort',
        label: 'Asian Comfort',
        icon: 'restaurant-outline',
        mamaReaction: "Fast, fragrant, and comforting. Nothing beats garlic ginger noodles.",
        reactionPose: 'cooking',
      },
      {
        id: 'everyday_comfort',
        label: 'Everyday Classics',
        icon: 'fast-food-outline',
        mamaReaction: "Straight to the point. No fuss, just good quick comfort.",
        reactionPose: 'writing',
      },
      {
        id: 'mediterranean',
        label: 'Mediterranean & Western',
        icon: 'cafe-outline',
        mamaReaction: "Golden and satisfying. Garlic and good olive oil cure everything.",
        reactionPose: 'cooking',
      },
      {
        id: 'latin_americas',
        label: 'Latin & Americas',
        icon: 'nutrition-outline',
        mamaReaction: "Warm, vibrant, and hearty. A warm skillet will set you right.",
        reactionPose: 'delighted',
      },
    ],
  },
  {
    step: 4,
    mamaPose: 'thinking',
    dialogue: "Tell me the truth: what are we actually cooking with in your kitchen?",
    otherPlaceholder: 'Type your gear (e.g. Instant Pot, Cast Iron)...',
    options: [
      {
        id: 'one_pan',
        label: '1 Pan & Single Burner',
        icon: 'disc-outline',
        mamaReaction: "Respect! In this house, we don't wash 5 pots after a long day.",
        reactionPose: 'cooking',
      },
      {
        id: 'air_fryer',
        label: 'Air Fryer & Microwave',
        icon: 'flash-outline',
        mamaReaction: "Smart and clean. You put it in, sit down, and dinner is done.",
        reactionPose: 'delighted',
      },
      {
        id: 'full_kitchen',
        label: 'Full Kitchen Setup',
        icon: 'grid-outline',
        mamaReaction: "Wonderful! When you have time, we will make something special.",
        reactionPose: 'writing',
      },
    ],
  },
  {
    step: 5,
    mamaPose: 'thinking',
    dialogue: "Any non-negotiables? Anything Mama should never put on your plate?",
    otherPlaceholder: 'Type any allergy or food you dislike...',
    isMultiSelect: true,
    options: [
      {
        id: 'all',
        label: 'I Eat Everything',
        icon: 'sparkles-outline',
        mamaReaction: "An adventurous eater! The whole kitchen is our playground.",
        reactionPose: 'delighted',
      },
      {
        id: 'halal',
        label: 'Halal Only',
        icon: 'shield-checkmark-outline',
        mamaReaction: "Noted with care. Every recommendation will be 100% halal.",
        reactionPose: 'writing',
      },
      {
        id: 'no_pork',
        label: 'No Pork',
        icon: 'ban-outline',
        mamaReaction: "Consider it done. Poultry, beef, eggs, and fish only.",
        reactionPose: 'writing',
      },
      {
        id: 'vegetarian',
        label: 'Vegetarian / Plant-Forward',
        icon: 'leaf-outline',
        mamaReaction: "Beautiful. We will make plants taste deeply rich and savory.",
        reactionPose: 'cooking',
      },
      {
        id: 'no_dairy',
        label: 'No Dairy / Lactose Friendly',
        icon: 'water-outline',
        mamaReaction: "Understood. Pure olive oil, broths, and sesame instead.",
        reactionPose: 'writing',
      },
    ],
  },
];

export const MakeItYours: React.FC<Props> = ({ navigation }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({
    0: 'NG',
    1: 35000,
    2: 'african_caribbean',
    3: 'one_pan',
    4: ['all'],
  });
  const [customTextInputs, setCustomTextInputs] = useState<Record<number, string>>({});
  const [isOtherActive, setIsOtherActive] = useState<Record<number, boolean>>({});
  const [activeSpeech, setActiveSpeech] = useState<string>(STEPS[0].dialogue);
  const [activePose, setActivePose] = useState<MamaPose>(STEPS[0].mamaPose);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Animations
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const bubbleScaleAnim = useRef(new Animated.Value(1)).current;

  const currentStep = STEPS[currentStepIndex];
  const selectedCountryCode = (typeof answers[0] === 'string' && !answers[0].startsWith('custom:')) ? answers[0] : 'NG';
  const countryInfo = SUPPORTED_COUNTRIES.find((c) => c.id === selectedCountryCode) || SUPPORTED_COUNTRIES[0];

  const animateToStep = (newIndex: number) => {
    Animated.timing(contentFadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStepIndex(newIndex);
      setActiveSpeech(STEPS[newIndex].dialogue);
      setActivePose(STEPS[newIndex].mamaPose);

      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSelectOption = (
    optionId: string,
    mamaReaction: string,
    reactionPose: MamaPose
  ) => {
    setIsOtherActive((prev) => ({ ...prev, [currentStepIndex]: false }));
    setActiveSpeech(mamaReaction);
    setActivePose(reactionPose);

    bubbleScaleAnim.setValue(0.95);
    Animated.spring(bubbleScaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    if (currentStepIndex === 0) {
      // User changed country -> update default weekly budget for that country
      const foundCountry = SUPPORTED_COUNTRIES.find((c) => c.id === optionId);
      const newDefaultBudget = foundCountry ? foundCountry.defaultWeeklyBudget : 85;
      setAnswers((prev) => ({
        ...prev,
        0: optionId,
        1: newDefaultBudget,
      }));
      return;
    }

    if (currentStepIndex === 1) {
      // Step 2: Budget tier selected
      const c = SUPPORTED_COUNTRIES.find((item) => item.id === answers[0]) || SUPPORTED_COUNTRIES[0];
      let newBudget = c.defaultWeeklyBudget;
      if (optionId === 'lean') {
        newBudget = Math.round((c.defaultWeeklyBudget * 0.6) / (c.defaultWeeklyBudget >= 1000 ? 500 : 5)) * (c.defaultWeeklyBudget >= 1000 ? 500 : 5);
      } else if (optionId === 'balanced') {
        newBudget = c.defaultWeeklyBudget;
      } else if (optionId === 'abundant') {
        newBudget = Math.round((c.defaultWeeklyBudget * 1.6) / (c.defaultWeeklyBudget >= 1000 ? 500 : 5)) * (c.defaultWeeklyBudget >= 1000 ? 500 : 5);
      }
      setAnswers((prev) => ({ ...prev, 1: newBudget }));
      return;
    }

    if (currentStep.isMultiSelect) {
      const currentList = (answers[currentStepIndex] as string[]) || [];
      let updated: string[];
      if (optionId === 'all') {
        updated = ['all'];
      } else {
        const withoutAll = currentList.filter((item) => item !== 'all');
        if (withoutAll.includes(optionId)) {
          updated = withoutAll.filter((item) => item !== optionId);
        } else {
          updated = [...withoutAll, optionId];
        }
      }
      setAnswers((prev) => ({
        ...prev,
        [currentStepIndex]: updated.length > 0 ? updated : ['all'],
      }));
    } else {
      setAnswers((prev) => ({ ...prev, [currentStepIndex]: optionId }));
    }
  };

  const handleCustomTextChange = (text: string) => {
    setCustomTextInputs((prev) => ({ ...prev, [currentStepIndex]: text }));
    if (text.trim().length > 0) {
      setIsOtherActive((prev) => ({ ...prev, [currentStepIndex]: true }));
      if (currentStepIndex === 1) {
        const num = parseFloat(text.replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num > 0) {
          setAnswers((prev) => ({ ...prev, 1: num }));
          setActiveSpeech(`"${countryInfo.currencySymbol}${num.toLocaleString()} noted! I'll make sure every recipe respects your pocket."`);
          setActivePose('writing');
          return;
        }
      }
      setAnswers((prev) => ({ ...prev, [currentStepIndex]: `custom:${text.trim()}` }));
      setActiveSpeech(`"Got it! I wrote down '${text.trim()}' in my recipe book."`);
      setActivePose('writing');
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      animateToStep(currentStepIndex + 1);
    } else {
      saveAndFinish();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      animateToStep(currentStepIndex - 1);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const saveAndFinish = async () => {
    setIsSaving(true);
    setActiveSpeech("Locking in your kitchen brief in Mama's recipe book...");
    setActivePose('writing');

    const rawCountry = answers[0] as string;
    const rawBudget = Number(answers[1]) || 35000;
    const rawCuisine = answers[2] as string;
    const rawGear = answers[3] as string;
    const rawDiet = (answers[4] as string[]) || ['all'];

    const cuisineChoice = STEPS[2].options.find((o) => o.id === rawCuisine);
    const gearChoice = STEPS[3].options.find((o) => o.id === rawGear);

    if (rawCountry?.startsWith('custom:')) {
      const customName = rawCountry.replace('custom:', '');
      preferencesStore.updateKitchenPass({
        country: 'custom',
        countryName: customName,
        currencyCode: 'USD',
        currencySymbol: '$',
        weeklyBudget: rawBudget,
        spentThisWeek: 0,
      });
    } else {
      preferencesStore.updateCountryAndCurrency(rawCountry || 'NG', undefined, rawBudget);
    }

    const updatedPass = preferencesStore.updateKitchenPass({
      weeklyBudget: rawBudget,
      cuisineAnchor: rawCuisine?.startsWith('custom:') ? rawCuisine.replace('custom:', '') : (rawCuisine || 'african_caribbean'),
      cuisineLabel: rawCuisine?.startsWith('custom:') ? rawCuisine.replace('custom:', '') : (cuisineChoice?.label || 'African & Caribbean'),
      cookingGear: rawGear?.startsWith('custom:') ? rawGear.replace('custom:', '') : (rawGear || 'one_pan'),
      cookingGearLabel: rawGear?.startsWith('custom:') ? rawGear.replace('custom:', '') : (gearChoice?.label || '1 Pan & Burner'),
      timeLimitMinutes: rawGear === 'one_pan' ? 10 : 15,
      timeLimitLabel: rawGear === 'one_pan' ? 'Under 10 mins (1 Pan)' : '12 to 15 mins',
      stapleBase: 'rice',
      stapleBaseLabel: 'Rice & Grains',
      dietaryRestrictions: rawDiet,
      spiceLevel: 'warm',
      spiceLabel: 'A Warm Kick',
      hasCompletedOnboarding: true,
    });

    try {
      await userPreferencesService.syncToDb(updatedPass);
    } catch (e) {
      console.warn('[MakeItYours] syncToDb warning:', e);
    } finally {
      setIsSaving(false);
      setIsCompleted(true);
    }
  };

  // --- FINAL SCREEN: STAMPED KITCHEN PASS ---
  if (isCompleted) {
    const pass = preferencesStore.getKitchenPass();
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.summaryWrap}>
          <MamaCharacter pose="delighted" size={140} isSpeaking={true} />

          <View style={styles.summaryTextGroup}>
            <Text style={styles.summaryTitle}>Your Kitchen Brief is Ready</Text>
            <Text style={styles.summarySub}>
              &ldquo;I have locked in your taste, your gear, and your budget. Every meal I curate for you will respect your home.&rdquo;
            </Text>
          </View>

          <View style={styles.minimalPassCard}>
            <View style={styles.passRow}>
              <Text style={styles.passLabel}>Market & Currency</Text>
              <Text style={styles.passVal}>{pass.countryName} ({pass.currencySymbol})</Text>
            </View>
            <View style={styles.passRow}>
              <Text style={styles.passLabel}>Weekly Budget</Text>
              <Text style={styles.passVal}>{pass.currencySymbol}{pass.weeklyBudget.toLocaleString()} / wk</Text>
            </View>
            <View style={styles.passRow}>
              <Text style={styles.passLabel}>Flavor Style</Text>
              <Text style={styles.passVal}>{pass.cuisineLabel}</Text>
            </View>
            <View style={styles.passRow}>
              <Text style={styles.passLabel}>Kitchen Specs</Text>
              <Text style={styles.passVal}>{pass.cookingGearLabel}</Text>
            </View>
            <View style={styles.passRow}>
              <Text style={styles.passLabel}>Dealbreakers</Text>
              <Text style={styles.passVal}>
                {pass.dietaryRestrictions.includes('all') || pass.dietaryRestrictions.length === 0
                  ? 'None (Eats Everything)'
                  : pass.dietaryRestrictions.join(', ')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.replace('YourDailyEdit')}
            activeOpacity={0.85}
          >
            <Text style={styles.doneButtonText}>See Tonight&apos;s Curated Listing</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.snow100} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- CONVERSATION STEP SCREEN ---
  const selectedAnswer = answers[currentStepIndex];
  const customVal = customTextInputs[currentStepIndex] || '';
  const isCustomSelected = isOtherActive[currentStepIndex] || (typeof selectedAnswer === 'string' && selectedAnswer.startsWith('custom:'));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Top Navigation Bar: Back + Step Counter */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.navIconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Step dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((s, idx) => (
            <View
              key={s.step}
              style={[
                styles.dot,
                idx === currentStepIndex && styles.dotActive,
                idx < currentStepIndex && styles.dotDone,
              ]}
            />
          ))}
        </View>

        {/* Clean Step Counter Tag */}
        <View style={styles.stepTag}>
          <Text style={styles.stepTagText}>{currentStepIndex + 1}/{STEPS.length}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.contentBody, { opacity: contentFadeAnim }]}>
            {/* Mama Live Animated Stage & Dynamic Speech Bubble */}
            <View style={styles.mamaStage}>
              <MamaCharacter
                pose={activePose}
                size={130}
                isSpeaking={true}
                onPress={() => {
                  setActiveSpeech("Pick what your heart wants, my child. Mama will take care of the rest!");
                  setActivePose('delighted');
                }}
              />

              <Animated.View
                style={[
                  styles.speechBubble,
                  { transform: [{ scale: bubbleScaleAnim }] },
                ]}
              >
                <View style={styles.speechTriangle} />
                <Text style={styles.speechDialogue}>{activeSpeech}</Text>
              </Animated.View>
            </View>

            {/* If on Step 2: Render WeeklyBudgetCard interactive adjuster */}
            {currentStepIndex === 1 && (
              <View style={{ width: '100%', marginBottom: 10 }}>
                <WeeklyBudgetCard
                  amount={Number(answers[1]) || countryInfo.defaultWeeklyBudget}
                  currencySymbol={countryInfo.currencySymbol}
                  currencyCode={countryInfo.currencyCode}
                  onAmountChange={(val) => {
                    setAnswers((prev) => ({ ...prev, 1: val }));
                    setActiveSpeech(`"${countryInfo.currencySymbol}${val.toLocaleString()} noted! I'll make sure every recipe respects your pocket."`);
                    setActivePose('writing');
                  }}
                />
              </View>
            )}

            {/* Answer Options */}
            <View style={styles.optionsList}>
              {currentStep.options.map((opt) => {
                let isSelected = false;
                if (currentStepIndex === 1) {
                  const c = countryInfo;
                  if (opt.id === 'lean') isSelected = Number(answers[1]) <= c.defaultWeeklyBudget * 0.75;
                  else if (opt.id === 'abundant') isSelected = Number(answers[1]) >= c.defaultWeeklyBudget * 1.3;
                  else if (opt.id === 'balanced') isSelected = Number(answers[1]) > c.defaultWeeklyBudget * 0.75 && Number(answers[1]) < c.defaultWeeklyBudget * 1.3;
                } else if (currentStep.isMultiSelect) {
                  isSelected = Array.isArray(selectedAnswer) && selectedAnswer.includes(opt.id);
                } else {
                  isSelected = selectedAnswer === opt.id && !isCustomSelected;
                }

                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => handleSelectOption(opt.id, opt.mamaReaction, opt.reactionPose)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
                      <Ionicons
                        name={opt.icon}
                        size={20}
                        color={isSelected ? colors.snow100 : colors.primary}
                      />
                    </View>

                    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {opt.label}
                    </Text>

                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color={colors.snow100} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Other... Write-in Input Box */}
              <View style={[styles.otherCard, isCustomSelected && styles.otherCardActive]}>
                <View style={styles.otherHeaderRow}>
                  <View style={[styles.iconWrap, isCustomSelected && styles.iconWrapSelected]}>
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={isCustomSelected ? colors.snow100 : colors.primary}
                    />
                  </View>
                  <Text style={[styles.otherTitle, isCustomSelected && styles.otherTitleActive]}>
                    Other...
                  </Text>
                  {isCustomSelected && (
                    <View style={[styles.checkCircle, styles.checkCircleSelected]}>
                      <Ionicons name="checkmark" size={14} color={colors.snow100} />
                    </View>
                  )}
                </View>

                <TextInput
                  style={styles.otherInput}
                  value={customVal}
                  onChangeText={handleCustomTextChange}
                  placeholder={currentStep.otherPlaceholder}
                  placeholderTextColor={colors.text.muted}
                  returnKeyType="done"
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Bar: Single Clean Continue Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleNext}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={colors.snow100} />
                <Text style={styles.continueButtonText}>Saving to Database...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.continueButtonText}>
                  {currentStepIndex === STEPS.length - 1 ? "Complete Kitchen Setup" : "Continue"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.snow100} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flexOne: {
    flex: 1,
  },
  navBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(36, 40, 32, 0.08)',
  },
  navIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.snow200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(36, 40, 32, 0.15)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
  dotDone: {
    backgroundColor: colors.primary,
  },
  stepTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.snow200,
  },
  stepTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  contentBody: {
    gap: 16,
  },
  mamaStage: {
    alignItems: 'center',
    gap: 12,
  },
  speechBubble: {
    backgroundColor: '#FAF6EF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ECE4D4',
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: '100%',
    position: 'relative',
    shadowColor: '#242820',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  speechTriangle: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#ECE4D4',
  },
  speechDialogue: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.snow100,
    borderWidth: 1.5,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    gap: 12,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F3F6F1',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.snow200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapSelected: {
    backgroundColor: colors.primary,
  },
  optionLabel: {
    flex: 1,
    fontSize: typography.fontSize.sub,
    fontWeight: '500',
    color: colors.text.primary,
  },
  optionLabelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(36, 40, 32, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  otherCard: {
    backgroundColor: colors.snow100,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    padding: 14,
    gap: 10,
  },
  otherCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F3F6F1',
  },
  otherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  otherTitle: {
    flex: 1,
    fontSize: typography.fontSize.sub,
    fontWeight: '500',
    color: colors.text.primary,
  },
  otherTitleActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  otherInput: {
    backgroundColor: colors.snow200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: typography.fontSize.sub,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(36, 40, 32, 0.08)',
    backgroundColor: colors.background,
  },
  continueButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: typography.fontSize.sub,
    fontWeight: '700',
    color: colors.snow100,
    letterSpacing: 0.3,
  },
  summaryWrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  summaryTextGroup: {
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  summarySub: {
    fontSize: typography.fontSize.sub,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  minimalPassCard: {
    width: '100%',
    backgroundColor: colors.snow100,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 10,
  },
  passRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  passVal: {
    fontSize: typography.fontSize.sub,
    color: colors.text.primary,
    fontWeight: '600',
  },
  doneButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneButtonText: {
    fontSize: typography.fontSize.sub,
    fontWeight: '700',
    color: colors.snow100,
  },
});

export default MakeItYours;
