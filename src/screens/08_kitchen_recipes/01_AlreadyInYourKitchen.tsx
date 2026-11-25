import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

import { ConfirmedPantrySummaryCard } from './components/ConfirmedPantrySummaryCard';
import { MakeNowMealCard } from './components/MakeNowMealCard';
import { TactileToast } from '../../components/common/TactileToast';
import { MamaCharacter, MamaPose } from '../../components/common/MamaCharacter';
import { preferencesStore, convertMealCost } from '../../services/preferencesStore';
import { CountryCurrencyModal } from '../../components/common/CountryCurrencyModal';
import { MamaDialogueService } from '../../services/mamaDialogueService';
import {
  AiMamaService,
  buildIntelligentPantryRecipe,
  sanitizeDishTitle,
} from '../../services/aiMamaService';
import { savedMealsService } from '../../services/api/savedMealsService';
import { apiClient } from '../../services/api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'AlreadyInYourKitchen'>;

interface KitchenDynamicRecipe {
  title: string;
  subtitle: string;
  cookTime: string;
  costNumeric: number;
  cost: string;
  image?: string;
  steps: string[];
  ingredients: { name: string; amount: string }[];
  chefTip?: string;
}

export const AlreadyInYourKitchen: React.FC<Props> = ({ navigation, route }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [pass, setPass] = useState(preferencesStore.getKitchenPass());

  const passedItems = route.params?.items || ['Eggs', 'Tomatoes', 'Onions', 'Rice'];

  const [mamaQuote, setMamaQuote] = useState<string>(
    `I looked at what you have: ${passedItems.slice(0, 3).join(', ')}. Let's make a simple, delicious meal right now.`
  );
  const [mamaPose, setMamaPose] = useState<MamaPose>('cooking');
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(true);

  // Dynamic recipe based on actual ingredients — instant intelligent fallback + AI enhancement
  const [dynamicRecipe, setDynamicRecipe] = useState<KitchenDynamicRecipe>(() => {
    const init = buildIntelligentPantryRecipe(passedItems, pass);
    return {
      title: init.title,
      subtitle: init.subtitle,
      cookTime: init.cookTime,
      costNumeric: 1.8,
      cost: init.estCost,
      image: undefined as string | undefined,
      steps: init.steps,
      ingredients: init.ingredients,
      chefTip: init.chefTip,
    };
  });

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const unsub = preferencesStore.subscribe((updated) => setPass(updated));
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();

    const fallbackToAiMama = () => {
      AiMamaService.generateRecipeFromPantry(passedItems, pass)
        .then((aiRes) => {
          if (aiRes) {
            const costNum = 2.0;
            setDynamicRecipe({
              title: aiRes.title,
              subtitle: aiRes.subtitle,
              cookTime: aiRes.cookTime,
              costNumeric: costNum,
              cost: convertMealCost(costNum, pass.currencyCode, pass.currencySymbol),
              image: undefined,
              steps: aiRes.steps,
              ingredients: aiRes.ingredients,
              chefTip: aiRes.chefTip,
            });
            if (aiRes.chefTip) {
              setMamaQuote(`"${aiRes.chefTip}"`);
            }
          }
        })
        .catch(() => {
          setDynamicRecipe((prev) => ({
            ...prev,
            title: sanitizeDishTitle(`${passedItems.slice(0, 2).join(' & ')} Stir-Fry`),
            subtitle: `Quick meal made with your kitchen ingredients`,
            cookTime: '12 min',
            steps: [
              `Heat 1 tbsp cooking oil in a pan on medium heat.`,
              `Add ${passedItems.join(', ')} and cook until tender.`,
              `Season with salt, pepper, and spices; serve warm.`,
            ],
          }));
        })
        .finally(() => {
          setIsGeneratingAi(false);
        });
    };

    // Call backend to generate custom recipe with these exact ingredients
    apiClient<any>('/api/recipes/generate', {
      method: 'POST',
      body: JSON.stringify({
        availableIngredients: passedItems,
      }),
    })
      .then((res) => {
        if (res && res.title) {
          const costNum = typeof res.estimatedCost === 'number' ? res.estimatedCost : 1.8;
          const mappedSteps =
            Array.isArray(res.steps) && res.steps.length > 0
              ? res.steps
              : Array.isArray(res.instructions) && res.instructions.length > 0
              ? res.instructions.map((s: any) =>
                  typeof s === 'string' ? s : s.instruction || ''
                ).filter(Boolean)
              : [
                  `Warm your pan with cooking oil on medium heat.`,
                  `Add ${passedItems.join(', ')} and cook until tender and fragrant.`,
                  `Season to taste and serve hot.`,
                ];
          const mappedIngredients =
            Array.isArray(res.ingredients) && res.ingredients.length > 0
              ? res.ingredients.map((i: any) =>
                  typeof i === 'string' ? { name: i, amount: '1 portion' } : i
                )
              : Array.isArray(res.ingredientsUsed) && res.ingredientsUsed.length > 0
              ? res.ingredientsUsed.map((i: string) => ({ name: i, amount: '1 portion' }))
              : passedItems.map((name) => ({ name, amount: '1 portion' }));

          setDynamicRecipe({
            title: sanitizeDishTitle(res.title),
            subtitle: res.subtitle || `Easy · Uses ${passedItems.slice(0, 2).join(' & ')}`,
            cookTime: `${res.cookTimeMinutes || 12} min`,
            costNumeric: costNum,
            cost: convertMealCost(costNum, pass.currencyCode, pass.currencySymbol),
            image: res.imageUrl || undefined,
            steps: mappedSteps,
            ingredients: mappedIngredients,
            chefTip: res.mamaTip || res.chefTip || 'Cook on medium heat so all the flavors meld together.',
          });
          if (res.mamaVoiceLine) {
            setMamaQuote(res.mamaVoiceLine);
          }
          setIsGeneratingAi(false);
        } else {
          fallbackToAiMama();
        }
      })
      .catch(() => {
        fallbackToAiMama();
      });

    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTapMama = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const voice = MamaDialogueService.getSyncedMamaVoice({
      timeOfDay: 'dinner',
      pass,
      pantryItems: passedItems,
      activeDish: {
        title: dynamicRecipe.title,
        cookTimeMinutes: parseInt(dynamicRecipe.cookTime, 10) || 12,
        estCost: dynamicRecipe.costNumeric,
        gear: pass.cookingGearLabel,
      },
      actionHint: 'tap_advice',
    });
    setMamaQuote(voice.quote);
    setMamaPose(voice.pose);

    AiMamaService.getLiveMamaDialogue({
      timeOfDay: 'dinner',
      pass,
      pantryItems: passedItems,
      activeDish: {
        title: dynamicRecipe.title,
        cookTimeMinutes: parseInt(dynamicRecipe.cookTime, 10) || 12,
        estCost: dynamicRecipe.costNumeric,
        gear: pass.cookingGearLabel,
      },
      actionHint: 'tap_advice',
    })
      .then((aiQuote) => {
        if (aiQuote && aiQuote.length > 5) {
          setMamaQuote(aiQuote);
        }
      })
      .catch(() => {});
  };

  const handlePassRecipe = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const rotatedItems =
      passedItems.length > 1 ? [...passedItems.slice(1), passedItems[0]] : passedItems;
    const nextFallback = buildIntelligentPantryRecipe(rotatedItems, pass);
    setIsGeneratingAi(true);
    setMamaQuote(`Let me think of another quick idea using your ${rotatedItems.slice(0, 2).join(' and ')}...`);
    AiMamaService.generateRecipeFromPantry(rotatedItems, pass)
      .then((aiRes) => {
        if (aiRes && aiRes.title !== dynamicRecipe.title) {
          setDynamicRecipe({
            title: aiRes.title,
            subtitle: aiRes.subtitle,
            cookTime: aiRes.cookTime,
            costNumeric: 2.0,
            cost: convertMealCost(2.0, pass.currencyCode, pass.currencySymbol),
            image: undefined,
            steps: aiRes.steps,
            ingredients: aiRes.ingredients,
            chefTip: aiRes.chefTip,
          });
          if (aiRes.chefTip) {
            setMamaQuote(`"${aiRes.chefTip}"`);
          }
        } else {
          setDynamicRecipe({
            title: nextFallback.title,
            subtitle: nextFallback.subtitle,
            cookTime: nextFallback.cookTime,
            costNumeric: 1.8,
            cost: nextFallback.estCost,
            image: undefined,
            steps: nextFallback.steps,
            ingredients: nextFallback.ingredients,
            chefTip: nextFallback.chefTip,
          });
        }
      })
      .catch(() => {
        setDynamicRecipe({
          title: nextFallback.title,
          subtitle: nextFallback.subtitle,
          cookTime: nextFallback.cookTime,
          costNumeric: 1.8,
          cost: nextFallback.estCost,
          image: undefined,
          steps: nextFallback.steps,
          ingredients: nextFallback.ingredients,
          chefTip: nextFallback.chefTip,
        });
      })
      .finally(() => {
        setIsGeneratingAi(false);
      });
  };

  const handleSaveRecipe = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    const mealId = `pantry-${dynamicRecipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    savedMealsService.saveMeal({
      mealId,
      title: dynamicRecipe.title,
      type: 'home',
      cookTime: dynamicRecipe.cookTime,
      cost: dynamicRecipe.cost,
      costNumeric: dynamicRecipe.costNumeric,
      imageUrl: dynamicRecipe.image,
      recipeSteps: dynamicRecipe.steps,
      ingredients: dynamicRecipe.ingredients,
    });
    preferencesStore.recordMealDecision(mealId, 'saved', dynamicRecipe.costNumeric);
    setToastMessage(`Saved ${dynamicRecipe.title} to your collection`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Screen Masthead Header */}
      <View style={styles.masthead}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.navigate('YourDailyEdit');
            }}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('YourDailyEdit')}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="home-outline" size={16} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.brandTitle}>Mama Dish</Text>

        <TouchableOpacity
          style={styles.countryBtn}
          onPress={() => setCountryModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.countryBtnText}>
            {pass.countryName} ({pass.currencySymbol})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Feed */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.animatedContainer,
            { opacity: contentFade, transform: [{ translateY: contentY }] },
          ]}
        >
          {/* Section 1: Introduction */}
          <View style={styles.introBlock}>
            <Text style={styles.eyebrow}>PANTRY CHEF · READY TO COOK</Text>
            <Text style={styles.heading}>Already in your kitchen</Text>
            <Text style={styles.supportingCopy}>
              Curated for your ingredients and 1-pan setup. Zero shopping required.
            </Text>
          </View>

          {/* Mama Live Kitchen Voice Card */}
          <TouchableOpacity
            style={styles.mamaGreetingCard}
            onPress={handleTapMama}
            activeOpacity={0.85}
          >
            <MamaCharacter pose={mamaPose} size={48} isSpeaking={true} />
            <View style={styles.mamaBubble}>
              <Text style={styles.mamaBubbleText}>
                &ldquo;{mamaQuote}&rdquo;
              </Text>
            </View>
          </TouchableOpacity>

          {/* Section 2: Confirmed Pantry Summary */}
          <ConfirmedPantrySummaryCard
            items={passedItems}
            onEditPantry={() => navigation.navigate('WhatsInYourKitchen')}
          />

          {/* Section 3: Make Now Meal Card */}
          <MakeNowMealCard
            isLoading={isGeneratingAi}
            title={dynamicRecipe.title}
            subtitle={dynamicRecipe.subtitle}
            cookTime={dynamicRecipe.cookTime}
            cost={dynamicRecipe.cost}
            image={dynamicRecipe.image}
            ingredientsSummary={`Uses: ${dynamicRecipe.ingredients.map((i) => i.name).join(', ')}.`}
            onPass={handlePassRecipe}
            onLikeAndSave={handleSaveRecipe}
            onChooseToCook={() => {
              const mealId = `pantry-${Date.now()}`;
              savedMealsService.saveMeal({
                mealId,
                title: dynamicRecipe.title,
                type: 'home',
                cookTime: dynamicRecipe.cookTime,
                cost: dynamicRecipe.cost,
                costNumeric: dynamicRecipe.costNumeric,
                imageUrl: dynamicRecipe.image,
                recipeSteps: dynamicRecipe.steps,
                ingredients: dynamicRecipe.ingredients,
              });
              preferencesStore.recordMealDecision(mealId, 'saved', dynamicRecipe.costNumeric);
              navigation.navigate('AtHomeMealDetails', {
                id: mealId,
                title: dynamicRecipe.title,
                subtitle: dynamicRecipe.subtitle,
                cookTime: dynamicRecipe.cookTime,
                gear: '1 Pan',
                estCost: dynamicRecipe.cost,
                costNumeric: dynamicRecipe.costNumeric,
                image: dynamicRecipe.image,
                steps: dynamicRecipe.steps,
                ingredients: dynamicRecipe.ingredients,
                mamaTip: dynamicRecipe.chefTip,
              });
            }}
          />
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
  brandTitle: {
    fontSize: 20,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.6,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.snow200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryBtn: {
    backgroundColor: colors.snow200,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  countryBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  animatedContainer: {
    gap: 16,
  },
  introBlock: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '600',
  },
  supportingCopy: {
    fontSize: typography.fontSize.xs,
    color: colors.text.muted,
    lineHeight: 18,
  },
  mamaGreetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF6EF',
    borderWidth: 1,
    borderColor: '#ECE4D4',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mamaBubble: {
    flex: 1,
  },
  mamaBubbleText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  reasonsBlock: {
    backgroundColor: colors.snow100,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    gap: 10,
  },
  prompt: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.primary,
  },
  reasonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.snow200,
  },
  reasonChipSelected: {
    backgroundColor: colors.primary,
  },
  checkIcon: {
    marginRight: 2,
  },
  reasonLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    fontWeight: '500',
  },
  reasonLabelSelected: {
    color: colors.snow100,
    fontWeight: '600',
  },
});

export default AlreadyInYourKitchen;
