import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Correlation } from '../types/correlations';
import { palette } from '../theme/palette';
import { typography } from '../theme/typography';
import { tokens } from '../theme/tokens';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';

interface Props {
  correlation: Correlation;
}

/**
 * Displays a single protocol-outcome correlation.
 * Design per PRD Section 5.8.
 *
 * Shows:
 * - Trend arrow (up = positive/green, down = negative/amber)
 * - Protocol → Outcome label
 * - Interpretation with p-value
 * - Days tracked progress bar
 */
export const CorrelationCard: React.FC<Props> = ({ correlation }) => {
  const isPositive = correlation.direction === 'positive';
  const isNegative = correlation.direction === 'negative';

  // Color coding: green for beneficial, amber for concerning
  const trendColor = useMemo(() => {
    if (isPositive) return palette.success;
    if (isNegative) return palette.accent;
    return palette.textMuted;
  }, [isPositive, isNegative]);

  const trendArrow = useMemo(() => {
    if (isPositive) return '↑';
    if (isNegative) return '↓';
    return '●';
  }, [isPositive, isNegative]);

  // Progress value: sample_size out of 30 days (lookback window)
  const progress = useMemo(() => {
    return Math.min(1, correlation.sample_size / 30);
  }, [correlation.sample_size]);

  return (
    <Card accessibilityRole="summary">
      {/* Header: Arrow + Protocol → Outcome */}
      <View style={styles.headerRow}>
        <Text style={[styles.arrow, { color: trendColor }]}>{trendArrow}</Text>
        <Text style={styles.label}>
          {correlation.protocol_name} → {correlation.outcome_name}
        </Text>
      </View>

      {/* Interpretation with p-value */}
      <Text style={styles.interpretation}>
        {correlation.interpretation} (p={correlation.p_value.toFixed(2)})
      </Text>

      {/* Progress bar: days tracked */}
      <View style={styles.progressRow}>
        <View style={styles.progressBarContainer}>
          <ProgressBar progress={progress} animated />
        </View>
        <Text style={styles.daysLabel}>{correlation.sample_size} days tracked</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    ...typography.subheading,
    color: palette.textPrimary,
    flex: 1,
  },
  interpretation: {
    ...typography.body,
    color: palette.textSecondary,
    lineHeight: 20,
    marginTop: tokens.spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
  },
  progressBarContainer: {
    flex: 1,
  },
  daysLabel: {
    ...typography.caption,
    color: palette.textMuted,
    minWidth: 90,
    textAlign: 'right',
  },
});
