// Mock RevenueCat service for Web

export const CORE_OFFERING_ID = 'core';
export const CORE_MONTHLY_PACKAGE_ID = 'core_monthly';
export const CORE_ANNUAL_PACKAGE_ID = 'core_annual';
export const CORE_ENTITLEMENT_ID = 'core';

export interface CustomerInfo {
  entitlements: {
    active: Record<string, any>;
    all: Record<string, any>;
  };
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  nonSubscriptionTransactions: any[];
  latestExpirationDate: string | null;
  firstSeen: string;
  originalAppUserId: string;
  requestDate: string;
  managementURL: string | null;
  originalPurchaseDate: string | null;
}

interface PurchaseResult {
  customerInfo: CustomerInfo | null;
  productIdentifier: string | null;
}

export type RevenueCatPurchaseResult = PurchaseResult;

class RevenueCatService {
  async configure(appUserId: string | null): Promise<void> {
    console.log('WEB MOCK: RevenueCat configure', { appUserId });
  }

  async purchaseCorePackage(): Promise<PurchaseResult> {
    console.log('WEB MOCK: RevenueCat purchaseCorePackage');
    // Mock a successful purchase
    return {
      customerInfo: {
        entitlements: {
          active: {
            [CORE_ENTITLEMENT_ID]: {
              identifier: CORE_ENTITLEMENT_ID,
              isActive: true,
              willRenew: true,
              periodType: 'NORMAL',
              latestPurchaseDate: new Date().toISOString(),
              originalPurchaseDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              store: 'APP_STORE',
              productIdentifier: CORE_MONTHLY_PACKAGE_ID,
              isSandbox: true,
              unsubscribeDetectedAt: null,
              billingIssueDetectedAt: null,
            },
          },
          all: {},
        },
        activeSubscriptions: [CORE_MONTHLY_PACKAGE_ID],
        allPurchasedProductIdentifiers: [CORE_MONTHLY_PACKAGE_ID],
        nonSubscriptionTransactions: [],
        latestExpirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        firstSeen: new Date().toISOString(),
        originalAppUserId: 'mock-user',
        requestDate: new Date().toISOString(),
        managementURL: null,
        originalPurchaseDate: new Date().toISOString(),
      },
      productIdentifier: CORE_MONTHLY_PACKAGE_ID,
    };
  }

  hasActiveCoreEntitlement(info: CustomerInfo | null): boolean {
    if (!info) return false;
    return !!info.entitlements.active[CORE_ENTITLEMENT_ID];
  }

  isUserCancellationError(error: unknown): boolean {
    return false;
  }
}

export const revenueCat = new RevenueCatService();

