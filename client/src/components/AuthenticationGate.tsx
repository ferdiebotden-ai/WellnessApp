import React from 'react';
import { useAppLock } from '../providers/AppLockProvider';
import { BiometricLockScreen } from './BiometricLockScreen';

interface AuthenticationGateProps {
  children: React.ReactNode;
}

/**
 * Locks the application UI until biometric or PIN authentication succeeds.
 */
export const AuthenticationGate: React.FC<AuthenticationGateProps> = ({ children }) => {
  const { isLocked } = useAppLock();

  if (isLocked) {
    return <BiometricLockScreen />;
  }

  return <>{children}</>;
};
