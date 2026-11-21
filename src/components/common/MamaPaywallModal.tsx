import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { preferencesStore } from '../../services/preferencesStore';
import { subscriptionService } from '../../services/subscriptionService';
import { RegionalMamaAvatar } from '../signature/RegionalMamaAvatar';
import { KitchenAtmosphere } from '../signature/KitchenAtmosphere';

export interface MamaPaywallProps {
  onClose: () => void;
  onSubscribed?: () => void;
}

type PlanType = 'monthly' | 'yearly';

/**
 * Full Mama Kitchen Pro Paywall view.
 * Can be rendered inline inside any existing modal or standalone.
 */
export const MamaPaywallContent: React.FC<MamaPaywallProps> = ({
  onClose,
  onSubscribed,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [loading, setLoading] = useState(false);

  const countryCode = preferencesStore.getKitchenPass().country || 'NG';
  const monthlyPrice = preferencesStore.getLocalizedPlusPrice();

  // Currencies formatted for Yearly ($9.99 eq.)
  const currencyCode = preferencesStore.getKitchenPass().currencyCode || 'USD';
  const getYearlyPriceString = (): { total: string; perMonth: string } => {
    switch (currencyCode) {
      case 'NGN':
        return { total: '₦14,900/yr', perMonth: '₦1,241/mo' };
      case 'GBP':
        return { total: '£9.99/yr', perMonth: '£0.83/mo' };
      case 'EUR':
        return { total: '€9.99/yr', perMonth: '€0.83/mo' };
      case 'GHS':
        return { total: 'GH₵150/yr', perMonth: 'GH₵12.5/mo' };
      case 'KES':
        return { total: 'KSh1,299/yr', perMonth: 'KSh108/mo' };
      case 'ZAR':
        return { total: 'R189/yr', perMonth: 'R15.7/mo' };
      case 'CAD':
        return { total: 'CA$13.99/yr', perMonth: 'CA$1.16/mo' };
      case 'AUD':
        return { total: 'A$14.99/yr', perMonth: 'A$1.25/mo' };
      default:
        return { total: '$9.99/yr', perMonth: '$0.83/mo' };
    }
  };

  const yearly = getYearlyPriceString();

  const handlePurchase = async () => {
    if (loading) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const outcome = await subscriptionService.purchasePlus(selectedPlan);
      if (outcome === 'purchased' || outcome === 'preview') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onSubscribed?.();
      } else if (outcome === 'error') {
        Alert.alert(
          'Purchase Not Completed',
          'Something went wrong processing your order. You have not been charged.'
        );
      }
    } catch (err) {
      console.warn('[MamaPaywallContent] Purchase error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (loading) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    try {
      const restored = await subscriptionService.restore();
      if (restored) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Alert.alert('Restored!', 'Your Mama Kitchen Pro access has been restored.');
        onSubscribed?.();
      } else {
        Alert.alert(
          'Nothing to Restore',
          'No active Mama Kitchen Pro subscription was found on this account.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const topInset = Math.max(insets.top, 24);
  const bottomInset = Math.max(insets.bottom, 18);

  return (
    <View style={styles.container}>
      <KitchenAtmosphere period="dinner" />

      {/* Top Header bar with Safe-Area aware Close and Restore */}
      <View style={[styles.topBar, { paddingTop: topInset + 10 }]}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel="Close paywall"
        >
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Restore purchases"
        >
          <Text style={styles.restoreText}>Restore</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 96 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Branding */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrap}>
            <RegionalMamaAvatar countryCode={countryCode} size={76} />
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Mama Kitchen Pro</Text>
          <Text style={styles.heroSubtitle}>
            Cook what you love, whenever you want. Complete kitchen freedom.
          </Text>
        </View>

        {/* Perks Feature Box */}
        <View style={styles.perksCard}>
          <View style={styles.perkRow}>
            <View style={styles.perkIconWrap}>
              <Ionicons name="dice" size={20} color={colors.primary} />
            </View>
            <View style={styles.perkTextWrap}>
              <Text style={styles.perkTitle}>Unlimited Daily Rolls</Text>
              <Text style={styles.perkDesc}>
                No 2-roll daily cap. Roll until you find the exact home meal you crave.
              </Text>
            </View>
          </View>

          <View style={styles.perkDivider} />

          <View style={styles.perkRow}>
            <View style={styles.perkIconWrap}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
            </View>
            <View style={styles.perkTextWrap}>
              <Text style={styles.perkTitle}>{'Free "Make It Healthy" Remixes'}</Text>
              <Text style={styles.perkDesc}>
                Instant nutrient-dense & low-calorie variations on any dish without spending 50 XP.
              </Text>
            </View>
          </View>

          <View style={styles.perkDivider} />

          <View style={styles.perkRow}>
            <View style={styles.perkIconWrap}>
              <Ionicons name="flame" size={20} color={colors.primary} />
            </View>
            <View style={styles.perkTextWrap}>
              <Text style={styles.perkTitle}>2x XP Multiplier</Text>
              <Text style={styles.perkDesc}>
                Earn +100 XP for every meal cooked at home to build your culinary streak faster.
              </Text>
            </View>
          </View>
        </View>

        {/* Plan Selector */}
        <Text style={styles.sectionHeader}>CHOOSE YOUR PASS</Text>

        {/* Monthly Option */}
        <TouchableOpacity
          style={[
            styles.planOption,
            selectedPlan === 'monthly' && styles.planOptionActive,
          ]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setSelectedPlan('monthly');
          }}
          activeOpacity={0.88}
        >
          <View style={styles.planRadio}>
            <View
              style={[
                styles.planRadioInner,
                selectedPlan === 'monthly' && styles.planRadioInnerActive,
              ]}
            />
          </View>
          <View style={styles.planInfo}>
            <View style={styles.planTitleRow}>
              <Text style={styles.planTitle}>Monthly Pass</Text>
              <View style={styles.pillTag}>
                <Text style={styles.pillTagText}>POPULAR</Text>
              </View>
            </View>
            <Text style={styles.planSub}>Flexible, cancel anytime</Text>
          </View>
          <View style={styles.planPriceCol}>
            <Text style={styles.planPriceMain}>{monthlyPrice}</Text>
          </View>
        </TouchableOpacity>

        {/* Yearly Option */}
        <TouchableOpacity
          style={[
            styles.planOption,
            selectedPlan === 'yearly' && styles.planOptionActive,
          ]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setSelectedPlan('yearly');
          }}
          activeOpacity={0.88}
        >
          <View style={styles.planRadio}>
            <View
              style={[
                styles.planRadioInner,
                selectedPlan === 'yearly' && styles.planRadioInnerActive,
              ]}
            />
          </View>
          <View style={styles.planInfo}>
            <View style={styles.planTitleRow}>
              <Text style={styles.planTitle}>Yearly Pass</Text>
              <View style={[styles.pillTag, styles.pillTagHighlight]}>
                <Text style={[styles.pillTagText, styles.pillTagTextHighlight]}>
                  SAVE 17%
                </Text>
              </View>
            </View>
            <Text style={styles.planSub}>{yearly.perMonth} billed annually</Text>
          </View>
          <View style={styles.planPriceCol}>
            <Text style={styles.planPriceMain}>{yearly.total}</Text>
          </View>
        </TouchableOpacity>

        {/* Legal / Guarantee note */}
        <Text style={styles.legalNote}>
          {"Cancel anytime in your phone's App Store / Google Play subscriptions. No hidden fees."}
        </Text>
      </ScrollView>

      {/* Floating Bottom CTA Button */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 12 }]}>
        <TouchableOpacity
          style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
          onPress={handlePurchase}
          activeOpacity={0.88}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaButtonText}>
              {selectedPlan === 'monthly'
                ? `Unlock Monthly (${monthlyPrice})`
                : `Unlock Yearly (${yearly.total})`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const MamaPaywallModal: React.FC<MamaPaywallProps & { visible: boolean }> = ({
  visible,
  onClose,
  onSubscribed,
}) => {
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <MamaPaywallContent onClose={onClose} onSubscribed={onSubscribed} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(36, 40, 32, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 112, 74, 0.12)',
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  proBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text.primary,
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 290,
  },
  perksCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(218, 216, 204, 0.7)',
    marginBottom: 22,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    paddingVertical: 10,
  },
  perkIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 112, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkTextWrap: {
    flex: 1,
    gap: 2,
  },
  perkTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text.primary,
  },
  perkDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  perkDivider: {
    height: 1,
    backgroundColor: 'rgba(218, 216, 204, 0.45)',
    marginHorizontal: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: colors.text.secondary,
    marginBottom: 10,
    marginLeft: 4,
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(218, 216, 204, 0.8)',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  planOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(102, 112, 74, 0.08)',
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  planRadioInnerActive: {
    backgroundColor: colors.primary,
  },
  planInfo: {
    flex: 1,
    gap: 2,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text.primary,
  },
  planSub: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  pillTag: {
    backgroundColor: 'rgba(36, 40, 32, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillTagHighlight: {
    backgroundColor: colors.primary,
  },
  pillTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  pillTagTextHighlight: {
    color: '#FFFFFF',
  },
  planPriceCol: {
    alignItems: 'flex-end',
  },
  planPriceMain: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.text.primary,
  },
  legalNote: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 216, 204, 0.6)',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
