import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { MamaCharacter, MamaPose } from '../../components/common/MamaCharacter';
import { TactileToast } from '../../components/common/TactileToast';
import {
  preferencesStore,
  convertMealCost,
} from '../../services/preferencesStore';
import { savedMealsService } from '../../services/api/savedMealsService';
import { decisionsService } from '../../services/api/decisionsService';

type Props = NativeStackScreenProps<RootStackParamList, 'AtHomeMealDetails'>;

interface CookingStepItem {
  id: number;
  timeHint: string;
  title: string;
  instruction: string;
}

export const AtHomeMealDetails: React.FC<Props> = ({ navigation, route }) => {
  const params = route.params;
  const cookTime = params?.cookTime || '15 min';

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [mamaPose, setMamaPose] = useState<MamaPose>('cooking');
  const [mamaNote, setMamaNote] = useState<string>(
    `"You've got this! Follow my simple steps, and you'll be eating in ${cookTime}."`
  );

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
            Choose a meal from Your Daily Edit, Discover, or Your Collection to see full cooking instructions.
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
  // Use API-provided image only — never fall back to a hardcoded third-party URL
  const image = params.image || undefined;

  const mealId = params.id || `meal-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const rawIngredients = params.ingredients;
  const rawSteps = params.steps;

  // Dynamically resolve ingredients from params — no hardcoded eggs or mock ingredients
  const resolvedIngredients =
    rawIngredients && rawIngredients.length > 0
      ? rawIngredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          inPantry: true,
        }))
      : [];

  // Dynamically resolve steps from params — no hardcoded mock steps
  const resolvedSteps: CookingStepItem[] =
    rawSteps && rawSteps.length > 0
      ? rawSteps.map((stepText, idx) => ({
          id: idx + 1,
          timeHint: `Step ${idx + 1}`,
          title: stepText.length > 32 ? stepText.slice(0, 32).trim() + '…' : stepText,
          instruction: stepText,
        }))
      : [];

  const toggleStep = (stepId: number) => {
    let updated: number[];
    if (completedSteps.includes(stepId)) {
      updated = completedSteps.filter((id) => id !== stepId);
    } else {
      updated = [...completedSteps, stepId];
    }
    setCompletedSteps(updated);

    if (updated.length === 0) {
      setMamaPose('cooking');
      setMamaNote(`"Let's get cooking! The pan is waiting."`);
    } else if (updated.length === 1) {
      setMamaPose('writing');
      setMamaNote(`"Smells incredible already! Don't rush it, let the flavor build."`);
    } else if (updated.length === resolvedSteps.length) {
      setMamaPose('delighted');
      setMamaNote(`"Magnificent! Dinner is served. Sit down, relax, and eat warm."`);
    } else {
      setMamaPose('cooking');
      setMamaNote(`"Almost there! Just assembling your hot comfort bowl."`);
    }
  };

  const handleMarkAsCooked = () => {
    // 1. Update local preference store
    preferencesStore.recordMealDecision(mealId, 'cooked', costNumeric);
    // 2. Persist decision to Neon DB
    decisionsService.log(mealId, title, 'cooked', costNumeric);

    setMamaPose('delighted');
    setToastMessage(`Mama: "Well done! I logged this in your weekly budget."`);

    Animated.sequence([
      Animated.timing(finishScale, { toValue: 0.94, duration: 100, useNativeDriver: true }),
      Animated.timing(finishScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        navigation.navigate('YourDailyEdit');
      }, 900);
    });
  };

  const handleToggleBookmark = () => {
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
      setToastMessage('Removed from collection');
    }
  };

  // Localized Costs
  const homeCostFormatted = convertMealCost(
    costNumeric,
    currentPass.currencyCode,
    currentPass.currencySymbol
  );
  const takeoutCostFormatted = convertMealCost(
    14.0,
    currentPass.currencyCode,
    currentPass.currencySymbol
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.container, { opacity: contentFade, transform: [{ translateY: contentY }] }]}>
          {/* Hero Image with cook time & gear badges */}
          <View style={styles.heroWrap}>
            {image ? (
              <Image source={{ uri: image }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderHero}>
                <Ionicons name="flame-outline" size={48} color={colors.primary} />
              </View>
            )}
            <View style={styles.timeTag}>
              <Ionicons name="time-outline" size={13} color={colors.primary} />
              <Text style={styles.timeTagText}>{cookTime}</Text>
            </View>
            <View style={styles.gearTag}>
              <Ionicons name="disc-outline" size={13} color={colors.snow100} />
              <Text style={styles.gearTagText}>{gear}</Text>
            </View>
          </View>

          {/* Dish Title & Price Row */}
          <View style={styles.titleRow}>
            <View style={styles.titleTextWrap}>
              <Text style={styles.mealTitle}>{title}</Text>
              <Text style={styles.mealSubtitle}>{cookTime} · 1 Pan · Zero cleanup stress</Text>
            </View>
            <View style={styles.pricePill}>
              <Text style={styles.priceValue}>{homeCostFormatted}</Text>
              <Text style={styles.priceLabel}>homemade</Text>
            </View>
          </View>

          {/* Mama Cooking Coach Stage */}
          <View style={styles.mamaCoachCard}>
            <MamaCharacter pose={mamaPose} size={56} isSpeaking={true} />
            <View style={styles.mamaCoachTextWrap}>
              <Text style={styles.mamaCoachName}>MAMA&apos;S TIP</Text>
              <Text style={styles.mamaCoachBody}>{mamaNote}</Text>
            </View>
          </View>

          {/* Cost Savings vs Takeout Banner */}
          <View style={styles.savingsCard}>
            <View style={styles.savingsCol}>
              <Text style={styles.savingsLabel}>Homemade</Text>
              <Text style={styles.savingsValHome}>{homeCostFormatted}</Text>
            </View>
            <View style={styles.savingsDivider} />
            <View style={styles.savingsCol}>
              <Text style={styles.savingsLabel}>Takeout app</Text>
              <Text style={styles.savingsValOut}>{takeoutCostFormatted}</Text>
            </View>
            <View style={styles.savingsBadge}>
              <Ionicons name="trending-down" size={14} color={colors.snow100} />
              <Text style={styles.savingsBadgeText}>Huge Saving</Text>
            </View>
          </View>

          {/* Section: What You Need (Ingredients) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Ingredients</Text>
            <View style={styles.ingredientList}>
              {resolvedIngredients.length > 0 ? (
                resolvedIngredients.map((item, idx) => (
                  <View key={idx} style={styles.ingredientRow}>
                    <View style={styles.ingredientBullet}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                    </View>
                    <Text style={styles.ingredientName}>{item.name}</Text>
                    <Text style={styles.ingredientAmount}>{item.amount}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ fontSize: 13, color: colors.text.secondary, fontStyle: 'italic', paddingVertical: 4 }}>
                  Uses your confirmed kitchen staples and seasoning to taste.
                </Text>
              )}
            </View>
          </View>

          {/* Section: Step-by-Step Cooking Guide with Interactive Checkboxes */}
          <View style={styles.sectionCard}>
            <View style={styles.stepsHeader}>
              <Text style={styles.sectionHeading}>Cooking Steps</Text>
              <Text style={styles.stepsCount}>
                {completedSteps.length}/{resolvedSteps.length} done
              </Text>
            </View>

            <View style={styles.stepsList}>
              {resolvedSteps.length > 0 ? (
                resolvedSteps.map((step) => {
                  const isDone = completedSteps.includes(step.id);
                  return (
                    <TouchableOpacity
                      key={step.id}
                      style={[styles.stepItem, isDone && styles.stepItemDone]}
                      onPress={() => toggleStep(step.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.stepCircle, isDone && styles.stepCircleDone]}>
                        {isDone ? (
                          <Ionicons name="checkmark" size={16} color={colors.snow100} />
                        ) : (
                          <Text style={styles.stepNumText}>{step.id}</Text>
                        )}
                      </View>

                      <View style={styles.stepBody}>
                        <View style={styles.stepTopLine}>
                          <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>
                            {step.title}
                          </Text>
                          <Text style={styles.stepTimeHint}>{step.timeHint}</Text>
                        </View>
                        <Text style={[styles.stepInstruction, isDone && styles.stepInstructionDone]}>
                          {step.instruction}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={{ fontSize: 13, color: colors.text.secondary, fontStyle: 'italic', paddingVertical: 4 }}>
                  Follow Mama&apos;s cooking tips above to prepare this meal in your skillet.
                </Text>
              )}
            </View>
          </View>

          {/* Primary Action Button: "I Cooked This Tonight!" */}
          <Animated.View style={{ transform: [{ scale: finishScale }] }}>
            <TouchableOpacity
              style={styles.cookedButton}
              onPress={handleMarkAsCooked}
              activeOpacity={0.88}
            >
              <Ionicons name="checkmark-done" size={20} color={colors.snow100} />
              <Text style={styles.cookedButtonText}>I Cooked This Tonight!</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ScrollView>

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
    paddingBottom: 32,
  },
  container: {
    gap: 16,
  },
  heroWrap: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.snow200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  placeholderHero: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: typography.fontSize.xs,
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
    fontSize: typography.fontSize.xs,
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
    fontSize: 22,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 28,
  },
  mealSubtitle: {
    fontSize: typography.fontSize.xs,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  priceLabel: {
    fontSize: 10,
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
    gap: 2,
  },
  mamaCoachName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  mamaCoachBody: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    lineHeight: 18,
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
});

export default AtHomeMealDetails;
