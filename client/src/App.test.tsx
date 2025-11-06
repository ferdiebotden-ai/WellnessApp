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
