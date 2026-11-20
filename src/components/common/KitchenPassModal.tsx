import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { preferencesStore, BodyGoal } from '../../services/preferencesStore';
import { subscriptionService } from '../../services/subscriptionService';
import { authService } from '../../services/api/authService';
import { useUserDataBank } from '../../context/UserDataBankContext';

interface KitchenPassModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'gear' | 'time' | 'flavor' | 'diet' | 'goal' | 'account';
}

const GEAR_OPTIONS = [
  { id: 'one_pan', title: '1 Pan', fullTitle: '1 Pan & Burner', icon: 'flame-outline' as const },
  { id: 'air_fryer', title: 'Air Fryer', fullTitle: 'Air Fryer & Stovetop', icon: 'flash-outline' as const },
  { id: 'full_kitchen', title: 'Full Kitchen', fullTitle: 'Full Kitchen', icon: 'restaurant-outline' as const },
];

const TIME_OPTIONS = [
  { id: 'under_15', minutes: 15, title: 'Under 15m', fullTitle: 'Under 15 mins', icon: 'speedometer-outline' as const },
  { id: 'standard', minutes: 25, title: '20–30m', fullTitle: '20 to 30 mins', icon: 'time-outline' as const },
  { id: 'no_rush', minutes: 45, title: 'No Rush', fullTitle: 'No rush', icon: 'cafe-outline' as const },
];

const FLAVOR_OPTIONS = [
  { id: 'african_caribbean', title: 'African & Caribbean', icon: 'flame-outline' as const },
  { id: 'weeknight_comfort', title: 'Everyday Comfort', icon: 'nutrition-outline' as const },
  { id: 'global', title: 'Surprise Me', icon: 'shuffle-outline' as const },
];

const DIETARY_OPTIONS = [
  { id: 'none', title: 'Eat Everything' },
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
  { id: 'curves_glutes', title: 'Curves & Glutes', icon: 'body-outline' },
  { id: 'reduce_weight', title: 'Lose Weight', icon: 'leaf-outline' },
  { id: 'add_weight', title: 'Gain Weight', icon: 'restaurant-outline' },
  { id: 'balanced', title: 'Balanced', icon: 'fitness-outline' },
];

