import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../providers/AuthProvider';
import { validateEmail } from '../../validation/authValidation';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type ForgotPasswordScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  'ForgotPassword'
>;

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendReset = async () => {
    setEmailError(undefined);

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccess(true);
      Alert.alert(
        'Reset Link Sent',
        'If an account exists with this email, you will receive a password reset link shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('SignIn'),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to send reset email';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successText}>
            We've sent a password reset link to {email}
          </Text>
          <PrimaryButton
            title="Back to Sign In"
            onPress={() => navigation.navigate('SignIn')}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            <FormInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={emailError}
              editable={!loading}
              testID="forgot-email-input"
            />

            <PrimaryButton
              title="Send Reset Link"
              onPress={handleSendReset}
              loading={loading}
              disabled={loading}
              style={styles.resetButton}
              testID="forgot-reset-button"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    ...typography.heading,
    fontSize: 28,
    color: palette.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
  },
  form: {
    flex: 1,
  },
  resetButton: {
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successTitle: {
    ...typography.heading,
    fontSize: 24,
    color: palette.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    minWidth: 200,
  },
});

