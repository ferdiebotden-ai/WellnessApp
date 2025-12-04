import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';

interface Props {
  daysTracked: number;
  minDaysRequired: number;
}

/**
 * Empty state for users with insufficient data for correlations.
 * Design per PRD Section 5.8.
 *
 * Shows:
 * - "Building your patterns..." message
 * - Progress bar: X of 14 days
 */
export const EmptyCorrelationState: React.FC<Props> = ({ daysTracked, minDaysRequired }) => {
  const progressWidth = useMemo((): DimensionValue => {
    const percent = Math.min(100, Math.round((daysTracked / minDaysRequired) * 100));
    return `${percent}%` as DimensionValue;
  }, [daysTracked, minDaysRequired]);

  return (
    <View style={styles.container} accessibilityRole="summary">
      <Text style={styles.title}>Building your patterns...</Text>
      <Text style={styles.description}>
        We need {minDaysRequired} days of data to find meaningful correlations between your protocols
        and outcomes.
      </Text>

      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressTrack, { width: progressWidth }]} />
        </View>
      </View>

      <Text style={styles.progressLabel}>
        {daysTracked} of {minDaysRequired} days
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    ...typography.subheading,
    color: palette.textPrimary,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: palette.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressRow: {
    width: '100%',
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: palette.elevated,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressTrack: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: palette.primary,
  },
  progressLabel: {
    ...typography.caption,
    color: palette.textMuted,
    textAlign: 'center',
  },
});
