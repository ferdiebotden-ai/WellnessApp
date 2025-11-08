import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage } from 'react-native-purchases';

export const CORE_OFFERING_ID = 'core';
export const CORE_MONTHLY_PACKAGE_ID = 'core_monthly';
export const CORE_ANNUAL_PACKAGE_ID = 'core_annual';
export const CORE_ENTITLEMENT_ID = 'core';

interface PurchaseResult {
  customerInfo: CustomerInfo;
  productIdentifier: string | null;
}

const REVENUECAT_KEY_FALLBACK = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? null;

interface OfferingsResponse {
  current?: { identifier: string; availablePackages: PurchasesPackage[] } | null;
  all: Record<string, { identifier: string; availablePackages: PurchasesPackage[] } | undefined>;
}

function selectApiKey(): string | null {
  const platformKey = Platform.select<string | null>({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? REVENUECAT_KEY_FALLBACK,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? REVENUECAT_KEY_FALLBACK,
    default: REVENUECAT_KEY_FALLBACK,
  });

  if (!platformKey) {
    console.warn('RevenueCat API key is not configured for this platform.');
  }

  return platformKey ?? null;
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

class RevenueCatService {
  private configured = false;

  private currentUserId: string | null = null;

  async configure(appUserId: string | null): Promise<void> {
    const apiKey = selectApiKey();
    if (!apiKey) {
      this.configured = false;
      this.currentUserId = null;
      return;
    }

    if (!this.configured) {
      Purchases.setLogLevel(LOG_LEVEL.WARN);
      Purchases.configure({ apiKey, appUserID: appUserId ?? undefined });
      this.configured = true;
      this.currentUserId = appUserId ?? null;
      return;
    }

    if (appUserId && appUserId !== this.currentUserId) {
      await Purchases.logIn(appUserId);
      this.currentUserId = appUserId;
      return;
    }

    if (!appUserId && this.currentUserId) {
      await Purchases.logOut();
      this.currentUserId = null;
    }
  }

  async purchaseCorePackage(): Promise<PurchaseResult> {
    if (!this.configured) {
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

  hasActiveCoreEntitlement(info: CustomerInfo): boolean {
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
