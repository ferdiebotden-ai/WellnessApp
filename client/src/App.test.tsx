import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { App } from './App';

jest.mock('./hooks/useTaskFeed', () => ({
  useTaskFeed: () => ({ tasks: [], loading: false }),
}));

jest.mock('./services/firebase', () => ({
  firebaseAuth: { currentUser: { uid: 'test-user' } },
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
    requestChatAccess: jest.fn().mockReturnValue(true),
    requestProModuleAccess: jest.fn().mockReturnValue(false),
  };

  return {
    MonetizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useMonetization: () => mockValue,
  };
});

jest.spyOn(Alert, 'alert').mockImplementation(() => undefined as unknown as void);

describe('App', () => {
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
  });
});
