import { Platform } from 'react-native';

// Feature flag: disable RevenueCat native module in development when API keys are missing
const DISABLE_REVENUECAT_IN_DEV = true; // Set to false to enable RevenueCat even without API keys
const isDevMode = __DEV__ || process.env.NODE_ENV === 'development';

export const CORE_OFFERING_ID = 'core';
export const CORE_MONTHLY_PACKAGE_ID = 'core_monthly';
export const CORE_ANNUAL_PACKAGE_ID = 'core_annual';
export const CORE_ENTITLEMENT_ID = 'core';

const REVENUECAT_KEY_FALLBACK = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? null;

// Only import Purchases if we're going to use it (prevents native module errors)
let Purchases: typeof import('react-native-purchases').default | null = null;
let LOG_LEVEL: typeof import('react-native-purchases').LOG_LEVEL | null = null;
let CustomerInfo: typeof import('react-native-purchases').CustomerInfo | null = null;
let PurchasesPackage: typeof import('react-native-purchases').PurchasesPackage | null = null;

let hasLoggedRevenueCatWarning = false;

function selectApiKey(): string | null {
  const platformKey = Platform.select<string | null>({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? REVENUECAT_KEY_FALLBACK,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? REVENUECAT_KEY_FALLBACK,
    default: REVENUECAT_KEY_FALLBACK,
  });

  if (!platformKey && isDevMode) {
    // Only log once in dev mode to reduce console noise
    if (!hasLoggedRevenueCatWarning) {
      console.log('ℹ️ RevenueCat API key not configured. Subscriptions disabled in development.');
      hasLoggedRevenueCatWarning = true;
    }
  } else if (!platformKey) {
    console.warn('RevenueCat API key is not configured for this platform.');
  }

  return platformKey ?? null;
}

// Try to import Purchases only if not in dev mode with missing keys
const shouldUseRevenueCat = () => {
  const apiKey = selectApiKey();
  if (!apiKey && isDevMode && DISABLE_REVENUECAT_IN_DEV) {
    return false; // Don't use RevenueCat in dev without API keys
  }
  return true; // Use RevenueCat if API key exists or dev mode allows it
};

if (shouldUseRevenueCat()) {
  try {
    const purchasesModule = require('react-native-purchases');
    Purchases = purchasesModule.default;
    LOG_LEVEL = purchasesModule.LOG_LEVEL;
    CustomerInfo = purchasesModule.CustomerInfo;
    PurchasesPackage = purchasesModule.PurchasesPackage;
  } catch (error) {
    // Native module not available - will use stub implementation
    if (!hasLoggedRevenueCatWarning) {
      console.log('ℹ️ RevenueCat native module not available, using stub implementation');
      hasLoggedRevenueCatWarning = true;
    }
  }
}

interface PurchaseResult {
  customerInfo: CustomerInfo | null;
  productIdentifier: string | null;
}

interface OfferingsResponse {
  current?: { identifier: string; availablePackages: PurchasesPackage[] } | null;
  all: Record<string, { identifier: string; availablePackages: PurchasesPackage[] } | undefined>;
}


function resolveOffering(offerings: OfferingsResponse): OfferingsResponse['current'] | undefined {
  if (offerings.current?.identifier === CORE_OFFERING_ID) {
    return offerings.current;
  }

  if (offerings.all[CORE_OFFERING_ID]) {
    return offerings.all[CORE_OFFERING_ID];
  }

  return offerings.current ?? undefined;
}

function pickCorePackage(packages: PurchasesPackage[]): PurchasesPackage | null {
  const preferredOrder = [CORE_MONTHLY_PACKAGE_ID, CORE_ANNUAL_PACKAGE_ID];

  for (const identifier of preferredOrder) {
    const match = packages.find((pkg) => pkg.identifier === identifier);
    if (match) {
      return match;
    }
  }

  return packages[0] ?? null;
}

// Check if RevenueCat is actually available
const isRevenueCatAvailable = (): boolean => {
  return Purchases !== null && LOG_LEVEL !== null && shouldUseRevenueCat();
};

class RevenueCatService {
  private configured = false;
  private currentUserId: string | null = null;

  async configure(appUserId: string | null): Promise<void> {
    // Short-circuit if RevenueCat native module is not available
    if (!isRevenueCatAvailable()) {
      this.configured = false;
      this.currentUserId = null;
      return; // Silent return, no error
    }

    const apiKey = selectApiKey();
    if (!apiKey) {
      this.configured = false;
      this.currentUserId = null;
      return; // Silent return, no error
    }

    if (!this.configured) {
      if (Purchases && LOG_LEVEL) {
        Purchases.setLogLevel(LOG_LEVEL.WARN);
        Purchases.configure({ apiKey, appUserID: appUserId ?? undefined });
      }
      this.configured = true;
      this.currentUserId = appUserId ?? null;
      return;
    }

    if (appUserId && appUserId !== this.currentUserId) {
      if (Purchases) {
        await Purchases.logIn(appUserId);
      }
      this.currentUserId = appUserId;
      return;
    }

    if (!appUserId && this.currentUserId) {
      if (Purchases) {
        await Purchases.logOut();
      }
      this.currentUserId = null;
    }
  }

  async purchaseCorePackage(): Promise<PurchaseResult> {
    if (!this.configured || !isRevenueCatAvailable() || !Purchases) {
      throw new Error('RevenueCat SDK has not been configured for this user.');
    }

    const offerings = (await Purchases.getOfferings()) as OfferingsResponse;
    const offering = resolveOffering(offerings);

    if (!offering) {
      throw new Error('Core subscription offering is unavailable.');
    }

    const packageToBuy = pickCorePackage(offering.availablePackages);
    if (!packageToBuy) {
      throw new Error('No Core packages are available for purchase.');
    }

    const purchaseResult = await Purchases.purchasePackage(packageToBuy);

    return {
      customerInfo: purchaseResult.customerInfo,
      productIdentifier: purchaseResult.productIdentifier ?? packageToBuy.identifier ?? null,
    };
  }

  hasActiveCoreEntitlement(info: CustomerInfo | null): boolean {
    if (!info) {
      return false;
    }
    const activeEntitlements = info.entitlements?.active ?? {};
    if (activeEntitlements[CORE_ENTITLEMENT_ID]) {
      return true;
    }

    return Object.keys(activeEntitlements).some(
      (identifier) => identifier.toLowerCase() === CORE_ENTITLEMENT_ID
    );
  }

  isUserCancellationError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    return (error as { userCancelled?: boolean }).userCancelled === true;
  }
}

export const revenueCat = new RevenueCatService();

export type RevenueCatPurchaseResult = PurchaseResult;
