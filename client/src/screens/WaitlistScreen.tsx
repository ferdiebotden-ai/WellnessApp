import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import type { HomeStackParamList } from '../navigation/HomeStack';
import { submitWaitlistEntry } from '../services/api';
import { ThinkingDots } from '../components/ui/ApexLoadingIndicator';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALUE_PROPS: Record<'pro' | 'elite', string[]> = {
  pro: [
    'Unlimited AI chat coaching with contextual follow-ups',
    'Advanced stress, recovery, and HRV analytics dashboard',
    'Weekly performance insights from the coaching team',
  ],
  elite: [
    'Dedicated concierge coach with 1:1 protocol reviews',
    'Lab, biomarker, and wearable integrations across providers',
    'Executive performance playbooks and recovery war-room',
  ],
};

type WaitlistScreenProps = NativeStackScreenProps<HomeStackParamList, 'Waitlist'>;

/**
 * Waitlist enrollment screen presented when a locked premium module is tapped.
 */
export const WaitlistScreen: React.FC<WaitlistScreenProps> = ({ route }) => {
  const { tier, moduleName } = route.params;
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const tierLabel = tier === 'pro' ? 'Pro' : 'Elite';
  const valueProps = useMemo(() => VALUE_PROPS[tier], [tier]);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      await submitWaitlistEntry(trimmedEmail, tier);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to join the waitlist right now.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.kicker}>{tierLabel} Access</Text>
            <Text style={styles.title}>{moduleName} is coming soon</Text>
            <Text style={styles.subtitle}>
              Join the waitlist to be first in line when we unlock {tierLabel.toLowerCase()} features.
            </Text>
          </View>

          <View style={styles.valuePropCard}>
            {valueProps.map((item) => (
              <View key={item} style={styles.valuePropRow}>
                <Text style={styles.valuePropBullet}>•</Text>
                <Text style={styles.valuePropText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.form}>
            <Text style={styles.formLabel}>Email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              style={styles.input}
              textContentType="emailAddress"
              accessibilityLabel="Email address"
              testID="waitlist-email-input"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {status === 'success' ? (
              <Text style={styles.successText}>
                You\'re on the list\! We\'ll notify you when {tierLabel} unlocks.
              </Text>
            ) : null}
            <Pressable
              onPress={handleSubmit}
              accessibilityRole="button"
              disabled={status === 'loading' || status === 'success'}
              style={[styles.submitButton, status === 'success' ? styles.submitButtonDisabled : null]}
              testID="waitlist-submit-button"
            >
              {status === 'loading' ? (
                <ThinkingDots color="#ffffff" size={6} />
              ) : (
                <Text style={styles.submitButtonLabel}>
                  {status === 'success' ? 'Request received' : 'Join the Waitlist'}
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 12,
  },
  kicker: {
    ...typography.caption,
    textTransform: 'uppercase',
    color: palette.primary,
    letterSpacing: 0.8,
  },
  title: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
  },
  valuePropCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  valuePropRow: {
    flexDirection: 'row',
    gap: 12,
  },
  valuePropBullet: {
    ...typography.body,
    color: palette.primary,
  },
  valuePropText: {
    ...typography.body,
    color: palette.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  form: {
    gap: 12,
  },
  formLabel: {
    ...typography.caption,
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...typography.body,
    color: palette.textPrimary,
  },
  errorText: {
    ...typography.caption,
    color: '#dc2626',
  },
  successText: {
    ...typography.body,
    color: palette.primary,
  },
  submitButton: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: palette.textMuted,
  },
  submitButtonLabel: {
    ...typography.subheading,
    color: '#ffffff',
  },
});
