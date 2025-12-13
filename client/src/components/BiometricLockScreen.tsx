import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BiometryType } from '../services/secureCredentials';
import { useAppLock } from '../providers/AppLockProvider';
import { palette } from '../theme/palette';
import { ApexLoadingIndicator } from './ui/ApexLoadingIndicator';

type ScreenMode = 'biometric' | 'pin-entry' | 'pin-create' | 'pin-confirm';

const getBiometryLabel = (type: BiometryType): string => {
  switch (type) {
    case 'FaceID':
      return 'Face ID';
    case 'TouchID':
      return 'Touch ID';
    case 'Fingerprint':
      return 'Fingerprint';
    case 'Iris':
      return 'Iris Scan';
    default:
      return 'Biometrics';
  }
};

/**
 * Renders the biometric/PIN unlock UI overlay used to protect sensitive data.
 */
export const BiometricLockScreen: React.FC = () => {
  const {
    supportedBiometry,
    unlockWithBiometrics,
    unlockWithPin,
    configurePin,
    hasPin,
    isProcessing,
    error,
    clearError,
  } = useAppLock();
  const [mode, setMode] = useState<ScreenMode>('biometric');
  const [pinValue, setPinValue] = useState('');
  const [pinConfirmation, setPinConfirmation] = useState('');
  const [initialPin, setInitialPin] = useState('');
  const [autoPrompted, setAutoPrompted] = useState(false);
  const [pinSetupError, setPinSetupError] = useState<string | null>(null);

  useEffect(() => {
    if (supportedBiometry && !autoPrompted) {
      setAutoPrompted(true);
      unlockWithBiometrics().catch(() => null);
    }
  }, [autoPrompted, supportedBiometry, unlockWithBiometrics]);

  useEffect(() => {
    if (!supportedBiometry) {
      setMode(hasPin ? 'pin-entry' : 'pin-create');
    }
  }, [hasPin, supportedBiometry]);

  useEffect(() => {
    if (mode === 'biometric') {
      setPinValue('');
      setPinConfirmation('');
      setInitialPin('');
      setPinSetupError(null);
    }
  }, [mode]);

  const handleBiometricPress = useCallback(() => {
    clearError();
    unlockWithBiometrics().catch(() => null);
  }, [clearError, unlockWithBiometrics]);

  const handlePinSubmit = useCallback(() => {
    clearError();
    setPinSetupError(null);
    unlockWithPin(pinValue).catch(() => null);
  }, [clearError, pinValue, unlockWithPin]);

  const handleStartPinSetup = useCallback(() => {
    clearError();
    setPinSetupError(null);
    setMode('pin-create');
  }, [clearError]);

  const handlePinCreateContinue = useCallback(() => {
    if (!pinValue || pinValue.length < 4) {
      setPinSetupError('PIN must be at least 4 digits.');
      return;
    }
    setPinSetupError(null);
    setInitialPin(pinValue);
    setPinValue('');
    setMode('pin-confirm');
  }, [pinValue]);

  const handlePinConfirmation = useCallback(() => {
    if (pinConfirmation !== initialPin) {
      setPinConfirmation('');
      setPinSetupError('PIN entries do not match.');
      return;
    }

    configurePin(initialPin)
      .then(() => {
        setPinValue('');
        setPinConfirmation('');
        setInitialPin('');
        setPinSetupError(null);
        setMode('pin-entry');
      })
      .catch(() => {
        setPinConfirmation('');
        setPinSetupError('Unable to save PIN. Please try again.');
      });
  }, [configurePin, initialPin, pinConfirmation]);

  const biometricLabel = useMemo(() => getBiometryLabel(supportedBiometry), [supportedBiometry]);

  const showPinOptions = mode === 'pin-entry' || mode === 'pin-create' || mode === 'pin-confirm';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Wellness OS Locked</Text>
        <Text style={styles.subtitle}>
          Authenticate to protect your personalized health insights.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {pinSetupError ? <Text style={styles.errorText}>{pinSetupError}</Text> : null}

        {isProcessing ? <ApexLoadingIndicator size={32} style={styles.indicator} /> : null}

        {supportedBiometry && mode === 'biometric' ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handleBiometricPress} disabled={isProcessing}>
            <Text style={styles.primaryButtonLabel}>Unlock with {biometricLabel}</Text>
          </TouchableOpacity>
        ) : null}

        {showPinOptions ? (
          <View style={styles.pinContainer}>
            {mode === 'pin-entry' ? (
              <>
                <Text style={styles.pinLabel}>Enter your Wellness OS PIN</Text>
                <TextInput
                  value={pinValue}
                  onChangeText={setPinValue}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={8}
                  style={styles.pinInput}
                  accessibilityLabel="PIN Input"
                />
                <TouchableOpacity style={styles.primaryButton} onPress={handlePinSubmit} disabled={isProcessing}>
                  <Text style={styles.primaryButtonLabel}>Unlock with PIN</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {mode === 'pin-create' ? (
              <>
                <Text style={styles.pinLabel}>Create a 4-digit PIN</Text>
                <TextInput
                  value={pinValue}
                  onChangeText={setPinValue}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={8}
                  style={styles.pinInput}
                  accessibilityLabel="New PIN Input"
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handlePinCreateContinue}
                  disabled={!pinValue || pinValue.length < 4}
                >
                  <Text style={styles.primaryButtonLabel}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {mode === 'pin-confirm' ? (
              <>
                <Text style={styles.pinLabel}>Confirm your new PIN</Text>
                <TextInput
                  value={pinConfirmation}
                  onChangeText={setPinConfirmation}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={8}
                  style={styles.pinInput}
                  accessibilityLabel="Confirm PIN Input"
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handlePinConfirmation}
                  disabled={!pinConfirmation || pinConfirmation.length < 4}
                >
                  <Text style={styles.primaryButtonLabel}>Save PIN</Text>
                </TouchableOpacity>
              </>
            ) : null}

            {supportedBiometry ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  clearError();
                  setPinSetupError(null);
                  setMode('biometric');
                }}
              >
                <Text style={styles.secondaryButtonLabel}>Use {biometricLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {!showPinOptions && supportedBiometry ? (
          <View style={styles.actionsRow}>
            {hasPin ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  clearError();
                  setPinSetupError(null);
                  setMode('pin-entry');
                }}
              >
                <Text style={styles.secondaryButtonLabel}>Use PIN</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleStartPinSetup}>
                <Text style={styles.secondaryButtonLabel}>Set up PIN</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: palette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorText: {
    color: palette.error,
    marginBottom: 16,
    textAlign: 'center',
  },
  indicator: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: palette.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
  },
  primaryButtonLabel: {
    color: palette.white,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    marginTop: 12,
  },
  secondaryButtonLabel: {
    color: palette.textPrimary,
    fontSize: 15,
    textAlign: 'center',
  },
  pinContainer: {
    width: '100%',
    marginTop: 24,
  },
  pinLabel: {
    color: palette.textPrimary,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  pinInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: palette.textPrimary,
    fontSize: 18,
    textAlign: 'center',
  },
  actionsRow: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
});
