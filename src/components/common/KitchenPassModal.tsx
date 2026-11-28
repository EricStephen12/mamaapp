import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import {
  preferencesStore,
  BodyGoal,
  FREE_DAILY_ROLL_LIMIT,
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  SupportedCountry,
  formatCurrency,
} from '../../services/preferencesStore';
import { subscriptionService } from '../../services/subscriptionService';
import { notificationService } from '../../services/notificationService';
import { authService } from '../../services/api/authService';
import { pantryService } from '../../services/api/pantryService';
import { rollService } from '../../services/api/rollService';
import { mamaAlert } from '../../services/mamaAlert';
import { useUserDataBank } from '../../context/UserDataBankContext';
import { useModalBottomInset } from '../../hooks/useBottomNavInset';
import { MamaPaywallContent } from './MamaPaywallModal';
import { MamaAlertHost } from './MamaAlertHost';
import { MamaCharacter } from './MamaCharacter';

export type KitchenPassInitialTab =
  | 'gear'
  | 'time'
  | 'flavor'
  | 'diet'
  | 'goal'
  | 'account'
  | 'budget';

type SettingsTab = 'account' | 'budget' | 'taste';

interface KitchenPassModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: KitchenPassInitialTab;
}

const mapInitialTab = (tab?: KitchenPassInitialTab): SettingsTab => {
  if (tab === 'budget') return 'budget';
  if (tab === 'gear' || tab === 'time' || tab === 'flavor' || tab === 'diet' || tab === 'goal') {
    return 'taste';
  }
  return 'account';
};

const GEAR_OPTIONS = [
  { id: 'one_pan', title: '1 Pan', fullTitle: '1 Pan & Burner', icon: 'flame-outline' as const },
  { id: 'air_fryer', title: 'Air Fryer', fullTitle: 'Air Fryer & Stovetop', icon: 'flash-outline' as const },
  { id: 'full_kitchen', title: 'Full', fullTitle: 'Full Kitchen', icon: 'restaurant-outline' as const },
];

const TIME_OPTIONS = [
  { id: 'under_15', minutes: 15, title: '< 15m', fullTitle: 'Under 15 mins', icon: 'speedometer-outline' as const },
  { id: 'standard', minutes: 25, title: '20–30m', fullTitle: '20 to 30 mins', icon: 'time-outline' as const },
  { id: 'no_rush', minutes: 45, title: 'No Rush', fullTitle: 'No rush', icon: 'cafe-outline' as const },
];

const FLAVOR_OPTIONS = [
  { id: 'african_caribbean', title: 'Afro-Carib', fullTitle: 'African & Caribbean', icon: 'flame-outline' as const },
  { id: 'weeknight_comfort', title: 'Comfort', fullTitle: 'Everyday Comfort', icon: 'nutrition-outline' as const },
  { id: 'global', title: 'Surprise', fullTitle: 'Surprise Me', icon: 'shuffle-outline' as const },
];

const DIETARY_OPTIONS = [
  { id: 'none', title: 'Everything' },
  { id: 'vegetarian', title: 'Vegetarian' },
  { id: 'vegan', title: 'Vegan' },
  { id: 'halal', title: 'Halal' },
  { id: 'gluten_free', title: 'Gluten-Free' },
  { id: 'dairy_free', title: 'Dairy-Free' },
];

const BODY_GOAL_OPTIONS: {
  id: BodyGoal;
  title: string;
  icon: 'body-outline' | 'leaf-outline' | 'restaurant-outline' | 'fitness-outline';
}[] = [
  { id: 'balanced', title: 'Balanced', icon: 'fitness-outline' },
  { id: 'reduce_weight', title: 'Lose Weight', icon: 'leaf-outline' },
  { id: 'add_weight', title: 'Gain Weight', icon: 'restaurant-outline' },
  { id: 'curves_glutes', title: 'Curves & Glutes', icon: 'body-outline' },
];

