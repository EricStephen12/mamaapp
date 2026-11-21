/**
 * Mama Plus Subscription Service (RevenueCat)
 *
 * - Real store purchases when EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
 *   are set and the app runs in a development / production build.
 * - Expo Go: RevenueCat automatically runs in "Preview API Mode" (no crash, no real purchases).
 * - No keys yet (or web): falls back to the local "Plus Preview" toggle so the app keeps working.
 *
 * RevenueCat dashboard setup expected:
 *   Entitlement identifier: "mama_plus"
 *   Current offering with a monthly package ($1/mo)
 */

import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { preferencesStore } from './preferencesStore';

const ENTITLEMENT_ID = 'mama_plus';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

let configured = false;

function getApiKey(): string {
  if (Platform.OS === 'ios') return IOS_KEY;
  if (Platform.OS === 'android') return ANDROID_KEY;
  return '';
}

function hasPlusEntitlement(info: CustomerInfo | null | undefined): boolean {
  return Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]);
}

/** Keep the local Kitchen Pass plan tier in sync with the store receipt */
function syncPlanTier(info: CustomerInfo | null | undefined): void {
  const active = hasPlusEntitlement(info);
  const currentlyPlus = preferencesStore.isMamaPlus();
  if (active && !currentlyPlus) preferencesStore.setPlanTier('plus');
  if (!active && currentlyPlus) preferencesStore.setPlanTier('free');
}

export type PurchaseOutcome = 'purchased' | 'cancelled' | 'preview' | 'error';

export const subscriptionService = {
  /** True when real RevenueCat billing is active (keys present + native platform) */
  isLive(): boolean {
    return configured;
  },

  /** Call once at app start (after tokenStore.init). Safe to call when no keys exist. */
  async init(appUserId?: string | null): Promise<void> {
    const apiKey = getApiKey();
    if (!apiKey || configured) return;
    try {
      Purchases.configure({ apiKey, appUserID: appUserId || undefined });
      configured = true;
      Purchases.addCustomerInfoUpdateListener(syncPlanTier);
      const info = await Purchases.getCustomerInfo();
      syncPlanTier(info);
    } catch (err) {
      configured = false;
      console.warn('[subscriptionService] init failed, using preview mode:', err);
    }
  },

  /** Link purchases to the signed-in Mama account (so Plus follows them across devices) */
  async identify(userId: string): Promise<void> {
    if (!configured || !userId) return;
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      syncPlanTier(customerInfo);
    } catch (err) {
      console.warn('[subscriptionService] logIn failed:', err);
    }
  },

  async reset(): Promise<void> {
    if (!configured) return;
    try {
      await Purchases.logOut();
    } catch {
      // logOut throws if the current user is already anonymous; safe to ignore
    }
  },

  /** Store-localized price string for the monthly Plus package, or our local estimate */
  async getPlusPriceString(): Promise<string> {
    const pkg = await this.getPlusPackage();
    return pkg?.product?.priceString ? `${pkg.product.priceString}/mo` : preferencesStore.getLocalizedPlusPrice();
  },

  async getPlusPackage(): Promise<PurchasesPackage | null> {
    if (!configured) return null;
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      return current?.monthly || current?.availablePackages?.[0] || null;
    } catch {
      return null;
    }
  },

  /** Start the Mama Plus purchase. Without RevenueCat keys, activates the local preview. */
  async purchasePlus(): Promise<PurchaseOutcome> {
    if (!configured) {
      preferencesStore.setPlanTier('plus');
      return 'preview';
    }
    try {
      const pkg = await this.getPlusPackage();
      if (!pkg) return 'error';
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      syncPlanTier(customerInfo);
      return hasPlusEntitlement(customerInfo) ? 'purchased' : 'error';
    } catch (err: any) {
      if (err?.userCancelled) return 'cancelled';
      console.warn('[subscriptionService] purchase failed:', err);
      return 'error';
    }
  },

  /** Required by Apple: lets users restore a subscription on a new phone */
  async restore(): Promise<boolean> {
    if (!configured) return preferencesStore.isMamaPlus();
    try {
      const info = await Purchases.restorePurchases();
      syncPlanTier(info);
      return hasPlusEntitlement(info);
    } catch {
      return false;
    }
  },

  /** Preview-mode only: lets you switch back to Free while testing without a store */
  cancelPreview(): void {
    if (!configured) preferencesStore.setPlanTier('free');
  },
};

