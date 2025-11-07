import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useMonetization } from '../providers/MonetizationProvider';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

export const TrialSoftReminderModal: React.FC = () => {
  const { shouldShowSoftReminder, daysLeftInTrial, markSoftReminderSeen, openPaywall } = useMonetization();

  if (!shouldShowSoftReminder) {
    return null;
  }

  const handleDismiss = () => {
    markSoftReminderSeen();
  };

  const handleUpgrade = () => {
    markSoftReminderSeen();
    openPaywall('soft_prompt');
  };

  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.overlay}>
        <View style={styles.card} testID="trial-soft-modal">
          <Text style={styles.badge}>Day 7 check-in</Text>
          <Text style={styles.headline}>You're halfway through your trial</Text>
          <Text style={styles.subhead}>
            {daysLeftInTrial ?? 7} days left — here’s what your data shows so far.
          </Text>

          <View style={styles.metricList}>
            <Text style={styles.metricItem}>• Sleep quality improved 9% over baseline</Text>
            <Text style={styles.metricItem}>• HRV readiness has stayed in the green zone</Text>
            <Text style={styles.metricItem}>• Daily protocol completion streak at 6 days</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleDismiss}
              style={styles.secondaryButton}
              testID="soft-modal-continue"
            >
              <Text style={styles.secondaryButtonText}>Keep exploring</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleUpgrade}
              style={styles.primaryButton}
              testID="soft-modal-upgrade"
            >
              <Text style={styles.primaryButtonText}>See Core plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    ...typography.caption,
    color: palette.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headline: {
    ...typography.heading,
    color: palette.textPrimary,
  },
  subhead: {
    ...typography.body,
    color: palette.textSecondary,
  },
  metricList: {
    gap: 8,
  },
  metricItem: {
    ...typography.body,
    color: palette.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderColor: palette.primary,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.subheading,
    color: palette.primary,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: palette.primary,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.subheading,
    color: palette.surface,
  },
});
