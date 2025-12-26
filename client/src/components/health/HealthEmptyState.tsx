/**
 * HealthEmptyState Component
 *
 * Displayed when no health data is available.
 * Provides CTA to connect Apple Health / Health Connect.
 *
 * @file client/src/components/health/HealthEmptyState.tsx
 */

import React from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/palette';
import { typography } from '../../theme/typography';
import { tokens } from '../../theme/tokens';

export interface HealthEmptyStateProps {
  /** Called when user taps the connect button */
  onConnectWearable: () => void;
}

const BENEFITS = [
  'Track daily steps and activity',
  'Monitor sleep duration and quality',
  'View HRV and recovery trends',
];

export function HealthEmptyState({ onConnectWearable }: HealthEmptyStateProps): React.ReactElement {
  const platformName = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';

  return (
    <View style={styles.container}>
      {/* Icon Circle */}
      <View style={styles.iconCircle}>
        <Ionicons name="heart-outline" size={48} color={palette.primary} />
      </View>

      {/* Title */}
      <Text style={styles.title}>No Health Data Yet</Text>

      {/* Description */}
      <Text style={styles.description}>
        Connect {platformName} to see your steps, sleep, HRV, and heart rate trends.
      </Text>

      {/* Benefits List */}
      <View style={styles.benefits}>
        {BENEFITS.map((text, index) => (
          <View key={index} style={styles.benefitRow}>
            <Ionicons name="checkmark-circle" size={18} color={palette.success} />
            <Text style={styles.benefitText}>{text}</Text>
          </View>
        ))}
      </View>

      {/* CTA Button */}
      <Pressable
        style={({ pressed }) => [
          styles.connectButton,
          pressed && styles.connectButtonPressed,
        ]}
        onPress={onConnectWearable}
        accessibilityRole="button"
        accessibilityLabel={`Connect ${platformName}`}
      >
        <Ionicons name="link" size={18} color={palette.canvas} />
        <Text style={styles.connectText}>Connect {platformName}</Text>
      </Pressable>

      {/* Privacy Note */}
      <Text style={styles.privacy}>
        Your health data stays on your device. We only read data you explicitly share.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${palette.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    ...typography.h2,
    color: palette.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    maxWidth: 300,
  },
  benefits: {
    alignSelf: 'stretch',
    marginBottom: 32,
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    ...typography.body,
    color: palette.textSecondary,
    flex: 1,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 200,
  },
  connectButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  connectText: {
    ...typography.subheading,
    color: palette.canvas,
    fontWeight: '600',
  },
  privacy: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
