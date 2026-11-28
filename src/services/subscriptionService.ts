/**
 * Mama Kitchen Pro Subscription Service (RevenueCat SDK v11 + RevenueCatUI)
 *
 * Entitlement identifier: "mama_kitchen_pro"
 * Configured packages in current Offering:
 *   - Monthly  ("monthly" / $rc_monthly)  - Monthly subscription
 *   - Yearly   ("yearly"  / $rc_annual)   - Yearly subscription
 *   - Lifetime ("lifetime"/ $rc_lifetime) - One-time purchase
 *
 * Runtime behavior:
 *   - Native dev / preview / production build with API keys: full RevenueCat Paywalls,
 *     Customer Center, and store billing.
 *   - Expo Go: RevenueCat runs in Preview API Mode (no crash; safe fallback if native Paywall UI is unavailable).
 *   - Web or missing keys: safe local preview fallback.
 */

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesError,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { preferencesStore } from './preferencesStore';

export const PRO_ENTITLEMENT_ID = 'mama_kitchen_pro';

/**
 * Expo Go can't run native RevenueCat billing. Its "Preview API Mode" returns mock
 * products (e.g. $9.99/mo) and the Paywall UI throws "document is not available".
 * So in Expo Go we skip RevenueCat entirely and use Mama's own $1/mo preview flow.
 */
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const IOS_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ||
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
  '';
const ANDROID_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ||
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ||
  '';

let configured = false;
let latestCustomerInfo: CustomerInfo | null = null;
let lastErrorMessage: string | null = null;
const entitlementListeners = new Set<(isPro: boolean, info: CustomerInfo | null) => void>();

function getApiKey(): string {
  if (Platform.OS === 'ios') return IOS_KEY.trim();
  if (Platform.OS === 'android') return ANDROID_KEY.trim();
  return '';
}

function hasProEntitlement(info: CustomerInfo | null | undefined): boolean {
  return Boolean(info?.entitlements?.active?.[PRO_ENTITLEMENT_ID]);
}

function notifyEntitlementListeners(isPro: boolean, info: CustomerInfo | null): void {
  entitlementListeners.forEach((cb) => {
    try {
      cb(isPro, info);
    } catch {
      // Isolate listener failures
    }
  });
}

/** Keep local Kitchen Pass plan tier in sync with RevenueCat's CustomerInfo */
function syncPlanTier(info: CustomerInfo | null | undefined): boolean {
  latestCustomerInfo = info || null;
  const active = hasProEntitlement(info);
  const currentlyPlus = preferencesStore.isMamaPlus();
  if (active && !currentlyPlus) preferencesStore.setPlanTier('plus');
  if (!active && currentlyPlus) preferencesStore.setPlanTier('free');
  notifyEntitlementListeners(active, latestCustomerInfo);
  return active;
}

export type PurchaseOutcome = 'purchased' | 'restored' | 'cancelled' | 'preview' | 'unavailable' | 'error';

export interface MamaOfferingsBundle {
  offering: PurchasesOffering | null;
  monthly: PurchasesPackage | null;
  yearly: PurchasesPackage | null;
  lifetime: PurchasesPackage | null;
  all: PurchasesPackage[];
}

function findPackageByHint(
  offering: PurchasesOffering | null,
  hints: string[],
): PurchasesPackage | null {
  if (!offering) return null;
  const lowerHints = hints.map((h) => h.toLowerCase());
  return (
    offering.availablePackages.find((pkg) => {
      const pkgId = (pkg.identifier || '').toLowerCase();
      const prodId = (pkg.product?.identifier || '').toLowerCase();
      return lowerHints.some((hint) => pkgId === hint || prodId === hint || pkgId.includes(hint) || prodId.includes(hint));
    }) || null
  );
}

