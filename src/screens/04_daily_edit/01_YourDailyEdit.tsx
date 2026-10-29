import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { BottomNavigation, NavTab } from '../../components/navigation/BottomNavigation';
import { TactileToast } from '../../components/common/TactileToast';
import { MamaCharacter, MamaPose } from '../../components/common/MamaCharacter';
import {
  preferencesStore,
  UserKitchenPass,
  convertMealCost,
} from '../../services/preferencesStore';
import { WeeklyBalanceCard } from './components/WeeklyBalanceCard';
import { CountryCurrencyModal } from '../../components/common/CountryCurrencyModal';
import { MEAL_CATALOG, MealPeriod } from './mealCatalog';
import { MamaDialogueService } from '../../services/mamaDialogueService';
import { AiMamaService } from '../../services/aiMamaService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type Props = NativeStackScreenProps<RootStackParamList, 'YourDailyEdit'>;

interface DeckItem {
  id: string;
  type: 'standard' | 'survival' | 'takeout';
  title: string;
  subtitle: string;
  cookTimeOrDistance: string;
  gearOrVibe: string;
  estCost: string;
  costNumeric: number;
  image: string;
  mamaQuote: string;
  mamaPose: MamaPose;
}

function getAutoMealPeriod(): MealPeriod {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return 'late_night';
}

