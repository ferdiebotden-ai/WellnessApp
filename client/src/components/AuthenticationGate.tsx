import React from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { useAppLock } from '../providers/AppLockProvider';
import { BiometricLockScreen } from './BiometricLockScreen';
import { palette } from '../theme/palette';

interface AuthenticationGateProps {
  children: React.ReactNode;
}

/**
 * Locks the application UI until biometric or PIN authentication succeeds.
 * Shows a loading state while checking if lock is configured.
 */
export const AuthenticationGate: React.FC<AuthenticationGateProps> = ({ children }) => {
  const { isLocked, isInitializing } = useAppLock();

  // Show loading while checking lock status to prevent flash of lock screen
  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isLocked) {
    return <BiometricLockScreen />;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