export const subscriptionService = {
  /** True when RevenueCat SDK is configured on a native platform */
  isLive(): boolean {
    return configured;
  },

  /** Most recent diagnostic error message from RevenueCat / Play Billing */
  getLastError(): string | null {
    return lastErrorMessage;
  },

  /** Subscribe to live mama_kitchen_pro entitlement updates */
  subscribe(listener: (isPro: boolean, info: CustomerInfo | null) => void): () => void {
    entitlementListeners.add(listener);
    return () => {
      entitlementListeners.delete(listener);
    };
  },

  /**
   * Configure RevenueCat once at app start (after tokenStore.init).
   * Safe to call repeatedly or on platforms without keys.
   */
  async init(appUserId?: string | null): Promise<void> {
    const apiKey = getApiKey();
    if (!apiKey || configured || Platform.OS === 'web' || IS_EXPO_GO) return;
    if (apiKey.startsWith('test_')) {
      console.warn('[subscriptionService] Ignoring RevenueCat Test Store key — configure a live goog_ / appl_ key.');
      return;
    }

    try {
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
      Purchases.configure({
        apiKey,
        appUserID: appUserId || undefined,
      });
      configured = true;

      Purchases.addCustomerInfoUpdateListener((info) => {
        syncPlanTier(info);
      });

      const info = await Purchases.getCustomerInfo();
      syncPlanTier(info);
    } catch (err) {
      configured = false;
      console.warn('[subscriptionService] RevenueCat init failed, falling back to preview mode:', err);
    }
  },

  /** Link RevenueCat purchases to the signed-in Mama user ID */
  async identify(userId: string): Promise<boolean> {
    if (!configured || !userId) return preferencesStore.isMamaPlus();
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      return syncPlanTier(customerInfo);
    } catch (err) {
      console.warn('[subscriptionService] RevenueCat logIn failed:', err);
      return preferencesStore.isMamaPlus();
    }
  },

  /** Reset RevenueCat to an anonymous user on sign-out */
  async reset(): Promise<void> {
    if (!configured) return;
    try {
      const info = await Purchases.logOut();
      syncPlanTier(info);
    } catch {
      // Throws if user is already anonymous — safe to ignore
    }
  },

  /** Retrieve fresh CustomerInfo and verify mama_kitchen_pro entitlement */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    if (!configured) return null;
    try {
      const info = await Purchases.getCustomerInfo();
      syncPlanTier(info);
      return info;
    } catch (err) {
      console.warn('[subscriptionService] getCustomerInfo failed:', err);
      return latestCustomerInfo;
    }
  },

  /** Check whether mama_kitchen_pro is currently active */
  async checkProEntitlement(): Promise<boolean> {
    if (!configured) return preferencesStore.isMamaPlus();
    const info = await this.getCustomerInfo();
    return hasProEntitlement(info);
  },

  /** Fetch Monthly, Yearly, and Lifetime packages from the current RevenueCat Offering */
  async getAvailablePackages(): Promise<MamaOfferingsBundle> {
    if (!configured) {
      return { offering: null, monthly: null, yearly: null, lifetime: null, all: [] };
    }
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) {
        return { offering: null, monthly: null, yearly: null, lifetime: null, all: [] };
      }

      const monthly = current.monthly || findPackageByHint(current, ['$rc_monthly', 'monthly']);
      const yearly = current.annual || findPackageByHint(current, ['$rc_annual', 'yearly', 'annual']);
      const lifetime = current.lifetime || findPackageByHint(current, ['$rc_lifetime', 'lifetime']);

      return {
        offering: current,
        monthly,
        yearly,
        lifetime,
        all: current.availablePackages,
      };
    } catch (err) {
      console.warn('[subscriptionService] getOfferings failed:', err);
      return { offering: null, monthly: null, yearly: null, lifetime: null, all: [] };
    }
  },

  /** Store-localized price string for the Monthly package, or our $1/mo local fallback */
  async getPlusPriceString(): Promise<string> {
    const bundle = await this.getAvailablePackages();
    const pkg = bundle.monthly || bundle.all[0];
    return pkg?.product?.priceString
      ? `${pkg.product.priceString}/mo`
      : preferencesStore.getLocalizedPlusPrice();
  },

  /**
   * Present the hosted RevenueCat Paywall modal (Monthly / Yearly / Lifetime).
   * Pre-verifies offerings exist so Android never flashes an empty-offering error screen.
   * Returns 'unavailable' when native Paywall UI isn't ready so the warm in-app paywall opens cleanly.
   */
  async presentPaywall(): Promise<PurchaseOutcome> {
    lastErrorMessage = null;
    if (!configured || Platform.OS === 'web') {
      return 'unavailable';
    }
    try {
      const bundle = await this.getAvailablePackages();
      if (!bundle.offering || bundle.all.length === 0) {
        lastErrorMessage = 'Store subscriptions are still syncing with Google Play.';
        return 'unavailable';
      }
      const result: PAYWALL_RESULT = await RevenueCatUI.presentPaywall({
        offering: bundle.offering,
        displayCloseButton: true,
      });
      await this.getCustomerInfo();

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
          return 'purchased';
        case PAYWALL_RESULT.RESTORED:
          return 'restored';
        case PAYWALL_RESULT.CANCELLED:
          return 'cancelled';
        case PAYWALL_RESULT.NOT_PRESENTED:
          return 'unavailable';
        case PAYWALL_RESULT.ERROR:
        default:
          lastErrorMessage = 'Could not load the Google Play checkout sheet.';
          return 'error';
      }
    } catch (err) {
      const msg = (err as PurchasesError)?.message || String(err);
      lastErrorMessage = msg;
      console.warn('[subscriptionService] presentPaywall unavailable, using fallback:', msg);
      return 'unavailable';
    }
  },

  /**
   * Present the RevenueCat Paywall ONLY if mama_kitchen_pro is not active.
   */
  async presentPaywallIfNeeded(): Promise<PurchaseOutcome> {
    lastErrorMessage = null;
    if (!configured || Platform.OS === 'web') {
      return 'unavailable';
    }
    try {
      const bundle = await this.getAvailablePackages();
      if (!bundle.offering || bundle.all.length === 0) {
        lastErrorMessage = 'Store subscriptions are still syncing with Google Play.';
        return 'unavailable';
      }
      const result: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
        offering: bundle.offering,
        requiredEntitlementIdentifier: PRO_ENTITLEMENT_ID,
        displayCloseButton: true,
      });
      await this.getCustomerInfo();

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
          return 'purchased';
        case PAYWALL_RESULT.RESTORED:
          return 'restored';
        case PAYWALL_RESULT.CANCELLED:
          return 'cancelled';
        case PAYWALL_RESULT.NOT_PRESENTED:
          return preferencesStore.isMamaPlus() ? 'purchased' : 'unavailable';
        case PAYWALL_RESULT.ERROR:
        default:
          lastErrorMessage = 'Could not load the Google Play checkout sheet.';
          return 'error';
      }
    } catch (err) {
      const msg = (err as PurchasesError)?.message || String(err);
      lastErrorMessage = msg;
      console.warn('[subscriptionService] presentPaywallIfNeeded unavailable, using fallback:', msg);
      return 'unavailable';
    }
  },

  /**
   * Present RevenueCat Customer Center so Pro subscribers can manage, cancel,
   * restore purchases, or request refunds natively.
   * Returns true if Customer Center was shown, false if fallback UI should be used.
   */
  async presentCustomerCenter(): Promise<boolean> {
    if (!configured || Platform.OS === 'web') {
      return false;
    }
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onRestoreCompleted: ({ customerInfo }) => {
            syncPlanTier(customerInfo);
          },
        },
      });
      await this.getCustomerInfo();
      return true;
    } catch (err) {
      console.warn('[subscriptionService] presentCustomerCenter unavailable:', err);
      return false;
    }
  },

  /** Direct package purchase (Monthly, Yearly, or Lifetime) */
  async purchasePackage(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
    lastErrorMessage = null;
    if (!configured) {
      preferencesStore.setPlanTier('plus');
      return 'preview';
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = syncPlanTier(customerInfo);
      if (!active) {
        lastErrorMessage = 'Purchase completed but entitlement mama_kitchen_pro was not granted yet.';
      }
      return active ? 'purchased' : 'error';
    } catch (err) {
      const rcErr = err as PurchasesError & { userCancelled?: boolean };
      if (rcErr?.userCancelled) return 'cancelled';
      lastErrorMessage = rcErr?.message || String(err);
      console.warn('[subscriptionService] purchasePackage failed:', lastErrorMessage);
      return 'error';
    }
  },

  /** Convenience helper: purchase the monthly package (or first available package) */
  async purchasePlus(plan: 'monthly' | 'yearly' | 'lifetime' = 'monthly'): Promise<PurchaseOutcome> {
    lastErrorMessage = null;
    if (!configured) {
      preferencesStore.setPlanTier('plus');
      return 'preview';
    }
    const bundle = await this.getAvailablePackages();
    const targetPkg =
      (plan === 'yearly' && bundle.yearly) ||
      (plan === 'lifetime' && bundle.lifetime) ||
      bundle.monthly ||
      bundle.all[0];

    if (!targetPkg) {
      lastErrorMessage = 'No active Google Play subscription package found yet. Make sure subscriptions are active in Play Console & RevenueCat.';
      return 'error';
    }
    return this.purchasePackage(targetPkg);
  },

  /** Restore previous purchases (required by Apple App Store Review Guidelines) */
  async restore(): Promise<boolean> {
    if (!configured) return preferencesStore.isMamaPlus();
    try {
      const info = await Purchases.restorePurchases();
      return syncPlanTier(info);
    } catch (err) {
      console.warn('[subscriptionService] restorePurchases failed:', err);
      return false;
    }
  },

  /** Preview-mode only: lets you switch back to Free while testing without a store */
  cancelPreview(): void {
    if (!configured) {
      preferencesStore.setPlanTier('free');
      notifyEntitlementListeners(false, null);
    }
  },
};
