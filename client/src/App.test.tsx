import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { App } from './App';

const analyticsMock = {
  init: jest.fn().mockResolvedValue(undefined),
  identifyUser: jest.fn().mockResolvedValue(undefined),
  trackUserSignup: jest.fn().mockResolvedValue(undefined),
  trackOnboardingComplete: jest.fn().mockResolvedValue(undefined),
  trackProtocolLogged: jest.fn().mockResolvedValue(undefined),
  trackPaywallViewed: jest.fn().mockResolvedValue(undefined),
  trackSubscriptionStarted: jest.fn().mockResolvedValue(undefined),
  trackSubscriptionActivated: jest.fn().mockResolvedValue(undefined),
  trackAiChatQuerySent: jest.fn().mockResolvedValue(undefined),
  trackAiChatLimitHit: jest.fn().mockResolvedValue(undefined),
};

jest.mock('./services/AnalyticsService', () => ({
  __esModule: true,
  default: analyticsMock,
  analytics: analyticsMock,
}));

const revenueCatMock = {
  configure: jest.fn().mockResolvedValue(undefined),
  purchaseCorePackage: jest.fn().mockResolvedValue({
    productIdentifier: 'core_monthly',
    customerInfo: { entitlements: { active: { core: {} } } },
  }),
  hasActiveCoreEntitlement: jest.fn().mockReturnValue(true),
  isUserCancellationError: jest.fn().mockReturnValue(false),
};

jest.mock('./services/RevenueCatService', () => ({
  revenueCat: revenueCatMock,
}));

jest.mock('./hooks/useTaskFeed', () => ({
  useTaskFeed: () => ({ tasks: [], loading: false }),
}));

jest.mock('./services/firebase', () => ({
  firebaseAuth: {
    currentUser: { uid: 'test-user', email: 'test@example.com' },
    onAuthStateChanged: jest.fn(() => jest.fn()),
  },
}));

jest.mock('./providers/AppLockProvider', () => {
  const React = require('react');
  const mockValue = {
    isLocked: false,
    isProcessing: false,
    supportedBiometry: null,
    hasPin: false,
    error: null,
    unlockWithBiometrics: jest.fn(),
    unlockWithPin: jest.fn(),
    configurePin: jest.fn(),
    disablePin: jest.fn(),
    clearError: jest.fn(),
  };

  return {
    AppLockProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAppLock: () => mockValue,
  };
});

jest.mock('./components/AuthenticationGate', () => ({
  AuthenticationGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('./providers/MonetizationProvider', () => {
  const React = require('react');
  const requestChatAccess = jest.fn().mockReturnValue(true);
  const refreshStatus = jest.fn().mockResolvedValue(undefined);
  const mockValue = {
    loading: false,
    status: {
      trial_start_date: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      trial_end_date: new Date('2024-01-15T00:00:00.000Z').toISOString(),
      subscription_tier: 'trial',
    },
    daysLeftInTrial: 7,
    hasTrial: true,
    isTrialActive: true,
    isTrialExpired: false,
    chatLimitRemaining: 4,
    shouldShowSoftReminder: false,
    markSoftReminderSeen: jest.fn(),
    isPaywallVisible: false,
    isPaywallDismissible: true,
    paywallTrigger: null,
    openPaywall: jest.fn(),
    closePaywall: jest.fn(),
    requestChatAccess,
    requestProModuleAccess: jest.fn().mockReturnValue(false),
    refreshStatus,
  };

  return {
    MonetizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useMonetization: () => mockValue,
    __mock: { mockValue },
  };
});

jest.spyOn(Alert, 'alert').mockImplementation(() => undefined as unknown as void);

describe('App', () => {
  const { __mock } = jest.requireMock('./providers/MonetizationProvider') as {
    __mock: { mockValue: { requestChatAccess: jest.Mock; refreshStatus: jest.Mock; closePaywall: jest.Mock } };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    __mock.mockValue.isPaywallVisible = false;
  });

  it('renders bottom navigation tabs', () => {
    const { getByText } = render(<App />);
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Protocols')).toBeTruthy();
    expect(getByText('Insights')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('exposes AI coach quick access button', () => {
    const { getByTestId } = render(<App />);
    const button = getByTestId('ai-coach-button');
    fireEvent.press(button);
    expect(Alert.alert).toHaveBeenCalled();
    expect(__mock.mockValue.requestChatAccess).toHaveBeenCalledWith({ intent: 'quick_access' });
  });

  it('configures RevenueCat with the current user on mount', async () => {
    render(<App />);
    expect(revenueCatMock.configure).toHaveBeenCalledWith('test-user');
  });

  it('initiates RevenueCat purchase flow when paywall subscribe is pressed', async () => {
    __mock.mockValue.isPaywallVisible = true;

    const { getByTestId } = render(<App />);
    const subscribeButton = getByTestId('subscribe-core');
    fireEvent.press(subscribeButton);

    await new Promise((resolve) => setImmediate(resolve));

    expect(analyticsMock.trackSubscriptionStarted).toHaveBeenCalled();
    expect(revenueCatMock.purchaseCorePackage).toHaveBeenCalled();
    expect(__mock.mockValue.refreshStatus).toHaveBeenCalled();
    expect(__mock.mockValue.closePaywall).toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith(
      'Welcome to Core',
      expect.stringContaining('Your subscription is active')
    );

    __mock.mockValue.isPaywallVisible = false;
  });
});
