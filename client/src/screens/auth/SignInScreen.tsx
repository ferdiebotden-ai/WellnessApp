import React, { useState } from 'react';
import {
  Alert,
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
import { typography, fontFamily } from '../../theme/typography';
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
          {/* Hero Section */}
          <View style={styles.hero}>
            <Animated.View entering={FadeIn.duration(800)}>
              <Text style={styles.brand}>Apex OS</Text>
            </Animated.View>
            <Animated.View entering={FadeIn.duration(600).delay(200)}>
              <Text style={styles.tagline}>Your AI wellness operating system</Text>
            </Animated.View>
          </View>

          {/* Welcome Section */}
          <Animated.View
            style={styles.header}
            entering={FadeInDown.duration(500).delay(400)}
          >
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your wellness journey</Text>
          </Animated.View>

          {/* Form Section */}
          <View style={styles.form}>
            <Animated.View entering={FadeInDown.duration(400).delay(500)}>
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
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(600)}>
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
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(700)}>
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPasswordLink}
                disabled={loading}
                testID="forgot-password-link"
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(800)}>
              <PrimaryButton
                title="Sign In"
                onPress={handleSignIn}
                loading={loading}
                disabled={loading}
                style={styles.signInButton}
                testID="signin-submit-button"
              />
            </Animated.View>
          </View>

          {/* Footer Section */}
          <Animated.View
            style={styles.footer}
            entering={FadeInDown.duration(400).delay(900)}
          >
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              disabled={loading}
              testID="goto-signup-link"
            >
              <Text style={styles.footerLink}>Sign Up</Text>
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
    paddingTop: tokens.spacing.xl,
    paddingBottom: tokens.spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  brand: {
    fontFamily: fontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
    color: palette.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: tokens.spacing.sm,
  },
  tagline: {
    ...typography.bodySmall,
    color: palette.textMuted,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  title: {
    ...typography.h1,
    color: palette.textPrimary,
    marginBottom: tokens.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  form: {
    flex: 1,
  },
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xs,
  },
  forgotPasswordText: {
    ...typography.bodySmall,
    color: palette.primary,
  },
  signInButton: {
    marginTop: tokens.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacing.xl,
    paddingBottom: tokens.spacing.md,
  },
  footerText: {
    ...typography.body,
    color: palette.textSecondary,
  },
  footerLink: {
    ...typography.body,
    color: palette.primary,
    fontFamily: fontFamily.semiBold,
  },
});