export const YourDailyEdit: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('edit');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [countryModalVisible, setCountryModalVisible] = useState(false);

  // User kitchen preferences
  const [kitchenPass, setKitchenPass] = useState<UserKitchenPass>(
    preferencesStore.getKitchenPass()
  );

  // Current automatic time of day
  const [mealPeriod] = useState<MealPeriod>(getAutoMealPeriod);
  const [deckIndex, setDeckIndex] = useState(0);

  // Dynamic Mama Live Dialogue
  const [mamaQuote, setMamaQuote] = useState<string>(
    MamaDialogueService.getDynamicQuote(mealPeriod, kitchenPass)
  );
  const [mamaPose, setMamaPose] = useState<MamaPose>('cooking');

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(15)).current;
  const bubbleScaleAnim = useRef(new Animated.Value(1)).current;

  // Horizontal card gesture animations
  const position = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsub = preferencesStore.subscribe((updated) => {
      setKitchenPass(updated);
      setMamaQuote(MamaDialogueService.getDynamicQuote(mealPeriod, updated));
    });
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(contentY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
    return unsub;
  }, []);

  // Format today's date
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'short' });
  const dateFormatted = `${dayName}, ${now.getDate()} ${now.toLocaleDateString('en-US', { month: 'short' })}`;

  // Time of day label
  const periodTitle = useMemo(() => {
    switch (mealPeriod) {
      case 'morning':
        return 'Morning Fuel';
      case 'lunch':
        return 'Midday Lunch';
      case 'dinner':
        return "Tonight's Edit";
      case 'late_night':
        return 'Late Night Plate';
    }
  }, [mealPeriod]);

  // Build the 3-Card Deck with localized currency prices
  const mealDeck: DeckItem[] = useMemo(() => {
    const periodCatalog = MEAL_CATALOG[mealPeriod];
    const cuisineGroup =
      periodCatalog[kitchenPass.cuisineAnchor] || periodCatalog.default;

    const std = cuisineGroup.standard;
    const surv = cuisineGroup.survival;
    const out = cuisineGroup.takeout;

    const stdCostNum = parseFloat(std.estCost.replace(/[^0-9.]/g, '')) || 2.2;
    const survCostNum = parseFloat(surv.estCost.replace(/[^0-9.]/g, '')) || 1.4;
    const outCostNum = 14.0;

    return [
      {
        id: std.id,
        type: 'standard',
        title: std.title,
        subtitle: std.subtitle,
        cookTimeOrDistance: std.cookTime,
        gearOrVibe: std.gear,
        estCost: convertMealCost(stdCostNum, kitchenPass.currencyCode, kitchenPass.currencySymbol),
        costNumeric: stdCostNum,
        image: std.image,
        mamaQuote: "Hot skillet comfort. One pan, zero sink dishes tonight.",
        mamaPose: 'cooking',
      },
      {
        id: surv.id,
        type: 'survival',
        title: surv.title,
        subtitle: surv.subtitle,
        cookTimeOrDistance: surv.cookTime,
        gearOrVibe: surv.gear,
        estCost: convertMealCost(survCostNum, kitchenPass.currencyCode, kitchenPass.currencySymbol),
        costNumeric: survCostNum,
        image: surv.image,
        mamaQuote: "Zero effort. In 4 minutes you're eating, my child.",
        mamaPose: 'writing',
      },
      {
        id: 'takeout-spot',
        type: 'takeout',
        title: `${out.dish} at ${out.name}`,
        subtitle: out.vibe,
        cookTimeOrDistance: out.distance,
        gearOrVibe: 'Eating Out',
        estCost: convertMealCost(outCostNum, kitchenPass.currencyCode, kitchenPass.currencySymbol),
        costNumeric: outCostNum,
        image: out.image,
        mamaQuote: "Too tired to stand? Zero guilt. Let someone else cook tonight.",
        mamaPose: 'welcoming',
      },
    ];
  }, [mealPeriod, kitchenPass.cuisineAnchor, kitchenPass.currencyCode, kitchenPass.currencySymbol]);

  const activeItem = mealDeck[deckIndex % mealDeck.length];

  // Interactive talk with Mama on tap (Instant local response + Groq AI async refresh)
  const handleTapMama = () => {
    const line = MamaDialogueService.getRandomInteractiveLine(kitchenPass);
    setMamaQuote(line.quote);
    setMamaPose(line.pose);

    bubbleScaleAnim.setValue(0.93);
    Animated.spring(bubbleScaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();

    // Async live dialogue generation with Groq ultra-fast AI
    AiMamaService.getLiveMamaDialogue(kitchenPass, 'tap')
      .then((aiQuote) => {
        if (aiQuote && aiQuote.length > 5) {
          setMamaQuote(aiQuote);
        }
      })
      .catch(() => {});
  };

  // PanResponder for smooth thumb swiping left ("Not today") and right ("Cook today")
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 12,
        onPanResponderMove: (_, gesture) => {
          position.setValue({ x: gesture.dx, y: 0 });
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx > SWIPE_THRESHOLD) {
            handleSwipeAction('right');
          } else if (gesture.dx < -SWIPE_THRESHOLD) {
            handleSwipeAction('left');
          } else {
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              friction: 5,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [deckIndex, mealDeck.length]
  );

  const handleSwipeAction = (direction: 'left' | 'right') => {
    const toX = direction === 'right' ? SCREEN_WIDTH + 50 : -SCREEN_WIDTH - 50;
    Animated.parallel([
      Animated.timing(position.x, {
        toValue: toX,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (direction === 'right') {
        // Cook Today -> Mama praises you & records decision
        preferencesStore.recordMealDecision(activeItem.id, 'cooked', activeItem.costNumeric);
        const cookSpeech = MamaDialogueService.getCookReaction();
        setToastMessage(`Mama: "${cookSpeech}"`);

        if (activeItem.type === 'takeout') {
          navigation.navigate('EatingOutMealDetails', {
            dishName: activeItem.title,
            spotName: activeItem.subtitle,
            distance: activeItem.cookTimeOrDistance,
            price: activeItem.estCost,
            vibe: activeItem.gearOrVibe,
            image: activeItem.image,
          });
        } else {
          navigation.navigate('AtHomeMealDetails', {
            id: activeItem.id,
            title: activeItem.title,
            subtitle: activeItem.subtitle,
            cookTime: activeItem.cookTimeOrDistance,
            gear: activeItem.gearOrVibe,
            estCost: activeItem.estCost,
            costNumeric: activeItem.costNumeric,
            image: activeItem.image,
          });
        }
        position.setValue({ x: 0, y: 0 });
        cardOpacity.setValue(1);
      } else {
        // Not Today -> Mama comments wittily and advances
        preferencesStore.recordMealDecision(activeItem.id, 'passed', activeItem.costNumeric);
        const passSpeech = MamaDialogueService.getPassReaction();
        setMamaQuote(passSpeech);
        setMamaPose('writing');

        setDeckIndex((prev) => (prev + 1) % mealDeck.length);
        position.setValue({ x: 0, y: 0 });
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      }
    });
  };

  const animatedCardStyle = {
    transform: [
      { translateX: position.x },
      {
        rotate: position.x.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: ['-6deg', '0deg', '6deg'],
        }),
      },
    ],
    opacity: cardOpacity,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      {/* Sleek Minimal Masthead */}
      <View style={styles.masthead}>
        <Text style={styles.brandTitle}>Mama</Text>

        <TouchableOpacity
          style={styles.countryBtn}
          onPress={() => setCountryModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="location-outline" size={13} color={colors.primary} />
          <Text style={styles.countryBtnText}>
            {kitchenPass.countryName} ({kitchenPass.currencySymbol})
          </Text>
        </TouchableOpacity>
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
          {/* Header Row: Title & Date in one clean line */}
          <View style={styles.headerBlock}>
            <Text style={styles.greetingTitle}>{periodTitle}</Text>
            <Text style={styles.dateText}>{dateFormatted}</Text>
          </View>

          {/* 1. WEEKLY BUDGET (Compact, High-End) */}
          <WeeklyBalanceCard
            remainingAmount={kitchenPass.weeklyBudget - kitchenPass.spentThisWeek}
            remainingDays={kitchenPass.remainingDaysInWeek}
            spentAmount={kitchenPass.spentThisWeek}
            totalBudget={kitchenPass.weeklyBudget}
            currencySymbol={kitchenPass.currencySymbol}
            currencyCode={kitchenPass.currencyCode}
            countryName={kitchenPass.countryName}
            onPressManage={() => setCountryModalVisible(true)}
          />

          {/* 2. MAMA LIVE VOICE (Interactive Talk Stage) */}
          <TouchableOpacity
            style={styles.mamaGreetingCard}
            onPress={handleTapMama}
            activeOpacity={0.85}
          >
            <MamaCharacter
              pose={mamaPose}
              size={54}
              isSpeaking={true}
              onPress={handleTapMama}
            />

            <View style={styles.mamaBubbleWrap}>
              <View style={styles.mamaBadgeRow}>
                <Text style={styles.mamaName}>Mama</Text>
                <View style={styles.tapPill}>
                  <Ionicons name="chatbubble-ellipses-outline" size={11} color={colors.primary} />
                  <Text style={styles.tapPillText}>Tap Mama to talk</Text>
                </View>
              </View>

              <Animated.View style={{ transform: [{ scale: bubbleScaleAnim }] }}>
                <Text style={styles.mamaBubbleText}>&ldquo;{mamaQuote}&rdquo;</Text>
              </Animated.View>
            </View>
          </TouchableOpacity>

          {/* 3. HERO MEAL CARD (Clean, uncluttered, focused) */}
          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.heroCardWrap, animatedCardStyle]}
          >
            <TouchableOpacity
              style={styles.imageCard}
              activeOpacity={0.92}
              onPress={() => handleSwipeAction('right')}
            >
              <Image source={{ uri: activeItem.image }} style={styles.mealImage} resizeMode="cover" />

              <View style={styles.timeBadge}>
                <Ionicons
                  name={activeItem.type === 'takeout' ? 'location-outline' : 'time-outline'}
                  size={12}
                  color={colors.primary}
                />
                <Text style={styles.timeBadgeText}>{activeItem.cookTimeOrDistance}</Text>
              </View>

              <View style={styles.gearBadge}>
                <Ionicons
                  name={activeItem.type === 'takeout' ? 'bag-handle-outline' : 'disc-outline'}
                  size={12}
                  color={colors.snow100}
                />
                <Text style={styles.gearBadgeText}>{activeItem.gearOrVibe}</Text>
              </View>
            </TouchableOpacity>

            {/* Focused Card Body */}
            <View style={styles.heroContent}>
              <View style={styles.titlePriceRow}>
                <Text style={styles.mealHeading} numberOfLines={2}>
                  {activeItem.title}
                </Text>
                <Text style={styles.priceAmount}>{activeItem.estCost}</Text>
              </View>

              <Text style={styles.mealSubtitle} numberOfLines={2}>
                {activeItem.subtitle}
              </Text>
            </View>
          </Animated.View>

          {/* 4. THE SIGNATURE ACTIONS: NOT TODAY vs COOK TODAY */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.notTodayButton}
              onPress={() => handleSwipeAction('left')}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={16} color={colors.text.secondary} />
              <Text style={styles.notTodayText}>Not today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cookTodayButton}
              onPress={() => handleSwipeAction('right')}
              activeOpacity={0.85}
            >
              <Ionicons
                name={activeItem.type === 'takeout' ? 'bag-handle' : 'restaurant'}
                size={16}
                color={colors.snow100}
              />
              <Text style={styles.cookTodayText}>
                {activeItem.type === 'takeout' ? 'View Spot' : 'Cook today'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.snow100} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Country & Currency Modal */}
      <CountryCurrencyModal
        visible={countryModalVisible}
        onClose={() => setCountryModalVisible(false)}
      />

      {/* Bottom Tab Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab: NavTab) => {
          setActiveTab(tab);
          if (tab === 'discover') navigation.navigate('DiscoverYourNextMeal');
          if (tab === 'collection') navigation.navigate('YourCollection');
        }}
      />

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
    backgroundColor: colors.background,
  },
  masthead: {
    height: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(36, 40, 32, 0.08)',
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
    letterSpacing: 0.6,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.snow200,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countryBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 90,
  },
  container: {
    gap: 14,
  },
  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  greetingTitle: {
    fontSize: 24,
    fontFamily: typography.fontFamily.serif,
    color: colors.text.primary,
    fontWeight: '600',
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mamaGreetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF6EF',
    borderWidth: 1,
    borderColor: '#ECE4D4',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#242820',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  mamaBubbleWrap: {
    flex: 1,
    gap: 4,
  },
  mamaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mamaName: {
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  tapPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECE3D4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tapPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
  },
  mamaBubbleText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.primary,
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  heroCardWrap: {
    borderRadius: 20,
    backgroundColor: colors.snow100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  imageCard: {
    height: 220,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.snow200,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  timeBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  gearBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(36, 40, 32, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  gearBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: colors.snow100,
  },
  heroContent: {
    padding: 16,
    gap: 6,
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  mealHeading: {
    flex: 1,
    fontSize: 18,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 23,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  mealSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  notTodayButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.snow100,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  notTodayText: {
    fontSize: typography.fontSize.sub,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  cookTodayButton: {
    flex: 1.4,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  cookTodayText: {
    fontSize: typography.fontSize.sub,
    fontWeight: '600',
    color: colors.snow100,
  },
});

export default YourDailyEdit;