const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'budget', label: 'Budget' },
  { id: 'taste', label: 'Taste' },
];

export const KitchenPassModal: React.FC<KitchenPassModalProps> = ({
  visible,
  onClose,
  initialTab,
}) => {
  const { user, isLoggedIn, kitchenPass: currentPass } = useUserDataBank();
  const navigation = useNavigation<any>();
  const modalBottomInset = useModalBottomInset(24);

  const matchedCountry = SUPPORTED_COUNTRIES.find((c) => c.id === currentPass.country);
  const fallbackBudget = matchedCountry?.defaultWeeklyBudget ?? currentPass.weeklyBudget ?? 50;

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => mapInitialTab(initialTab));
  const [selectedCountryId, setSelectedCountryId] = useState<string>(currentPass.country || 'NG');
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>(currentPass.currencyCode || 'NGN');
  const [weeklyBudgetString, setWeeklyBudgetString] = useState<string>(
    String(currentPass.weeklyBudget || fallbackBudget)
  );
  const [spentThisWeek, setSpentThisWeek] = useState<number>(currentPass.spentThisWeek || 0);

  const [selectedGearId, setSelectedGearId] = useState<string>(currentPass.cookingGear || 'one_pan');
  const [selectedTimeMinutes, setSelectedTimeMinutes] = useState<number>(currentPass.timeLimitMinutes || 15);
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(currentPass.cuisineAnchor || 'african_caribbean');
  const [selectedDiets, setSelectedDiets] = useState<string[]>(
    currentPass.dietaryRestrictions && currentPass.dietaryRestrictions.length > 0
      ? currentPass.dietaryRestrictions
      : ['none']
  );
  const [selectedGoal, setSelectedGoal] = useState<BodyGoal>(currentPass.bodyGoal || 'balanced');
  const [customDietInput, setCustomDietInput] = useState<string>('');
  const [hiddenDishes, setHiddenDishes] = useState<string[]>(currentPass.neverShowDishes || []);
  const [isPlusActive, setIsPlusActive] = useState<boolean>(preferencesStore.isMamaPlus());
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const [shakeEnabled, setShakeEnabled] = useState<boolean>(
    currentPass.shakeToRollEnabled !== false
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    Boolean(currentPass.notificationsEnabled)
  );

  useEffect(() => {
    const unsub = subscriptionService.subscribe((isPro) => {
      setIsPlusActive(isPro);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (visible) {
      const pass = preferencesStore.getKitchenPass();
      const countryMatch = SUPPORTED_COUNTRIES.find((c) => c.id === pass.country);
      const defaultBudget = countryMatch?.defaultWeeklyBudget ?? pass.weeklyBudget ?? 50;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(mapInitialTab(initialTab));
      setSelectedCountryId(pass.country || 'NG');
      setSelectedCurrencyCode(pass.currencyCode || 'NGN');
      setWeeklyBudgetString(String(pass.weeklyBudget || defaultBudget));
      setSpentThisWeek(pass.spentThisWeek || 0);
      setSelectedGearId(pass.cookingGear || 'one_pan');
      setSelectedTimeMinutes(pass.timeLimitMinutes || 15);
      setSelectedFlavorId(pass.cuisineAnchor || 'african_caribbean');
      setSelectedDiets(
        pass.dietaryRestrictions && pass.dietaryRestrictions.length > 0
          ? pass.dietaryRestrictions
          : ['none']
      );
      setSelectedGoal(pass.bodyGoal || 'balanced');
      setHiddenDishes(pass.neverShowDishes || []);
      setIsPlusActive(pass.planTier === 'plus');
      setShakeEnabled(pass.shakeToRollEnabled !== false);
      setNotificationsEnabled(Boolean(pass.notificationsEnabled));
      setShowPaywall(false);
    }
  }, [visible, initialTab]);

  const handleSelectCountry = (country: SupportedCountry) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedCountryId(country.id);
    setSelectedCurrencyCode(country.currencyCode);
    setWeeklyBudgetString(String(country.defaultWeeklyBudget));
  };

  const handleUnhideDish = (dishTitle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    preferencesStore.removeNeverShowDish(dishTitle);
    const updated = preferencesStore.getKitchenPass();
    setHiddenDishes(updated.neverShowDishes || []);
  };

  const handleToggleDiet = (dietId: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (dietId === 'none') {
      setSelectedDiets(['none']);
      return;
    }
    setSelectedDiets((prev) => {
      const withoutNone = prev.filter((d) => d !== 'none');
      if (withoutNone.includes(dietId)) {
        const remaining = withoutNone.filter((d) => d !== dietId);
        return remaining.length > 0 ? remaining : ['none'];
      }
      return [...withoutNone, dietId];
    });
  };

  const handleLogout = () => {
    mamaAlert.alert('Log Out', 'Log out of Mama Dish on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await authService.signOut();
          onClose();
          navigation.reset({
            index: 0,
            routes: [{ name: 'MamaKitchenSignIn' }],
          });
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    mamaAlert.alert(
      'Delete Account',
      "Permanently delete your account and saved data? This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            await authService.deleteAccount();
            onClose();
            navigation.reset({
              index: 0,
              routes: [{ name: 'MamaKitchenSignIn' }],
            });
          },
        },
      ]
    );
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const chosenGear = GEAR_OPTIONS.find((g) => g.id === selectedGearId);
    const chosenTime =
      TIME_OPTIONS.find((t) => t.minutes === selectedTimeMinutes) || TIME_OPTIONS[0];
    const chosenFlavor = FLAVOR_OPTIONS.find((f) => f.id === selectedFlavorId);
    const chosenGoal = BODY_GOAL_OPTIONS.find((g) => g.id === selectedGoal);

    const baseDiets = selectedDiets.filter((d) => d !== 'none');
    const pendingCustomDiet = customDietInput.trim();
    const finalDiets =
      pendingCustomDiet && !baseDiets.some((d) => d.toLowerCase() === pendingCustomDiet.toLowerCase())
        ? [...baseDiets, pendingCustomDiet]
        : baseDiets;
    setCustomDietInput('');

    const budgetNum = parseFloat(weeklyBudgetString.replace(/[^0-9.]/g, '')) || fallbackBudget;
    const countryChanged = selectedCountryId !== currentPass.country;
    if (countryChanged) {
      rollService.resetForRegionChange();
      const matched = SUPPORTED_COUNTRIES.find((c) => c.id === selectedCountryId);
      if (matched && matched.popularStaples?.length > 0) {
        pantryService
          .syncItems(matched.popularStaples.map((name) => ({ name, category: 'pantryStaples' })))
          .catch(() => {});
      }
    }

    preferencesStore.updateCountryAndCurrency(
      selectedCountryId,
      selectedCurrencyCode,
      budgetNum
    );

    preferencesStore.updateKitchenPass({
      cookingGear: selectedGearId,
      cookingGearLabel: chosenGear ? chosenGear.fullTitle : '1 Pan & Burner',
      timeLimitMinutes: chosenTime.minutes,
      timeLimitLabel: chosenTime.fullTitle,
      cuisineAnchor: selectedFlavorId,
      cuisineLabel: chosenFlavor ? chosenFlavor.fullTitle : 'African & Caribbean',
      dietaryRestrictions: finalDiets,
      bodyGoal: selectedGoal,
      bodyGoalLabel: chosenGoal ? chosenGoal.title : 'Balanced',
      shakeToRollEnabled: shakeEnabled,
    });

    // Refresh upcoming Mama Nudges with updated country / currency / budget
    notificationService.syncScheduleIfEnabled().catch(() => {});

    onClose();
  };

  const handleToggleNotifications = async () => {
    Haptics.selectionAsync().catch(() => {});
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      await notificationService.disableNotifications();
      return;
    }
    const status = await notificationService.enableNotifications();
    if (status === 'granted') {
      setNotificationsEnabled(true);
    } else {
      setNotificationsEnabled(false);
      mamaAlert.alert(
        'Notifications Off',
        'Enable notifications for Mama in your phone settings so Mama can send dinner nudges.'
      );
    }
  };

  /** Upgrade (paywall) when Free, Manage / cancel (Customer Center) when Pro */
  const handlePlanPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    if (isPlusActive) {
      const openedCustomerCenter = await subscriptionService.presentCustomerCenter();
      if (openedCustomerCenter) {
        const stillPro = await subscriptionService.checkProEntitlement();
        setIsPlusActive(stillPro);
        return;
      }

      const isLive = subscriptionService.isLive();
      mamaAlert.alert(
        'Mama Pro Active',
        isLive
          ? 'Unlimited rolls, free healthy remixes, and 2x XP. Manage anytime in your store subscriptions.'
          : 'Unlimited rolls, free healthy remixes, and 2x XP.',
        isLive
          ? [{ text: 'OK', style: 'cancel' }]
          : [
              { text: 'Keep Pro', style: 'cancel' },
              {
                text: 'Cancel Plan',
                style: 'destructive',
                onPress: () => {
                  subscriptionService.cancelPreview();
                  setIsPlusActive(false);
                },
              },
            ]
      );
      return;
    }

    if (subscriptionService.isLive()) {
      const paywallOutcome = await subscriptionService.presentPaywall();
      if (paywallOutcome === 'purchased' || paywallOutcome === 'restored') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setIsPlusActive(true);
        return;
      }
      if (paywallOutcome === 'cancelled') return;
    }

    setShowPaywall(true);
  };

  const activeCurrency =
    SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrencyCode) || {
      code: selectedCurrencyCode,
      symbol: currentPass.currencySymbol || '₦',
    };
  const parsedWeeklyBudget = parseFloat(weeklyBudgetString.replace(/[^0-9.]/g, '')) || fallbackBudget;
  const remainingWeeklyBudget = Math.max(0, parsedWeeklyBudget - spentThisWeek);
  const displayName =
    (isLoggedIn && user) || user
      ? user?.name?.trim() || user?.email?.split('@')[0] || "Mama's Child"
      : 'Guest';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {showPaywall ? (
        <MamaPaywallContent
          onClose={() => setShowPaywall(false)}
          onSubscribed={() => {
            setIsPlusActive(true);
            setShowPaywall(false);
          }}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.overlay}
        >
          <TouchableOpacity style={styles.backdropArea} activeOpacity={1} onPress={onClose} />

          <View style={[styles.sheetContainer, { paddingBottom: modalBottomInset }]}>
            {/* Drag Handle */}
            <View style={styles.dragHandleWrap}>
              <View style={styles.dragHandle} />
            </View>

            {/* Clean Sheet Header */}
            <View style={styles.header}>
              <Text style={styles.sheetTitle}>Settings</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Calm 3-Tab Segmented Control */}
            <View style={styles.segmentWrap}>
              <View style={styles.segmentTrack}>
                {SETTINGS_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[styles.segmentBtn, isActive && styles.segmentBtnActive]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setActiveTab(tab.id);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ===================== TAB 1: ACCOUNT ===================== */}
              {activeTab === 'account' && (
                <>
                  {/* Clean Identity Card */}
                  <View style={styles.groupCard}>
                    <View style={styles.profileRow}>
                      <View style={styles.profileLeft}>
                        <View style={styles.bowlAvatarBadge}>
                          <MamaCharacter pose="welcoming" size={44} isSpeaking={false} hideArms />
                        </View>
                        <View style={styles.profileTextWrap}>
                          <Text style={styles.profileName} numberOfLines={1}>
                            {displayName}
                          </Text>
                          <Text style={styles.profileEmail} numberOfLines={1}>
                            {user?.email ||
                              (isPlusActive
                                ? 'Mama Pro'
                                : `${preferencesStore.getRemainingDailyRolls()}/${FREE_DAILY_ROLL_LIMIT} rolls left today`)}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.xpPill}
                        activeOpacity={0.8}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          mamaAlert.alert(
                            'Your Mama XP',
                            'Earn +50 XP per home meal (up to 2/day). Spend 50 XP for a Healthy Swap or 100 XP for 1 daily bonus roll.'
                          );
                        }}
                      >
                        <Ionicons name="flame" size={14} color={colors.primary} />
                        <Text style={styles.xpPillText}>
                          {preferencesStore.getXpBalance()} XP
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Crisp Plan Card */}
                  <View style={[styles.planCard, isPlusActive && styles.planCardActive]}>
                    <View style={styles.planCardTextWrap}>
                      <Text style={[styles.planCardTitle, isPlusActive && styles.planCardTitleActive]}>
                        {isPlusActive ? 'Mama Pro' : 'Upgrade to Pro'}
                      </Text>
                      <Text style={[styles.planCardSub, isPlusActive && styles.planCardSubActive]}>
                        {isPlusActive
                          ? 'Unlimited rolls · 2x XP'
                          : `Unlimited rolls · ${preferencesStore.getLocalizedPlusPrice()}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.planCardBtn, isPlusActive && styles.planCardBtnActive]}
                      onPress={handlePlanPress}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={isPlusActive ? 'Manage subscription' : 'Upgrade to Mama Pro'}
                    >
                      <Text style={[styles.planCardBtnText, isPlusActive && styles.planCardBtnTextActive]}>
                        {isPlusActive ? 'Manage' : 'Upgrade'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Grouped iOS-style Controls & Account Rows */}
                  <View style={styles.listCard}>
                    <TouchableOpacity
                      style={styles.listRow}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setShakeEnabled((prev) => !prev);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={styles.listRowLeft}>
                        <View style={styles.listIconCircle}>
                          <Ionicons name="phone-portrait-outline" size={17} color={colors.primary} />
                        </View>
                        <Text style={styles.listRowLabel}>Shake to Roll</Text>
                      </View>
                      <View style={[styles.switchTrack, shakeEnabled && styles.switchTrackOn]}>
                        <View style={[styles.switchThumb, shakeEnabled && styles.switchThumbOn]} />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.listDivider} />

                    <TouchableOpacity
                      style={styles.listRow}
                      onPress={handleToggleNotifications}
                      activeOpacity={0.75}
                    >
                      <View style={styles.listRowLeft}>
                        <View style={styles.listIconCircle}>
                          <Ionicons name="notifications-outline" size={17} color={colors.primary} />
                        </View>
                        <Text style={styles.listRowLabel}>Mama Dinner Nudges</Text>
                      </View>
                      <View style={[styles.switchTrack, notificationsEnabled && styles.switchTrackOn]}>
                        <View
                          style={[styles.switchThumb, notificationsEnabled && styles.switchThumbOn]}
                        />
                      </View>
                    </TouchableOpacity>

                    <View style={styles.listDivider} />

                    <TouchableOpacity
                      style={styles.listRow}
                      onPress={() => {
                        onClose();
                        navigation.navigate('MamaKitchenSplash', { previewOnboarding: true });
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={styles.listRowLeft}>
                        <View style={styles.listIconCircle}>
                          <Ionicons name="refresh-outline" size={17} color={colors.primary} />
                        </View>
                        <Text style={styles.listRowLabel}>Replay Welcome Setup</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={17} color={colors.text.muted} />
                    </TouchableOpacity>

                    <View style={styles.listDivider} />

                    {!isLoggedIn && !user ? (
                      <TouchableOpacity
                        style={styles.listRow}
                        onPress={() => {
                          onClose();
                          navigation.navigate('MamaKitchenSignIn');
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={styles.listRowLeft}>
                          <View style={styles.listIconCircle}>
                            <Ionicons name="log-in-outline" size={17} color={colors.primary} />
                          </View>
                          <Text style={[styles.listRowLabel, { color: colors.primary }]}>
                            Sign In
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={17} color={colors.text.muted} />
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.listRow}
                          onPress={handleLogout}
                          activeOpacity={0.75}
                        >
                          <View style={styles.listRowLeft}>
                            <View style={styles.listIconCircle}>
                              <Ionicons name="log-out-outline" size={17} color={colors.text.secondary} />
                            </View>
                            <Text style={styles.listRowLabel}>Log Out</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={17} color={colors.text.muted} />
                        </TouchableOpacity>

                        <View style={styles.listDivider} />

                        <TouchableOpacity
                          style={styles.listRow}
                          onPress={handleDeleteAccount}
                          activeOpacity={0.75}
                        >
                          <View style={styles.listRowLeft}>
                            <View style={[styles.listIconCircle, styles.listIconCircleDanger]}>
                              <Ionicons name="trash-outline" size={16} color="#C93B2B" />
                            </View>
                            <Text style={[styles.listRowLabel, { color: '#C93B2B' }]}>
                              Delete Account
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </>
              )}

              {/* ===================== TAB 2: BUDGET ===================== */}
              {activeTab === 'budget' && (
                <>
                  {/* Weekly Food Budget Card */}
                  <View style={styles.groupCard}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.cardLabel}>WEEKLY BUDGET</Text>
                      {spentThisWeek > 0 ? (
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            preferencesStore.updateKitchenPass({ spentThisWeek: 0 });
                            setSpentThisWeek(0);
                          }}
                          style={styles.resetWeekBtn}
                          activeOpacity={0.75}
                        >
                          <Ionicons name="refresh-outline" size={13} color={colors.primary} />
                          <Text style={styles.resetWeekText}>Reset</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    <View style={styles.budgetBalanceRow}>
                      <Text style={styles.budgetHeroRemaining}>
                        {formatCurrency(remainingWeeklyBudget, activeCurrency.symbol, activeCurrency.code)}
                      </Text>
                      <Text style={styles.budgetHeroSub}>
                        left of {formatCurrency(parsedWeeklyBudget, activeCurrency.symbol, activeCurrency.code)}
                      </Text>
                    </View>

                    <View style={styles.budgetInputRow}>
                      <Text style={styles.budgetCurrencyPrefix}>{activeCurrency.symbol}</Text>
                      <TextInput
                        style={styles.budgetInputField}
                        value={weeklyBudgetString}
                        onChangeText={setWeeklyBudgetString}
                        keyboardType="numeric"
                        placeholder={String(fallbackBudget)}
                        placeholderTextColor={colors.text.muted}
                      />
                      <Text style={styles.budgetPerWeekText}>/ week</Text>
                    </View>
                  </View>

                  {/* Country & Currency Grouped Card */}
                  <View style={styles.groupCard}>
                    <View style={styles.subSection}>
                      <Text style={styles.cardLabel}>COUNTRY</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalScrollRow}
                      >
                        {SUPPORTED_COUNTRIES.map((country) => {
                          const active = selectedCountryId === country.id;
                          return (
                            <TouchableOpacity
                              key={country.id}
                              style={[styles.chip, active && styles.chipActive]}
                              onPress={() => handleSelectCountry(country)}
                              activeOpacity={0.82}
                            >
                              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                {country.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.subSection}>
                      <Text style={styles.cardLabel}>CURRENCY</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalScrollRow}
                      >
                        {SUPPORTED_CURRENCIES.map((curr) => {
                          const active = selectedCurrencyCode === curr.code;
                          return (
                            <TouchableOpacity
                              key={curr.code}
                              style={[styles.chip, active && styles.chipActive]}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setSelectedCurrencyCode(curr.code);
                              }}
                              activeOpacity={0.82}
                            >
                              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                {curr.symbol} {curr.code}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>
                </>
              )}

              {/* ===================== TAB 3: TASTE ===================== */}
              {activeTab === 'taste' && (
                <>
                  {/* Body Goal 2x2 Grid */}
                  <View style={styles.groupCard}>
                    <Text style={styles.cardLabel}>GOAL</Text>
                    <View style={styles.twoColGrid}>
                      {BODY_GOAL_OPTIONS.map((goal) => {
                        const active = selectedGoal === goal.id;
                        return (
                          <TouchableOpacity
                            key={goal.id}
                            style={[styles.gridTile, active && styles.chipActive]}
                            onPress={() => {
                              Haptics.selectionAsync().catch(() => {});
                              setSelectedGoal(goal.id);
                            }}
                            activeOpacity={0.82}
                          >
                            <Ionicons
                              name={goal.icon}
                              size={15}
                              color={active ? '#FFFFFF' : colors.primary}
                            />
                            <Text
                              style={[styles.chipText, active && styles.chipTextActive]}
                              numberOfLines={1}
                            >
                              {goal.title}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Time, Gear & Vibe in ONE Calm Grouped Card */}
                  <View style={styles.groupCard}>
                    <View style={styles.subSection}>
                      <Text style={styles.cardLabel}>COOK TIME</Text>
                      <View style={styles.threeUpRow}>
                        {TIME_OPTIONS.map((opt) => {
                          const active = selectedTimeMinutes === opt.minutes;
                          return (
                            <TouchableOpacity
                              key={opt.id}
                              style={[styles.threeUpPill, active && styles.chipActive]}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setSelectedTimeMinutes(opt.minutes);
                              }}
                              activeOpacity={0.82}
                            >
                              <Text
                                style={[styles.chipText, active && styles.chipTextActive]}
                                numberOfLines={1}
                              >
                                {opt.title}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.subSection}>
                      <Text style={styles.cardLabel}>KITCHEN GEAR</Text>
                      <View style={styles.threeUpRow}>
                        {GEAR_OPTIONS.map((gear) => {
                          const active = selectedGearId === gear.id;
                          return (
                            <TouchableOpacity
                              key={gear.id}
                              style={[styles.threeUpPill, active && styles.chipActive]}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setSelectedGearId(gear.id);
                              }}
                              activeOpacity={0.82}
                            >
                              <Text
                                style={[styles.chipText, active && styles.chipTextActive]}
                                numberOfLines={1}
                              >
                                {gear.title}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.subSection}>
                      <Text style={styles.cardLabel}>VIBE</Text>
                      <View style={styles.threeUpRow}>
                        {FLAVOR_OPTIONS.map((flav) => {
                          const active = selectedFlavorId === flav.id;
                          return (
                            <TouchableOpacity
                              key={flav.id}
                              style={[styles.threeUpPill, active && styles.chipActive]}
                              onPress={() => {
                                Haptics.selectionAsync().catch(() => {});
                                setSelectedFlavorId(flav.id);
                              }}
                              activeOpacity={0.82}
                            >
                              <Text
                                style={[styles.chipText, active && styles.chipTextActive]}
                                numberOfLines={1}
                              >
                                {flav.title}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>

                  {/* Diet & Exclusions Card */}
                  <View style={styles.groupCard}>
                    <Text style={styles.cardLabel}>DIET &amp; EXCLUSIONS</Text>
                    <View style={styles.chipWrap}>
                      {DIETARY_OPTIONS.map((diet) => {
                        const active = selectedDiets.includes(diet.id);
                        return (
                          <TouchableOpacity
                            key={diet.id}
                            style={[styles.chip, active && styles.chipActive]}
                            onPress={() => handleToggleDiet(diet.id)}
                            activeOpacity={0.82}
                          >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>
                              {diet.title}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      {selectedDiets
                        .filter((d) => !DIETARY_OPTIONS.some((opt) => opt.id === d))
                        .map((customRule) => (
                          <TouchableOpacity
                            key={customRule}
                            style={[styles.chip, styles.chipActive]}
                            onPress={() => handleToggleDiet(customRule)}
                            activeOpacity={0.82}
                          >
                            <Text style={[styles.chipText, styles.chipTextActive]}>{customRule}</Text>
                            <Ionicons name="close-circle" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.customDietInputRow}>
                      <TextInput
                        value={customDietInput}
                        onChangeText={setCustomDietInput}
                        placeholder="Avoid ingredient (e.g. peanuts)"
                        placeholderTextColor={colors.text.muted}
                        onSubmitEditing={() => {
                          const trimmed = customDietInput.trim();
                          if (trimmed) {
                            handleToggleDiet(trimmed);
                            setCustomDietInput('');
                          }
                        }}
                        style={styles.customDietInput}
                      />
                      {customDietInput.trim().length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            const trimmed = customDietInput.trim();
                            if (trimmed) {
                              handleToggleDiet(trimmed);
                              setCustomDietInput('');
                            }
                          }}
                          style={styles.customDietAddBtn}
                        >
                          <Text style={styles.customDietAddText}>Add</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {hiddenDishes.length > 0 && (
                      <View style={styles.hiddenDishesWrap}>
                        {hiddenDishes.map((dish) => (
                          <TouchableOpacity
                            key={dish}
                            style={styles.hiddenDishChip}
                            onPress={() => handleUnhideDish(dish)}
                          >
                            <Text style={styles.hiddenDishText}>{dish}</Text>
                            <Text style={styles.unhideLabel}>Unhide</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Sticky Save CTA */}
            <View style={styles.footerBar}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                activeOpacity={0.88}
              >
                <Text style={styles.saveBtnText}>Save</Text>
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
      {visible ? <MamaAlertHost inline /> : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(18, 20, 16, 0.5)',
  },
  backdropArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '84%',
    paddingBottom: 24,
  },
  dragHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(36, 40, 32, 0.16)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 23,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(36, 40, 32, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrap: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: '#EFEAE1',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E2419',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  scrollArea: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 2,
    paddingBottom: 24,
    gap: 14,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.text.secondary,
    letterSpacing: 0.9,
  },
  subSection: {
    gap: 10,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(36, 40, 32, 0.08)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  bowlAvatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#58673A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileTextWrap: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.text.primary,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(102, 112, 74, 0.1)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
  },
  xpPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(102, 112, 74, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(102, 112, 74, 0.24)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  planCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  planCardTextWrap: {
    flex: 1,
    gap: 2,
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
  planCardTitleActive: {
    color: '#FFFFFF',
  },
  planCardSub: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  planCardSubActive: {
    color: 'rgba(255, 255, 255, 0.88)',
  },
  planCardBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  planCardBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  planCardBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  planCardBtnTextActive: {
    color: colors.primary,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(102, 112, 74, 0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listIconCircleDanger: {
    backgroundColor: 'rgba(201, 59, 43, 0.09)',
  },
  listRowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  listDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(36, 40, 32, 0.08)',
    marginLeft: 60,
  },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(36, 40, 32, 0.16)',
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: colors.primary,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  resetWeekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(102, 112, 74, 0.1)',
  },
  resetWeekText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  budgetBalanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  budgetHeroRemaining: {
    fontSize: 26,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.primary,
  },
  budgetHeroSub: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  budgetCurrencyPrefix: {
    fontSize: 20,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: 6,
  },
  budgetInputField: {
    flex: 1,
    fontSize: 20,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.text.primary,
    padding: 0,
  },
  budgetPerWeekText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  horizontalScrollRow: {
    flexDirection: 'row',
    gap: 8,
  },
  twoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAF7F2',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
  },
  threeUpRow: {
    flexDirection: 'row',
    gap: 8,
  },
  threeUpPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7F2',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.06)',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text.primary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  customDietInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customDietInput: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.07)',
  },
  customDietAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  customDietAddText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  hiddenDishesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hiddenDishChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  hiddenDishText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  unhideLabel: {
    fontSize: 11.5,
    color: colors.primary,
    fontWeight: '800',
  },
  footerBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default KitchenPassModal;
