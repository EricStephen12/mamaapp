import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

import { ConfirmedPantrySummaryCard } from './components/ConfirmedPantrySummaryCard';
import { MakeNowMealCard } from './components/MakeNowMealCard';
import { AlternativeMealCard } from './components/AlternativeMealCard';
import { SaveForLaterMealCard } from './components/SaveForLaterMealCard';
import { BalancedMealGuidanceCard } from './components/BalancedMealGuidanceCard';
import { TactileToast } from '../../components/common/TactileToast';
import { MamaCharacter, MamaPose } from '../../components/common/MamaCharacter';
import { WeeklyBalanceCard } from '../04_daily_edit/components/WeeklyBalanceCard';
import { preferencesStore, convertMealCost } from '../../services/preferencesStore';
import { CountryCurrencyModal } from '../../components/common/CountryCurrencyModal';
import { MamaDialogueService } from '../../services/mamaDialogueService';
import { AiMamaService } from '../../services/aiMamaService';

type Props = NativeStackScreenProps<RootStackParamList, 'AlreadyInYourKitchen'>;

const PASS_REASONS = ['Too much effort', 'Not my taste', 'Save ingredients'];

export const AlreadyInYourKitchen: React.FC<Props> = ({ navigation }) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [pass, setPass] = useState(preferencesStore.getKitchenPass());
  const [mamaQuote, setMamaQuote] = useState<string>(
    'I looked at what you have: eggs, sweet onions, and rice. In 8 minutes we can make this warm comfort bowl!'
  );
  const [mamaPose, setMamaPose] = useState<MamaPose>('cooking');

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const unsub = preferencesStore.subscribe((updated) => setPass(updated));
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
    return unsub;
  }, []);

  const handleTapMama = () => {
    const local = MamaDialogueService.getRandomInteractiveLine(pass);
    setMamaQuote(local.quote);
    setMamaPose(local.pose);

    AiMamaService.getLiveMamaDialogue(pass, 'pantry')
      .then((aiQuote) => {
        if (aiQuote && aiQuote.length > 5) {
          setMamaQuote(aiQuote);
        }
      })
      .catch(() => {});
  };

  const handleToggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Screen Masthead Header */}
      <View style={styles.masthead}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.brandTitle}>Mama Kitchen</Text>
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

          {/* Section 2: Weekly Balance Summary */}
          <WeeklyBalanceCard
            remainingAmount={pass.weeklyBudget - pass.spentThisWeek}
            remainingDays={pass.remainingDaysInWeek}
            spentAmount={pass.spentThisWeek}
            totalBudget={pass.weeklyBudget}
            currencySymbol={pass.currencySymbol}
            currencyCode={pass.currencyCode}
            countryName={pass.countryName}
            onPressManage={() => setCountryModalVisible(true)}
          />

          {/* Section 3: Confirmed Pantry Summary */}
          <ConfirmedPantrySummaryCard
            onEditPantry={() => navigation.navigate('ConfirmYourPantry')}
          />

          {/* Section 4: Make Now Meal Card */}
          <MakeNowMealCard
            onChooseToCook={() =>
              navigation.navigate('AtHomeMealDetails', {
                id: 'pantry-make-now-1',
                title: 'Tomato & Sizzled Egg Rice Bowl',
                subtitle: 'Velvety eggs folded into sweet tomatoes over steamed rice.',
                cookTime: '8 min',
                gear: '1 Pan',
                estCost: convertMealCost(1.8, pass.currencyCode, pass.currencySymbol),
                costNumeric: 1.8,
                image:
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
              })
            }
          />

          {/* Section 5: Optional Pass Reasons */}
          <View style={styles.reasonsBlock}>
            <Text style={styles.prompt}>Not feeling this one? Tell Mama why:</Text>
            <View style={styles.reasonsRow}>
              {PASS_REASONS.map((reason) => {
                const isSelected = selectedReasons.includes(reason);
                return (
                  <Pressable
                    key={reason}
                    onPress={() => handleToggleReason(reason)}
                    style={[
                      styles.reasonChip,
                      isSelected && styles.reasonChipSelected,
                    ]}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color={colors.snow100}
                        style={styles.checkIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.reasonLabel,
                        isSelected && styles.reasonLabelSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Section 6: Alternative Meal Option */}
          <AlternativeMealCard
            onViewRecipe={() =>
              navigation.navigate('AtHomeMealDetails', {
                id: 'alt-meal-1',
                title: 'Spinach, Tomato & Egg Rice',
                subtitle: 'Caramelized onions, garlic chili crunch, and golden crusty bread.',
                cookTime: '6 min',
                gear: '1 Skillet',
                estCost: convertMealCost(1.4, pass.currencyCode, pass.currencySymbol),
                costNumeric: 1.4,
                image:
                  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
              })
            }
          />

          {/* Section 7: Save for Later Option */}
          <SaveForLaterMealCard />

          {/* Section 8: Dietary / Balanced Guidance */}
          <BalancedMealGuidanceCard />
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