export const KitchenPassModal: React.FC<KitchenPassModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, isLoggedIn, kitchenPass: currentPass } = useUserDataBank();
  const navigation = useNavigation<any>();

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
  const [shakeEnabled, setShakeEnabled] = useState<boolean>(
    currentPass.shakeToRollEnabled !== false
  );

  useEffect(() => {
    if (visible) {
      const pass = preferencesStore.getKitchenPass();
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    }
  }, [visible]);

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
    Alert.alert('Log Out', 'Are you sure you want to log out of Mama Kitchen?', [
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
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all associated data? This action cannot be undone.',
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

    preferencesStore.updateKitchenPass({
      cookingGear: selectedGearId,
      cookingGearLabel: chosenGear ? chosenGear.fullTitle : '1 Pan & Burner',
      timeLimitMinutes: chosenTime.minutes,
      timeLimitLabel: chosenTime.fullTitle,
      cuisineAnchor: selectedFlavorId,
      cuisineLabel: chosenFlavor ? chosenFlavor.title : 'African & Caribbean',
      dietaryRestrictions: finalDiets,
      bodyGoal: selectedGoal,
      bodyGoalLabel: chosenGoal ? chosenGoal.title : 'Balanced',
      shakeToRollEnabled: shakeEnabled,
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdropArea} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

          {/* Sheet Header */}
          <View style={styles.header}>
            <Text style={styles.sheetTitle}>Kitchen Pass</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Clean Warm Profile Card: Name, Email, XP Earned & Perks */}
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <View style={styles.profileLeft}>
                  <View style={styles.avatarCircle}>
                    <Ionicons name="person" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.profileTextWrap}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {(isLoggedIn && user) || user
                        ? user?.name?.trim() || user?.email?.split('@')[0] || "Mama's Child"
                        : 'Guest'}
                    </Text>
                    <Text style={styles.profileEmail} numberOfLines={1}>
                      {user?.email || 'Not signed in'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.xpPill}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    Alert.alert(
                      'Your Mama XP',
                      'Earn +50 XP every time you eat at home.\n\n• Spend 50 XP on any dish to unlock a "Make It Healthy" remix.\n• Keep stacking your XP for upcoming Partner Grocery & Food Discounts (Coming Soon)!'
                    );
                  }}
                >
                  <Ionicons name="flame" size={14} color={colors.primary} />
                  <Text style={styles.xpPillText}>
                    {preferencesStore.getXpBalance()} XP
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.xpPerkHintRow}>
                <View style={styles.xpPerkLeftWrap}>
                  <Ionicons name="leaf-outline" size={13} color={colors.primary} />
                  <Text style={styles.xpPerkHintText} numberOfLines={1}>
                    {isPlusActive
                      ? 'Mama Plus • Unlimited Rolls, Free Healthy & 2x XP'
                      : `Free Plan • ${preferencesStore.getRemainingDailyRolls()}/5 Rolls left today`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.plusTogglePill,
                    isPlusActive && styles.plusTogglePillActive,
                  ]}
                  activeOpacity={0.82}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    if (isPlusActive) {
                      const isLive = subscriptionService.isLive();
                      Alert.alert(
                        'Mama Plus Active',
                        isLive
                          ? 'You have Unlimited Daily Rolls, Free Healthy Remixes, and 2x XP. Manage or cancel anytime in your phone\'s App Store / Play Store subscriptions.'
                          : 'You have Unlimited Daily Rolls, Free Instant Healthy Remixes, and 2x XP (+100 XP per home meal).',
                        isLive
                          ? [{ text: 'OK', style: 'cancel' }]
                          : [
                              { text: 'Keep Plus', style: 'cancel' },
                              {
                                text: 'Switch to Free Plan',
                                style: 'destructive',
                                onPress: () => {
                                  subscriptionService.cancelPreview();
                                  setIsPlusActive(false);
                                },
                              },
                            ]
                      );
                    } else {
                      subscriptionService.getPlusPriceString().then((price) => {
                        Alert.alert(
                          `Mama Plus (${price})`,
                          'Unlock the full Mama experience:\n\n• Unlimited Daily Dice Rolls\n• Free Instant "Make It Healthy" Remixes (0 XP)\n• 2x XP Multiplier (+100 XP per home meal for Partner Perks)',
                          [
                            { text: 'Not Now', style: 'cancel' },
                            {
                              text: 'Restore Purchase',
                              onPress: async () => {
                                const restored = await subscriptionService.restore();
                                setIsPlusActive(restored);
                                if (!restored) {
                                  Alert.alert('Nothing to restore', 'No active Mama Plus subscription was found on this account.');
                                }
                              },
                            },
                            {
                              text: subscriptionService.isLive() ? 'Get Mama Plus' : 'Activate Plus Preview',
                              onPress: async () => {
                                const outcome = await subscriptionService.purchasePlus();
                                if (outcome === 'purchased' || outcome === 'preview') {
                                  Haptics.notificationAsync(
                                    Haptics.NotificationFeedbackType.Success
                                  ).catch(() => {});
                                  setIsPlusActive(true);
                                } else if (outcome === 'error') {
                                  Alert.alert('Purchase not completed', 'Something went wrong with the store. You have not been charged.');
                                }
                              },
                            },
                          ]
                        );
                      });
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.plusTogglePillText,
                      isPlusActive && styles.plusTogglePillTextActive,
                    ]}
                  >
                    {isPlusActive
                      ? 'Plus ✓'
                      : `Plus · ${preferencesStore.getLocalizedPlusPrice()}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Body Goal */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>BODY GOAL</Text>
              <View style={styles.pillGrid}>
                {BODY_GOAL_OPTIONS.map((goal) => {
                  const active = selectedGoal === goal.id;
                  return (
                    <TouchableOpacity
                      key={goal.id}
                      style={[styles.pillButton, active && styles.pillButtonActive]}
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
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {goal.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Max Cooking Time */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>PACE &amp; TIME</Text>
              <View style={styles.pillRow}>
                {TIME_OPTIONS.map((opt) => {
                  const active = selectedTimeMinutes === opt.minutes;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.pillEqual, active && styles.pillButtonActive]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedTimeMinutes(opt.minutes);
                      }}
                      activeOpacity={0.82}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={14}
                        color={active ? '#FFFFFF' : colors.primary}
                      />
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {opt.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Kitchen Setup */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>KITCHEN SETUP</Text>
              <View style={styles.pillRow}>
                {GEAR_OPTIONS.map((gear) => {
                  const active = selectedGearId === gear.id;
                  return (
                    <TouchableOpacity
                      key={gear.id}
                      style={[styles.pillEqual, active && styles.pillButtonActive]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedGearId(gear.id);
                      }}
                      activeOpacity={0.82}
                    >
                      <Ionicons
                        name={gear.icon}
                        size={14}
                        color={active ? '#FFFFFF' : colors.primary}
                      />
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {gear.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Flavor Vibe */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>CRAVING VIBE</Text>
              <View style={styles.pillGrid}>
                {FLAVOR_OPTIONS.map((flav) => {
                  const active = selectedFlavorId === flav.id;
                  return (
                    <TouchableOpacity
                      key={flav.id}
                      style={[styles.pillButton, active && styles.pillButtonActive]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedFlavorId(flav.id);
                      }}
                      activeOpacity={0.82}
                    >
                      <Ionicons
                        name={flav.icon}
                        size={14}
                        color={active ? '#FFFFFF' : colors.primary}
                      />
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
                        {flav.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Dietary Rules & Custom Exclusions */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>DIET &amp; EXCLUSIONS</Text>
              <View style={styles.pillGrid}>
                {DIETARY_OPTIONS.map((diet) => {
                  const active = selectedDiets.includes(diet.id);
                  return (
                    <TouchableOpacity
                      key={diet.id}
                      style={[styles.pillCompact, active && styles.pillButtonActive]}
                      onPress={() => handleToggleDiet(diet.id)}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>
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
                      style={[styles.pillCompact, styles.pillButtonActive]}
                      onPress={() => handleToggleDiet(customRule)}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.pillText, styles.pillTextActive]}>{customRule}</Text>
                      <Ionicons name="close-circle" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  ))}
              </View>

              <View style={styles.customDietInputRow}>
                <TextInput
                  value={customDietInput}
                  onChangeText={setCustomDietInput}
                  placeholder="Never give me... (e.g. No okra, No peanuts)"
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

            {/* Shake to Roll Preference */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>MOTION &amp; CONTROLS</Text>
              <TouchableOpacity
                style={[styles.pillButton, shakeEnabled && styles.pillButtonActive]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShakeEnabled((prev) => !prev);
                }}
                activeOpacity={0.82}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={15}
                  color={shakeEnabled ? '#FFFFFF' : colors.primary}
                />
                <Text style={[styles.pillText, shakeEnabled && styles.pillTextActive]}>
                  {shakeEnabled ? 'Shake Phone to Roll: ON' : 'Shake Phone to Roll: OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Compact Account Footer */}
            <View style={styles.accountFooter}>
              {!isLoggedIn && !user ? (
                <TouchableOpacity
                  style={styles.accountLinkBtn}
                  onPress={() => {
                    onClose();
                    navigation.navigate('MamaKitchenSignIn');
                  }}
                >
                  <Ionicons name="log-in-outline" size={16} color={colors.primary} />
                  <Text style={styles.accountLinkText}>Sign In / Sync Pass</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.accountActionsRow}>
                  <TouchableOpacity style={styles.accountLinkBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={16} color={colors.text.secondary} />
                    <Text style={styles.accountSecondaryText}>Log Out</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.accountLinkBtn} onPress={handleDeleteAccount}>
                    <Ionicons name="trash-outline" size={15} color="#D32F2F" />
                    <Text style={[styles.accountSecondaryText, { color: '#D32F2F' }]}>
                      Delete Account
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Sticky Primary Save CTA */}
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(18, 20, 16, 0.52)',
  },
  backdropArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '84%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
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
    paddingVertical: 10,
  },
  sheetTitle: {
    fontSize: 22,
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
  scrollArea: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 20,
    gap: 18,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.07)',
    gap: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpPerkHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(36, 40, 32, 0.08)',
  },
  xpPerkLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  xpPerkHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
    flexShrink: 1,
  },
  plusTogglePill: {
    backgroundColor: 'rgba(217, 85, 36, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  plusTogglePillActive: {
    backgroundColor: colors.primary,
  },
  plusTogglePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  plusTogglePillTextActive: {
    color: '#FFFFFF',
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(217, 85, 36, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTextWrap: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontFamily: typography.fontFamily.serif,
    fontWeight: '700',
    color: colors.text.primary,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(217, 85, 36, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
  },
  xpPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.muted,
    letterSpacing: 0.9,
  },
  pillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  pillEqual: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  pillCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  pillButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  customDietInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customDietInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(36, 40, 32, 0.08)',
  },
  customDietAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  customDietAddText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  hiddenDishesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  hiddenDishChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(36, 40, 32, 0.06)',
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
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
  },
  accountFooter: {
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(36, 40, 32, 0.1)',
  },
  accountActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  accountLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  accountSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
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
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});

export default KitchenPassModal;
