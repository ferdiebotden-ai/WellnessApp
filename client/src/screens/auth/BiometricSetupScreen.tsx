import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useUpdateOnboarding } from '../../providers/AuthProvider';
import {
  getSupportedBiometryType,
  storeBiometricRefreshToken,
  type BiometryType,
} from '../../services/secureCredentials';
import { firebaseAuth } from '../../services/firebase';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import type { OnboardingStackParamList } from '../../navigation/OnboardingStack';

type BiometricSetupScreenProps = NativeStackScreenProps<
  OnboardingStackParamList,
  'BiometricSetup'
>;

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
 * Optional screen shown after onboarding to enable biometric unlock.
 */
export const BiometricSetupScreen: React.FC<BiometricSetupScreenProps> = ({
  navigation,
}) => {
  const [supportedBiometry, setSupportedBiometry] = useState<BiometryType>(null);
  const [loading, setLoading] = useState(false);
  const updateOnboarding = useUpdateOnboarding();

  useEffect(() => {
    getSupportedBiometryType().then(setSupportedBiometry).catch(() => {
      setSupportedBiometry(null);
    });
  }, []);

  const handleEnableBiometrics = useCallback(async () => {
    const user = firebaseAuth.currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be signed in to enable biometrics.');
      return;
    }

    // Get refresh token from Firebase user
    const refreshToken = (
      user as unknown as { stsTokenManager?: { refreshToken?: string } }
    )?.stsTokenManager?.refreshToken;

    if (!refreshToken) {
      Alert.alert(
        'Error',
        'Unable to retrieve session token. Please try signing in again.'
      );
      return;
    }

    setLoading(true);
    try {
      console.log('📱 Storing biometric refresh token...');
      await storeBiometricRefreshToken(refreshToken);
      console.log('✅ Biometric token stored successfully');
      
      // Mark onboarding as complete - RootNavigator will automatically show MainStack
      console.log('🎯 Marking onboarding as complete...');
      await updateOnboarding(true);
      console.log('✅ Onboarding marked as complete');
    } catch (error) {
      console.error('❌ Biometric setup failed:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to enable biometrics. Please try again.';
      Alert.alert('Setup Failed', message);
      setLoading(false); // Only set loading to false on error
    }
    // Don't set loading to false on success - let the navigation happen
  }, [updateOnboarding]);

  const handleSkip = useCallback(async () => {
    console.log('⏭️  Skipping biometric setup...');
    setLoading(true);
    try {
      // Mark onboarding as complete - RootNavigator will automatically show MainStack
      console.log('🎯 Marking onboarding as complete...');
      await updateOnboarding(true);
      console.log('✅ Onboarding marked as complete');
    } catch (error) {
      console.error('❌ Failed to complete onboarding:', error);
      setLoading(false);
    }
    // Don't set loading to false on success - let the navigation happen
  }, [updateOnboarding]);

  if (!supportedBiometry) {
    // No biometrics available, skip this screen
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Enable {getBiometryLabel(supportedBiometry)}</Text>
          <Text style={styles.subtitle}>
            Unlock Apex OS quickly and securely with {getBiometryLabel(supportedBiometry)}.
            Your health data stays protected.
          </Text>
        </View>

        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔒</Text>
            <Text style={styles.benefitText}>Secure access to your health data</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>Quick unlock without typing</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🛡️</Text>
            <Text style={styles.benefitText}>Protected by device security</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title={`Enable ${getBiometryLabel(supportedBiometry)}`}
            onPress={handleEnableBiometrics}
            loading={loading}
            disabled={loading}
            style={styles.enableButton}
          />
          <PrimaryButton
            title="Skip for now"
            onPress={handleSkip}
            variant="secondary"
            disabled={loading}
            style={styles.skipButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    ...typography.heading,
    fontSize: 28,
    color: palette.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 22,
  },
  benefits: {
    flex: 1,
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  benefitText: {
    ...typography.body,
    color: palette.textPrimary,
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  enableButton: {
    marginBottom: 8,
  },
  skipButton: {
    marginTop: 8,
  },
});

