import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { BIOMETRY_TYPE } from 'react-native-keychain';
import { firebaseAuth } from '../services/firebase';
import { refreshFirebaseSession } from '../services/firebaseSession';
import {
  getSupportedBiometryType,
  hasPinCredentials,
  retrieveRefreshTokenWithBiometrics,
  retrieveRefreshTokenWithPin,
  storeBiometricRefreshToken,
  storePinCredentials,
  updatePinProtectedRefreshToken,
  verifyPin,
  clearPinCredentials,
} from '../services/secureCredentials';

interface AppLockContextValue {
  isLocked: boolean;
  isProcessing: boolean;
  supportedBiometry: BIOMETRY_TYPE | null;
  hasPin: boolean;
  error: string | null;
  unlockWithBiometrics: () => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  configurePin: (pin: string) => Promise<void>;
  disablePin: () => Promise<void>;
  clearError: () => void;
}

const AppLockContext = createContext<AppLockContextValue | undefined>(undefined);

const MIN_PIN_LENGTH = 4;

/**
 * Provides biometric and PIN gated access to the application tree.
 */
export const AppLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [supportedBiometry, setSupportedBiometry] = useState<BIOMETRY_TYPE | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const latestRefreshTokenRef = useRef<string | null>(null);

  useEffect(() => {
    getSupportedBiometryType().then(setSupportedBiometry).catch(() => setSupportedBiometry(null));
    hasPinCredentials().then(setHasPin).catch(() => setHasPin(false));

    const unsubscribe = firebaseAuth.onIdTokenChanged(async (user) => {
      try {
        const refreshToken = (user as unknown as { stsTokenManager?: { refreshToken?: string } })?.stsTokenManager?.refreshToken;
        if (refreshToken) {
          latestRefreshTokenRef.current = refreshToken;
          await storeBiometricRefreshToken(refreshToken);
          await updatePinProtectedRefreshToken(refreshToken);
        } else {
          latestRefreshTokenRef.current = null;
          setIsLocked(true);
        }
      } catch (tokenError) {
        console.error('Failed to persist refresh token', tokenError);
      }
    });

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        setIsLocked(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const unlockWithBiometrics = useCallback(async () => {
    setIsProcessing(true);
    try {
      const refreshResult = await refreshFirebaseSession(await retrieveRefreshTokenWithBiometrics());
      latestRefreshTokenRef.current = refreshResult.refreshToken;
      setIsLocked(false);
      setError(null);
      return true;
    } catch (unlockError) {
      const message = unlockError instanceof Error ? unlockError.message : 'Unable to unlock with biometrics';
      setError(message);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const unlockWithPin = useCallback(async (pin: string) => {
    if (!pin || pin.length < MIN_PIN_LENGTH) {
      setError('PIN must be at least 4 digits.');
      return false;
    }

    setIsProcessing(true);
    try {
      const isValid = await verifyPin(pin);
      if (!isValid) {
        setError('Invalid PIN. Please try again.');
        return false;
      }

      const refreshToken = await retrieveRefreshTokenWithPin(pin);
      const refreshResult = await refreshFirebaseSession(refreshToken);
      latestRefreshTokenRef.current = refreshResult.refreshToken;
      setIsLocked(false);
      setError(null);
      return true;
    } catch (unlockError) {
      const message = unlockError instanceof Error ? unlockError.message : 'Unable to unlock with PIN';
      setError(message);
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const configurePin = useCallback(
    async (pin: string) => {
      if (!pin || pin.length < MIN_PIN_LENGTH) {
        throw new Error('PIN must be at least 4 digits.');
      }

      let refreshToken: string | null = null;

      if (supportedBiometry) {
        refreshToken = await retrieveRefreshTokenWithBiometrics();
      } else {
        refreshToken = latestRefreshTokenRef.current;
      }

      if (!refreshToken) {
        throw new Error('Refresh token unavailable. Please sign in again.');
      }

      await storePinCredentials(pin, refreshToken);
      latestRefreshTokenRef.current = refreshToken;
      setHasPin(true);
    },
    [supportedBiometry]
  );

  const disablePin = useCallback(async () => {
    await clearPinCredentials();
    setHasPin(false);
  }, []);

  const value = useMemo(
    () => ({
      isLocked,
      isProcessing,
      supportedBiometry,
      hasPin,
      error,
      unlockWithBiometrics,
      unlockWithPin,
      configurePin,
      disablePin,
      clearError,
    }),
    [
      clearError,
      configurePin,
      disablePin,
      error,
      hasPin,
      isLocked,
      isProcessing,
      supportedBiometry,
      unlockWithBiometrics,
      unlockWithPin,
    ]
  );

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
};

/**
 * Accessor hook for the biometric/PIN lock context.
 * @returns Controls and state for the application lock experience.
 */
export const useAppLock = (): AppLockContextValue => {
  const context = useContext(AppLockContext);
  if (!context) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }

  return context;
};
