import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../providers/AuthProvider';
import { validateEmail, validatePassword } from '../../validation/authValidation';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { tokens } from '../../theme/tokens';
import type { AuthStackParamList } from '../../navigation/AuthStack';

type SignInScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setEmailError(undefined);
    setPasswordError(undefined);

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error);
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error);
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      Alert.alert('Sign In Failed', message);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View style={styles.logoSection} entering={FadeIn.duration(600)}>
            <Image
              source={require('../../../assets/Logo/chevron-only.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Form */}
          <Animated.View style={styles.form} entering={FadeInDown.duration(500).delay(300)}>
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
              testID="signin-email-input"
            />

            <FormInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              error={passwordError}
              editable={!loading}
              testID="signin-password-input"
            />

            <PrimaryButton
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              disabled={loading}
              style={styles.signInButton}
              testID="signin-submit-button"
            />
          </Animated.View>

          {/* Footer Links */}
          <Animated.View style={styles.footer} entering={FadeIn.duration(400).delay(600)}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              disabled={loading}
              testID="forgot-password-link"
            >
              <Text style={styles.footerLink}>Forgot Password?</Text>
            </TouchableOpacity>
            <Text style={styles.footerDivider}>|</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              disabled={loading}
              testID="goto-signup-link"
            >
              <Text style={styles.footerLink}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.xxl,
    paddingBottom: tokens.spacing.xl,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xxl,
  },
  logo: {
    width: 80,
    height: 80,
  },
  form: {
    gap: tokens.spacing.xs,
  },
  signInButton: {
    marginTop: tokens.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacing.xxl,
    gap: tokens.spacing.md,
  },
  footerLink: {
    ...typography.bodySmall,
    color: palette.textMuted,
  },
  footerDivider: {
    ...typography.bodySmall,
    color: palette.subtle,
  },
});
